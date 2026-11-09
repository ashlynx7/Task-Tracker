import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { getFile, removeFile, useSupabaseStorage } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: { taskId: string; attachmentId: string };
}

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId, attachmentId } = params;

  const task = await queryOne(
    `SELECT t.id, f.owner_id FROM tasks t
     JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,
    [taskId, session.id, session.id]
  );

  if (!task) {
    return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 404 });
  }

  const attachment = await queryOne(
    `SELECT * FROM task_attachments WHERE id = ? AND task_id = ?`,
    [attachmentId, taskId]
  );

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

  let fileBuffer: Buffer;
  let storedType: string | null = null;

  if (useSupabaseStorage) {
    try {
      const stored = await getFile(taskId, attachment.file_path);
      fileBuffer = stored.buffer;
      storedType = stored.contentType;
    } catch {
      return NextResponse.json({ error: 'File not found in storage.' }, { status: 404 });
    }
  } else {
    const filePath = path.join(UPLOADS_DIR, taskId, attachment.file_path);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File on disk not found.' }, { status: 404 });
    }
    fileBuffer = fs.readFileSync(filePath);
  }

  const download = req.nextUrl.searchParams.get('download') === '1';
  const disposition = download ? 'attachment' : 'inline';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': attachment.file_type || storedType || 'application/octet-stream',
      'Content-Disposition': `${disposition}; filename="${encodeURIComponent(attachment.file_name)}"`,
      'Content-Length': fileBuffer.length.toString(),
    },
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId, attachmentId } = params;

  const attachment = await queryOne(
    `SELECT a.*, f.owner_id as folder_owner_id 
     FROM task_attachments a
     JOIN tasks t ON a.task_id = t.id
     JOIN folders f ON t.folder_id = f.id
     WHERE a.id = ? AND a.task_id = ?`,
    [attachmentId, taskId]
  );

  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

  if (attachment.user_id !== session.id && attachment.folder_owner_id !== session.id) {
    return NextResponse.json(
      { error: 'Permission denied to delete this attachment.' },
      { status: 403 }
    );
  }

  try {
    if (useSupabaseStorage) {
      await removeFile(taskId, attachment.file_path);
    } else {
      const filePath = path.join(UPLOADS_DIR, taskId, attachment.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.warn('Failed to remove attachment file:', err);
  }

  await execute(`DELETE FROM task_attachments WHERE id = ?`, [attachmentId]);

  return NextResponse.json({ success: true, message: 'Attachment deleted.' });
}
