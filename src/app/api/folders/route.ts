import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get('deleted') === 'true';

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const folderParams: any[] = [session.id, session.id, session.id];
  let deletedFilter = 'f.deleted_at IS NULL';
  if (includeDeleted) {
    deletedFilter = 'f.deleted_at IS NOT NULL AND f.deleted_at >= ?';
    folderParams.push(cutoff);
  }

  const folders = await query(
    `SELECT DISTINCT f.id, f.name, f.color_hex, f.owner_id, f.parent_id, f.created_at, f.deleted_at,
            u.username as owner_username,
            CASE WHEN f.owner_id = ? THEN 1 ELSE 0 END as is_owner
     FROM folders f
     LEFT JOIN users u ON f.owner_id = u.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE (f.owner_id = ? OR fc.user_id = ?)
       AND ${deletedFilter}
     ORDER BY f.created_at ASC`,
    folderParams
  );

  // Fetch collaborators and task counts for each folder
  const enrichedFolders = await Promise.all(
    folders.map(async (folder) => {
      const collaborators = await query(
        `SELECT u.id, u.username, u.email, u.avatar_color, fc.joined_at
         FROM folder_collaborators fc
         JOIN users u ON fc.user_id = u.id
         WHERE fc.folder_id = ?`,
        [folder.id]
      );

      const stats = await queryOne(
        `SELECT 
           COUNT(*) as total_tasks,
           SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending_tasks
         FROM tasks WHERE folder_id = ?`,
        [folder.id]
      );

      return {
        ...folder,
        is_shared: collaborators.length > 0 || folder.is_owner === 0,
        collaborators,
        total_tasks: Number(stats?.total_tasks || 0),
        pending_tasks: Number(stats?.pending_tasks || 0),
      };
    })
  );

  return NextResponse.json({ folders: enrichedFolders });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, color_hex } = await req.json();
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const folderColor = color_hex || '#3E4B8E';

    await execute(
      'INSERT INTO folders (id, name, color_hex, owner_id) VALUES (?, ?, ?, ?)',
      [folderId, name.trim(), folderColor, session.id]
    );

    const folder = await queryOne(
      'SELECT id, name, color_hex, owner_id, parent_id, created_at FROM folders WHERE id = ?',
      [folderId]
    );

    return NextResponse.json({
      folder: {
        ...folder,
        is_owner: 1,
        is_shared: false,
        collaborators: [],
        total_tasks: 0,
        pending_tasks: 0,
      },
      message: 'Folder created successfully!',
    });
  } catch (err: any) {
    console.error('Error creating folder:', err);
    return NextResponse.json({ error: 'Failed to create folder.' }, { status: 500 });
  }
}
