import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

interface RouteParams {
  params: { folderId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { folderId } = params;
  const { username } = await req.json();

  if (!username || !username.trim()) {
    return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
  }

  const targetUsername = username.trim().toLowerCase();

  // Verify caller has access to the folder (owner or co-worker)
  const folder = await queryOne(
    `SELECT f.id, f.name, f.owner_id FROM folders f
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,
    [folderId, session.id, session.id]
  );

  if (!folder) {
    return NextResponse.json({ error: 'Folder not found or permission denied.' }, { status: 404 });
  }

  // Find target user
  const targetUser = await queryOne(
    'SELECT id, username, email, avatar_color FROM users WHERE LOWER(username) = ?',
    [targetUsername]
  );

  if (!targetUser) {
    return NextResponse.json({ error: `User "@${username}" does not exist.` }, { status: 404 });
  }

  // Check if target user is already the owner
  if (targetUser.id === folder.owner_id) {
    return NextResponse.json({ error: `@${targetUser.username} is already the owner of this folder.` }, { status: 400 });
  }

  // Check if already a collaborator
  const existingCollab = await queryOne(
    'SELECT * FROM folder_collaborators WHERE folder_id = ? AND user_id = ?',
    [folderId, targetUser.id]
  );

  if (existingCollab) {
    return NextResponse.json({ error: `@${targetUser.username} is already a collaborator on this folder.` }, { status: 400 });
  }

  // Add collaborator
  await execute(
    'INSERT INTO folder_collaborators (folder_id, user_id) VALUES (?, ?)',
    [folderId, targetUser.id]
  );

  // Let the invited user know they now have access
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await execute(
    `INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
     VALUES (?, ?, ?, NULL, 'folder_invite', ?)`,
    [notificationId, targetUser.id, session.id, `@${session.username} added you to the folder "${folder.name}".`]
  );

  // Return all collaborators
  const collaborators = await query(
    `SELECT u.id, u.username, u.email, u.avatar_color, fc.joined_at
     FROM folder_collaborators fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.folder_id = ?`,
    [folderId]
  );

  return NextResponse.json({
    collaborators,
    addedUser: targetUser,
    message: `@${targetUser.username} has been added as a collaborator!`,
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { folderId } = params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target userId required.' }, { status: 400 });
  }

  const folder = await queryOne('SELECT owner_id FROM folders WHERE id = ?', [folderId]);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
  }

  // User can remove themselves, or the owner can remove any collaborator
  if (targetUserId !== session.id && folder.owner_id !== session.id) {
    return NextResponse.json({ error: 'Permission denied to remove this collaborator.' }, { status: 403 });
  }

  await execute(
    'DELETE FROM folder_collaborators WHERE folder_id = ? AND user_id = ?',
    [folderId, targetUserId]
  );

  return NextResponse.json({ message: 'Collaborator removed successfully.' });
}
