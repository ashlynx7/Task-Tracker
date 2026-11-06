import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { notifyFolderMembers } from '@/lib/notifications';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;

  const task = await queryOne(
    `SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
            u.username as creator_username
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ?
       OR f.id IN (SELECT folder_id FROM folder_collaborators WHERE user_id = ?)
     )`,
    [taskId, session.id, session.id, session.id]
  );

  if (!task) {
    return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;
  const body = await req.json();
  const normalizedFolderId = body.folder_id === '' || body.folder_id === null ? null : body.folder_id ?? null;

  if (body.restore === true) {
    const task = await queryOne('SELECT id, deleted_at FROM tasks WHERE id = ? AND created_by = ?', [taskId, session.id]);
    if (!task) {
      return NextResponse.json({ error: 'Task not found or permission denied.' }, { status: 404 });
    }

    await execute('UPDATE tasks SET deleted_at = NULL WHERE id = ?', [taskId]);
    return NextResponse.json({ message: 'Task restored successfully!' });
  }

  // Verify access to current task's folder (Option 1 model: equal co-working access)
  const task = await queryOne(
    `SELECT t.id, t.title, t.folder_id, t.is_completed, t.completed_at, t.time_logged_seconds,
            f.owner_id
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,
    [taskId, session.id, session.id, session.id]
  );

  if (!task) {
    return NextResponse.json({ error: 'Task not found or permission denied.' }, { status: 404 });
  }

  const currentFolderValue = task.folder_id === '' || task.folder_id === null ? null : task.folder_id;
  if (body.folder_id !== undefined && normalizedFolderId !== currentFolderValue) {
    if (normalizedFolderId) {
      const destFolder = await queryOne(
        `SELECT f.id
         FROM folders f
         WHERE f.id = ?
           AND (f.owner_id = ? OR EXISTS (
             SELECT 1 FROM folder_collaborators fc WHERE fc.folder_id = f.id AND fc.user_id = ?
           ))`,
        [normalizedFolderId, session.id, session.id]
      );
      if (!destFolder) {
        return NextResponse.json({ error: 'Destination folder not found or permission denied.' }, { status: 403 });
      }
    }
  }

  // Handle updates
  if (body.title !== undefined && body.title.trim()) {
    await execute('UPDATE tasks SET title = ? WHERE id = ?', [body.title.trim(), taskId]);
  }

  if (body.description !== undefined) {
    await execute('UPDATE tasks SET description = ? WHERE id = ?', [body.description.trim(), taskId]);
  }

  if (body.due_date !== undefined) {
    const isoDueDate = new Date(body.due_date).toISOString();
    await execute('UPDATE tasks SET due_date = ? WHERE id = ?', [isoDueDate, taskId]);
  }

  if (body.time_logged_seconds !== undefined) {
    const loggedSeconds = Number.isFinite(Number(body.time_logged_seconds))
      ? Math.max(0, Number(body.time_logged_seconds))
      : 0;
    await execute('UPDATE tasks SET time_logged_seconds = ? WHERE id = ?', [loggedSeconds, taskId]);
  }

  if (body.is_completed !== undefined) {
    const completedVal = body.is_completed ? 1 : 0;
    if (completedVal !== task.is_completed) {
      const completedAt = completedVal === 1 ? new Date().toISOString() : null;
      await execute(
        'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
        [completedVal, completedAt, taskId]
      );
      if (task.folder_id) {
        await notifyFolderMembers({
          folderId: task.folder_id,
          taskId,
          actorId: session.id,
          type: completedVal === 1 ? 'task_completed' : 'task_reopened',
          message: `${session.username} ${completedVal === 1 ? 'completed' : 'reopened'} "${task.title}".`,
        });
      }
    }
  }

  if (body.folder_id !== undefined && normalizedFolderId !== currentFolderValue) {
    const nextFolderId = normalizedFolderId === null ? '' : normalizedFolderId;
    await execute('UPDATE tasks SET folder_id = ? WHERE id = ?', [nextFolderId, taskId]);
  }

  const updatedTask = await queryOne(
    `SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
            u.username as creator_username,
            (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ?`,
    [taskId]
  );

  return NextResponse.json({ task: updatedTask, message: 'Task updated successfully!' });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;
  const body = await req.json().catch(() => ({}));
  const permanent = Boolean(body.permanent || body.force || body.permanent === true);

  // Verify access (Option 1 co-working rights: collaborators can delete tasks)
  const task = await queryOne(
    `SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,
    [taskId, session.id, session.id, session.id]
  );

  if (!task) {
    return NextResponse.json({ error: 'Task not found or permission denied.' }, { status: 404 });
  }

  if (permanent) {
    const taskToDelete = await queryOne('SELECT id, title FROM tasks WHERE id = ?', [taskId]);
    if (!taskToDelete) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    await execute('DELETE FROM comments WHERE task_id = ?', [taskId]);
    await execute('DELETE FROM task_attachments WHERE task_id = ?', [taskId]);
    await execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    return NextResponse.json({ message: 'Task permanently deleted.' });
  }

  if (task.folder_id) {
    await notifyFolderMembers({
      folderId: task.folder_id,
      taskId: null,
      actorId: session.id,
      type: 'task_deleted',
      message: `${session.username} deleted task "${task.title}".`,
    });
  }

  const result = await execute('UPDATE tasks SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [new Date().toISOString(), taskId]);
  if (result.rowsModified !== 1) {
    return NextResponse.json({ error: 'Task already deleted or not found.' }, { status: 409 });
  }

  return NextResponse.json({ message: 'Task archived successfully. It can be restored from history for 7 days.' });
}
