'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timer, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (userHandle: string) => {
    setIdentifier(userHandle);
    setPassword('password123');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: userHandle, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login with demo account');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F3F0E6] text-[#172433]">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5E0D4] shadow-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#152A42] text-white mx-auto flex items-center justify-center mb-3 shadow">
            <Timer className="w-6 h-6" />
          </div>
          <h1 className="font-serif-heading text-2xl font-bold tracking-tight text-[#172433]">
            AcademiaTask
          </h1>
          <p className="text-xs text-[#7A8796] mt-1">
            Sign in to your academic workspace
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Username or College Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8E9BAC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="alex_cs or alex@college.edu"
                className="input-field pl-10 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Password
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
                Sign In to Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill */}
        <div className="mt-6 pt-5 border-t border-[#E5E0D4]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8796] text-center mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Demo Student Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('alex_cs')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#F5F2EA] hover:bg-[#ECE7DC] border border-[#E0DBD0] text-left transition-colors text-xs"
            >
              <div className="font-semibold text-[#172433]">Alex (Lead)</div>
              <div className="text-[10px] text-[#7A8796]">@alex_cs • 5 courses</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('jordan_dev')}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#F5F2EA] hover:bg-[#ECE7DC] border border-[#E0DBD0] text-left transition-colors text-xs"
            >
              <div className="font-semibold text-[#172433]">Jordan (Peer)</div>
              <div className="text-[10px] text-[#7A8796]">@jordan_dev • Sprint 3</div>
            </button>
          </div>
        </div>

        <form action="/api/auth/guest" method="POST" className="mt-5">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl border border-[#E5E0D4] bg-[#F5F2EA] text-[#172433] text-xs font-semibold transition hover:bg-[#ECE7DC]"
          >
            Continue as Guest
          </button>
        </form>

        <p className="text-center text-xs text-[#7A8796] mt-6">
          New to AcademiaTask?{' '}
          <Link href="/register" className="text-[#3E4B8E] hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
