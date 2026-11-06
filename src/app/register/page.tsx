'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timer, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUsernameValid = (name: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(name.trim());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;

    if (!isUsernameValid(username)) {
      setError('Username must be 3–20 characters with letters, numbers, or underscores only.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const usernameTrimmed = username.trim();
  const usernameFormatOk = usernameTrimmed.length >= 3 && isUsernameValid(usernameTrimmed);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F3F0E6] text-[#172433]">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5E0D4] shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#152A42] text-white mx-auto flex items-center justify-center mb-3 shadow">
            <Timer className="w-6 h-6" />
          </div>
          <h1 className="font-serif-heading text-2xl font-bold tracking-tight text-[#172433]">
            Join Task Tracker
          </h1>
          <p className="text-xs text-[#7A8796] mt-1">
            Create your account to organize coursework and collaborate
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796]">
                Student Handle
              </label>
              {usernameTrimmed.length > 0 && (
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                  usernameFormatOk ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {usernameFormatOk ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Valid format
                    </>
                  ) : (
                    '3–20 chars (letters/numbers/_)'
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E9BAC] z-10 pointer-events-none">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_cs or jordan_dev"
                className="input-field pl-8 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              College Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8E9BAC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="input-field pl-10 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Password (6+ characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8E9BAC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 text-xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-blue w-full py-2.5 text-xs font-bold tracking-wide mt-2"
          >
            {loading ? <div className="spinner" /> : (
              <>
                Create Account
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <form action="/api/auth/login" method="POST" className="mt-4">
          <input type="hidden" name="identifier" value="alex_cs" />
          <input type="hidden" name="password" value="password123" />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl border border-[#E5E0D4] bg-[#F5F2EA] text-[#172433] text-xs font-semibold transition hover:bg-[#ECE7DC]"
          >
            Continue as Guest
          </button>
        </form>

        <p className="text-center text-xs text-[#7A8796] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3E4B8E] hover:underline font-semibold">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
