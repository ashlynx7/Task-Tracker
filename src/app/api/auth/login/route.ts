import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    const normalisedIdentifier = identifier.trim();
    const cleanIdentifier = normalisedIdentifier.toLowerCase();

    const demoAliases: Record<string, string> = {
      alex: 'alex_cs',
      alex_cs: 'alex_cs',
      'alex@college.edu': 'alex_cs',
      jordan: 'jordan_dev',
      jordan_dev: 'jordan_dev',
      'jordan@college.edu': 'jordan_dev',
    };

    const effectiveIdentifier = demoAliases[cleanIdentifier] || cleanIdentifier;

    // Allow logging in via either username or email.
    // Also support the demo aliases used by the quick-account buttons.
    const user = await queryOne(
      'SELECT id, username, email, password_hash, avatar_color FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?',
      [effectiveIdentifier, effectiveIdentifier]
    );

    if (!user) {
      const fallbackDemo = {
        alex_cs: { username: 'alex_cs', email: 'alex@college.edu', password_hash: '$2a$10$D8wJ7fUCPyHfUW4HhGg5M.m0tHqj9Q/1g7l0Hz8JQxVg2a8W9xIuG' },
        jordan_dev: { username: 'jordan_dev', email: 'jordan@college.edu', password_hash: '$2a$10$D8wJ7fUCPyHfUW4HhGg5M.m0tHqj9Q/1g7l0Hz8JQxVg2a8W9xIuG' },
      }[effectiveIdentifier];

      if (fallbackDemo && password === 'password123') {
        const userSession = {
          id: fallbackDemo.username === 'alex_cs' ? 'user_alex' : 'user_jordan',
          username: fallbackDemo.username,
          email: fallbackDemo.email,
          avatar_color: fallbackDemo.username === 'alex_cs' ? '#3E4B8E' : '#10b981',
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
      }

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
