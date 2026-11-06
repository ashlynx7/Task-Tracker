import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestedOffset = Number(new URL(req.url).searchParams.get('timezoneOffsetMinutes'));
  const timezoneOffsetMinutes = Number.isFinite(requestedOffset) && Math.abs(requestedOffset) <= 840
    ? Math.trunc(requestedOffset)
    : 0;
  const localNow = new Date(Date.now() - timezoneOffsetMinutes * 60 * 1000);
  const dayKey = [
    localNow.getUTCFullYear(),
    String(localNow.getUTCMonth() + 1).padStart(2, '0'),
    String(localNow.getUTCDate()).padStart(2, '0'),
  ].join('-');
  const localDayStart = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
  const dueStart = new Date(localDayStart + timezoneOffsetMinutes * 60 * 1000).toISOString();
  const dueEnd = new Date(localDayStart + 86400000 + timezoneOffsetMinutes * 60 * 1000).toISOString();
  const deadlinePrefix = `deadline_${session.id}_${dayKey}_`;

  await execute(
    `DELETE FROM notifications
     WHERE recipient_id = ? AND task_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM tasks t
         JOIN folders f ON f.id = t.folder_id
         WHERE t.id = notifications.task_id
       )`,
    [session.id]
  );

  await execute(
    "DELETE FROM notifications WHERE recipient_id = ? AND type = 'deadline' AND id NOT LIKE ?",
    [session.id, `${deadlinePrefix}%`]
  );

  const dueTasks = await query<{ id: string; title: string; due_date: string }>(
    `SELECT DISTINCT t.id, t.title, t.due_date
     FROM tasks t
     JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE (f.owner_id = ? OR fc.user_id = ?)
       AND t.is_completed = 0
       AND t.due_date >= ?
       AND t.due_date < ?
     ORDER BY datetime(t.due_date) ASC`,
    [session.id, session.id, dueStart, dueEnd]
  );
  const dueTaskIds = new Set(dueTasks.map((task) => task.id));
  const existingDeadlines = await query<{ id: string; task_id: string }>(
    `SELECT id, task_id FROM notifications
     WHERE recipient_id = ? AND type = 'deadline' AND id LIKE ?`,
    [session.id, `${deadlinePrefix}%`]
  );
  const existingDeadlineIds = new Set(existingDeadlines.map((notification) => notification.id));

  for (const notification of existingDeadlines) {
    if (!dueTaskIds.has(notification.task_id)) {
      await execute('DELETE FROM notifications WHERE id = ? AND recipient_id = ?', [notification.id, session.id]);
    }
  }

  for (const task of dueTasks) {
    const notificationId = `${deadlinePrefix}${task.id}`;
    if (existingDeadlineIds.has(notificationId)) continue;
    await execute(
      `INSERT INTO notifications (id, recipient_id, task_id, type, message)
       VALUES (?, ?, ?, 'deadline', ?)`,
      [notificationId, session.id, task.id, !Number.isNaN(new Date(task.due_date).getTime()) ? `Due today at ${new Date(task.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}: "${task.title}".` : `Due today: "${task.title}".`]
    );
  }

  const notifications = await query(
    `SELECT n.id, n.task_id, n.type, n.message, n.created_at, n.is_read
     FROM notifications n
     LEFT JOIN tasks t ON t.id = n.task_id
     WHERE n.recipient_id = ?
     ORDER BY CASE WHEN n.type = 'deadline' THEN 0 ELSE 1 END,
              CASE WHEN n.type = 'deadline' THEN datetime(t.due_date) END ASC,
              datetime(n.created_at) DESC
     LIMIT 50`,
    [session.id]
  );

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  if (body.all === true) {
    await execute(
      'UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0',
      [session.id]
    );
  } else if (typeof body.id === 'string') {
    await execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?',
      [body.id, session.id]
    );
  } else {
    return NextResponse.json({ error: 'A notification id or all=true is required.' }, { status: 400 });
  }

  return NextResponse.json({ message: 'Notifications updated.' });
}
