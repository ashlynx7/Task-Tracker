import { execute, query } from './db';

interface FolderActivityNotification {
  folderId: string;
  taskId: string | null;
  actorId: string;
  type: 'task_created' | 'task_completed' | 'task_reopened' | 'task_deleted' | 'folder_deleted' | 'comment' | 'attachment';
  message: string;
}

export async function notifyFolderMembers({
  folderId,
  taskId,
  actorId,
  type,
  message,
}: FolderActivityNotification) {
  if (!folderId) {
    return;
  }

  const recipients = await query<{ user_id: string }>(
    `SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,
    [folderId, actorId, folderId, actorId]
  );

  for (const recipient of recipients) {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await execute(
      `INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notificationId, recipient.user_id, actorId, taskId, type, message]
    );
  }
}