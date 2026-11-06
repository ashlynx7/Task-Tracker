import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { AUTH_COOKIE_NAME, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const guestUsername = 'alex_cs';
    const user = await queryOne(
      'SELECT id, username, email, avatar_color FROM users WHERE LOWER(username) = LOWER(?)',
      [guestUsername]
    );

    if (!user) {
      return NextResponse.json({ error: 'Guest account is unavailable.' }, { status: 404 });
    }

    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_color: user.avatar_color || '#3E4B8E',
    };

    const token = createToken(session);
    const response = NextResponse.redirect(new URL('/dashboard', req.url));

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json({ error: 'Unable to continue as guest.' }, { status: 500 });
  }
}
