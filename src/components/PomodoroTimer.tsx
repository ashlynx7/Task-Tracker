'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Settings, X, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

export type PomodoroMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface PomodoroDurations {
  pomodoro: number; // in minutes
  shortBreak: number;
  longBreak: number;
}

export const DEFAULT_DURATIONS: PomodoroDurations = {
  pomodoro: 30, // 30 minutes matching reference image
  shortBreak: 5,
  longBreak: 15,
};

export function playPomodoroChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime: C Major arpeggio
    const freqs = [523.25, 659.25, 783.99, 1046.50];
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

interface PomodoroTimerProps {
  className?: string;
  accentColor?: string;
  darkMode?: boolean;
  pomodoroMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  onTimerStateChange?: (isRunning: boolean, mode: PomodoroMode, secondsLeft: number) => void;
}

function mixHexColors(baseHex: string, targetHex: string, ratio: number) {
  const normalize = (hex: string) => {
    const sanitized = hex.replace('#', '');
    const fullHex = sanitized.length === 3
      ? sanitized.split('').map((char) => char + char).join('')
      : sanitized;

    const value = Number.parseInt(fullHex, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };

  const [r1, g1, b1] = normalize(baseHex);
  const [r2, g2, b2] = normalize(targetHex);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);

  const r = mix(r1, r2);
  const g = mix(g1, g2);
  const b = mix(b1, b2);

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export default function PomodoroTimer({
  className = '',
  accentColor = '#5bbf9a',
  darkMode = true,
  pomodoroMinutes = DEFAULT_DURATIONS.pomodoro,
  shortBreakMinutes = DEFAULT_DURATIONS.shortBreak,
  longBreakMinutes = DEFAULT_DURATIONS.longBreak,
  onTimerStateChange,
}: PomodoroTimerProps) {
  const [mode, setMode] = useState<PomodoroMode>('pomodoro');
  const [durations, setDurations] = useState<PomodoroDurations>({
    pomodoro: pomodoroMinutes,
    shortBreak: shortBreakMinutes,
    longBreak: longBreakMinutes,
  });
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_DURATIONS.pomodoro * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Ref to track end timestamp for drift-free timing
  const endTimestampRef = useRef<number | null>(null);

  // Restore settings and state from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('tasktracker_pomodoro_durations');
      let restoredDurations = DEFAULT_DURATIONS;
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed.pomodoro === 'number' && typeof parsed.shortBreak === 'number' && typeof parsed.longBreak === 'number') {
          restoredDurations = {
            pomodoro: Math.max(1, Math.min(180, Math.round(parsed.pomodoro))),
            shortBreak: Math.max(1, Math.min(60, Math.round(parsed.shortBreak))),
            longBreak: Math.max(1, Math.min(90, Math.round(parsed.longBreak))),
          };
          setDurations(restoredDurations);
        }
      }

      const savedSound = localStorage.getItem('tasktracker_pomodoro_sound');
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }

      const savedSessions = localStorage.getItem('tasktracker_pomodoro_sessions');
      if (savedSessions) {
        setCompletedSessions(Number(savedSessions) || 0);
      }

      const savedState = localStorage.getItem('tasktracker_pomodoro_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const savedMode: PomodoroMode = parsed.mode && ['pomodoro', 'shortBreak', 'longBreak'].includes(parsed.mode)
          ? parsed.mode
          : 'pomodoro';
        setMode(savedMode);

        const targetEnd = parsed.endTimestamp;
        if (parsed.isRunning && typeof targetEnd === 'number' && targetEnd > Date.now()) {
          const remaining = Math.round((targetEnd - Date.now()) / 1000);
          setSecondsLeft(remaining);
          endTimestampRef.current = targetEnd;
          setIsRunning(true);
        } else if (typeof parsed.secondsLeft === 'number' && parsed.secondsLeft > 0) {
          setSecondsLeft(parsed.secondsLeft);
          setIsRunning(false);
          endTimestampRef.current = null;
        } else {
          setSecondsLeft(restoredDurations[savedMode] * 60);
          setIsRunning(false);
          endTimestampRef.current = null;
        }
      } else {
        setSecondsLeft(restoredDurations.pomodoro * 60);
      }
    } catch (e) {
      console.warn('Failed to restore pomodoro state:', e);
      setSecondsLeft(DEFAULT_DURATIONS.pomodoro * 60);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('tasktracker_pomodoro_state', JSON.stringify({
        mode,
        secondsLeft,
        isRunning,
        endTimestamp: isRunning ? endTimestampRef.current : null,
      }));
    } catch {}
  }, [mode, secondsLeft, isRunning, initialized]);

  // Persist durations
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('tasktracker_pomodoro_durations', JSON.stringify(durations));
    } catch {}
  }, [durations, initialized]);

  // Persist sound
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('tasktracker_pomodoro_sound', String(soundEnabled));
    } catch {}
  }, [soundEnabled, initialized]);

  useEffect(() => {
    setDurations((prev) => ({
      ...prev,
      pomodoro: Math.max(1, pomodoroMinutes),
      shortBreak: Math.max(1, shortBreakMinutes),
      longBreak: Math.max(1, longBreakMinutes),
    }));
  }, [pomodoroMinutes, shortBreakMinutes, longBreakMinutes]);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(durations[mode] * 60);
    }
  }, [durations, mode, isRunning]);

  // Notify parent of state changes
  useEffect(() => {
    onTimerStateChange?.(isRunning, mode, secondsLeft);
  }, [isRunning, mode, secondsLeft, onTimerStateChange]);

  // Timer tick effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (endTimestampRef.current !== null) {
        const remaining = Math.max(0, Math.round((endTimestampRef.current - Date.now()) / 1000));
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setIsRunning(false);
          endTimestampRef.current = null;

          if (soundEnabled) {
            playPomodoroChime();
          }

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const title = mode === 'pomodoro' ? 'Pomodoro Completed!' : 'Break Completed!';
            const body = mode === 'pomodoro'
              ? 'Great work! Take a short or long break to recharge.'
              : 'Break finished! Ready to get back into focus?';
            try {
              new Notification(title, { body });
            } catch {}
          }

          if (mode === 'pomodoro') {
            setCompletedSessions((prev) => {
              const updated = prev + 1;
              try {
                localStorage.setItem('tasktracker_pomodoro_sessions', String(updated));
              } catch {}
              return updated;
            });
          }
        }
      } else {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            if (soundEnabled) playPomodoroChime();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, mode, soundEnabled]);

  const selectMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    endTimestampRef.current = null;
    setMode(newMode);
    setSecondsLeft(durations[newMode] * 60);
  }, [durations]);

  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      endTimestampRef.current = null;
    } else {
      let currentSeconds = secondsLeft;
      if (currentSeconds <= 0) {
        currentSeconds = durations[mode] * 60;
        setSecondsLeft(currentSeconds);
      }
      endTimestampRef.current = Date.now() + currentSeconds * 1000;
      setIsRunning(true);
    }
  }, [isRunning, secondsLeft, durations, mode]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    endTimestampRef.current = null;
    setSecondsLeft(durations[mode] * 60);
  }, [durations, mode]);

  const updateDuration = useCallback((targetMode: PomodoroMode, minutes: number) => {
    const validMinutes = Math.max(1, Math.min(180, Math.round(minutes) || 1));
    setDurations((prev) => {
      const next = { ...prev, [targetMode]: validMinutes };
      return next;
    });

    if (mode === targetMode && !isRunning) {
      setSecondsLeft(validMinutes * 60);
      endTimestampRef.current = null;
    }
  }, [mode, isRunning]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const shellTop = darkMode
    ? mixHexColors(accentColor, '#0f172a', 0.52)
    : mixHexColors(accentColor, '#102026', 0.55);
  const shellBody = darkMode
    ? mixHexColors(accentColor, '#0b1220', 0.72)
    : mixHexColors(accentColor, '#1d2d35', 0.8);
  const shellPanel = darkMode
    ? mixHexColors(accentColor, '#1b2430', 0.7)
    : mixHexColors(accentColor, '#dfe8eb', 0.75);

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] p-4 text-white shadow-xl transition-all select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${shellTop} 0%, ${shellBody} 100%)`,
        boxShadow: '0 12px 28px -12px rgba(0, 0, 0, 0.28)',
      }}
    >
      {/* Top Row: Mode selector pills */}
      <div className="flex items-center justify-center gap-1.5 w-full">
        <button
          type="button"
          onClick={() => selectMode('pomodoro')}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
            mode === 'pomodoro'
              ? 'shadow-sm'
              : 'border border-white/50 bg-white/10 text-white hover:bg-white/15 hover:border-white/80'
          }`}
          style={mode === 'pomodoro' ? { backgroundColor: 'rgba(255,255,255,0.88)', color: '#0f172a' } : { backdropFilter: 'blur(8px)' }}
        >
          Pomodoro
        </button>

        <button
          type="button"
          onClick={() => selectMode('shortBreak')}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
            mode === 'shortBreak'
              ? 'font-semibold shadow-sm'
              : 'border border-white/50 bg-white/10 text-white hover:bg-white/15 hover:border-white/80'
          }`}
          style={mode === 'shortBreak' ? { backgroundColor: 'rgba(255,255,255,0.88)', color: '#0f172a' } : { backdropFilter: 'blur(8px)' }}
        >
          Short Break
        </button>

        <button
          type="button"
          onClick={() => selectMode('longBreak')}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
            mode === 'longBreak'
              ? 'font-semibold shadow-sm'
              : 'border border-white/50 bg-white/10 text-white hover:bg-white/15 hover:border-white/80'
          }`}
          style={mode === 'longBreak' ? { backgroundColor: 'rgba(255,255,255,0.88)', color: '#0f172a' } : { backdropFilter: 'blur(8px)' }}
        >
          Long Break
        </button>
      </div>

      {/* Center: Large bold countdown timer */}
      <div className="my-3.5 flex items-center justify-center">
        <span
          className="font-bold text-white text-[42px] leading-none tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
          style={{ fontFamily: 'var(--font-sans), system-ui, -apple-system, sans-serif' }}
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Bottom Controls Row: Start/Pause button, Reset icon, Settings icon */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleTimer}
          className="rounded-full px-5 py-1.5 text-xs font-bold shadow-sm transition active:scale-95"
          style={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: `0 8px 18px -10px ${accentColor}`,
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          title="Reset timer"
          aria-label="Reset timer"
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/95 transition hover:bg-white/15 hover:text-white active:scale-90"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          title="Timer settings"
          aria-label="Timer settings"
          className={`flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90 ${
            showSettings ? 'bg-white text-neutral-900' : 'text-white/95 hover:bg-white/15 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Cycle indicator dots */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] text-white/80">
        <span className="opacity-75">Cycle</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((idx) => {
            const filled = (completedSessions % 4) > idx || (completedSessions > 0 && completedSessions % 4 === 0 && mode !== 'pomodoro');
            return (
              <span
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  filled ? 'bg-white shadow-[0_0_4px_white]' : 'bg-white/30'
                }`}
              />
            );
          })}
        </div>
        <span className="opacity-75 font-mono ml-0.5">#{completedSessions}</span>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          className="mt-3 rounded-xl border border-white/20 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all"
          style={{ backgroundColor: shellPanel, backdropFilter: 'blur(18px)' }}
        >
          <div className="mb-2.5 flex items-center justify-between border-b border-[#3d5b55]/40 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#20312d]">
              Timer Durations (Min)
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="rounded p-0.5 text-[#20312d]/80 hover:bg-black/5 hover:text-[#10211f]"
              title="Close settings"
              aria-label="Close settings"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="pomodoro-duration" className="text-[11px] text-[#20312d]">
                Pomodoro
              </label>
              <input
                id="pomodoro-duration"
                type="number"
                min={1}
                max={120}
                value={durations.pomodoro}
                onChange={(e) => updateDuration('pomodoro', Number(e.target.value))}
                className="w-14 rounded-md border border-[#3d5b55]/35 bg-[#edf3f1] px-2 py-0.5 text-right font-mono text-xs text-[#1d2d2b] focus:border-[#2d4b46] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="short-break-duration" className="text-[11px] text-[#20312d]">
                Short Break
              </label>
              <input
                id="short-break-duration"
                type="number"
                min={1}
                max={60}
                value={durations.shortBreak}
                onChange={(e) => updateDuration('shortBreak', Number(e.target.value))}
                className="w-14 rounded-md border border-[#3d5b55]/35 bg-[#edf3f1] px-2 py-0.5 text-right font-mono text-xs text-[#1d2d2b] focus:border-[#2d4b46] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="long-break-duration" className="text-[11px] text-[#20312d]">
                Long Break
              </label>
              <input
                id="long-break-duration"
                type="number"
                min={1}
                max={90}
                value={durations.longBreak}
                onChange={(e) => updateDuration('longBreak', Number(e.target.value))}
                className="w-14 rounded-md border border-[#3d5b55]/35 bg-[#edf3f1] px-2 py-0.5 text-right font-mono text-xs text-[#1d2d2b] focus:border-[#2d4b46] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#3d5b55]/30 pt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-[#20312d]">
                {soundEnabled ? <Volume2 className="h-3 w-3 text-[#20312d]" /> : <VolumeX className="h-3 w-3 text-[#20312d]" />}
                Chime on Finish
              </span>
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  soundEnabled ? 'bg-white' : 'bg-white/25'
                }`}
                title="Toggle sound"
                aria-label="Toggle sound"
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-3.5 bg-neutral-900' : 'translate-x-0.5 bg-white'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

