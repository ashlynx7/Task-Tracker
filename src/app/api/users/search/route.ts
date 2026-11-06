import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';

  // FR-AUTH-002: Typing 2+ characters triggers a query
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // FR-AUTH-002: Exclude current logged-in user and return up to 5 best matching active accounts
  const users = await query(
    `SELECT id, username, email, avatar_color 
     FROM users 
     WHERE LOWER(username) LIKE ? AND id != ?
     ORDER BY 
       CASE WHEN LOWER(username) = ? THEN 1
            WHEN LOWER(username) LIKE ? THEN 2
            ELSE 3 END,
       username ASC
     LIMIT 5`,
    [`%${q}%`, session.id, q, `${q}%`]
  );

  return NextResponse.json({ users });
}
