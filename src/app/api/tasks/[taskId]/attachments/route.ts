import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';
import { notifyFolderMembers } from '@/lib/notifications';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: { taskId: string };
}

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;

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

  const attachments = await query(
    `SELECT a.id, a.task_id, a.user_id, a.file_name, a.file_size, a.file_type, a.created_at,
            u.username as uploader_username, u.avatar_color as uploader_avatar_color,
            CASE WHEN a.user_id = ? THEN 1 ELSE 0 END as is_uploader
     FROM task_attachments a
     JOIN users u ON a.user_id = u.id
     WHERE a.task_id = ?
     ORDER BY a.created_at DESC`,
    [session.id, taskId]
  );

  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = params;

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

  try {
    const formData = await req.formData();
    const fileEntries = [...formData.getAll('files'), ...formData.getAll('file')];
    const files = fileEntries.filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400 });
    }

    const taskDir = path.join(UPLOADS_DIR, taskId);
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    const createdAttachments = [];

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 25MB limit.` },
          { status: 400 }
        );
      }

      const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeFileName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
      const diskFileName = `${attachmentId}_${safeFileName}`;
      const filePath = path.join(taskDir, diskFileName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const fileType = file.type || 'application/octet-stream';

      await execute(
        `INSERT INTO task_attachments (id, task_id, user_id, file_name, file_path, file_size, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [attachmentId, taskId, session.id, file.name, diskFileName, file.size, fileType]
      );

      const att = await queryOne(
        `SELECT a.id, a.task_id, a.user_id, a.file_name, a.file_size, a.file_type, a.created_at,
                u.username as uploader_username, u.avatar_color as uploader_avatar_color,
                1 as is_uploader
         FROM task_attachments a
         JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
        [attachmentId]
      );

      if (att) {
        createdAttachments.push(att);
        if (task.folder_id) {
          await notifyFolderMembers({
            folderId: task.folder_id,
            taskId,
            actorId: session.id,
            type: 'attachment',
            message: `${session.username} uploaded "${file.name}" to "${task.title}".`,
          });
        }
      }
    }

    return NextResponse.json({
      attachments: createdAttachments,
      message: `Successfully uploaded ${createdAttachments.length} file(s).`,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed.' }, { status: 500 });
  }
}
