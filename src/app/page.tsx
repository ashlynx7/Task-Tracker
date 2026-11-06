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
            AcademiaTask
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
          Real-time Task Queue & Time Logging
        </div>

        <h1 className="font-serif-heading text-4xl sm:text-6xl font-bold tracking-tight text-[#172433] leading-tight mb-5 max-w-3xl">
          Implement, Track & Ship Without The Clutter
        </h1>

        <p className="text-sm sm:text-base text-[#4E5C6E] max-w-xl mb-8 leading-relaxed">
          The editorial task manager built for focused teams and students. Integrated time logger,
          visual task queue, peer collaboration, and subtask milestones.
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

        <form action="/api/auth/guest" method="POST" className="mb-8">
          <button type="submit" className="btn-secondary text-sm py-2.5 px-6">
            Continue as Guest
          </button>
        </form>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D4] shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#3E4B8E]/10 text-[#3E4B8E] flex items-center justify-center mb-4">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif-heading text-base font-bold text-[#172433] mb-1">
              Linear Task Queue
            </h3>
            <p className="text-xs text-[#6A7889] leading-relaxed">
              Track upcoming sprints chronologically with visual status nodes, tags, and quick metadata inspections.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D4] shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#3E4B8E]/10 text-[#3E4B8E] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif-heading text-base font-bold text-[#172433] mb-1">
              Active Time Logging
            </h3>
            <p className="text-xs text-[#6A7889] leading-relaxed">
              Log focus hours with single-click stopwatch tracking and animated audio equalizer telemetry.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D4] shadow-sm">
            <div className="w-9 h-9 rounded-full bg-[#3E4B8E]/10 text-[#3E4B8E] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-serif-heading text-base font-bold text-[#172433] mb-1">
              Equal Co-working
            </h3>
            <p className="text-xs text-[#6A7889] leading-relaxed">
              Invite teammates using student handles. Discuss issues and check off subtasks collaboratively.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-[#E5E0D4] text-center text-xs text-[#7A8796]">
        AcademiaTask Workspace — Built for focused study and collaboration
      </footer>
    </div>
  );
}
