'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Timer as StopwatchIcon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Coffee,
  Brain,
  Volume2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  due_date: string;
  is_completed: number;
  folder_name?: string;
  folder_color?: string;
}

interface FocusWidgetsProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.18, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.5);
    });
  } catch (e) {
    console.warn('AudioContext not allowed or not supported yet:', e);
  }
}

export default function FocusWidgets({ tasks, onSelectTask }: FocusWidgetsProps) {
  // Mode tabs: 'pomodoro' | 'stopwatch'
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'stopwatch'>('pomodoro');

  // 1. Digital Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Pomodoro Timer State (25 min work, 5 min break)
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (pomoRunning) {
      timer = setInterval(() => {
        setPomoSeconds((prev) => {
          if (prev <= 1) {
            playChime();
            if (pomoMode === 'work') {
              setPomoMode('break');
              setPomoSessions((s) => s + 1);
              return 5 * 60; // 5 min break
            } else {
              setPomoMode('work');
              return 25 * 60; // 25 min work
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomoRunning, pomoMode]);

  const switchPomoMode = (mode: 'work' | 'break') => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoSeconds(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const resetPomo = () => {
    setPomoRunning(false);
    setPomoSeconds(pomoMode === 'work' ? 25 * 60 : 5 * 60);
  };

  // 3. Stopwatch State
  const [swTime, setSwTime] = useState(0); // milliseconds
  const [swRunning, setSwRunning] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (swRunning) {
      const start = Date.now() - swTime;
      timer = setInterval(() => {
        setSwTime(Date.now() - start);
      }, 50);
    }
    return () => clearInterval(timer);
  }, [swRunning, swTime]);

  const resetSw = () => {
    setSwRunning(false);
    setSwTime(0);
  };

  // 4. Automated Deadline Countdown (FR-WIDG-001)
  const nearestTask = useMemo(() => {
    const nowMs = currentTime ? currentTime.getTime() : Date.now();
    const upcoming = tasks
      .filter((t) => t.is_completed === 0 && new Date(t.due_date).getTime() >= nowMs)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [tasks, currentTime]);

  const countdownStats = useMemo(() => {
    if (!nearestTask || !currentTime) return null;
    const diffMs = new Date(nearestTask.due_date).getTime() - currentTime.getTime();
    if (diffMs <= 0) return null;

    const totalSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const isUrgent = diffMs < 12 * 3600 * 1000; // < 12 hours
    const isApproaching = diffMs < 24 * 3600 * 1000; // < 24 hours

    return {
      days,
      hours,
      minutes,
      seconds,
      isUrgent,
      isApproaching,
    };
  }, [nearestTask, currentTime]);

  const formatClock = (d: Date | null) => {
    if (!d) return '--:--:--';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPomoTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const fraction = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${fraction}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* Widget 1 & 2: Clock & Impending Deadline (Clean Flat Card) */}
      <div className="lg:col-span-7 bg-[#131826] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex flex-col justify-between gap-4">
        {/* Top Header Row with Time & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3E4B8E]/20 text-[#9ba8e5] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono tracking-tight text-white leading-none">
                {formatClock(currentTime)}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Academic Focus Workspace
          </div>
        </div>

        {/* Impending Deadline Section */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Nearest Impending Deadline
            </span>
            {nearestTask && (
              <span 
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: `${nearestTask.folder_color || '#3E4B8E'}25`,
                  color: nearestTask.folder_color || '#a9b7ee',
                }}
              >
                {nearestTask.folder_name || 'Course'}
              </span>
            )}
          </div>

          {nearestTask && countdownStats ? (
            <div 
              onClick={() => onSelectTask && onSelectTask(nearestTask)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                countdownStats.isUrgent 
                  ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/15' 
                  : 'bg-[#182033] border border-[rgba(255,255,255,0.07)] hover:border-[#3E4B8E]'
              }`}
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-xs font-semibold text-white truncate">
                  {nearestTask.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                  <span className={`font-mono font-semibold ${countdownStats.isUrgent ? 'text-red-300' : 'text-slate-300'}`}>
                    {countdownStats.days > 0 ? `${countdownStats.days}d ` : ''}
                    {countdownStats.hours}h {countdownStats.minutes}m {countdownStats.seconds}s
                  </span>
                  <span>remaining</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-medium">
                    Due {new Date(nearestTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(nearestTask.due_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                {countdownStats.isUrgent && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                    Due Soon
                  </span>
                )}
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#182033] border border-[rgba(255,255,255,0.06)] flex items-center gap-2.5 text-slate-400 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>No upcoming deadlines. All caught up!</span>
            </div>
          )}
        </div>
      </div>

      {/* Widget 3 & 4: Focus Timer (Pomodoro / Stopwatch) */}
      <div className="lg:col-span-5 bg-[#131826] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex flex-col justify-between">
        {/* Tab Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center p-0.5 bg-[#0f1421] rounded-lg border border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'pomodoro' 
                  ? 'bg-[#3E4B8E] text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Pomodoro
            </button>
            <button
              onClick={() => setActiveTab('stopwatch')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'stopwatch' 
                  ? 'bg-[#3E4B8E] text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <StopwatchIcon className="w-3.5 h-3.5" />
              Stopwatch
            </button>
          </div>

          {activeTab === 'pomodoro' && (
            <div className="text-[11px] text-slate-400">
              Sessions: <span className="font-bold text-white bg-white/5 px-1.5 py-0.5 rounded">{pomoSessions}</span>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'pomodoro' ? (
          <div>
            {/* Mode Switchers */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => switchPomoMode('work')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    pomoMode === 'work' 
                      ? 'bg-[#3E4B8E]/30 text-[#b5c2f7] border border-[#3E4B8E]/50' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Brain className="w-3 h-3" />
                  Work (25m)
                </button>
                <button
                  onClick={() => switchPomoMode('break')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    pomoMode === 'break' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  Break (5m)
                </button>
              </div>

              <button
                onClick={playChime}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Test Audio Chime"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Display & Controls */}
            <div className="flex items-center justify-between bg-[#0f1421] p-3 rounded-lg border border-[rgba(255,255,255,0.06)]">
              <div>
                <div className="font-mono text-2xl font-bold tracking-tight text-white leading-none">
                  {formatPomoTime(pomoSeconds)}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                  {pomoMode === 'work' ? 'Focus Session' : 'Rest Break'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPomoRunning(!pomoRunning)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                    pomoRunning 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-[#3E4B8E] hover:bg-[#4A5AA8] text-white'
                  }`}
                >
                  {pomoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{pomoRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={resetPomo}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-slate-400 text-xs mb-3">
              Track elapsed study and reading hours
            </div>

            <div className="flex items-center justify-between bg-[#0f1421] p-3 rounded-lg border border-[rgba(255,255,255,0.06)]">
              <div>
                <div className="font-mono text-2xl font-bold tracking-tight text-white leading-none">
                  {formatStopwatch(swTime)}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                  Elapsed Time
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSwRunning(!swRunning)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                    swRunning 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-[#3E4B8E] hover:bg-[#4A5AA8] text-white'
                  }`}
                >
                  {swRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{swRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={resetSw}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
