import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { hashPassword, validateEmail, validateUsername, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const AVATAR_COLORS = ['#3E4B8E', '#2563eb', '#0d9488', '#10b981', '#d97706', '#ea580c', '#e11d48', '#7c3aed', '#475569'];

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // 1. Validate Username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.message }, { status: 400 });
    }

    // 2. Validate Email
    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid college email address.' }, { status: 400 });
    }

    // 3. Validate Password
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username already taken (FR-AUTH-001)
    const existingUser = await queryOne('SELECT id FROM users WHERE LOWER(username) = ?', [cleanUsername]);
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken. Please choose another.' }, { status: 409 });
    }

    // Check if email already registered
    const existingEmail = await queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = hashPassword(password);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    await execute(
      'INSERT INTO users (id, username, email, password_hash, avatar_color) VALUES (?, ?, ?, ?, ?)',
      [userId, cleanUsername, cleanEmail, passwordHash, avatarColor]
    );

    // Auto-create default "General Coursework" folder
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await execute(
      'INSERT INTO folders (id, name, color_hex, owner_id) VALUES (?, ?, ?, ?)',
      [folderId, 'General Coursework', '#3E4B8E', userId]
    );

    const userSession = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      avatar_color: avatarColor,
    };

    const token = createToken(userSession);
    const response = NextResponse.json({ user: userSession, message: 'Account created successfully!' });
    
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error while creating account.' }, { status: 500 });
  }
}
