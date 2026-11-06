import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { notifyFolderMembers } from '@/lib/notifications';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;

  // Verify user has access to the task, even when it is not in a folder.
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
    return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
  }

  // Acceptance Criteria: Chronological comment stream
  const comments = await query(
    `SELECT c.id, c.task_id, c.author_id, c.content, c.created_at,
            u.username as author_username, u.avatar_color as author_avatar_color,
            CASE WHEN c.author_id = ? THEN 1 ELSE 0 END as is_author
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [session.id, taskId]
  );

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;
  const { content } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Comment text is required.' }, { status: 400 });
  }

  // Verify user has access to the task, even when it is not in a folder.
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
    return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
  }

  const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  // XSS prevention: sanitize plain text
  const cleanContent = content.trim();

  await execute(
    'INSERT INTO comments (id, task_id, author_id, content) VALUES (?, ?, ?, ?)',
    [commentId, taskId, session.id, cleanContent]
  );

  const newComment = await queryOne(
    `SELECT c.id, c.task_id, c.author_id, c.content, c.created_at,
            u.username as author_username, u.avatar_color as author_avatar_color,
            1 as is_author
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.id = ?`,
    [commentId]
  );

  if (task.folder_id) {
    await notifyFolderMembers({
      folderId: task.folder_id,
      taskId,
      actorId: session.id,
      type: 'comment',
      message: `${session.username} commented on "${task.title}".`,
    });
  }

  return NextResponse.json({ comment: newComment, message: 'Comment posted!' });
}
