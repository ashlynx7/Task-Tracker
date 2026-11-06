'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  Folder,
  Users,
  Settings, 
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  LogOut,
  Palette,
  Bell,
  Globe,
  Shield,
  Trash2,
  Clock3,
  Move,
  History,
  Minus,
  Maximize2
} from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';

interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatar_color?: string;
}

interface FolderItem {
  id: string;
  name: string;
  color_hex: string;
  owner_id: string;
  parent_id: string | null;
  created_at?: string;
  is_owner: number;
  is_shared: boolean;
  total_tasks: number;
  pending_tasks: number;
  collaborators?: Collaborator[];
}

interface UserSession {
  id: string;
  username: string;
  email: string;
  avatar_color?: string;
}

interface AppConfig {
  darkMode: boolean;
  compactView: boolean;
  accentColor: string;
  notifications: boolean;
  deadlineReminder: string;
  language: string;
  dateFormat: string;
  profileVisibility: string;
  activityStatus: boolean;
  pomodoroWork: number;
  pomodoroBreak: number;
  autoBreakdown: boolean;
}

interface SidebarProps {
  user: UserSession;
  folders: FolderItem[];
  activeFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onOpenNewFolderModal: () => void;
  onOpenEditFolderModal: (folder: FolderItem) => void;
  onLogout: () => void;
  totalPendingTasks: number;
  activeNav?: string;
  onSelectNav?: (nav: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  onDeleteFolder?: (folderId: string) => void;
  appConfig?: AppConfig;
  onConfigChange?: (config: Partial<AppConfig>) => void;
  currentTimeLabel: string;
  sessionTimerLabel: string;
  sessionTargetLabel: string;
  sessionTargetSeconds: number;
  sessionProgress: number;
  isTimerRunning: boolean;
  onToggleSessionTimer: () => void;
  onResetSessionTimer?: () => void;
  onSessionTargetChange: (seconds: number) => void;
  completedTaskCount?: number;
}

// Ambient music tracks - using Web Audio API generated ambient sounds
const MUSIC_TRACKS = [
  { id: 'lofi_rain', name: 'Rainy Lo-Fi', emoji: '🌧️' },
  { id: 'deep_focus', name: 'Deep Focus', emoji: '🧠' },
  { id: 'cafe_vibes', name: 'Café Vibes', emoji: '☕' },
  { id: 'nature_sounds', name: 'Nature Sounds', emoji: '🌿' },
];

const YOUTUBE_TRACKS: Record<string, string> = {
  lofi_rain: 'qGdMzB9P4VE',
  deep_focus: 'Shnvh1ivAIU',
  cafe_vibes: 'DIT_SXDcjns',
  nature_sounds: 'u3EBlmzb9ds',
};

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  const fullHex = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized;

  const numeric = Number.parseInt(fullHex, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHexColors(baseHex: string, targetHex: string, ratio: number) {
  const normalize = (hex: string) => {
    const sanitized = hex.replace('#', '');
    const fullHex = sanitized.length === 3
      ? sanitized.split('').map((char) => char + char).join('')
      : sanitized;

    const value = Number.parseInt(fullHex, 16);
    return [
      (value >> 16) & 255,
      (value >> 8) & 255,
      value & 255,
    ];
  };

  const [r1, g1, b1] = normalize(baseHex);
  const [r2, g2, b2] = normalize(targetHex);

  const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
  const r = mix(r1, r2);
  const g = mix(g1, g2);
  const b = mix(b1, b2);

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

// Web Audio API ambient sound generator
function createAmbientSound(trackId: string, audioCtx: AudioContext, gainNode: GainNode) {
  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];

  if (trackId === 'lofi_rain') {
    // White noise for rain + low drone
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    nodes.push(noise);

    // Sub bass drone
    const drone = audioCtx.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(55, audioCtx.currentTime);
    const droneGain = audioCtx.createGain();
    droneGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    drone.connect(droneGain);
    droneGain.connect(gainNode);
    drone.start();
    nodes.push(drone);
  } else if (trackId === 'deep_focus') {
    // Binaural-style dual oscillators
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, audioCtx.currentTime);
    const g1 = audioCtx.createGain();
    g1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc1.connect(g1);
    g1.connect(gainNode);
    osc1.start();
    nodes.push(osc1);

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(210, audioCtx.currentTime);
    const g2 = audioCtx.createGain();
    g2.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc2.connect(g2);
    g2.connect(gainNode);
    osc2.start();
    nodes.push(osc2);

    // Warm pad
    const pad = audioCtx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.setValueAtTime(110, audioCtx.currentTime);
    const padGain = audioCtx.createGain();
    padGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    pad.connect(padGain);
    padGain.connect(gainNode);
    pad.start();
    nodes.push(pad);
  } else if (trackId === 'cafe_vibes') {
    // Warm chords
    const freqs = [261.63, 329.63, 392.0];
    freqs.forEach((freq) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.connect(g);
      g.connect(gainNode);
      osc.start();
      nodes.push(osc);
    });

    // Subtle noise for cafe ambience
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, audioCtx.currentTime);
    filter.Q.setValueAtTime(0.5, audioCtx.currentTime);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    nodes.push(noise);
  } else if (trackId === 'nature_sounds') {
    // Wind-like noise
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    nodes.push(noise);

    // Bird-like oscillator
    const bird = audioCtx.createOscillator();
    bird.type = 'sine';
    bird.frequency.setValueAtTime(1200, audioCtx.currentTime);
    bird.frequency.linearRampToValueAtTime(1800, audioCtx.currentTime + 0.5);
    bird.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 1.0);
    const birdGain = audioCtx.createGain();
    birdGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    bird.connect(birdGain);
    birdGain.connect(gainNode);
    bird.start();
    nodes.push(bird);
  }

  return nodes;
}

export default function Sidebar({
  user,
  folders,
  activeFolderId,
  onSelectFolder,
  onOpenNewFolderModal,
  onOpenEditFolderModal,
  onLogout,
  totalPendingTasks,
  activeNav = 'all',
  onSelectNav,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onCloseMobile,
  onDeleteFolder,
  appConfig,
  onConfigChange,
  currentTimeLabel,
  sessionTimerLabel,
  sessionTargetLabel,
  sessionTargetSeconds,
  sessionProgress,
  isTimerRunning,
  onToggleSessionTimer,
  onSessionTargetChange,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const [showPreferences, setShowPreferences] = useState(false);
  const [showPomodoroFloat, setShowPomodoroFloat] = useState(false);
  const [isPomodoroMinimized, setIsPomodoroMinimized] = useState(false);
  const [pomodoroPosition, setPomodoroPosition] = useState({ x: 260, y: 180 });
  const dragRef = useRef<{ pointerId: number | null; startX: number; startY: number; originX: number; originY: number } | null>(null);

  // Music player state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([]);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePomodoroPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    dragRef.current = {
      pointerId: event.pointerId,
      startX,
      startY,
      originX: pomodoroPosition.x,
      originY: pomodoroPosition.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePomodoroPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    setPomodoroPosition({
      x: Math.max(18, Math.min(window.innerWidth - 360, dragRef.current.originX + dx)),
      y: Math.max(18, Math.min(window.innerHeight - 220, dragRef.current.originY + dy)),
    });
  };

  const handlePomodoroPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current && dragRef.current.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const navItems = [
    { id: 'all', label: 'All Tasks', icon: LayoutGrid },
    { id: 'folder', label: 'By Folder', icon: Folder },
    { id: 'mutual', label: 'Mutual', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ];

  // Stop all active audio nodes
  const stopAudio = () => {
    activeNodesRef.current.forEach((node) => {
      try { node.stop(); } catch (_) {}
    });
    activeNodesRef.current = [];

    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
    }
  };

  // Start audio for current track
  const startAudio = () => {
    const currentTrackId = MUSIC_TRACKS[currentTrackIndex].id;
    const youtubeTrackId = YOUTUBE_TRACKS[currentTrackId];

    if (youtubeTrackId) {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current.currentTime = 0;
      }
      if (audioCtxRef.current) {
        stopAudio();
      }
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    const ctx = audioCtxRef.current;
    const gain = gainNodeRef.current!;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    gain.gain.setValueAtTime(isMusicMuted ? 0 : 0.5, ctx.currentTime);
    const nodes = createAmbientSound(currentTrackId, ctx, gain);
    activeNodesRef.current = nodes;
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (isMusicPlaying) {
      stopAudio();
      setIsMusicPlaying(false);
    } else {
      startAudio();
      setIsMusicPlaying(true);
    }
  };

  // Next track
  const handleNextTrack = () => {
    const wasPlaying = isMusicPlaying;
    stopAudio();
    setCurrentTrackIndex((prev) => {
      const next = (prev + 1) % MUSIC_TRACKS.length;
      return next;
    });
    if (wasPlaying) {
      // Will restart in effect below
      setTimeout(() => {
        startAudio();
      }, 100);
    }
  };

  // Mute/unmute
  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = isMusicMuted ? 0 : 0.5;
    }

    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMusicMuted ? 0 : 0.5,
        audioCtxRef.current.currentTime
      );
    }
  }, [isMusicMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const currentTrack = MUSIC_TRACKS[currentTrackIndex];
  const activeYoutubeTrackId = isMusicPlaying ? YOUTUBE_TRACKS[currentTrack.id] : undefined;
  const accentColor = appConfig?.accentColor ?? '#3E4B8E';
  const darkAccentBase = appConfig?.darkMode ? mixHexColors(accentColor, '#0b1320', 0.62) : accentColor;
  const darkAccentDeep = appConfig?.darkMode ? mixHexColors(accentColor, '#0b1320', 0.78) : accentColor;
  const sidebarSurfaceColor = appConfig?.darkMode ? darkAccentDeep : hexToRgba(accentColor, 0.82);
  const sidebarSubtleColor = appConfig?.darkMode ? hexToRgba(darkAccentBase, 0.72) : hexToRgba(accentColor, 0.2);
  const activeNavColor = appConfig?.darkMode ? hexToRgba(darkAccentBase, 0.9) : accentColor;
  const sidebarTextColor = appConfig?.darkMode ? '#F5F7FF' : '#DDEAF7';
  const sidebarMutedText = appConfig?.darkMode ? '#E8F0FF' : '#C8D8E8';

  return (
    <>
      {showPomodoroFloat && (
        <div
          className="fixed z-[1300] w-[330px]"
          style={{ left: `${pomodoroPosition.x}px`, top: `${pomodoroPosition.y}px` }}
        >
          {isPomodoroMinimized ? (
            <div
              onPointerDown={handlePomodoroPointerDown}
              onPointerMove={handlePomodoroPointerMove}
              onPointerUp={handlePomodoroPointerUp}
              onPointerLeave={handlePomodoroPointerUp}
              className="flex cursor-grab items-center justify-between rounded-[18px] border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-lg active:cursor-grabbing"
              style={{ backgroundColor: sidebarSurfaceColor, color: sidebarTextColor }}
            >
              <span>POMODORO</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPomodoroMinimized(false);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                  style={{ color: sidebarTextColor }}
                  title="Restore pomodoro"
                  aria-label="Restore pomodoro"
                >
                  <Maximize2 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsPomodoroMinimized(false);
                    setShowPomodoroFloat(false);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                  style={{ color: sidebarTextColor }}
                  title="Close pomodoro"
                  aria-label="Close pomodoro"
                >
                  <X className="h-3 w-3" style={{ color: sidebarTextColor }} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                onPointerDown={handlePomodoroPointerDown}
                onPointerMove={handlePomodoroPointerMove}
                onPointerUp={handlePomodoroPointerUp}
                onPointerLeave={handlePomodoroPointerUp}
                className="flex cursor-grab items-center justify-between rounded-t-[20px] border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] active:cursor-grabbing"
                style={{ backgroundColor: sidebarSurfaceColor, color: sidebarTextColor }}
              >
                <span>Pomodoro</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsPomodoroMinimized(true);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                    style={{ color: sidebarTextColor }}
                    title="Minimize pomodoro"
                    aria-label="Minimize pomodoro"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsPomodoroMinimized(false);
                      setShowPomodoroFloat(false);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                    style={{ color: sidebarTextColor }}
                    title="Close pomodoro"
                    aria-label="Close pomodoro"
                  >
                    <X className="h-3 w-3" style={{ color: sidebarTextColor }} />
                  </button>
                </div>
              </div>
              <PomodoroTimer
                className="!rounded-t-none !rounded-b-[20px]"
                accentColor={accentColor}
                darkMode={appConfig?.darkMode ?? false}
                pomodoroMinutes={appConfig?.pomodoroWork ?? 25}
                shortBreakMinutes={appConfig?.pomodoroBreak ?? 5}
                longBreakMinutes={15}
              />
            </>
          )}
        </div>
      )}

      {activeYoutubeTrackId && (
        <div className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-0 w-0 overflow-hidden opacity-0">
          <iframe
            title={`${currentTrack.name} ambient audio`}
            src={`https://www.youtube.com/embed/${activeYoutubeTrackId}?autoplay=1&mute=0&loop=1&playlist=${activeYoutubeTrackId}&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen={false}
          />
        </div>
      )}

      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } flex-shrink-0 flex flex-col h-full relative z-20 select-none transition-all duration-300 ease-in-out`}
        style={{ backgroundColor: appConfig?.darkMode ? darkAccentDeep : accentColor, color: sidebarMutedText }}
      >
        {/* Top Header: Logo & Collapse icon */}
        <div
          className={`pt-4 pb-0 ${
            isCollapsed ? 'px-3 justify-center' : 'px-6 justify-between'
          } flex items-center relative`}
        >
          <div className="flex items-center gap-3 overflow-hidden -mt-2">
            <img
              src="/task-tracker-logo.png?v=4"
              alt="Task Tracker"
              className={
                isCollapsed
                  ? 'h-12 w-12 object-contain object-left'
                  : 'h-32 w-auto max-w-[280px] object-contain'
              }
            />
          </div>

          {/* Small round collapse pill on border */}
          <button
            onClick={handleToggle}
            className="w-6 h-6 rounded-full bg-[#E8E4DA] text-[#152A42] flex items-center justify-center absolute -right-3 top-7 shadow-md hover:scale-110 active:scale-95 transition-all z-30 cursor-pointer border border-[#152A42]/10"
            title={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            aria-label={isCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>

          {/* Mobile close button */}
          {onCloseMobile && !isCollapsed && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Navigation Items */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'} pt-0 pb-2 space-y-1.5`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectNav) onSelectNav(item.id);
                }}
                title={item.label}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'gap-3.5 px-4 py-2.5'
                } rounded-full text-xs font-medium transition-all relative ${
                  isActive
                    ? 'border border-white/30 text-white font-semibold shadow-inner'
                    : 'text-[#C8D8E8] hover:text-white hover:bg-white/[0.04]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: activeNavColor,
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                      }
                    : undefined
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {item.id === 'all' && totalPendingTasks > 0 && (
                  isCollapsed ? (
                    <span
                      className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400"
                      title={`${totalPendingTasks} pending tasks`}
                    />
                  ) : (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                      {totalPendingTasks}
                    </span>
                  )
                )}
              </button>
            );
          })}

        </div>

        <div className={`${isCollapsed ? 'px-2 mt-3' : 'mx-4 mt-3'}`}>
          <div
            className="rounded-[20px] border border-white/15 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(0,0,0,0.15)] backdrop-blur-md"
            style={{ backgroundColor: sidebarSubtleColor, backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-center pb-2">
              <div
                className={`font-bold tracking-[-0.08em] text-white font-sans leading-none text-center ${
                  isCollapsed ? 'text-[15px]' : 'text-[30px]'
                }`}
              >
                {currentTimeLabel}
              </div>
            </div>

            <div className={`flex ${isCollapsed ? 'justify-center' : 'items-center justify-center gap-3'} pt-1`}>
              <button
                type="button"
                onClick={() => setShowPomodoroFloat(true)}
                className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 ${
                  isCollapsed ? 'h-9 w-9' : 'h-10 w-10'
                }`}
                style={{ color: sidebarTextColor }}
                title="Open Pomodoro"
                aria-label="Open Pomodoro"
              >
                <Clock3 className={isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.2} />
              </button>

              {!isCollapsed && (
                <span className="text-[13px] font-medium tracking-[-0.04em] lowercase" style={{ color: sidebarTextColor }}>
                  pomodoro
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Music Section at Bottom of Sidebar */}
        {!isCollapsed ? (
          <div
            className="mx-4 my-3 p-3.5 rounded-2xl border border-white/15 shadow-[0_12px_26px_rgba(0,0,0,0.12)] backdrop-blur-md"
            style={{ backgroundColor: sidebarSubtleColor, backdropFilter: 'blur(18px)' }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(accentColor, appConfig?.darkMode ? 0.22 : 0.28) }}>
                <Music className="w-3.5 h-3.5" style={{ color: sidebarTextColor }} />
              </div>
              <span className="text-[11px] font-bold tracking-tight" style={{ color: sidebarTextColor }}>
                Ambient Music
              </span>
            </div>

            {/* Current Track */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-sm">{currentTrack.emoji}</span>
              <span className="text-[11px] font-medium truncate flex-1" style={{ color: sidebarMutedText }}>
                {currentTrack.name}
              </span>
              {isMusicPlaying && (
                <div className="flex items-center gap-0.5 h-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-[2px] rounded-full"
                      style={{
                        backgroundColor: sidebarTextColor,
                        animation: `soundwave 0.8s ease-in-out ${i * 0.15}s infinite`,
                        height: `${6 + Math.random() * 6}px`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Music Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleTogglePlay}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
                >
                  {isMusicPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={handleNextTrack}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Next Track"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => setIsMusicMuted(!isMusicMuted)}
                className="p-1 rounded transition-colors"
                style={{ color: sidebarMutedText }}
                title={isMusicMuted ? 'Unmute' : 'Mute'}
              >
                {isMusicMuted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-3">
            <button
              onClick={handleTogglePlay}
              className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#DDEAF7] transition hover:bg-white/10 hover:text-white ${
                isMusicPlaying
                  ? 'bg-[var(--color-primary)]/30 text-[#A8B8F0]'
                  : 'text-[#DDEAF7]'
              } h-9 w-9`}
              title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
            >
              <Music className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer: Preferences only (avatar removed) */}
        <div
          className={`p-4 border-t border-white/10 flex items-center ${
            isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-start'
          } text-xs`}
        >
          <button
            onClick={() => setShowPreferences(true)}
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'gap-2.5'
            } text-[#C8D8E8] hover:text-white transition-colors`}
            title="Preferences"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Preferences</span>}
          </button>
        </div>
      </aside>

      {/* Preferences Modal */}
      {showPreferences && (
        <PreferencesModal
          user={user}
          onClose={() => setShowPreferences(false)}
          onLogout={onLogout}
          appConfig={appConfig}
          onConfigChange={onConfigChange}
        />
      )}
    </>
  );
}

/* ─── Preferences Modal ─── */
function PreferencesModal({
  user,
  onClose,
  onLogout,
  appConfig,
  onConfigChange,
}: {
  user: UserSession;
  onClose: () => void;
  onLogout: () => void;
  appConfig?: AppConfig;
  onConfigChange?: (config: Partial<AppConfig>) => void;
}) {
  const [activeSection, setActiveSection] = useState('general');

  // Local state initialized from appConfig
  const [notifications, setNotifications] = useState(appConfig?.notifications ?? true);
  const [darkMode, setDarkMode] = useState(appConfig?.darkMode ?? false);
  const [compactView, setCompactView] = useState(appConfig?.compactView ?? false);
  const [accentColor, setAccentColor] = useState(appConfig?.accentColor ?? '#3E4B8E');
  const [deadlineReminder, setDeadlineReminder] = useState(appConfig?.deadlineReminder ?? '1h');
  const [language, setLanguage] = useState(appConfig?.language ?? 'en');
  const [dateFormat, setDateFormat] = useState(appConfig?.dateFormat ?? 'mdy');
  const [profileVisibility, setProfileVisibility] = useState(appConfig?.profileVisibility ?? 'members');
  const [activityStatus, setActivityStatus] = useState(appConfig?.activityStatus ?? true);
  const [autoBreakdown, setAutoBreakdown] = useState(appConfig?.autoBreakdown ?? true);

  // Propagate changes to parent
  const handleChange = (key: string, value: any) => {
    if (onConfigChange) {
      onConfigChange({ [key]: value });
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Left sidebar menu */}
          <div className="w-56 bg-[var(--bg-card-subtle)] border-r border-[var(--border-light)] p-5 flex flex-col">
            <h2 className="font-serif-heading text-lg font-bold text-[var(--text-heading)] mb-1">
              Preferences
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] font-medium mb-4">
              Configuration & Settings
            </p>

            <nav className="space-y-1 flex-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'text-[var(--text-body)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User info & Logout at bottom */}
            <div className="pt-4 border-t border-[var(--border-light)] mt-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: user.avatar_color || 'var(--color-primary)' }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-heading)] truncate">
                    @{user.username}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif-heading text-xl font-bold text-[var(--text-heading)]">
                {sections.find((s) => s.id === activeSection)?.label}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeSection === 'general' && (
              <div className="space-y-5">
                <SettingsRow
                  label="Auto-generate Task Breakdown"
                  description="Automatically break tasks into steps based on description"
                >
                  <ToggleSwitch
                    checked={autoBreakdown}
                    onChange={(val) => {
                      setAutoBreakdown(val);
                      handleChange('autoBreakdown', val);
                    }}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Date Format"
                  description="How dates are displayed throughout the app"
                >
                  <select
                    value={dateFormat}
                    onChange={(e) => {
                      setDateFormat(e.target.value);
                      handleChange('dateFormat', e.target.value);
                    }}
                    className="input-field text-xs w-40 cursor-pointer"
                  >
                    <option value="mdy">MM/DD/YYYY</option>
                    <option value="dmy">DD/MM/YYYY</option>
                    <option value="ymd">YYYY/MM/DD</option>
                  </select>
                </SettingsRow>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-5">
                <SettingsRow
                  label="Dark Mode"
                  description="Switch between light and dark interface themes"
                >
                  <ToggleSwitch
                    checked={darkMode}
                    onChange={(val) => {
                      setDarkMode(val);
                      handleChange('darkMode', val);
                    }}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Compact View"
                  description="Reduce spacing for a denser layout"
                >
                  <ToggleSwitch
                    checked={compactView}
                    onChange={(val) => {
                      setCompactView(val);
                      handleChange('compactView', val);
                    }}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Accent Color"
                  description="Primary brand color for buttons and highlights"
                >
                  <div className="flex items-center gap-2">
                    {['#3E4B8E', '#2D6A4F', '#9B2226', '#E76F51', '#264653'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setAccentColor(color);
                          handleChange('accentColor', color);
                        }}
                        className={`w-6 h-6 rounded-full border-2 shadow-sm hover:scale-110 transition-transform ${
                          accentColor === color ? 'border-[var(--text-heading)] ring-2 ring-offset-1 ring-[var(--text-heading)]' : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </SettingsRow>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <SettingsRow
                  label="Push Notifications"
                  description="Receive browser notifications for deadlines"
                >
                  <ToggleSwitch
                    checked={notifications}
                    onChange={(val) => {
                      setNotifications(val);
                      handleChange('notifications', val);
                    }}
                  />
                </SettingsRow>

                <SettingsRow
                  label="Deadline Reminders"
                  description="Get notified before a deadline approaches"
                >
                  <select
                    value={deadlineReminder}
                    onChange={(e) => {
                      setDeadlineReminder(e.target.value);
                      handleChange('deadlineReminder', e.target.value);
                    }}
                    className="input-field text-xs w-32 cursor-pointer"
                  >
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="3h">3 hours</option>
                    <option value="1d">1 day</option>
                  </select>
                </SettingsRow>
              </div>
            )}

            {activeSection === 'language' && (
              <div className="space-y-5">
                <SettingsRow
                  label="Interface Language"
                  description="Change the language of the application"
                >
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      handleChange('language', e.target.value);
                    }}
                    className="input-field text-xs w-40 cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                    <option value="tl">Filipino</option>
                  </select>
                </SettingsRow>

              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-5">
                <SettingsRow
                  label="Profile Visibility"
                  description="Who can see your profile in shared folders"
                >
                  <select
                    value={profileVisibility}
                    onChange={(e) => {
                      setProfileVisibility(e.target.value);
                      handleChange('profileVisibility', e.target.value);
                    }}
                    className="input-field text-xs w-40 cursor-pointer"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="members">Folder Members</option>
                    <option value="private">Only Me</option>
                  </select>
                </SettingsRow>

                <SettingsRow
                  label="Activity Status"
                  description="Show when you are online to collaborators"
                >
                  <ToggleSwitch
                    checked={activityStatus}
                    onChange={(val) => {
                      setActivityStatus(val);
                      handleChange('activityStatus', val);
                    }}
                  />
                </SettingsRow>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Reusable Settings Row ─── */
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-[var(--border-subtle)]">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--text-heading)]">{label}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{description}</div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ─── Toggle Switch ─── */
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-[#D4CEC0]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
