import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';

interface RouteParams {
  params: { taskId: string; commentId: string };
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { commentId } = params;

  // Acceptance Criteria: Comment author can delete their own comment
  const comment = await queryOne('SELECT author_id FROM comments WHERE id = ?', [commentId]);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  }

  if (comment.author_id !== session.id) {
    return NextResponse.json({ error: 'You can only delete your own comments.' }, { status: 403 });
  }

  await execute('DELETE FROM comments WHERE id = ?', [commentId]);

  return NextResponse.json({ message: 'Comment deleted successfully.' });
}
