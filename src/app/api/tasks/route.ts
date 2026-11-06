import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { notifyFolderMembers } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get('folder_id');
  const search = searchParams.get('search')?.trim().toLowerCase() || '';
  const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'completed'
  const includeDeleted = searchParams.get('deleted') === 'true';

  // Build SQL query: Tasks must be in folders owned by user or shared with user
  let sql = `
    SELECT t.id, t.title, t.description, t.due_date, t.is_completed, t.completed_at, t.time_logged_seconds, t.folder_id, t.created_by, t.created_at, t.deleted_at,
           f.name as folder_name, f.color_hex as folder_color,
           u.username as creator_username,
           (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
           (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id) as attachment_count
    FROM tasks t
    LEFT JOIN folders f ON t.folder_id = f.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE (
      (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
      OR f.owner_id = ?
      OR f.id IN (SELECT folder_id FROM folder_collaborators WHERE user_id = ?)
    )
      AND ${includeDeleted ? 't.deleted_at IS NOT NULL AND t.deleted_at >= datetime("now", "-7 days")' : '(t.deleted_at IS NULL OR t.deleted_at = \'\')'}
  `;

  const params: any[] = [session.id, session.id, session.id];

  if (folderId && folderId !== 'all') {
    sql += ' AND t.folder_id = ?';
    params.push(folderId);
  }

  if (status === 'pending') {
    sql += ' AND t.is_completed = 0';
  } else if (status === 'completed') {
    sql += ' AND t.is_completed = 1';
  }

  if (search) {
    sql += ' AND (LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // MANDATORY PRD REQUIREMENT: Chronological sorting (oldest due date to newest due date)
  sql += ' ORDER BY t.due_date ASC, t.created_at ASC';

  const tasks = await query(sql, params);

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, due_date, folder_id } = await req.json();

    // Acceptance Criteria: Task fields required: Title, Due Date & Time, Folder
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });
    }

    if (!due_date) {
      return NextResponse.json({ error: 'A valid due date and time is mandatory.' }, { status: 400 });
    }

    let destinationFolderId: string | null = null;
    if (folder_id) {
      const folder = await queryOne(
        `SELECT f.id, f.name, f.color_hex FROM folders f
         LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
         WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,
        [folder_id, session.id, session.id]
      );

      if (!folder) {
        return NextResponse.json({ error: 'Selected folder not found or permission denied.' }, { status: 404 });
      }

      destinationFolderId = folder_id;
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isoDueDate = new Date(due_date).toISOString();

    await execute(
      `INSERT INTO tasks (id, title, description, due_date, is_completed, folder_id, created_by)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [taskId, title.trim(), (description || '').trim(), isoDueDate, destinationFolderId, session.id]
    );

    if (destinationFolderId) {
      await notifyFolderMembers({
        folderId: destinationFolderId,
        taskId,
        actorId: session.id,
        type: 'task_created',
        message: `${session.username} created task "${title.trim()}".`,
      });
    }

    const newTask = await queryOne(
      `SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
              u.username as creator_username, 0 as comment_count
       FROM tasks t
       LEFT JOIN folders f ON t.folder_id = f.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`,
      [taskId]
    );

    return NextResponse.json({ task: newTask, message: 'Task created successfully!' });
  } catch (err: any) {
    console.error('Error creating task:', err);
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}
