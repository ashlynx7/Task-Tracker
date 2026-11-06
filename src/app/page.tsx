import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { 
  Timer, 
  ArrowRight, 
  Clock, 
  Users, 
  CheckSquare, 
  BarChart2, 
  Sparkles 
} from 'lucide-react';

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token && verifyToken(token)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#F3F0E6] text-[#172433] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between border-b border-[#E5E0D4]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#152A42] flex items-center justify-center text-white shadow-sm">
            <Timer className="w-4 h-4" />
          </div>
          <span className="font-serif-heading text-xl font-bold tracking-tight text-[#172433]">
            Task Tracker
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-xs py-2 px-4">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary-blue text-xs py-2 px-4 shadow-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAE6DC] border border-[#DDD7C9] text-[#4F5D70] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Stay Organize, Stay Productive
        </div>

        <h1 className="font-serif-heading text-5xl sm:text-7xl font-bold tracking-tight text-[#172433] leading-[0.9] mb-5 max-w-4xl">
          Task Tracker
        </h1>

        <p className="text-sm sm:text-base text-[#4E5C6E] max-w-xl mb-8 leading-relaxed">
          A simple task management platform designed for students. Organize your assignments,
          set priorities, manage deadlines, and track your progress in one place.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href="/register" className="btn-primary-blue text-sm py-2.5 px-6 shadow-sm flex items-center gap-2">
            Launch Your Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-sm py-2.5 px-6">
            Try Demo Accounts (Alex & Jordan)
          </Link>
        </div>

        <form action="/api/auth/login" method="POST" className="mb-8">
          <input type="hidden" name="identifier" value="alex_cs" />
          <input type="hidden" name="password" value="password123" />
          <button type="submit" className="btn-secondary text-sm py-2.5 px-6">
            Continue as Guest
          </button>
        </form>

      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-[#E5E0D4] text-center text-xs text-[#7A8796]">
        Task Tracker
      </footer>
    </div>
  );
}
