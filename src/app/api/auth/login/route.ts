import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Allow logging in via either username or email
    const user = await queryOne(
      'SELECT id, username, email, password_hash, avatar_color FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [cleanIdentifier, cleanIdentifier]
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const userSession = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_color: user.avatar_color || '#3E4B8E',
    };

    const token = createToken(userSession);
    const response = NextResponse.json({ user: userSession, message: 'Logged in successfully!' });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error while logging in.' }, { status: 500 });
  }
}
