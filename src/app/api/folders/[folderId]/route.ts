import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { notifyFolderMembers } from '@/lib/notifications';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: { folderId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { folderId } = params;
  const { name, color_hex, restore } = await req.json();

  // Verify access (owner or collaborator per Option 1 co-working model)
  const hasAccess = await queryOne(
    `SELECT f.id FROM folders f
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,
    [folderId, session.id, session.id]
  );

  if (!hasAccess) {
    return NextResponse.json({ error: 'Folder not found or permission denied.' }, { status: 404 });
  }

  if (restore === true) {
    await execute('UPDATE folders SET deleted_at = NULL WHERE id = ?', [folderId]);
    await execute('UPDATE tasks SET deleted_at = NULL WHERE folder_id = ? AND deleted_at IS NOT NULL', [folderId]);
    return NextResponse.json({ message: 'Folder restored successfully!' });
  }

  if (name && name.trim()) {
    await execute('UPDATE folders SET name = ? WHERE id = ?', [name.trim(), folderId]);
  }
  if (color_hex) {
    await execute('UPDATE folders SET color_hex = ? WHERE id = ?', [color_hex, folderId]);
  }

  const updated = await queryOne('SELECT * FROM folders WHERE id = ?', [folderId]);
  return NextResponse.json({ folder: updated, message: 'Folder updated successfully!' });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { folderId } = params;
    const body = await req.json().catch(() => ({}));
    const permanent = Boolean(body.permanent || body.force || body.permanent === true);
    const folder = await queryOne<{ owner_id: string; name: string }>(
      'SELECT owner_id, name FROM folders WHERE id = ?',
      [folderId]
    );

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    }

    if (permanent) {
      if (folder.owner_id !== session.id) {
        return NextResponse.json({ error: 'Only the folder owner can permanently delete it.' }, { status: 403 });
      }

      await execute('DELETE FROM folder_collaborators WHERE folder_id = ?', [folderId]);
      await execute('DELETE FROM tasks WHERE folder_id = ?', [folderId]);
      await execute('DELETE FROM folders WHERE id = ?', [folderId]);
      return NextResponse.json({ message: 'Folder permanently deleted.' });
    }

    if (folder.owner_id === session.id) {
      await notifyFolderMembers({
        folderId,
        taskId: null,
        actorId: session.id,
        type: 'folder_deleted',
        message: `${session.username} deleted folder "${folder.name}".`,
      });

      const result = await execute('UPDATE folders SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [new Date().toISOString(), folderId]);
      await execute('UPDATE tasks SET deleted_at = ? WHERE folder_id = ? AND deleted_at IS NULL', [new Date().toISOString(), folderId]);
      if (result.rowsModified !== 1) {
        return NextResponse.json({ error: 'Folder could not be deleted.' }, { status: 409 });
      }

      return NextResponse.json({ message: 'Folder archived successfully. It can be restored from history for 7 days.' });
    }

    const collaborator = await queryOne(
      'SELECT folder_id FROM folder_collaborators WHERE folder_id = ? AND user_id = ?',
      [folderId, session.id]
    );
    if (!collaborator) {
      return NextResponse.json({ error: 'You do not have access to this folder.' }, { status: 403 });
    }

    const result = await execute(
      'DELETE FROM folder_collaborators WHERE folder_id = ? AND user_id = ?',
      [folderId, session.id]
    );
    if (result.rowsModified !== 1) {
      return NextResponse.json({ error: 'Could not leave the shared folder.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'You have left the shared folder.' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder.' }, { status: 500 });
  }
}
