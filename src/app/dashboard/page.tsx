'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TaskModal from '@/components/TaskModal';
import TaskDrawer from '@/components/TaskDrawer';
import FolderModal from '@/components/FolderModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast, { ToastMessage } from '@/components/Toast';
import { 
  Search, 
  Plus, 
  Bell, 
  Play, 
  Pause, 
  Check, 
  Send,
  ArrowRight, 
  MessageSquare, 
  Paperclip,
  CheckCircle2, 
  Circle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  AlertTriangle,
  Sparkles,
  Trash2,
  ListChecks,
  Users,
  FileText,
  Download,
  MoreVertical,
  Flag,
  RotateCcw,
  Pencil,

  LayoutGrid,
  List,
} from 'lucide-react';

interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatar_color?: string;
}

interface FolderItem {
  id: string;
  name: string;
  created_at?: string;
  deleted_at?: string;
  color_hex: string;
  owner_id: string;
  parent_id: string | null;
  is_owner: number;
  is_shared: boolean;
  total_tasks: number;
  pending_tasks: number;
  collaborators?: Collaborator[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at?: string;
  deleted_at?: string;
  is_completed: number;
  completed_at?: string | null;
  time_logged_seconds?: number;
  folder_id: string | null;
  folder_name?: string;
  folder_color?: string;
  creator_username?: string;
  comment_count?: number;
  urgency?: string;
  attachment_count?: number;
}

interface TaskAttachment {
  id: string;
  file_name: string;
  file_size: number;
}

interface NotificationItem {
  id: string;
  task_id: string | null;
  type: string;
  message: string;
  created_at: string;
  is_read: number;
}

interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_username: string;
  author_avatar_color: string;
  is_author: number;
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

interface SortDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
  compact?: boolean;
}

function SortDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  compact = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`sort-dropdown ${compact ? 'sort-dropdown-compact' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`sort-dropdown-trigger ${compact ? 'sort-dropdown-trigger-compact' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="sort-dropdown-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`sort-dropdown-option ${value === option.value ? 'sort-dropdown-option-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_CONFIG: AppConfig = {
  darkMode: false,
  compactView: false,
  accentColor: '#3E4B8E',
  notifications: true,
  deadlineReminder: '1h',
  language: 'en',
  dateFormat: 'mdy',
  profileVisibility: 'members',
  activityStatus: true,
  pomodoroWork: 25,
  pomodoroBreak: 5,
  autoBreakdown: true,
};

function isTaskOverdue(task: Task, now = Date.now()) {
  if (task.is_completed === 1) return false;
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  return Boolean(dueDate && !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now);
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserSession | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskHistory, setCompletedTaskHistory] = useState<Task[]>([]);
  const [deletedHistory, setDeletedHistory] = useState<Array<{
    id: string;
    type: 'task' | 'folder';
    title: string;
    deleted_at?: string;
    folder_name?: string;
    color_hex?: string;
  }>>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [activeNav, setActiveNav] = useState<string>('all');
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [folderView, setFolderView] = useState<'grid' | 'list'>('grid');
  const [folderTaskView, setFolderTaskView] = useState<'grid' | 'list'>('grid');
  const [folderTaskFilter, setFolderTaskFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('active');
  const [folderTaskSort, setFolderTaskSort] = useState<'name-asc' | 'date-asc' | 'date-desc'>('date-asc');
  const [isFolderTaskSelectionMode, setIsFolderTaskSelectionMode] = useState(false);
  const [selectedFolderTaskIds, setSelectedFolderTaskIds] = useState<string[]>([]);
  const [folderSort, setFolderSort] = useState<'name-asc' | 'date-asc' | 'date-desc'>('date-asc');
  const [isFolderSelectionMode, setIsFolderSelectionMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Task in Center Detail View
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [folderTaskPanel, setFolderTaskPanel] = useState<'breakdown' | 'comments' | null>(null);
  const [isFolderTaskClosing, setIsFolderTaskClosing] = useState(false);

  const closeFolderTaskDetail = () => setIsFolderTaskClosing(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [queueView, setQueueView] = useState<'all' | 'deadline' | 'priority'>('all');
  const [queueSort, setQueueSort] = useState<'deadline' | 'priority' | 'name' | 'date-asc' | 'date-desc'>('date-asc');
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);
  const [queueTransitionDirection, setQueueTransitionDirection] = useState<'expand' | 'collapse' | null>(null);

  // Modals & Drawers state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [folderModal, setFolderModal] = useState<{
    isOpen: boolean;
    folder: FolderItem | null;
    taskId?: string | null;
  }>({
    isOpen: false,
    folder: null,
    taskId: null,
  });
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [uploadingTaskAttachment, setUploadingTaskAttachment] = useState(false);
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [loadingTaskAttachments, setLoadingTaskAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const inlineAttachmentInputRef = useRef<HTMLInputElement>(null);

  type TaskTimerState = {
    isRunning: boolean;
    baseSeconds: number;
    startedAt: number | null;
    finishedMessage: string | null;
  };

  const createTaskTimerState = (): TaskTimerState => ({
    isRunning: false,
    baseSeconds: 0,
    startedAt: null,
    finishedMessage: null,
  });

  const [taskTimerMap, setTaskTimerMap] = useState<Record<string, TaskTimerState>>({});
  const [sessionTargetSeconds, setSessionTargetSeconds] = useState(0);
  const getTaskTimerSeconds = useCallback((taskId: string | null, now = Date.now()) => {
    if (!taskId) return 0;
    const timer = taskTimerMap[taskId] ?? createTaskTimerState();
    const elapsed = timer.isRunning && timer.startedAt !== null
      ? Math.floor((now - timer.startedAt) / 1000)
      : 0;
    return Math.max(0, timer.baseSeconds + elapsed);
  }, [taskTimerMap]);
  const activeTaskTimer = useMemo(() => {
    if (!selectedTaskId) return createTaskTimerState();
    return taskTimerMap[selectedTaskId] ?? createTaskTimerState();
  }, [selectedTaskId, taskTimerMap]);
  const timerSeconds = selectedTaskId ? getTaskTimerSeconds(selectedTaskId, Date.now()) : 0;
  const isTimerRunning = selectedTaskId ? activeTaskTimer.isRunning : false;
  const timerStartedAt = selectedTaskId ? activeTaskTimer.startedAt : null;
  const timerBaseSeconds = selectedTaskId ? activeTaskTimer.baseSeconds : 0;
  const finishedTaskMessage = selectedTaskId ? activeTaskTimer.finishedMessage : null;

  // App Config State (dark mode, compact view, accent color, etc.)
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Current time state for the time widget
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Notification permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'default'>('default');

  // Notification dropdown state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'read' | 'unread'>('unread');
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const seenNotificationIdsRef = useRef<Set<string> | null>(null);
  const notificationPopupUserRef = useRef<string | null>(null);
  const reminderSentRef = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    try {
      const timezoneOffsetMinutes = new Date().getTimezoneOffset();
      const res = await fetch(`/api/notifications?timezoneOffsetMinutes=${timezoneOffsetMinutes}`);
      if (!res.ok) return;
      const data = await res.json();
      const notifications: NotificationItem[] = data.notifications || [];
      const storageKey = `tasktracker_seen_notifications_${user?.id || 'guest'}`;

      if (notificationPopupUserRef.current !== user?.id) {
        notificationPopupUserRef.current = user?.id || null;
        try {
          const savedIds = localStorage.getItem(storageKey);
          seenNotificationIdsRef.current = new Set(savedIds ? JSON.parse(savedIds) : []);
        } catch {
          seenNotificationIdsRef.current = new Set();
        }
      }

      const seenIds = seenNotificationIdsRef.current || new Set<string>();
      const isFirstLoad = !localStorage.getItem(storageKey);
      const newNotifications = notifications.filter((notification) =>
        notification.is_read === 0 &&
        !seenIds.has(notification.id) &&
        (!isFirstLoad || notification.type === 'deadline')
      );

      if (newNotifications.length > 0) {
        setToasts((current) => [
          ...current,
          ...newNotifications.slice(0, 3).map((notification) => ({
            id: `notification_${notification.id}`,
            type: 'info' as const,
            message: notification.message,
          })),
        ].slice(-4));
      }

      notifications.forEach((notification) => seenIds.add(notification.id));
      seenNotificationIdsRef.current = seenIds;
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(seenIds).slice(-100)));
      } catch {}

      setNotificationItems(notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 15000);
    const handleFocus = () => void loadNotifications();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loadNotifications]);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tasktracker_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAppConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const savedTarget = Number(localStorage.getItem('tasktracker_session_target_seconds'));
      if (Number.isFinite(savedTarget) && savedTarget >= 0 && savedTarget <= 43200) {
        setSessionTargetSeconds(Math.round(savedTarget / 300) * 300);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tasktracker_task_timer_map');
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null) return;

      const timers = parsed as Record<string, Partial<TaskTimerState>>;
      const restored: Record<string, TaskTimerState> = {};

      Object.entries(timers).forEach(([taskId, value]) => {
        const baseSeconds = typeof value.baseSeconds === 'number' && Number.isFinite(value.baseSeconds)
          ? Math.max(0, value.baseSeconds)
          : 0;
        const startedAt = typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
          ? value.startedAt
          : null;
        restored[taskId] = {
          isRunning: Boolean(value.isRunning) && startedAt !== null,
          baseSeconds,
          startedAt,
          finishedMessage: typeof value.finishedMessage === 'string' ? value.finishedMessage : null,
        };
      });

      setTaskTimerMap(restored);
    } catch (error) {
      console.error('Failed to restore task timers.', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tasktracker_task_timer_map', JSON.stringify(taskTimerMap));
    } catch (error) {
      console.error('Failed to save task timers.', error);
    }
  }, [taskTimerMap]);

  const handleSessionTargetChange = (seconds: number) => {
    setSessionTargetSeconds(seconds);
    try {
      localStorage.setItem('tasktracker_session_target_seconds', String(seconds));
    } catch {}
  };

  const handleResetSessionTimer = () => {
    if (!selectedTaskId) return;

    setTaskTimerMap((prev) => ({
      ...prev,
      [selectedTaskId]: {
        ...createTaskTimerState(),
        finishedMessage: null,
      },
    }));
    handleSessionTargetChange(0);
  };

  // Apply config changes
  const handleConfigChange = useCallback((changes: Partial<AppConfig>) => {
    setAppConfig((prev) => {
      const next = { ...prev, ...changes };
      try {
        localStorage.setItem('tasktracker_config', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Apply dark mode to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const accentColor = appConfig.accentColor;
    if (appConfig.darkMode) {
      const darkAccentCard = mixHexColors(accentColor, '#0b1220', 0.62);
      const darkAccentCardSubtle = mixHexColors(accentColor, '#0d1524', 0.78);
      root.style.setProperty('--bg-canvas', '#090d15');
      root.style.setProperty('--bg-sidebar', mixHexColors(accentColor, '#0b1220', 0.72));
      root.style.setProperty('--bg-sidebar-hover', mixHexColors(accentColor, '#121b2d', 0.72));
      root.style.setProperty('--bg-card', darkAccentCard);
      root.style.setProperty('--bg-card-subtle', darkAccentCardSubtle);
      root.style.setProperty('--border-light', mixHexColors(accentColor, '#dfe7ff', 0.25));
      root.style.setProperty('--border-subtle', mixHexColors(accentColor, '#dfe7ff', 0.18));
      root.style.setProperty('--text-heading', '#edf2ff');
      root.style.setProperty('--text-body', '#dfe7ff');
      root.style.setProperty('--text-muted', '#b7c3e2');
    } else {
      root.style.setProperty('--bg-canvas', '#F3F0E6');
      root.style.setProperty('--bg-sidebar', '#152A42');
      root.style.setProperty('--bg-sidebar-hover', '#1E3754');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--bg-card-subtle', '#FAF9F5');
      root.style.setProperty('--border-light', '#E5E0D4');
      root.style.setProperty('--border-subtle', '#ECE8DD');
      root.style.setProperty('--text-heading', '#172433');
      root.style.setProperty('--text-body', '#3E4A5B');
      root.style.setProperty('--text-muted', '#798696');
    }
  }, [appConfig.darkMode, appConfig.accentColor]);

  // Apply accent color to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const color = appConfig.accentColor;
    root.style.setProperty('--color-primary', color);

    // Generate lighter/darker variants
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const lighterR = Math.min(255, r + 20);
    const lighterG = Math.min(255, g + 20);
    const lighterB = Math.min(255, b + 20);
    root.style.setProperty('--color-primary-hover', `rgb(${lighterR}, ${lighterG}, ${lighterB})`);

    const darkerR = Math.max(0, r - 20);
    const darkerG = Math.max(0, g - 20);
    const darkerB = Math.max(0, b - 20);
    root.style.setProperty('--color-primary-active', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
    root.style.setProperty(
      '--color-primary-light',
      appConfig.darkMode ? `rgba(${r}, ${g}, ${b}, 0.22)` : `rgba(${r}, ${g}, ${b}, 0.12)`
    );
  }, [appConfig.accentColor, appConfig.darkMode]);

  // Apply compact view
  useEffect(() => {
    const root = document.documentElement;
    if (appConfig.compactView) {
      root.style.setProperty('--radius-card', '12px');
      root.style.setProperty('--radius-sm', '6px');
      root.classList.add('compact-view');
    } else {
      root.style.setProperty('--radius-card', '18px');
      root.style.setProperty('--radius-sm', '8px');
      root.classList.remove('compact-view');
    }
  }, [appConfig.compactView]);

  // Request notification permission
  useEffect(() => {
    if (appConfig.notifications && typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setNotifPermission(perm);
        });
      }
    }
  }, [appConfig.notifications]);

  // Current time updater
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Deadline notification checker
  useEffect(() => {
    if (!appConfig.notifications || notifPermission !== 'granted') return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const reminderMs = {
        '30m': 30 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '3h': 3 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
      }[appConfig.deadlineReminder] || 60 * 60 * 1000;

      tasks.forEach((task) => {
        if (task.is_completed === 1) {
          reminderSentRef.current.delete(task.id);
          return;
        }

        const dueTime = new Date(task.due_date).getTime();
        if (!Number.isFinite(dueTime)) {
          reminderSentRef.current.delete(task.id);
          return;
        }

        const diff = dueTime - now;

        if (diff > 0 && diff <= reminderMs) {
          if (reminderSentRef.current.has(task.id)) return;
          reminderSentRef.current.add(task.id);
          const dueTimeStr = new Date(task.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          new Notification('Task Tracker - Deadline Reminder', {
            body: `"${task.title}" is due soon at ${dueTimeStr}!`,
            icon: '/favicon.ico',
          });
          return;
        }

        if (diff <= 0 || diff > reminderMs) {
          reminderSentRef.current.delete(task.id);
        }
      });
    }, 30000);

    return () => clearInterval(checkInterval);
  }, [appConfig.notifications, appConfig.deadlineReminder, notifPermission, tasks]);

  const handleToggleSessionTimer = () => {
    if (!selectedTaskId) return;

    setTaskTimerMap((prev) => {
      const current = prev[selectedTaskId] ?? createTaskTimerState();

      if (current.isRunning && current.startedAt !== null) {
        const elapsedSeconds = current.baseSeconds + Math.floor((Date.now() - current.startedAt) / 1000);
        return {
          ...prev,
          [selectedTaskId]: {
            ...current,
            baseSeconds: elapsedSeconds,
            startedAt: null,
            isRunning: false,
          },
        };
      }

      return {
        ...prev,
        [selectedTaskId]: {
          ...current,
          startedAt: Date.now(),
          isRunning: true,
        },
      };
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Subtasks State for the active task
  const [subtasksMap, setSubtasksMap] = useState<Record<string, SubtaskItem[]>>({});
  const [breakdownReasons, setBreakdownReasons] = useState<Record<string, string>>({});
  const [breakdownLoading, setBreakdownLoading] = useState<string | null>(null);
  const breakdownVariants = useRef<Record<string, number>>({});

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newTaskComment, setNewTaskComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingTaskComment, setSubmittingTaskComment] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [editingDescriptionTaskId, setEditingDescriptionTaskId] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [editingTaskTitle, setEditingTaskTitle] = useState(false);
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [editingTaskDeadline, setEditingTaskDeadline] = useState(false);
  const [taskDeadlineDraft, setTaskDeadlineDraft] = useState('');
  const [savingInlineTaskField, setSavingInlineTaskField] = useState<'title' | 'deadline' | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const toast = { id, type, message };

    setToasts([toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Load: Auth & Data
  const loadInitialData = useCallback(async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      await Promise.all([loadFolders(), loadTasks('all'), loadCompletedTaskHistory(), loadDeletedHistory()]);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load Folders
  const loadFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  // 3. Load Tasks
  const loadTasks = async (folderId: string) => {
    try {
      const url = folderId === 'all' ? '/api/tasks' : `/api/tasks?folder_id=${folderId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const loadedTasks: Task[] = data.tasks || [];

        // Enrich tasks with urgency and attachment count for the queue
        const enriched = loadedTasks.map((t, idx) => ({
          ...t,
          urgency: idx === 0 ? 'High Priority' : idx === 1 ? 'Medium Priority' : 'Normal',
        }));

        setTasks(enriched);

        // Keep the all-tasks view as a list view unless the user explicitly selects a task.
        // Auto-opening the first task here causes the detail panel to reappear on repeated nav clicks.

        // Auto-generate breakdowns for tasks that have descriptions when enabled in settings
        if (appConfig.autoBreakdown) {
          enriched.forEach((t) => {
            if (t.description && t.description.trim() && !subtasksMap[t.id]) {
              generateBreakdown(t.id, t.description, t.title);
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const loadCompletedTaskHistory = async () => {
    try {
      const res = await fetch('/api/tasks?status=completed');
      if (!res.ok) throw new Error('Failed to fetch completed tasks.');

      const data = await res.json();
      const completedTasks: Task[] = data.tasks || [];
      completedTasks.sort(
        (a, b) =>
          new Date(b.completed_at || 0).getTime() -
          new Date(a.completed_at || 0).getTime()
      );
      setCompletedTaskHistory(completedTasks);
    } catch (err) {
      console.error('Failed to load completed task history:', err);
    }
  };

  const loadDeletedHistory = useCallback(async () => {
    try {
      const [deletedTasksRes, deletedFoldersRes] = await Promise.all([
        fetch('/api/tasks?deleted=true'),
        fetch('/api/folders?deleted=true'),
      ]);

      const [deletedTasksData, deletedFoldersData] = await Promise.all([
        deletedTasksRes.ok ? deletedTasksRes.json() : { tasks: [] },
        deletedFoldersRes.ok ? deletedFoldersRes.json() : { folders: [] },
      ]);

      const deletedTasks = (deletedTasksData.tasks || []).map((task: Task) => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        deleted_at: task.deleted_at || task.created_at,
        folder_name: task.folder_name,
      }));

      const deletedFolders = (deletedFoldersData.folders || []).map((folder: FolderItem) => ({
        id: folder.id,
        type: 'folder' as const,
        title: folder.name,
        deleted_at: (folder as any).deleted_at || folder.created_at,
        color_hex: folder.color_hex,
      }));

      setDeletedHistory([...deletedTasks, ...deletedFolders].sort((a, b) => {
        const aDate = new Date(a.deleted_at || 0).getTime();
        const bDate = new Date(b.deleted_at || 0).getTime();
        return bDate - aDate;
      }));
    } catch (err) {
      console.error('Failed to load deleted history:', err);
    }
  }, []);

  // Load shared/mutual tasks
  const loadMutualTasks = async () => {
    try {
      // Load tasks from shared folders
      const foldersRes = await fetch('/api/folders');
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        const sharedFolders = (foldersData.folders || []).filter((f: FolderItem) => f.is_shared);

        if (sharedFolders.length === 0) {
          setTasks([]);
          return;
        }

        // Fetch tasks from all shared folders
        const allTasks: Task[] = [];
        for (const folder of sharedFolders) {
          const res = await fetch(`/api/tasks?folder_id=${folder.id}`);
          if (res.ok) {
            const data = await res.json();
            const folderTasks = (data.tasks || []).map((t: Task, idx: number) => ({
              ...t,
              urgency: idx === 0 ? 'High Priority' : idx === 1 ? 'Medium Priority' : 'Normal',
            }));
            allTasks.push(...folderTasks);
          }
        }

        setTasks(allTasks);
      }
    } catch (err) {
      console.error('Failed to fetch mutual tasks:', err);
    }
  };

  const detectDescriptionLanguage = (description: string): 'id' | 'en' => {
    const desc = (description || '').toLowerCase();
    const indonesianWords = [
      'buat', 'bikin', 'susun', 'menyusun', 'kumpulkan', 'mengumpulkan', 'tulis', 'menulis',
      'review', 'revisi', 'rancang', 'merancang', 'analisis', 'menganalisis', 'siapkan',
      'menyiapkan', 'presentasi', 'kirim', 'mengirim', 'baca', 'membaca', 'ringkas',
      'merangkum', 'pilih', 'memilih', 'bahas', 'membahas', 'jelaskan', 'menjelaskan',
      'dan', 'kemudian', 'lalu', 'selanjutnya', 'akhirnya', 'pertama', 'kedua'
    ];
    const englishWords = [
      'create', 'write', 'draft', 'review', 'prepare', 'collect', 'build', 'outline',
      'finalize', 'analyze', 'check', 'verify', 'submit', 'present', 'summarize',
      'design', 'plan', 'research', 'gather', 'organize', 'compare', 'update',
      'fix', 'implement', 'proofread', 'confirm', 'complete', 'deliver', 'read',
      'respond', 'compile', 'calculate', 'debug', 'type', 'upload', 'share', 'email',
      'then', 'next', 'finally', 'first', 'second'
    ];

    const idScore = indonesianWords.reduce((total, word) => total + (desc.includes(word) ? 1 : 0), 0);
    const enScore = englishWords.reduce((total, word) => total + (desc.includes(word) ? 1 : 0), 0);

    if (idScore === 0 && enScore === 0) {
      return /[a-z]/i.test(desc) && !/[\u00C0-\u024F]/.test(desc) ? 'en' : 'id';
    }

    return idScore >= enScore ? 'id' : 'en';
  };

  const getBreakdownTemplates = (language: 'id' | 'en') => {
    if (language === 'id') {
      return {
        poster: [
          'Kumpulkan referensi dan bahan visual yang relevan',
          'Buat outline layout dan alur pesan utama',
          'Tulis isi poster dan sesuaikan desain',
          'Review, revisi, dan export final'
        ],
        ppt: [
          'Buat outline slide dan struktur presentasi',
          'Kumpulkan materi utama untuk tiap slide',
          'Susun isi slide dan visual pendukung',
          'Review, revisi, dan finalisasi presentasi'
        ],
        essay: [
          'Buat outline dan argumen utama',
          'Kumpulkan sumber dan bukti pendukung',
          'Tulis draft dan revisi ide utama',
          'Review dan finalisasi tulisan'
        ],
        report: [
          'Identifikasi tujuan dan data utama',
          'Kumpulkan informasi dan bukti pendukung',
          'Susun laporan dan analisis',
          'Review, edit, dan kirim final'
        ],
        task: [
          'Tentukan target dan langkah utama',
          'Kumpulkan bahan yang dibutuhkan',
          'Susun draft dan eksekusi pekerjaan',
          'Review dan finalisasi hasil'
        ],
        generic: [
          'Tentukan tujuan dan hasil yang ingin dicapai',
          'Kumpulkan bahan atau informasi yang diperlukan',
          'Susun langkah kerja utama dan eksekusi',
          'Review hasil dan finalisasi pekerjaan'
        ]
      };
    }

    return {
      poster: [
        'Collect references and visual materials',
        'Create the poster layout and main message flow',
        'Draft the poster content and adapt the design',
        'Review, revise, and export the final version'
      ],
      ppt: [
        'Create the slide outline and presentation structure',
        'Gather key materials for each slide',
        'Build the slide content and supporting visuals',
        'Review, revise, and finalize the presentation'
      ],
      essay: [
        'Create the outline and main argument',
        'Gather sources and supporting evidence',
        'Write the draft and revise the key ideas',
        'Review and finalize the writing'
      ],
      report: [
        'Identify the goal and key data',
        'Collect information and supporting evidence',
        'Structure the report and analysis',
        'Review, edit, and submit the final report'
      ],
      task: [
        'Define the target and main steps',
        'Gather the required materials',
        'Draft and execute the work',
        'Review and finalize the result'
      ],
      generic: [
        'Define the goal and desired outcome',
        'Gather the necessary materials or information',
        'Build the main execution steps and complete the task',
        'Review the result and finalize the work'
      ]
    };
  };

  // Task Breakdown: auto-generate steps from description
  const getBreakdownResult = (description: string, title: string) => {
    const desc = (description || '').trim();
    const language = detectDescriptionLanguage(desc);
    const emptyReason = language === 'id'
      ? 'Deskripsi masih kosong. Tambahkan langkah kerja atau target yang jelas agar tugas bisa dipecah.'
      : 'This description is empty. Add the actual task steps or deliverables so the task can be broken down.';
    const vagueReason = language === 'id'
      ? 'Deskripsi ini terlalu umum untuk dipecah menjadi langkah kerja. Tambahkan tindakan atau hasil yang jelas.'
      : 'This description is too vague to break down. It does not describe clear work steps or deliverables.';
    const notSpecificReason = language === 'id'
      ? 'Deskripsi belum cukup spesifik untuk membuat breakdown yang berguna. Tambahkan langkah seperti "kumpulkan bahan", "buat outline", "draft", atau "review".'
      : 'This description is not specific enough to create a useful breakdown yet. Add clearer action steps like "collect materials", "create an outline", "draft", or "review".';

    if (!desc) {
      return {
        steps: [] as SubtaskItem[],
        reason: emptyReason
      };
    }

    const steps = parseDescriptionToSteps(desc, title, 0);
    if (steps.length > 0) {
      return { steps, reason: '' };
    }

    const actionRegex = /\b(?:plan|research|write|draft|review|edit|prepare|analyze|build|create|check|verify|submit|finalize|schedule|study|compare|collect|organize|summarize|outline|fix|update|implement|present|test|proofread|confirm|complete|gather|finish|deliver|read|respond|compile|calculate|debug|type|design|upload|share|email|buat|membuat|susun|menyusun|jelaskan|menjelaskan|kumpulkan|mengumpulkan|tulis|menulis|revisi|rancang|merancang|analisis|menganalisis|siapkan|menyiapkan|cek|presentasi|kirim|mengirim|baca|membaca|ringkas|merangkum|cari|mencari|pilih|memilih|bahas|membahas)\b/i;

    if (!actionRegex.test(desc)) {
      return {
        steps: [] as SubtaskItem[],
        reason: vagueReason
      };
    }

    return {
      steps: [] as SubtaskItem[],
      reason: notSpecificReason
    };
  };

  const generateBreakdown = (taskId: string, description: string, title: string, variant = 0) => {
    const result = getBreakdownResult(description, title);
    breakdownVariants.current[taskId] = variant;
    setSubtasksMap((prev) => ({
      ...prev,
      [taskId]: result.steps,
    }));
    setBreakdownReasons((prev) => ({
      ...prev,
      [taskId]: result.reason,
    }));
  };

  const getDescriptionComplexityScore = (description: string): number => {
    const desc = (description || '').trim();
    if (!desc) return 0;

    const actionWords = [
      'plan', 'research', 'write', 'draft', 'review', 'edit', 'prepare', 'analyze',
      'build', 'create', 'check', 'verify', 'submit', 'finalize', 'schedule', 'study',
      'compare', 'collect', 'organize', 'summarize', 'outline', 'fix', 'update',
      'implement', 'present', 'test', 'proofread', 'confirm', 'complete', 'gather',
      'finish', 'deliver', 'read', 'respond', 'compile', 'calculate', 'debug', 'type',
      'design', 'upload', 'share', 'email', 'buat', 'membuat', 'susun', 'menyusun',
      'jelaskan', 'menjelaskan', 'kumpulkan', 'mengumpulkan', 'tulis', 'menulis',
      'edit', 'revisi', 'rancang', 'merancang', 'analisis', 'menganalisis',
      'siapkan', 'menyiapkan', 'cek', 'presentasi', 'kirim', 'mengirim', 'baca',
      'membaca', 'ringkas', 'merangkum'
    ];

    const lowerDesc = desc.toLowerCase();
    const actionMatches = lowerDesc.match(/\b(?:plan|research|write|draft|review|edit|prepare|analyze|build|create|check|verify|submit|finalize|schedule|study|compare|collect|organize|summarize|outline|fix|update|implement|present|test|proofread|confirm|complete|gather|finish|deliver|read|respond|compile|calculate|debug|type|design|upload|share|email|buat|membuat|susun|menyusun|jelaskan|menjelaskan|kumpulkan|mengumpulkan|tulis|menulis|revisi|rancang|merancang|analisis|menganalisis|siapkan|menyiapkan|cek|presentasi|kirim|mengirim|baca|membaca|ringkas|merangkum)\b/gi) || [];
    const sentenceCount = desc.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean).length;
    const bulletCount = (desc.match(/(?:^|\n)\s*(?:[-*•]|\d+[\.)])\s+/g) || []).length;
    const clauses = desc
      .split(/\n+|[.;]+\s+|\s+(?:dan|lalu|kemudian|setelah itu|selanjutnya|akhirnya|then|next|finally)\s+/i)
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter((part) => part.length > 6);

    let verbCount = 0;
    for (const word of actionWords) {
      if (lowerDesc.includes(word)) verbCount += 1;
    }

    const score = (clauses.length * 0.8) + (actionMatches.length * 1.7) + (sentenceCount * 1.3) + (bulletCount * 2) + (verbCount * 0.7);
    return Math.min(Math.max(Math.round(score), 0), 5);
  };

  const parseDescriptionToSteps = (description: string, title: string, variant = 0): SubtaskItem[] => {
    const desc = (description || '').trim();
    if (!desc) return [];

    const language = detectDescriptionLanguage(desc);
    const templates = getBreakdownTemplates(language);
    const buildVariantSteps = (steps: string[]) => {
      if (steps.length <= 1) return steps;
      if (variant % 2 === 0) return steps;

      const reordered = [...steps];
      if (reordered.length >= 2) {
        const first = reordered.shift();
        const last = reordered.pop();
        if (first) reordered.unshift(last ?? first);
        if (last) reordered.push(first ?? last);
      }

      return reordered.map((step, idx) => {
        const low = step.toLowerCase();
        if (language === 'id') {
          if (idx === 0) return `Tentukan fokus utama sebelum ${low}`;
          if (idx === reordered.length - 1) return `Akhiri dengan ${low}`;
          return `Lanjutkan dengan ${low}`;
        }

        if (idx === 0) return `Set the key objective before ${low}`;
        if (idx === reordered.length - 1) return `Finish by ${low}`;
        return `Move on to ${low}`;
      });
    };

    const stripBulletPrefix = (line: string) => line
      .replace(/^\s*(?:[-*•]|\d+[\.)])\s+/, '')
      .replace(/^\s*(?:first|next|then|finally|afterward|after that|later|pertama|kedua|selanjutnya|akhirnya|lalu|kemudian)\s+/i, '')
      .trim();

    const existingSteps = desc
      .split(/\n+/)
      .map((line) => stripBulletPrefix(line.trim()))
      .filter((line) => line.length > 12);

    if (existingSteps.length >= 2) {
      return existingSteps.slice(0, 6).map((step, idx) => ({
        id: `st_${taskId_safe(title)}_${idx}_${Date.now()}`,
        title: step,
        completed: false,
      }));
    }

    const actionRegex = /\b(?:plan|research|write|draft|review|edit|prepare|analyze|build|create|check|verify|submit|finalize|schedule|study|compare|collect|organize|summarize|outline|fix|update|implement|present|test|proofread|confirm|complete|gather|finish|deliver|read|respond|compile|calculate|debug|type|design|upload|share|email|buat|membuat|susun|menyusun|jelaskan|menjelaskan|kumpulkan|mengumpulkan|tulis|menulis|revisi|rancang|merancang|analisis|menganalisis|siapkan|menyiapkan|cek|presentasi|kirim|mengirim|baca|membaca|ringkas|merangkum|cari|mencari|pilih|memilih|bahas|membahas)\b/i;

    const clauses = desc
      .split(/\n+|(?<=[.!?])\s+|;\s+|\s+(?:dan|lalu|kemudian|setelah itu|selanjutnya|akhirnya|and|then|next|finally)\s+/i)
      .map((part) => part.replace(/\s+/g, ' ').trim())
      .filter((part) => part.length > 10)
      .map((part) => stripBulletPrefix(part))
      .filter((part) => part.length > 12 && actionRegex.test(part));

    const cleanedClauses = clauses.filter((part, idx, arr) => arr.findIndex((entry) => entry.toLowerCase() === part.toLowerCase()) === idx);

    if (cleanedClauses.length >= 2) {
      return cleanedClauses.slice(0, 5).map((step, idx) => ({
        id: `st_auto_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: step,
        completed: false,
      }));
    }

    const splitActions = desc
      .split(/\s+(?:dan|lalu|kemudian|setelah itu|selanjutnya|akhirnya|and|then|next|finally)\s+/i)
      .map((part) => part.replace(/[.,;]+$/g, '').trim())
      .filter((part) => part.length > 18 && actionRegex.test(part));

    if (splitActions.length >= 2) {
      return splitActions.slice(0, 5).map((step, idx) => ({
        id: `st_auto_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: step,
        completed: false,
      }));
    }

    const lowerDesc = desc.toLowerCase();
    const descriptionKeywords = [
      { key: 'poster', value: templates.poster },
      { key: 'ppt', value: templates.ppt },
      { key: 'powerpoint', value: templates.ppt },
      { key: 'presentation', value: templates.ppt },
      { key: 'slide', value: templates.ppt },
      { key: 'essay', value: templates.essay },
      { key: 'paper', value: templates.essay },
      { key: 'report', value: templates.report },
      { key: 'laporan', value: templates.report },
      { key: 'makalah', value: templates.essay },
      { key: 'task', value: templates.task },
      { key: 'tugas', value: templates.task },
      { key: 'project', value: templates.task },
      { key: 'proyek', value: templates.task }
    ];

    const matchedStepSet = descriptionKeywords.find(({ key }) => lowerDesc.includes(key));
    if (matchedStepSet) {
      return buildVariantSteps(matchedStepSet.value).map((step, idx) => ({
        id: `st_auto_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: step,
        completed: false,
      }));
    }

    if (actionRegex.test(desc)) {
      return buildVariantSteps(templates.generic).map((step, idx) => ({
        id: `st_auto_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: step,
        completed: false,
      }));
    }

    return [];
  };

  const taskId_safe = (title: string) => title.replace(/[^a-zA-Z0-9]/g, '').substr(0, 10);

  const handleManualBreakdown = (task: Task) => {
    const variant = ((breakdownVariants.current[task.id] ?? 0) + 1) % 2;
    setBreakdownLoading(task.id);
    setTimeout(() => {
      try {
        generateBreakdown(task.id, task.description || '', task.title, variant);
        addToast('success', breakdownReasons[task.id] ? 'Breakdown check completed.' : 'Task breakdown generated!');
      } catch (err) {
        console.error('Failed to generate task breakdown:', err);
        addToast('error', 'Could not generate task breakdown.');
      } finally {
        setBreakdownLoading(null);
      }
    }, 400);
  };

  const handleSelectFolder = (folderId: string) => {
    if (folderId === activeFolderId && activeNav === 'folder') {
      return;
    }

    setActiveNav('folder');
    setActiveFolderId(folderId);
    setFolderTaskFilter('active');
    setIsFolderTaskSelectionMode(false);
    setSelectedFolderTaskIds([]);
    setSelectedTaskId(null);
    setMobileSidebarOpen(false);
    loadTasks(folderId);
  };

  const handleSelectNav = (nav: string) => {
    if (nav === activeNav) {
      return;
    }

    setActiveNav(nav);
    setMobileSidebarOpen(false);

    if (nav === 'all') {
      setActiveFolderId('all');
      loadTasks('all');
      return;
    }

    setSelectedTaskId(null);

    if (nav === 'mutual') {
      setActiveFolderId('all');
      loadMutualTasks();
    } else if (nav === 'folder') {
      setActiveFolderId('all');
      loadTasks('all');
    } else if (nav === 'history') {
      setActiveFolderId('all');
    }
  };

  // 4. Task Actions
  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    due_date: string;
    folder_id: string | null;
  }) => {
    const effectiveFolderId =
      taskData.folder_id || (activeFolderId !== 'all' ? activeFolderId : null);

    const payload = {
      ...taskData,
      folder_id: effectiveFolderId,
    };

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create task');
    }

    if (effectiveFolderId && effectiveFolderId !== activeFolderId) {
      setActiveFolderId(effectiveFolderId);
    }

    addToast('success', `Task "${taskData.title}" created successfully.`);
    await loadTasks(effectiveFolderId || activeFolderId);
    await loadFolders();
    if (data.task?.id) {
      setSelectedTaskId(data.task.id);
      // Auto-generate breakdown for the new task when enabled in General settings
      if (appConfig.autoBreakdown && taskData.description) {
        generateBreakdown(data.task.id, taskData.description, taskData.title);
      }
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.is_completed === 1 ? 0 : 1;
    const completedAt = newStatus === 1 ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, is_completed: newStatus, completed_at: completedAt }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: newStatus === 1 }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      if (newStatus === 1 && selectedTaskId === task.id) {
        const nextPendingTask = tasks.find(
          (candidate) => candidate.id !== task.id && candidate.is_completed === 0
        );
        setSelectedTaskId(nextPendingTask?.id ?? null);
      }

      addToast('success', newStatus === 1 ? 'Task completed!' : 'Task set to ongoing.');
      await Promise.all([loadFolders(), loadCompletedTaskHistory()]);
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? task : t))
      );
      addToast('error', 'Could not update task status.');
    }
  };

  const handleRestoreTask = async (task: Task) => {
    setSelectedTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not restore task.');
      addToast('success', `Task "${task.title}" restored.`);
      await Promise.all([loadTasks(activeFolderId), loadCompletedTaskHistory(), loadDeletedHistory()]);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not restore task.');
    }
  };

  const handleRestoreDeletedItem = async (item: { id: string; type: 'task' | 'folder'; title: string }) => {
    try {
      const endpoint = item.type === 'task' ? `/api/tasks/${item.id}` : `/api/folders/${item.id}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Could not restore ${item.type}.`);
      addToast('success', `${item.type === 'task' ? 'Task' : 'Folder'} "${item.title}" restored.`);
      await Promise.all([loadFolders(), loadTasks(activeFolderId), loadCompletedTaskHistory(), loadDeletedHistory()]);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : `Could not restore ${item.type}.`);
    }
  };

  const handlePermanentlyDeleteArchivedItem = async (item: { id: string; type: 'task' | 'folder'; title: string }) => {
    try {
      const endpoint = item.type === 'task' ? `/api/tasks/${item.id}` : `/api/folders/${item.id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Could not permanently delete ${item.type}.`);
      addToast('info', `${item.type === 'task' ? 'Task' : 'Folder'} "${item.title}" permanently deleted.`);
      await Promise.all([loadFolders(), loadTasks(activeFolderId), loadCompletedTaskHistory(), loadDeletedHistory()]);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : `Could not permanently delete ${item.type}.`);
    }
  };

  const handleFinishTask = async (task: Task) => {
    if (!task || task.is_completed === 1) return;

    const finishedSeconds = Math.max(0, getTaskTimerSeconds(task.id, Date.now()));
    try {
      await handleUpdateTask({ id: task.id, time_logged_seconds: finishedSeconds });
      setTaskTimerMap((prev) => ({
        ...prev,
        [task.id]: {
          ...createTaskTimerState(),
          baseSeconds: finishedSeconds,
          finishedMessage: `Task completed in: ${formatTimer(finishedSeconds)}`,
        },
      }));
      addToast('success', 'Time log saved for history.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not save time log.');
    }
  };

  const handleUpdateTask = async (updatedData: Partial<Task> & { id: string }) => {
    const normalizedData = {
      ...updatedData,
      ...(updatedData.folder_id !== undefined ? { folder_id: updatedData.folder_id === '' ? null : updatedData.folder_id } : {}),
    };

    const res = await fetch(`/api/tasks/${updatedData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task');

    addToast('success', 'Task updated.');
    await Promise.all([loadTasks(activeFolderId), loadFolders(), loadCompletedTaskHistory()]);

    if (appConfig.autoBreakdown && Object.prototype.hasOwnProperty.call(updatedData, 'description')) {
      const task = tasks.find((t) => t.id === updatedData.id) || { title: '', description: '' };
      const nextDescription = typeof updatedData.description === 'string' ? updatedData.description : task.description || '';
      generateBreakdown(updatedData.id, nextDescription, task.title || '');
    }
  };

  const loadTaskAttachments = async (taskId: string) => {
    setLoadingTaskAttachments(true);
    setAttachmentError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load files.');
      setTaskAttachments(data.attachments || []);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Failed to load files.');
    } finally {
      setLoadingTaskAttachments(false);
    }
  };

  const handleTaskAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    taskId: string,
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploadingTaskAttachment(true);
    setAttachmentError(null);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload file(s).');

      const uploadedCount = data.attachments?.length ?? files.length;
      addToast('success', `Uploaded ${uploadedCount} file(s).`);
      await loadTaskAttachments(taskId);
      await loadTasks(activeFolderId);
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : 'Failed to upload file(s).');
    } finally {
      setUploadingTaskAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete file.');

      addToast('info', 'File removed.');
      await loadTaskAttachments(taskId);
      await loadTasks(activeFolderId);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete file.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast('info', 'Task archived. It can be restored from history for 7 days.');
      if (selectedTaskId === taskId) {
        const remaining = tasks.filter((t) => t.id !== taskId);
        setSelectedTaskId(remaining.length > 0 ? remaining[0].id : null);
      }
      await Promise.all([loadFolders(), loadCompletedTaskHistory(), loadDeletedHistory()]);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete task.');
      throw err;
    }
  };

  const handleBulkDeleteTasks = async (taskIds: string[]) => {
    const results = await Promise.all(
      taskIds.map(async (taskId) => {
        try {
          const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) {
            return { taskId, error: data.error || 'Failed to delete task.' };
          }
          return { taskId, error: null };
        } catch (error) {
          return {
            taskId,
            error: error instanceof Error ? error.message : 'Failed to delete task.',
          };
        }
      })
    );

    const deletedIds = results.filter((result) => !result.error).map((result) => result.taskId);
    const failedResults = results.filter((result) => result.error);

    if (deletedIds.length > 0) {
      setTasks((current) => current.filter((task) => !deletedIds.includes(task.id)));
      setSelectedFolderTaskIds((current) => current.filter((id) => !deletedIds.includes(id)));
      if (selectedTaskId && deletedIds.includes(selectedTaskId)) {
        setSelectedTaskId(null);
      }
      await Promise.all([loadFolders(), loadCompletedTaskHistory(), loadDeletedHistory()]);
    }

    if (failedResults.length > 0) {
      throw new Error(
        `${deletedIds.length} task(s) archived. ${failedResults.length} could not be archived: ${
          failedResults.map((result) => result.error).join(' ')
        }`
      );
    }

    addToast('info', `${deletedIds.length} task(s) archived.`);
  };

  // Folder Actions
  const handleSaveFolder = async (folderData: {
    id?: string;
    name: string;
    color_hex: string;
  }) => {
    let tasksFolderId = activeFolderId;
    let createdFolderId: string | null = null;

    if (folderData.id) {
      const res = await fetch(`/api/folders/${folderData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderData.name,
          color_hex: folderData.color_hex,
        }),
      });
      if (!res.ok) throw new Error('Failed to update folder');
      addToast('success', `Folder "${folderData.name}" updated.`);
    } else {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderData.name, color_hex: folderData.color_hex }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      const data = await res.json();
      createdFolderId = typeof data?.folder?.id === 'string' ? data.folder.id : null;

      if (createdFolderId) {
        setActiveNav('folder');
        setActiveFolderId(createdFolderId);
        tasksFolderId = createdFolderId;
      }
      addToast('success', `Folder "${folderData.name}" created.`);

      if (folderModal.taskId && createdFolderId) {
        await handleUpdateTask({ id: folderModal.taskId, folder_id: createdFolderId });
      }
    }

    await Promise.all([loadFolders(), loadTasks(tasksFolderId), loadCompletedTaskHistory(), loadDeletedHistory()]);
    setFolderModal({ isOpen: false, folder: null, taskId: null });
  };

  const handleDeleteFolder = async (folderId: string) => {
    const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete folder');

    setSelectedFolderIds((current) => current.filter((id) => id !== folderId));
    addToast('info', data.message);
    setActiveFolderId('all');
    await Promise.all([loadFolders(), loadTasks('all'), loadCompletedTaskHistory(), loadDeletedHistory()]);
  };

  const handleBulkDeleteFolders = async (folderIds: string[]) => {
    const results = await Promise.all(
      folderIds.map(async (folderId) => {
        try {
          const res = await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) {
            return { folderId, error: data.error || 'Failed to remove folder.' };
          }
          return { folderId, error: null };
        } catch (error) {
          return {
            folderId,
            error: error instanceof Error ? error.message : 'Failed to remove folder.',
          };
        }
      })
    );

    const removedFolderIds = results.filter((result) => !result.error).map((result) => result.folderId);
    const failedResults = results.filter((result) => result.error);

    if (removedFolderIds.length > 0) {
      setSelectedFolderIds((current) => current.filter((id) => !removedFolderIds.includes(id)));
      setActiveFolderId('all');
      await Promise.all([loadFolders(), loadTasks('all'), loadCompletedTaskHistory(), loadDeletedHistory()]);
    }

    if (failedResults.length > 0) {
      throw new Error(
        `${removedFolderIds.length} folder(s) archived. ${failedResults.length} could not be archived: ${
          failedResults.map((result) => result.error).join(' ')
        }`
      );
    }

    addToast('info', `${removedFolderIds.length} folder(s) archived.`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Subtask Toggle & Add & Delete
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setSubtasksMap((prev) => {
      const currentList = prev[taskId] || [];
      const updated = currentList.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      return { ...prev, [taskId]: updated };
    });
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasksMap((prev) => {
      const currentList = prev[taskId] || [];
      const newItem: SubtaskItem = {
        id: `st_${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      };
      return { ...prev, [taskId]: [...currentList, newItem] };
    });
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setSubtasksMap((prev) => {
      const currentList = prev[taskId] || [];
      return { ...prev, [taskId]: currentList.filter((st) => st.id !== subtaskId) };
    });
  };

  const handleEditSubtask = (taskId: string, subtaskId: string, currentTitle: string) => {
    setEditingSubtaskId(subtaskId);
    setSubtaskDraft(currentTitle);
  };

  const handleSaveSubtaskEdit = (taskId: string) => {
    const trimmed = subtaskDraft.trim();
    if (!trimmed || !editingSubtaskId) return;

    setSubtasksMap((prev) => {
      const currentList = prev[taskId] || [];
      return {
        ...prev,
        [taskId]: currentList.map((st) =>
          st.id === editingSubtaskId ? { ...st, title: trimmed } : st
        ),
      };
    });

    setEditingSubtaskId(null);
    setSubtaskDraft('');
  };

  const handleMarkNotifRead = async (notifId: string) => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notifId }),
    });
    if (res.ok) {
      setNotificationItems((prev) =>
        prev.map((notification) => notification.id === notifId
          ? { ...notification, is_read: 1 }
          : notification)
      );
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    await handleMarkNotifRead(notification.id);
    if (!notification.task_id) return;
    setShowNotificationDropdown(false);

    let task = tasks.find((item) => item.id === notification.task_id)
      || completedTaskHistory.find((item) => item.id === notification.task_id)
      || null;

    if (!task) {
      try {
        const res = await fetch(`/api/tasks/${notification.task_id}`);
        if (!res.ok) {
          addToast('info', 'This task is no longer available.');
          return;
        }
        const data = await res.json();
        task = data.task as Task;
      } catch {
        addToast('error', 'Could not open this task.');
        return;
      }
    }

    await loadFolders();
    setActiveNav('folder');
    setActiveFolderId(task.folder_id || 'all');
    setTasks((current) => [
      ...current.filter((item) => item.id !== task!.id),
      task!,
    ]);
    setSelectedTaskId(task.id);
    setFolderTaskPanel(null);
    setIsFolderTaskClosing(false);
    setMobileSidebarOpen(false);
  };

  const handleMarkAllNotifsRead = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) {
      setNotificationItems((prev) => prev.map((notification) => ({ ...notification, is_read: 1 })));
    }
  };

  const unreadNotifCount = notificationItems.filter((notification) => notification.is_read === 0).length;
  const readNotifCount = notificationItems.length - unreadNotifCount;
  const visibleNotificationItems = notificationItems.filter((notification) =>
    notificationFilter === 'unread' ? notification.is_read === 0 : notification.is_read === 1
  );

  const formatNotificationTime = (createdAt: string) => {
    const timestamp = new Date(createdAt.includes('T') ? createdAt : `${createdAt.replace(' ', 'T')}Z`);
    if (Number.isNaN(timestamp.getTime())) return '';
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));
    if (elapsedSeconds < 60) return 'just now';
    if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
    if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
    return timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDeadlineTime = (value: Date | string | null) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const locale = appConfig.dateFormat === 'dmy' ? 'en-GB' : 'en-US';
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateByConfig = (
    value: Date | string | null,
    options?: Intl.DateTimeFormatOptions,
    includeTime = true
  ) => {
    if (!value) return 'No deadline';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';

    const pad = (num: number) => String(num).padStart(2, '0');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const timeStr = includeTime ? formatDeadlineTime(date) : '';
    const timeSuffix = timeStr ? ` at ${timeStr}` : '';

    if (options) {
      if (appConfig.dateFormat === 'ymd') {
        const monthName = date.toLocaleDateString('en-US', { month: options.month || 'long' });
        return `${year}, ${monthName} ${day}${timeSuffix}`;
      }

      const locale = appConfig.dateFormat === 'dmy' ? 'en-GB' : 'en-US';
      const formatted = date.toLocaleDateString(locale, options);
      return `${formatted}${timeSuffix}`;
    }

    switch (appConfig.dateFormat) {
      case 'dmy':
        return `${pad(day)}/${pad(month)}/${year}${timeSuffix}`;
      case 'ymd':
        return `${year}, ${date.toLocaleDateString('en-US', { month: 'long' })} ${day}${timeSuffix}`;
      case 'mdy':
      default:
        return `${pad(month)}/${pad(day)}/${year}${timeSuffix}`;
    }
  };

  const formatQueueDateByConfig = (value: Date | string | null, includeTime = true) => {
    if (!value) return 'No deadline';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'No deadline';

    const timeStr = includeTime ? formatDeadlineTime(date) : '';
    const timeSuffix = timeStr ? ` at ${timeStr}` : '';

    if (appConfig.dateFormat === 'ymd') {
      return `${date.getFullYear()}, ${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}${timeSuffix}`;
    }

    const locale = appConfig.dateFormat === 'dmy' ? 'en-GB' : 'en-US';
    return `${date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}${timeSuffix}`;
  };

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => task.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const filteredFolderTasks = useMemo(
    () => filteredTasks.filter((task) => {
      if (folderTaskFilter === 'active') return task.is_completed === 0 && !isTaskOverdue(task);
      if (folderTaskFilter === 'completed') return task.is_completed === 1;
      if (folderTaskFilter === 'overdue') return isTaskOverdue(task);
      return true;
    }),
    [filteredTasks, folderTaskFilter]
  );

  const sortedFolderTasks = useMemo(() => {
    return [...filteredFolderTasks].sort((a, b) => {
      if (folderTaskSort === 'name-asc') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }

      const dateDifference =
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return folderTaskSort === 'date-desc' ? -dateDifference : dateDifference;
    });
  }, [filteredFolderTasks, folderTaskSort]);
  const allVisibleFolderTasksSelected =
    sortedFolderTasks.length > 0 &&
    sortedFolderTasks.every((task) => selectedFolderTaskIds.includes(task.id));

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.trim().toLowerCase();
    return folders.filter((folder) => folder.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const sortedFolders = useMemo(() => {
    return [...filteredFolders].sort((a, b) => {
      if (folderSort === 'name-asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }

      const dateDifference =
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return folderSort === 'date-desc' ? -dateDifference : dateDifference;
    });
  }, [filteredFolders, folderSort]);
  const allVisibleFoldersSelected =
    sortedFolders.length > 0 && sortedFolders.every((folder) => selectedFolderIds.includes(folder.id));

  const filteredCompletedTaskHistory = useMemo(() => {
    if (!searchQuery.trim()) return completedTaskHistory;
    const q = searchQuery.trim().toLowerCase();
    return completedTaskHistory.filter((task) => task.title.toLowerCase().includes(q));
  }, [completedTaskHistory, searchQuery]);

  const queueTasks = useMemo(() => {
    const pendingTasks = filteredTasks.filter((task) => task.is_completed === 0);
    const isOverdueTask = (task: Task) => {
      const parsed = new Date(task.due_date).getTime();
      return Number.isFinite(parsed) && parsed < currentTime.getTime();
    };

    const getDeadline = (task: Task) => {
      const parsed = new Date(task.due_date).getTime();
      return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
    };

    const now = currentTime.getTime();
    const getTaskPriorityBand = (task: Task): 'high' | 'medium' | 'low' | null => {
      const parsedDueDate = new Date(task.due_date).getTime();
      const isValidDeadline = Number.isFinite(parsedDueDate);
      const timeUntilDeadline = isValidDeadline ? parsedDueDate - now : Number.MAX_SAFE_INTEGER;
      const complexity = getDescriptionComplexityScore(task.description || '');
      const isActionable = parseDescriptionToSteps(task.description || '', task.title).length > 0;

      if (timeUntilDeadline < 0) return null;
      if (timeUntilDeadline <= 24 * 60 * 60 * 1000) return 'high';
      if (complexity >= 4) return 'high';
      if (!isActionable) return 'low';
      if (timeUntilDeadline <= 7 * 24 * 60 * 60 * 1000 && complexity >= 3) return 'high';
      if (complexity >= 2) return 'medium';
      return 'low';
    };

    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;

    const allTasks = showOverdueTasks
      ? pendingTasks.filter(isOverdueTask)
      : pendingTasks.filter((task) => !isOverdueTask(task));

    if (queueView === 'all') {
      return [...allTasks].sort((a, b) => {
        if (queueSort === 'name') {
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        }

        const deadlineDifference = getDeadline(a) - getDeadline(b);
        return queueSort === 'date-desc' ? -deadlineDifference : deadlineDifference;
      });
    }

    const visibleTasks = showOverdueTasks
      ? pendingTasks.filter(isOverdueTask)
      : pendingTasks.filter((task) => !isOverdueTask(task));

    if (showOverdueTasks) {
      return [...visibleTasks];
    }

    const baseTasks = [...visibleTasks].filter((task) => {
      if (queueView !== 'priority') return true;
      return getTaskPriorityBand(task) !== null;
    });

    return baseTasks.sort((a, b) => {
      const deadlineA = getDeadline(a);
      const deadlineB = getDeadline(b);

      if (queueView === 'priority') {
        const bandA = getTaskPriorityBand(a);
        const bandB = getTaskPriorityBand(b);
        const bandDifference = (bandA ? priorityOrder[bandA] : Number.MAX_SAFE_INTEGER) - (bandB ? priorityOrder[bandB] : Number.MAX_SAFE_INTEGER);
        if (bandDifference !== 0) return bandDifference;

        const deadlineDifference = deadlineA - deadlineB;
        if (deadlineDifference !== 0) return deadlineDifference;
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      }

      const deadlineDifference = deadlineA - deadlineB;
      return deadlineDifference;
    });
  }, [filteredTasks, queueView, queueSort, currentTime, showOverdueTasks]);

  const getTaskPriorityLabel = (task: Task) => {
    const parsedDueDate = new Date(task.due_date).getTime();
    const timeUntilDeadline = Number.isFinite(parsedDueDate) ? parsedDueDate - currentTime.getTime() : Number.MAX_SAFE_INTEGER;
    const complexity = getDescriptionComplexityScore(task.description || '');
    const isActionable = parseDescriptionToSteps(task.description || '', task.title).length > 0;

    if (timeUntilDeadline < 0) return 'Overdue';
    if (timeUntilDeadline <= 24 * 60 * 60 * 1000) return 'High priority';
    if (!isActionable) return 'Low priority';
    if (timeUntilDeadline <= 7 * 24 * 60 * 60 * 1000 && complexity >= 3) return 'High priority';
    if (complexity >= 4) return 'High priority';
    if (complexity >= 2) return 'Medium priority';
    return 'Low priority';
  };

  const getTaskPriorityPillClasses = (label: string, isSelected = false) => {
    if (isSelected) {
      return 'bg-white/15 text-white border border-white/20';
    }

    switch (label) {
      case 'High priority':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'Medium priority':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Low priority':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Only pending tasks belong in the detail pane and task queue.
  const activeTask = useMemo(() => {
    if (activeNav === 'folder' && activeFolderId !== 'all') {
      return tasks.find(
        (task) => task.id === selectedTaskId && task.folder_id === activeFolderId
      ) || null;
    }
    return queueTasks.find((task) => task.id === selectedTaskId) || null;
  }, [activeNav, activeFolderId, tasks, queueTasks, selectedTaskId]);

  useEffect(() => {
    if (!activeTask) {
      setTaskAttachments([]);
      setLoadingTaskAttachments(false);
      setAttachmentError(null);
      return;
    }

    let cancelled = false;
    setTaskAttachments([]);
    setLoadingTaskAttachments(true);
    setAttachmentError(null);
    fetch(`/api/tasks/${activeTask.id}/attachments`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load files.');
        if (!cancelled) setTaskAttachments(data.attachments || []);
      })
      .catch((err) => {
        console.error('Failed to load task attachments:', err);
        if (!cancelled) {
          setAttachmentError(err instanceof Error ? err.message : 'Failed to load files.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTaskAttachments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTask?.id]);

  useEffect(() => {
    setEditingTaskTitle(false);
    setEditingTaskDeadline(false);
    setFolderTaskPanel(null);
  }, [activeTask?.id]);

  useEffect(() => {
    if (!activeTask) {
      setTaskComments([]);
      setCommentsLoading(false);
      return;
    }

    let cancelled = false;
    setTaskComments([]);
    setNewTaskComment('');
    setCommentsError(null);
    setCommentsLoading(true);
    fetch(`/api/tasks/${activeTask.id}/comments`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load comments');
        const data = await res.json();
        if (!cancelled) setTaskComments(data.comments || []);
      })
      .catch((err) => {
        console.error('Failed to load task comments:', err);
        if (!cancelled) {
          setCommentsError(err instanceof Error ? err.message : 'Could not load task comments.');
        }
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTask?.id]);

  const handlePostTaskComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = newTaskComment.trim();
    if (!activeTask || !content || submittingTaskComment) return;

    setSubmittingTaskComment(true);
    try {
      const res = await fetch(`/api/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post comment');

      setTaskComments((current) => [...current, data.comment]);
      setNewTaskComment('');
    } catch (err) {
      console.error('Failed to post task comment:', err);
      addToast('error', err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setSubmittingTaskComment(false);
    }
  };

  const activeSubtasks = useMemo(() => {
    if (!activeTask) return [];
    return subtasksMap[activeTask.id] || [];
  }, [activeTask, subtasksMap]);

  const completedSubtasksCount = activeSubtasks.filter((st) => st.completed).length;
  const taskBreakdown = activeTask && (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-heading)]">Task Breakdown</h3>
        </div>
        <div className="flex items-center gap-2">
          {activeSubtasks.length > 0 && (
            <span className="tag-pill text-[10px]">
              {completedSubtasksCount} OUT OF {activeSubtasks.length} COMPLETED
            </span>
          )}
          <button
            type="button"
            onClick={() => handleManualBreakdown(activeTask)}
            disabled={breakdownLoading === activeTask.id}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-light)] hover:opacity-80"
            title="Break down the task description into steps"
          >
            <Sparkles className="h-3 w-3" />
            {breakdownLoading === activeTask.id ? 'Generating...' : 'Breakdown Task'}
          </button>
        </div>
      </div>

      {(!activeTask.description || !activeTask.description.trim()) && activeSubtasks.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card-subtle)] p-4 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Add a description to your task to auto-generate a step-by-step breakdown.
          </p>
        </div>
      ) : activeSubtasks.length > 0 ? (
        <>
          <div className="mb-3 space-y-2">
            {activeSubtasks.map((st) => (
              <div
                key={st.id}
                className="group relative flex items-center gap-3 rounded-lg px-1 py-1.5"
              >
                <div
                  onClick={() => handleToggleSubtask(activeTask.id, st.id)}
                  className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
                >
                  {st.completed ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-[var(--text-muted)] transition-colors group-hover:border-[var(--color-primary)]" />
                  )}
                </div>

                {editingSubtaskId === st.id ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={subtaskDraft}
                      onChange={(event) => setSubtaskDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSaveSubtaskEdit(activeTask.id);
                        if (event.key === 'Escape') {
                          setEditingSubtaskId(null);
                          setSubtaskDraft('');
                        }
                      }}
                      className="input-field min-w-0 flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSubtaskEdit(activeTask.id)}
                      className="rounded bg-[var(--color-primary)] px-2 py-1 text-[9px] font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubtaskId(null);
                        setSubtaskDraft('');
                      }}
                      className="rounded border border-[var(--border-light)] px-2 py-1 text-[9px] font-medium text-[var(--text-muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => handleToggleSubtask(activeTask.id, st.id)}
                      className={`flex-1 cursor-pointer text-xs transition-colors ${
                        st.completed
                          ? 'text-[var(--text-muted)] line-through'
                          : 'font-medium text-[var(--text-body)] group-hover:text-[var(--text-heading)]'
                      }`}
                    >
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEditSubtask(activeTask.id, st.id, st.title)}
                      className="rounded p-1 text-[var(--text-muted)] opacity-0 transition-all hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-heading)] group-hover:opacity-100"
                      title="Edit step"
                      aria-label={`Edit step ${st.title}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubtask(activeTask.id, st.id)}
                      className="rounded p-1 text-[var(--text-muted)] opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      title="Remove step"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(event) => setNewSubtaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAddSubtask(activeTask.id);
              }}
              placeholder="Add a step..."
              className="input-field flex-1 text-xs"
            />
            <button
              onClick={() => handleAddSubtask(activeTask.id)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          {breakdownReasons[activeTask.id] || 'This description cannot be broken down into steps yet.'}
        </div>
      )}
    </div>
  );
  const taskCommentsSection = activeTask && (
    <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-heading)]">
          Comments
          <span className="ml-2 text-xs font-semibold text-[var(--text-muted)]">
            {taskComments.length}
          </span>
        </h3>
      </div>

      {commentsLoading ? (
        <div className="py-3 text-center text-xs text-[var(--text-muted)]">Loading comments...</div>
      ) : commentsError ? (
        <p role="alert" className="mb-3 text-xs text-red-600">{commentsError}</p>
      ) : taskComments.length > 0 ? (
        <div className="mb-3 flex items-start gap-2.5">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: taskComments[taskComments.length - 1].author_avatar_color || 'var(--color-primary)' }}
          >
            {taskComments[taskComments.length - 1].author_username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-xs font-semibold text-[var(--text-body)]">
              {taskComments[taskComments.length - 1].author_username}
            </div>
            <p className="rounded-xl bg-[var(--bg-card-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-body)]">
              {taskComments[taskComments.length - 1].content}
            </p>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-xs text-[var(--text-muted)]">No comments yet. Start the conversation.</p>
      )}

      <form onSubmit={handlePostTaskComment} className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: user?.avatar_color || 'var(--color-primary)' }}
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <input
          type="text"
          value={newTaskComment}
          onChange={(event) => setNewTaskComment(event.target.value)}
          placeholder="Write a comment..."
          aria-label="Write a comment"
          className="input-field min-w-0 flex-1 text-xs"
          disabled={submittingTaskComment}
        />
        <button
          type="submit"
          aria-label="Post comment"
          title="Post comment"
          disabled={!newTaskComment.trim() || submittingTaskComment}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingTaskComment ? <div className="spinner" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>

      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={() => setDrawerTask(activeTask)}
          className="text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
        >
          See all
        </button>
      </div>
    </section>
  );

  const startEditingDescription = (task: Task) => {
    setEditingDescriptionTaskId(task.id);
    setDescriptionDraft(task.description || '');
  };

  const saveDescription = async () => {
    if (!activeTask) return;

    try {
      await handleUpdateTask({
        id: activeTask.id,
        description: descriptionDraft.trim(),
      });
      setEditingDescriptionTaskId(null);
      setDescriptionDraft('');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not update description.');
    }
  };

  const startEditingTaskTitle = (task: Task) => {
    setTaskTitleDraft(task.title);
    setEditingTaskTitle(true);
  };

  const saveTaskTitle = async () => {
    if (!activeTask || savingInlineTaskField) return;
    const title = taskTitleDraft.trim();
    if (!title) {
      addToast('error', 'Task title cannot be empty.');
      return;
    }

    setSavingInlineTaskField('title');
    try {
      await handleUpdateTask({ id: activeTask.id, title });
      setEditingTaskTitle(false);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not update task title.');
    } finally {
      setSavingInlineTaskField(null);
    }
  };

  const startEditingTaskDeadline = (task: Task) => {
    const dueDate = task.due_date ? new Date(task.due_date) : new Date();
    const localDateTime = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setTaskDeadlineDraft(localDateTime);
    setEditingTaskDeadline(true);
  };

  const applyInlineDeadlinePreset = (daysOffset: number, hours: number, mins: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(hours, mins, 0, 0);
    const localDateTime = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setTaskDeadlineDraft(localDateTime);
  };

  const saveTaskDeadline = async () => {
    if (!activeTask || savingInlineTaskField) return;
    const dueDate = new Date(taskDeadlineDraft);
    if (!taskDeadlineDraft || Number.isNaN(dueDate.getTime())) {
      addToast('error', 'Choose a valid deadline.');
      return;
    }

    setSavingInlineTaskField('deadline');
    try {
      await handleUpdateTask({ id: activeTask.id, due_date: dueDate.toISOString() });
      setEditingTaskDeadline(false);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not update deadline.');
    } finally {
      setSavingInlineTaskField(null);
    }
  };

  // Compact view spacing class
  const compactClass = appConfig.compactView ? 'compact' : '';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center text-[var(--text-heading)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-[var(--text-muted)] font-semibold tracking-wider uppercase">
          Loading Module Workspace...
        </p>
      </div>
    );
  }

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const showFolderGallery = activeNav === 'folder' && activeFolderId === 'all';
  const showFolderTasks = Boolean(activeFolder) && activeFolderId !== 'all';
  const isFolderTaskDetail =
    activeNav === 'folder' &&
    showFolderTasks &&
    tasks.some((task) => task.id === selectedTaskId && task.folder_id === activeFolderId);
  const shouldShowTaskLayout =
    !showFolderGallery &&
    (!showFolderTasks || isFolderTaskDetail) &&
    activeNav !== 'history' &&
    !(activeNav === 'mutual' && tasks.length === 0);
  const totalPending = tasks.filter((task) => {
    if (task.is_completed !== 0) return false;
    const dueTime = new Date(task.due_date).getTime();
    return !Number.isFinite(dueTime) || dueTime >= currentTime.getTime();
  }).length;
  const currentTimeLabel = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const sessionTimerLabel = formatTimer(activeTask ? getTaskTimerSeconds(activeTask.id, currentTime.getTime()) : 0);
  const sessionTargetHours = Math.floor(sessionTargetSeconds / 3600);
  const sessionTargetMinutes = Math.floor((sessionTargetSeconds % 3600) / 60);
  const sessionTargetLabel = sessionTargetHours > 0
    ? `${sessionTargetHours}h${sessionTargetMinutes > 0 ? ` ${sessionTargetMinutes}m` : ''}`
    : `${sessionTargetMinutes}m`;
  const sessionProgress = sessionTargetSeconds > 0
    ? Math.min((timerSeconds / sessionTargetSeconds) * 100, 100)
    : 0;
  return (
    <div className={`min-h-screen bg-[#7799B0] ${appConfig.compactView ? 'p-1 sm:p-3' : 'p-2 sm:p-5'} flex items-center justify-center font-sans`}>
      {/* Outer Rounded Application Frame matching mockup bezel */}
      <div className="w-full max-w-[1440px] h-[94vh] bg-[var(--bg-canvas)] rounded-[24px] shadow-2xl flex overflow-hidden border border-[var(--border-light)] relative">
        {/* 1. Left Sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar
            user={user}
            folders={folders}
            activeFolderId={activeFolderId}
            onSelectFolder={handleSelectFolder}
            onOpenNewFolderModal={() => setFolderModal({ isOpen: true, folder: null })}
            onOpenEditFolderModal={(folder) => setFolderModal({ isOpen: true, folder })}
            onLogout={handleLogout}
            totalPendingTasks={totalPending}
            activeNav={activeNav}
            onSelectNav={handleSelectNav}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            onDeleteFolder={handleDeleteFolder}
            appConfig={appConfig}
            onConfigChange={handleConfigChange}
            currentTimeLabel={currentTimeLabel}
            sessionTimerLabel={sessionTimerLabel}
            sessionTargetLabel={sessionTargetLabel}
            sessionTargetSeconds={sessionTargetSeconds}
            sessionProgress={sessionProgress}
            isTimerRunning={isTimerRunning}
            onToggleSessionTimer={handleToggleSessionTimer}
            onResetSessionTimer={handleResetSessionTimer}
            onSessionTargetChange={handleSessionTargetChange}
            completedTaskCount={completedTaskHistory.length}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-[1200] flex md:hidden">
            <div
              className="fixed inset-0 bg-black/60"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 max-w-[85vw] h-full shadow-2xl">
              <Sidebar
                user={user}
                folders={folders}
                activeFolderId={activeFolderId}
                onSelectFolder={handleSelectFolder}
                onOpenNewFolderModal={() => {
                  setMobileSidebarOpen(false);
                  setFolderModal({ isOpen: true, folder: null });
                }}
                onOpenEditFolderModal={(folder) => {
                  setMobileSidebarOpen(false);
                  setFolderModal({ isOpen: true, folder });
                }}
                onLogout={handleLogout}
                totalPendingTasks={totalPending}
                activeNav={activeNav}
                onSelectNav={handleSelectNav}
                onCloseMobile={() => setMobileSidebarOpen(false)}
                onDeleteFolder={handleDeleteFolder}
                appConfig={appConfig}
                onConfigChange={handleConfigChange}
                currentTimeLabel={currentTimeLabel}
                sessionTimerLabel={sessionTimerLabel}
                sessionTargetLabel={sessionTargetLabel}
                sessionTargetSeconds={sessionTargetSeconds}
                sessionProgress={sessionProgress}
                isTimerRunning={isTimerRunning}
                onToggleSessionTimer={handleToggleSessionTimer}
                onResetSessionTimer={handleResetSessionTimer}
                onSessionTargetChange={handleSessionTargetChange}
                completedTaskCount={completedTaskHistory.length}
              />
            </div>
          </div>
        )}

        {/* 2. Main Content Workspace */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-canvas)]">
          {/* Top Bar Navigation */}
          <header className={`px-6 ${appConfig.compactView ? 'py-2' : 'py-4'} flex items-center justify-between border-b border-[var(--border-light)] gap-4`}>
            <div className="flex items-center gap-3">
              {/* Mobile toggle */}
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="p-1.5 rounded-lg text-[var(--text-heading)] hover:bg-black/5 md:hidden"
                title="Toggle navigation"
                aria-label="Toggle navigation"
              >
                {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <h1 className="font-serif-heading text-2xl sm:text-3xl font-bold text-[var(--text-heading)] tracking-tight">
                {activeNav === 'history'
                  ? 'History'
                  : activeNav === 'folder'
                  ? 'By Folder'
                  : activeFolder
                  ? activeFolder.name
                  : activeNav === 'mutual'
                  ? 'Mutual Tasks'
                  : 'All Tasks'}
              </h1>
            </div>

            {/* Center: Search Pill with command badge */}
            <div className="relative flex-1 max-w-lg hidden sm:block">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-4 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  showFolderGallery
                    ? 'Search folders...'
                    : activeNav === 'history'
                    ? 'Search history...'
                    : 'Search tasks...'
                }
                className="w-full bg-[var(--bg-card-subtle)] text-xs text-[var(--text-heading)] placeholder-[var(--text-muted)] rounded-full pl-11 pr-14 py-2.5 border border-[var(--border-light)] outline-none focus:border-[var(--color-primary)] transition-colors font-medium"
              />
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-2.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-[var(--text-muted)] bg-[var(--border-subtle)] border border-[var(--border-light)] hover:text-[var(--text-heading)] hover:bg-[var(--border-light)] transition-colors"
                aria-label="Clear search"
                title="Clear search"
              >
                ⌘
              </button>
            </div>

            {/* Right: + Create New button, Bell (no avatar) */}
            <div className="flex items-center gap-3">
              {activeNav !== 'history' && (
                <button
                  onClick={() => {
                    if (showFolderGallery) {
                      setFolderModal({ isOpen: true, folder: null });
                    } else {
                      setIsTaskModalOpen(true);
                    }
                  }}
                  className="btn-primary-blue text-xs py-2 px-4 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showFolderGallery ? 'New Folder' : 'Create New'}</span>
                </button>
              )}

              {/* Notification Bell */}
              <div>
                <button
                  onClick={() => {
                    const shouldOpen = !showNotificationDropdown;
                    setShowNotificationDropdown(shouldOpen);
                    if (shouldOpen) void loadNotifications();
                  }}
                  className={`w-8 h-8 rounded-full border text-[var(--text-body)] hover:text-[var(--text-heading)] flex items-center justify-center relative transition-colors ${
                    showNotificationDropdown
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-[var(--border-light)] bg-[var(--bg-card-subtle)]'
                  }`}
                  title="Notifications"
                  aria-haspopup="dialog"
                  aria-expanded={showNotificationDropdown}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--bg-canvas)] absolute top-0.5 right-0.5" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {showNotificationDropdown && (
            <div
              className="modal-overlay folder-task-detail-overlay"
              onClick={() => setShowNotificationDropdown(false)}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Notifications"
                className="folder-task-detail-modal-content max-w-xl mx-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="overflow-hidden rounded-2xl shadow-2xl"
                  style={{
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  {/* ── HEADER ── */}
                  <header
                    className="relative px-5 py-5 sm:px-8 sm:py-6"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setShowNotificationDropdown(false)}
                      aria-label="Close notifications"
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition"
                      style={{
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-card-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Title row */}
                    <div className="flex min-h-9 items-center gap-2.5 pr-12">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <h2
                        className="font-sans text-xl font-extrabold leading-tight sm:text-2xl"
                        style={{ color: 'var(--text-heading)' }}
                      >
                        Notifications
                      </h2>
                      {unreadNotifCount > 0 ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          {unreadNotifCount} unread
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            border: '1px solid var(--border-light)',
                            backgroundColor: 'var(--bg-card-subtle)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          All caught up
                        </span>
                      )}
                    </div>

                    {/* Filter buttons */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNotificationFilter('unread')}
                        aria-pressed={notificationFilter === 'unread'}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={
                          notificationFilter === 'unread'
                            ? {
                                border: '1px solid var(--color-primary)',
                                backgroundColor: 'var(--color-primary)',
                                color: '#ffffff',
                              }
                            : {
                                border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-card-subtle)',
                                color: 'var(--text-muted)',
                              }
                        }
                      >
                        Unread ({unreadNotifCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationFilter('read')}
                        aria-pressed={notificationFilter === 'read'}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={
                          notificationFilter === 'read'
                            ? {
                                border: '1px solid var(--color-primary)',
                                backgroundColor: 'var(--color-primary)',
                                color: '#ffffff',
                              }
                            : {
                                border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-card-subtle)',
                                color: 'var(--text-muted)',
                              }
                        }
                      >
                        Read ({readNotifCount})
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkAllNotifsRead}
                        disabled={unreadNotifCount === 0}
                        className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-card-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Mark all read
                      </button>
                    </div>
                  </header>

                  {/* ── NOTIFICATION LIST ── */}
                  <div
                    className="max-h-[55vh] space-y-2.5 overflow-y-auto p-4 sm:p-6"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    {visibleNotificationItems.length === 0 ? (
                      <div
                        className="rounded-xl px-5 py-10 text-center text-sm"
                        style={{
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-card-subtle)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {notificationFilter === 'unread' ? 'No unread notifications.' : 'No read notifications yet.'}
                      </div>
                    ) : (
                      visibleNotificationItems.map((notification) => {
                        const isUnread = notification.is_read === 0;
                        const isDeadline = notification.type === 'deadline';
                        const leftBorderColor = isDeadline
                          ? '#f59e0b'
                          : isUnread
                          ? 'var(--color-primary)'
                          : 'transparent';
                        const itemBg = isUnread
                          ? 'var(--color-primary-light)'
                          : 'var(--bg-card)';

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => void handleOpenNotification(notification)}
                            className="group flex w-full items-start gap-3 rounded-xl p-4 text-left transition-all"
                            style={{
                              backgroundColor: itemBg,
                              border: '1px solid var(--border-light)',
                              borderLeft: `4px solid ${leftBorderColor}`,
                              opacity: isUnread ? 1 : 0.8,
                              color: 'var(--text-heading)',
                            }}
                          >
                            {isUnread && (
                              <span
                                className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: isDeadline ? '#fbbf24' : 'var(--color-primary)',
                                  boxShadow: isDeadline
                                    ? '0 0 8px rgba(251,191,36,0.7)'
                                    : '0 0 8px var(--color-primary)',
                                }}
                              />
                            )}
                            <span className="min-w-0 flex-1">
                              <span
                                className="block text-sm font-semibold leading-snug"
                                style={{ color: 'var(--text-heading)' }}
                              >
                                {notification.message}
                              </span>
                              <span
                                className="mt-1 block text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {formatNotificationTime(notification.created_at)}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {showFolderGallery && (
            <section
              className={`folder-gallery flex-1 overflow-y-auto p-5 sm:p-8 ${sidebarCollapsed ? 'folder-gallery-collapsed pl-3 sm:pl-4' : ''}`}
              aria-label="Folders"
            >
              {folders.length > 0 && (
                <div className={`mb-6 flex flex-wrap items-center justify-start gap-3 ${sidebarCollapsed ? 'max-w-full' : 'mx-auto max-w-[1000px]'}`}>
                  <div className="order-last ml-auto flex flex-wrap items-center gap-3">
                    {!isFolderSelectionMode ? (
                    <button
                      type="button"
                      onClick={() => setIsFolderSelectionMode(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Select
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFolderIds((current) => {
                            if (allVisibleFoldersSelected) {
                              return current.filter((id) => !sortedFolders.some((folder) => folder.id === id));
                            }
                            return Array.from(new Set([...current, ...sortedFolders.map((folder) => folder.id)]));
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                        aria-pressed={allVisibleFoldersSelected}
                      >
                        {allVisibleFoldersSelected ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {allVisibleFoldersSelected ? 'Deselect all' : 'Select all'}
                      </button>
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        {selectedFolderIds.length} selected
                      </span>
                      {selectedFolderIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const foldersToRemove = folders.filter((folder) => selectedFolderIds.includes(folder.id));
                            const ownedCount = foldersToRemove.filter((folder) => folder.is_owner === 1).length;
                            const sharedCount = foldersToRemove.length - ownedCount;
                            const description = [
                              ownedCount > 0
                                ? `${ownedCount} owned folder(s) and all their tasks will be archived and can be restored from history for 7 days.`
                                : '',
                              sharedCount > 0
                                ? `You will leave ${sharedCount} shared folder(s).`
                                : '',
                            ].filter(Boolean).join(' ');

                            setConfirmation({
                              title: 'Remove selected folders?',
                              description,
                              confirmLabel: 'Remove folders',
                              onConfirm: () => handleBulkDeleteFolders([...selectedFolderIds]),
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove selected
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFolderSelectionMode(false);
                          setSelectedFolderIds([]);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                      >
                        Done
                      </button>
                    </>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                    Sort by
                    <SortDropdown
                      value={folderSort}
                      onChange={(nextSort) => setFolderSort(nextSort as typeof folderSort)}
                      ariaLabel="Sort folders"
                      options={[
                        { value: 'name-asc', label: 'Name (A–Z)' },
                        { value: 'date-desc', label: 'Date created (newest)' },
                        { value: 'date-asc', label: 'Date created (oldest)' },
                      ]}
                    />
                  </label>
                  <div
                    className="inline-flex rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-1"
                    role="group"
                    aria-label="Folder view"
                  >
                    <button
                      type="button"
                      onClick={() => setFolderView('grid')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        folderView === 'grid'
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                      }`}
                      aria-pressed={folderView === 'grid'}
                      aria-label="Grid view"
                      title="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderView('list')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        folderView === 'list'
                          ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                      }`}
                      aria-pressed={folderView === 'list'}
                      aria-label="List view"
                      title="List view"
                    >
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </button>
                  </div>
                </div>
              )}
              {folders.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 text-5xl" aria-hidden="true">📁</div>
                  <h2 className="font-serif-heading text-xl font-bold text-[#5b4143]">No folders yet</h2>
                  <p className="mt-2 max-w-sm text-sm text-[#765b5d]">
                    Create a folder to organize your tasks and projects.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFolderModal({ isOpen: true, folder: null })}
                    className="btn-primary-blue mt-5 gap-2 px-4 py-2.5 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first folder
                  </button>
                </div>
              ) : filteredFolders.length === 0 ? (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <div className="px-6 py-12 text-center">
                    <h2 className="font-serif-heading text-xl font-bold text-[var(--text-heading)]">
                      No folders found
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      No folders match “{searchQuery.trim()}”. Try a different search.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={folderView === 'grid' ? `folder-grid ${sidebarCollapsed ? 'folder-grid-collapsed' : 'mx-auto'}` : `folder-list ${sidebarCollapsed ? 'folder-list-collapsed' : 'mx-auto'}`}>
                  {sortedFolders.map((folder) => (
                    <article
                      key={folder.id}
                      className={`folder-card ${folderView === 'list' ? 'folder-card-list' : ''} ${
                        selectedFolderIds.includes(folder.id) ? 'folder-card-selected' : ''
                      }`}
                      style={{ color: folder.color_hex }}
                    >
                      {isFolderSelectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedFolderIds.includes(folder.id)}
                          onChange={() => {
                            setSelectedFolderIds((current) =>
                              current.includes(folder.id)
                                ? current.filter((id) => id !== folder.id)
                                : [...current, folder.id]
                            );
                          }}
                          className="folder-select-checkbox"
                          aria-label={`Select ${folder.name} folder`}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isFolderSelectionMode) {
                            setSelectedFolderIds((current) =>
                              current.includes(folder.id)
                                ? current.filter((id) => id !== folder.id)
                                : [...current, folder.id]
                            );
                            return;
                          }
                          setOpenFolderMenuId(null);
                          handleSelectFolder(folder.id);
                        }}
                        className={`folder-card-open ${folderView === 'list' ? 'folder-card-open-list' : ''}`}
                        aria-label={`Open ${folder.name} folder`}
                      >
                        <svg
                          className="folder-artwork"
                          viewBox="0 0 120 92"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 25c0-6 4-10 10-10h27l10 9h39c6 0 10 4 10 10v40c0 6-4 10-10 10H22c-6 0-10-4-10-10V25Z"
                            fill="color-mix(in srgb, currentColor 52%, var(--bg-canvas))"
                          />
                          <path
                            d="M10 31c0-5 4-9 9-9h82c6 0 10 4 10 10v42c0 6-4 10-10 10H19c-6 0-10-4-10-10V31Z"
                            fill="color-mix(in srgb, currentColor 30%, var(--bg-canvas))"
                            stroke="color-mix(in srgb, currentColor 58%, var(--text-muted))"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M14 34c0-4 3-7 7-7h78c5 0 8 3 8 8v36c0 5-3 8-8 8H22c-5 0-8-3-8-8V34Z"
                            fill="color-mix(in srgb, currentColor 16%, var(--bg-card))"
                            opacity=".42"
                          />
                        </svg>
                        <span className="folder-card-labels">
                          <span className="folder-card-name">{folder.name}</span>
                          {folder.parent_id && (
                            <span className="folder-card-parent">
                              Inside {folders.find((item) => item.id === folder.parent_id)?.name || 'folder'}
                            </span>
                          )}
                        </span>
                      </button>

                      {!isFolderSelectionMode && (
                        <div className="folder-menu-wrap">
                        <button
                          type="button"
                          className="folder-menu-trigger"
                          aria-label={`Options for ${folder.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openFolderMenuId === folder.id}
                          onClick={() => setOpenFolderMenuId(
                            openFolderMenuId === folder.id ? null : folder.id
                          )}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openFolderMenuId === folder.id && (
                          <div className="folder-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenFolderMenuId(null);
                                setFolderModal({ isOpen: true, folder });
                              }}
                            >
                              Edit folder
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className={folder.is_owner === 1 ? 'folder-menu-delete' : ''}
                              onClick={() => {
                                setOpenFolderMenuId(null);
                                const isOwner = folder.is_owner === 1;
                                setConfirmation({
                                  title: isOwner ? `Archive "${folder.name}"?` : `Leave "${folder.name}"?`,
                                  description: isOwner
                                    ? 'This will archive the folder and all of its tasks. They can be restored from history for 7 days.'
                                    : 'You will lose access to this shared folder and its tasks.',
                                  confirmLabel: isOwner ? 'Archive folder' : 'Leave folder',
                                  onConfirm: () => handleDeleteFolder(folder.id),
                                });
                              }}
                            >
                              {folder.is_owner === 1 ? 'Archive folder' : 'Leave folder'}
                            </button>
                          </div>
                        )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {showFolderTasks && activeFolder && !isFolderTaskDetail && (
            <section
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              aria-label={`${activeFolder.name} tasks`}
            >
              <div
                className="mb-6 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-7"
                style={{ borderTop: `4px solid ${activeFolder.color_hex}` }}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFolderId('all');
                          setSelectedTaskId(null);
                          setSelectedFolderTaskIds([]);
                          setFolderTaskFilter('active');
                          void loadTasks('all');
                        }}
                        aria-label="Back to all folders"
                        title="Back to all folders"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card-subtle)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-card)] hover:text-[var(--text-heading)]"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: activeFolder.color_hex }}
                        />
                        Folder workspace
                      </div>
                    </div>
                    <h2 className="font-sans text-2xl font-bold text-[var(--text-heading)]">
                      {activeFolder.name}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setFolderTaskFilter('all')}
                      aria-pressed={folderTaskFilter === 'all'}
                      className={`rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        folderTaskFilter === 'all'
                          ? 'bg-[var(--color-primary-light)]'
                          : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--color-primary-light)]'
                      }`}
                    >
                      <div className="text-xl font-bold text-[var(--text-heading)]">{tasks.length}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Total tasks
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderTaskFilter('active')}
                      aria-pressed={folderTaskFilter === 'active'}
                      className={`rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        folderTaskFilter === 'active'
                          ? 'bg-[var(--color-primary-light)]'
                          : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--color-primary-light)]'
                      }`}
                    >
                      <div className="text-xl font-bold text-[var(--text-heading)]">
                        {tasks.filter((task) => task.is_completed === 0 && !isTaskOverdue(task)).length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        In progress
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderTaskFilter('completed')}
                      aria-pressed={folderTaskFilter === 'completed'}
                      className={`rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        folderTaskFilter === 'completed'
                          ? 'bg-[var(--color-primary-light)]'
                          : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--color-primary-light)]'
                      }`}
                    >
                      <div className="text-xl font-bold text-[var(--text-heading)]">
                        {tasks.filter((task) => task.is_completed === 1).length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Completed
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFolderTaskFilter('overdue')}
                      aria-pressed={folderTaskFilter === 'overdue'}
                      className={`rounded-xl px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        folderTaskFilter === 'overdue'
                          ? 'bg-[var(--color-primary-light)]'
                          : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--color-primary-light)]'
                      }`}
                    >
                      <div className="text-xl font-bold text-[var(--text-heading)]">
                        {tasks.filter((task) => isTaskOverdue(task)).length}
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Overdue
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {tasks.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                      Sort by
                      <SortDropdown
                        value={folderTaskSort}
                        onChange={(nextSort) => setFolderTaskSort(nextSort as typeof folderTaskSort)}
                        ariaLabel="Sort folder tasks"
                        options={[
                          { value: 'name-asc', label: 'Name (A–Z)' },
                          { value: 'date-desc', label: 'Date created (newest)' },
                          { value: 'date-asc', label: 'Date created (oldest)' },
                        ]}
                      />
                    </label>
                    <div
                      className="inline-flex rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] p-1"
                      role="group"
                      aria-label="Task view"
                    >
                      <button
                        type="button"
                        onClick={() => setFolderTaskView('grid')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          folderTaskView === 'grid'
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                        }`}
                        aria-pressed={folderTaskView === 'grid'}
                        aria-label="Grid view"
                        title="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span>Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFolderTaskView('list')}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          folderTaskView === 'list'
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                        }`}
                        aria-pressed={folderTaskView === 'list'}
                        aria-label="List view"
                        title="List view"
                      >
                        <List className="h-4 w-4" />
                        <span>List</span>
                      </button>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-3">
                    {!isFolderTaskSelectionMode ? (
                      <button
                        type="button"
                        onClick={() => setIsFolderTaskSelectionMode(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Select
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFolderTaskIds((current) => {
                              if (allVisibleFolderTasksSelected) {
                                return current.filter((id) => !sortedFolderTasks.some((task) => task.id === id));
                              }
                              return Array.from(new Set([...current, ...sortedFolderTasks.map((task) => task.id)]));
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                          aria-pressed={allVisibleFolderTasksSelected}
                        >
                          {allVisibleFolderTasksSelected
                            ? <Check className="h-4 w-4" />
                            : <CheckCircle2 className="h-4 w-4" />}
                          {allVisibleFolderTasksSelected ? 'Deselect all' : 'Select all'}
                        </button>
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {selectedFolderTaskIds.length} selected
                        </span>
                        {selectedFolderTaskIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setConfirmation({
                              title: 'Archive selected tasks?',
                              description: `${selectedFolderTaskIds.length} selected task(s) and their attachments will be moved to history and can be restored for 7 days.`,
                              confirmLabel: 'Archive tasks',
                              onConfirm: () => handleBulkDeleteTasks([...selectedFolderTaskIds]),
                            })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete selected
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsFolderTaskSelectionMode(false);
                            setSelectedFolderTaskIds([]);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                        >
                          Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-14 text-center">
                  <div
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${activeFolder.color_hex}20`,
                      color: activeFolder.color_hex,
                    }}
                  >
                    <ListChecks className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif-heading text-lg font-bold text-[var(--text-heading)]">
                    No tasks in this folder yet
                  </h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--text-muted)]">
                    Create a task to start organizing work in {activeFolder.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(true)}
                    className="btn-primary-blue mt-5 gap-2 px-4 py-2.5 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Create task
                  </button>
                </div>
              ) : filteredFolderTasks.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                  {searchQuery.trim()
                    ? `No tasks match “${searchQuery.trim()}”.`
                    : folderTaskFilter === 'completed'
                    ? 'No completed tasks in this folder.'
                    : folderTaskFilter === 'active'
                    ? 'No in-progress tasks in this folder. Overdue tasks are listed separately.'
                    : folderTaskFilter === 'overdue'
                    ? 'No overdue tasks in this folder.'
                    : 'No tasks in this folder.'}
                </div>
              ) : (
                <div className={folderTaskView === 'grid' ? 'folder-task-grid' : 'folder-task-list'}>
                  {sortedFolderTasks.map((task) => {
                    const isCompleted = task.is_completed === 1;
                    const dueDate = task.due_date ? new Date(task.due_date) : null;
                    const isOverdue = Boolean(
                      dueDate && !Number.isNaN(dueDate.getTime()) &&
                      dueDate.getTime() < Date.now() && !isCompleted
                    );

                    return (
                      <article
                        key={task.id}
                        className={`folder-task-card flex min-h-52 flex-col rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                          folderTaskView === 'list' ? 'folder-task-card-list' : ''
                        } ${
                          selectedFolderTaskIds.includes(task.id) ? 'folder-task-card-selected' : ''
                        } ${!isFolderTaskSelectionMode ? 'cursor-pointer' : ''}`}
                        style={{ borderLeft: `3px solid ${activeFolder.color_hex}` }}
                        onClick={(event) => {
                          const target = event.target;
                          if (target instanceof Element && target.closest('button, input')) return;
                          if (isFolderTaskSelectionMode) {
                            setSelectedFolderTaskIds((current) =>
                              current.includes(task.id)
                                ? current.filter((id) => id !== task.id)
                                : [...current, task.id]
                            );
                          } else {
                            setSelectedTaskId(task.id);
                          }
                        }}
                      >
                        <div className="folder-task-card-content">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isOverdue
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                              {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'In progress'}
                            </span>

                            {isFolderTaskSelectionMode ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedFolderTaskIds((current) =>
                                    current.includes(task.id)
                                      ? current.filter((id) => id !== task.id)
                                      : [...current, task.id]
                                  );
                                }}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                                  selectedFolderTaskIds.includes(task.id)
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                    : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'
                                }`}
                                aria-label={
                                  selectedFolderTaskIds.includes(task.id)
                                    ? `Deselect task ${task.title}`
                                    : `Select task ${task.title}`
                                }
                                title={
                                  selectedFolderTaskIds.includes(task.id)
                                    ? 'Deselect task'
                                    : 'Select task'
                                }
                              >
                                {selectedFolderTaskIds.includes(task.id) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <span className="h-3.5 w-3.5 rounded-[4px] border border-current" />
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setConfirmation({
                                    title: 'Archive this task?',
                                    description: `"${task.title}" and any attached files will be moved to history and can be restored for 7 days.`,
                                    confirmLabel: 'Archive task',
                                    onConfirm: async () => {
                                      await handleDeleteTask(task.id);
                                    },
                                  });
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete task ${task.title}`}
                                title="Delete task"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isFolderTaskSelectionMode) {
                                setSelectedFolderTaskIds((current) =>
                                  current.includes(task.id)
                                    ? current.filter((id) => id !== task.id)
                                    : [...current, task.id]
                                );
                              } else {
                                setSelectedTaskId(task.id);
                              }
                            }}
                            className="text-left font-sans text-lg font-bold leading-snug text-[var(--text-heading)] hover:text-[var(--color-primary)]"
                          >
                            {task.title}
                          </button>
                          <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-[var(--text-muted)]">
                            {task.description || 'No description added.'}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
                          <div
                            className={`flex min-w-0 items-center gap-1.5 text-[11px] ${isOverdue ? 'text-red-600 font-medium' : 'text-[var(--text-muted)]'}`}
                            title={dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toLocaleString() : 'No deadline'}
                          >
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {dueDate && !Number.isNaN(dueDate.getTime())
                                ? formatDateByConfig(dueDate, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'No deadline'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task)}
                            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                              isCompleted
                                ? 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                                : 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white'
                            }`}
                          >
                            {isCompleted ? 'Reopen task' : 'Mark complete'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeNav === 'history' && (
            <section className="flex-1 overflow-y-auto p-4 sm:p-6" aria-label="History">
              <div className="w-full space-y-5">
                {searchQuery.trim() && filteredCompletedTaskHistory.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-12 text-center">
                    <h2 className="font-serif-heading text-xl font-bold text-[var(--text-heading)]">
                      No tasks found
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      No tasks match “{searchQuery.trim()}”. Try a different search.
                    </p>
                  </div>
                ) : completedTaskHistory.length === 0 && deletedHistory.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                    Completed and archived tasks will appear here.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Completed task
                        </h3>
                      </div>
                      {filteredCompletedTaskHistory.map((task) => (
                        <article
                          key={task.id}
                          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5"
                        >
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-[var(--text-heading)]">
                              {task.title}
                            </h3>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {task.folder_name || 'TASK'} ·{' '}
                              {task.completed_at
                                ? new Date(task.completed_at).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : 'Completion date unavailable'}
                            </p>
                            {typeof task.time_logged_seconds === 'number' && task.time_logged_seconds > 0 && (
                              <p className="mt-1 text-[10px] font-medium text-[var(--color-primary)]">
                                Duration: {formatTimer(task.time_logged_seconds)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              DONE
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleRestoreTask(task)}
                              className="rounded-lg border border-[var(--border-light)] px-3 py-1.5 text-xs font-semibold text-[var(--text-body)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                              aria-label={`Restore task ${task.title}`}
                            >
                              Restore
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    {deletedHistory.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Deleted items
                          </h3>
                        </div>
                        {deletedHistory.map((item) => (
                          <article
                            key={`${item.type}-${item.id}`}
                            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5"
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-xl border border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                                style={{ backgroundColor: item.type === 'folder' ? item.color_hex || '#3E4B8E' : '#7C8DB5' }}
                              >
                                {item.type === 'folder' ? 'F' : 'T'}
                              </div>
                              <div>
                                <h4 className="truncate text-sm font-bold text-[var(--text-heading)]">
                                  {item.title}
                                </h4>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                  {item.type === 'folder' ? 'Folder' : 'Task'} ·{' '}
                                  {item.deleted_at ? new Date(item.deleted_at).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  }) : 'Deleted recently'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleRestoreDeletedItem(item)}
                                className="rounded-lg border border-[var(--border-light)] px-3 py-1.5 text-xs font-semibold text-[var(--text-body)] transition-colors hover:bg-[var(--bg-card-subtle)]"
                                aria-label={`Restore ${item.type} ${item.title}`}
                              >
                                Restore
                              </button>
                              <button
                                type="button"
                                onClick={() => void handlePermanentlyDeleteArchivedItem(item)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                                aria-label={`Delete ${item.type} ${item.title} permanently`}
                              >
                                Delete permanently
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Mutual Tasks Empty State */}
          {!showFolderGallery && !showFolderTasks && activeNav === 'mutual' && tasks.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-serif-heading text-xl font-bold text-[var(--text-heading)] mb-2">
                  No Mutual Tasks Yet
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  Mutual tasks appear when you share folders with collaborators. Add a collaborator to a folder to start working together.
                </p>
                <button
                  onClick={() => setFolderModal({ isOpen: true, folder: null })}
                  className="btn-primary-blue text-xs py-2 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Shared Folder</span>
                </button>
              </div>
            </div>
          )}

          {/* 2-Column Split: Task Detail (Center) & Task Queue (Right) */}
          <div className="dashboard-task-layout-wrapper" hidden={!shouldShowTaskLayout}>
            <div
              className={isFolderTaskDetail
                ? `modal-overlay folder-task-detail-overlay ${isFolderTaskClosing ? 'folder-task-detail-closing' : ''}`
                : `dashboard-task-layout ${isQueueCollapsed ? 'queue-collapsed' : ''} flex-1 overflow-y-auto ${appConfig.compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} grid grid-cols-1 gap-${appConfig.compactView ? '4' : '6'}`}
              onClick={isFolderTaskDetail ? (event) => {
                if (event.target === event.currentTarget) closeFolderTaskDetail();
              } : undefined}
              onAnimationEnd={isFolderTaskDetail ? (event) => {
                if (event.target === event.currentTarget && isFolderTaskClosing) {
                  setSelectedTaskId(null);
                  setIsFolderTaskClosing(false);
                }
              } : undefined}
            >
              {/* Center Column: Selected Task Details */}
              <div
                className={`min-w-0 flex flex-col space-y-4 ${isFolderTaskDetail ? 'folder-task-detail-modal-content' : ''}`}
                role={isFolderTaskDetail ? 'dialog' : undefined}
                aria-modal={isFolderTaskDetail ? true : undefined}
                aria-label={isFolderTaskDetail && activeTask ? `${activeTask.title} task details` : undefined}
              >
                {isFolderTaskDetail && (
                  <button
                    type="button"
                    onClick={closeFolderTaskDetail}
                    aria-label="Close task details"
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-sm transition-colors hover:bg-[var(--bg-card-subtle)] hover:text-[var(--text-heading)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {activeTask ? (
                  <>
                  <div className="overflow-hidden rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] shadow-sm">
                    <section className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-active)] px-5 py-5 text-white sm:px-7 sm:py-7">
                      {editingTaskTitle ? (
                        <div className="mx-auto max-w-full text-center">
                          <input
                            autoFocus
                            type="text"
                            value={taskTitleDraft}
                            onChange={(event) => setTaskTitleDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') void saveTaskTitle();
                              if (event.key === 'Escape') setEditingTaskTitle(false);
                            }}
                            aria-label="Task title"
                            className="w-full rounded-lg border border-white/30 bg-white/10 px-2 py-1 text-center font-sans text-xl font-extrabold normal-case leading-tight text-white outline-none focus:border-white sm:text-3xl"
                          />
                          <div className="mt-2 flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTaskTitle(false)}
                              className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/75 hover:bg-white/10 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveTaskTitle()}
                              disabled={savingInlineTaskField !== null}
                              className="rounded-md bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white hover:bg-white/25 disabled:opacity-60"
                            >
                              {savingInlineTaskField === 'title' ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h2 className="text-center font-sans text-xl font-extrabold normal-case leading-tight text-white sm:text-3xl">
                          <button
                            type="button"
                            onClick={() => startEditingTaskTitle(activeTask)}
                            className="rounded-md px-1 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            aria-label={`Edit task title: ${activeTask.title}`}
                            title="Click to edit title"
                          >
                            {activeTask.title}
                          </button>
                        </h2>
                      )}

                      <div className="mb-5 mt-1 flex justify-center text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                        {editingTaskDeadline ? (
                          <div className="flex flex-col items-center gap-2">
                            <label htmlFor="task-deadline" className="text-white/75">Deadline Date & Time</label>
                            <input
                              autoFocus
                              id="task-deadline"
                              type="datetime-local"
                              value={taskDeadlineDraft}
                              onChange={(event) => setTaskDeadlineDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') void saveTaskDeadline();
                                if (event.key === 'Escape') setEditingTaskDeadline(false);
                              }}
                              className="rounded-md border border-white/30 bg-white/10 px-2 py-1 text-center text-xs font-semibold tracking-normal text-white outline-none [color-scheme:dark] focus:border-white"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                              <span className="text-[9px] text-white/60 font-semibold uppercase tracking-wider">Quick:</span>
                              <button
                                type="button"
                                onClick={() => applyInlineDeadlinePreset(0, 23, 59)}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90 hover:bg-white/20 transition-colors"
                              >
                                Tonight 11:59 PM
                              </button>
                              <button
                                type="button"
                                onClick={() => applyInlineDeadlinePreset(1, 17, 0)}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90 hover:bg-white/20 transition-colors"
                              >
                                Tomorrow 5:00 PM
                              </button>
                              <button
                                type="button"
                                onClick={() => applyInlineDeadlinePreset(3, 23, 59)}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90 hover:bg-white/20 transition-colors"
                              >
                                In 3 Days
                              </button>
                              <button
                                type="button"
                                onClick={() => applyInlineDeadlinePreset(7, 17, 0)}
                                className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/90 hover:bg-white/20 transition-colors"
                              >
                                Next Week
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingTaskDeadline(false)}
                                className="rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide text-white/75 hover:bg-white/10 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => void saveTaskDeadline()}
                                disabled={savingInlineTaskField !== null}
                                className="rounded-md bg-white/15 px-2 py-1 text-[10px] font-semibold tracking-wide text-white hover:bg-white/25 disabled:opacity-60"
                              >
                                {savingInlineTaskField === 'deadline' ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingTaskDeadline(activeTask)}
                            className="rounded-md px-2 py-1 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            aria-label="Edit deadline"
                            title="Click to edit deadline"
                          >
                            Deadline · {activeTask.due_date
                              ? formatDateByConfig(activeTask.due_date, {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No deadline'}
                          </button>
                        )}
                      </div>

                        <div className="mt-5 flex justify-end">
                          <div className="w-full max-w-[100%] rounded-xl border border-white/15 bg-white/5 p-2.5 shadow-inner shadow-black/10 backdrop-blur-[1px]">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                                Folder
                              </span>
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/80">
                                {activeTask.folder_id ? 'Assigned' : 'Unassigned'}
                              </span>
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsFolderMenuOpen((open) => !open)}
                                className="flex w-full items-center justify-between rounded-[12px] border border-white/10 bg-white/10 px-2.5 py-2 text-left text-[11px] font-medium text-white outline-none transition focus:border-white/30"
                                aria-label="Change folder assignment"
                              >
                                <span className="truncate">
                                  {folders.find((folder) => folder.id === activeTask.folder_id)?.name || 'Not in any folder'}
                                </span>
                                <svg viewBox="0 0 20 20" fill="currentColor" className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-white/80">
                                  <path d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" />
                                </svg>
                              </button>

                              {isFolderMenuOpen && (
                                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[18px] border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFolderModal({ isOpen: true, folder: null, taskId: activeTask.id });
                                      setIsFolderMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[11px] font-medium text-slate-800 transition hover:bg-slate-100"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Create new folder</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!activeTask.folder_id) return setIsFolderMenuOpen(false);
                                      try {
                                        await handleUpdateTask({ id: activeTask.id, folder_id: null });
                                      } catch (error) {
                                        addToast('error', error instanceof Error ? error.message : 'Could not move task to folder.');
                                      } finally {
                                        setIsFolderMenuOpen(false);
                                      }
                                    }}
                                    className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[11px] font-medium text-slate-800 transition hover:bg-slate-100"
                                  >
                                    <span>Not in any folder</span>
                                  </button>
                                  {folders.map((folder) => (
                                    <button
                                      key={folder.id}
                                      type="button"
                                      onClick={async () => {
                                        if (folder.id === activeTask.folder_id) return setIsFolderMenuOpen(false);
                                        try {
                                          await handleUpdateTask({ id: activeTask.id, folder_id: folder.id });
                                        } catch (error) {
                                          addToast('error', error instanceof Error ? error.message : 'Could not move task to folder.');
                                        } finally {
                                          setIsFolderMenuOpen(false);
                                        }
                                      }}
                                      className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[11px] font-medium text-slate-800 transition hover:bg-slate-100"
                                    >
                                      <span>{folder.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-[var(--bg-card)] px-4 py-3.5 text-sm leading-relaxed text-[var(--text-body)] shadow-sm">
                        {editingDescriptionTaskId === activeTask.id ? (
                          <div>
                            <textarea
                              value={descriptionDraft}
                              onChange={(event) => setDescriptionDraft(event.target.value)}
                              rows={5}
                              placeholder="Add requirements, notes, or goals for this task..."
                              className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-card-subtle)] px-3 py-2 text-xs leading-relaxed text-[var(--text-heading)] outline-none transition focus:border-[var(--color-primary)]"
                            />
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDescriptionTaskId(null);
                                  setDescriptionDraft('');
                                }}
                                className="rounded-lg border border-[var(--border-light)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] transition hover:bg-[var(--bg-card-subtle)]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveDescription}
                                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:opacity-90"
                              >
                                Save description
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="whitespace-pre-wrap">
                              {activeTask.description || 'Add a description to share the task requirements with your team.'}
                            </p>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => startEditingDescription(activeTask)}
                                className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)] transition hover:opacity-80"
                              >
                                Edit description
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    <div className="space-y-5 p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-card-subtle)] px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleToggleSessionTimer}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                            title={isTimerRunning ? 'Pause Time Logger' : 'Start Time Logger'}
                          >
                            {isTimerRunning ? (
                              <Pause className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                            )}
                          </button>
                          <span className="text-xs font-semibold text-[var(--text-body)]">Time logged</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[var(--text-heading)]">
                            {formatTimer(timerSeconds)}
                          </span>
                          <button
                            type="button"
                            onClick={handleResetSessionTimer}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            title="Restart time log"
                            aria-label="Restart time log"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleFinishTask(activeTask)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] transition-colors hover:border-emerald-400 hover:text-emerald-600"
                            title="Finish task"
                            aria-label="Finish task"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          {finishedTaskMessage && (
                            <span className="text-[11px] font-medium text-emerald-600">
                              {finishedTaskMessage}
                            </span>
                          )}
                          {isFolderTaskDetail && (
                            <div className="flex items-center gap-2" aria-label="Task sections">
                              <button
                                type="button"
                                onClick={() => setFolderTaskPanel((panel) => panel === 'breakdown' ? null : 'breakdown')}
                                aria-label="Show task breakdown"
                                aria-pressed={folderTaskPanel === 'breakdown'}
                                title="Task breakdown"
                                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                                  folderTaskPanel === 'breakdown'
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                    : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                                }`}
                              >
                                <ListChecks className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFolderTaskPanel((panel) => panel === 'comments' ? null : 'comments')}
                                aria-label={`Show comments${taskComments.length > 0 ? ` (${taskComments.length})` : ''}`}
                                aria-pressed={folderTaskPanel === 'comments'}
                                title="Comments"
                                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                                  folderTaskPanel === 'comments'
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                    : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                                }`}
                              >
                                <MessageSquare className="h-4 w-4" />
                                {taskComments.length > 0 && (
                                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold text-white">
                                    {taskComments.length}
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isFolderTaskDetail ? (
                        <>
                          {folderTaskPanel === 'breakdown' && (
                            <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5">
                              {taskBreakdown}
                            </section>
                          )}
                          {folderTaskPanel === 'comments' && taskCommentsSection}
                        </>
                      ) : taskBreakdown}
                    </div>
                  </div>

                  {!isFolderTaskDetail && (
                  <div className="space-y-4">
                  <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-heading)]">
                        Task files
                        {taskAttachments.length > 0 && (
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {taskAttachments.length}
                          </span>
                        )}
                      </h3>
                      <button
                        type="button"
                        onClick={() => inlineAttachmentInputRef.current?.click()}
                        disabled={uploadingTaskAttachment}
                        className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
                      >
                        {uploadingTaskAttachment ? 'Uploading...' : 'Upload file'}
                      </button>
                    </div>
                    <input
                      ref={inlineAttachmentInputRef}
                      type="file"
                      multiple
                      onChange={(event) => void handleTaskAttachmentUpload(event, activeTask.id)}
                      className="hidden"
                    />
                    {attachmentError && (
                      <p role="alert" className="mb-2 text-xs text-red-600">{attachmentError}</p>
                    )}
                    {loadingTaskAttachments ? (
                      <p className="py-2 text-xs text-[var(--text-muted)]">Loading files...</p>
                    ) : taskAttachments.length === 0 ? (
                      <p className="py-2 text-xs text-[var(--text-muted)]">No files uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {taskAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] px-3 py-2"
                          >
                            <FileText className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
                            <a
                              href={`/api/tasks/${activeTask.id}/attachments/${attachment.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-w-0 flex-1 truncate text-xs text-[var(--text-heading)] hover:underline"
                              title={`Open ${attachment.file_name}`}
                            >
                              {attachment.file_name}
                            </a>
                            <a
                              href={`/api/tasks/${activeTask.id}/attachments/${attachment.id}?download=1`}
                              className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--text-heading)]"
                              title={`Download ${attachment.file_name}`}
                              aria-label={`Download ${attachment.file_name}`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => void handleDeleteAttachment(attachment.id, activeTask.id)}
                              className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-red-600"
                              title={`Remove ${attachment.file_name}`}
                              aria-label={`Remove ${attachment.file_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                  <section className="rounded-2xl border border-[var(--border-light)] bg-[var(--bg-card)] p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[var(--text-heading)]">
                        Comments
                        <span className="ml-2 text-xs font-semibold text-[var(--text-muted)]">
                          {taskComments.length}
                        </span>
                      </h3>
                    </div>

                    {commentsLoading ? (
                      <div className="py-3 text-center text-xs text-[var(--text-muted)]">Loading comments...</div>
                    ) : commentsError ? (
                      <p role="alert" className="mb-3 text-xs text-red-600">{commentsError}</p>
                    ) : taskComments.length > 0 ? (
                      <div className="mb-3 flex items-start gap-2.5">
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: taskComments[taskComments.length - 1].author_avatar_color || 'var(--color-primary)' }}
                        >
                          {taskComments[taskComments.length - 1].author_username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-xs font-semibold text-[var(--text-body)]">
                            {taskComments[taskComments.length - 1].author_username}
                          </div>
                          <p className="rounded-xl bg-[var(--bg-card-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-body)]">
                            {taskComments[taskComments.length - 1].content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-3 text-xs text-[var(--text-muted)]">No comments yet. Start the conversation.</p>
                    )}

                    <form onSubmit={handlePostTaskComment} className="flex items-center gap-2.5">
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: user.avatar_color || 'var(--color-primary)' }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <input
                        type="text"
                        value={newTaskComment}
                        onChange={(event) => setNewTaskComment(event.target.value)}
                        placeholder="Write a comment..."
                        aria-label="Write a comment"
                        className="input-field min-w-0 flex-1 text-xs"
                        disabled={submittingTaskComment}
                      />
                      <button
                        type="submit"
                        aria-label="Post comment"
                        title="Post comment"
                        disabled={!newTaskComment.trim() || submittingTaskComment}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submittingTaskComment ? <div className="spinner" /> : <Send className="h-3.5 w-3.5" />}
                      </button>
                    </form>

                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setDrawerTask(activeTask)}
                        className="text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
                      >
                        See all
                      </button>
                    </div>
                  </section>
                  </div>
                  )}
                  </>
                ) : (
                  <div className="bg-[var(--bg-card)] rounded-2xl p-12 text-center border border-[var(--border-light)] shadow-sm">
                    <h3 className="font-serif-heading text-xl font-bold text-[var(--text-heading)] mb-2">
                      {searchQuery.trim() && filteredTasks.length === 0
                        ? 'No tasks found'
                        : 'No task selected'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4">
                      {searchQuery.trim() && filteredTasks.length === 0
                        ? `No tasks match “${searchQuery.trim()}”. Try a different search.`
                      : 'Select a task from the queue to view its details, or create a new task.'}
                    </p>
                    {!(searchQuery.trim() && filteredTasks.length === 0) && (
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="btn-primary-blue text-xs py-2 px-4"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Assignment</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Task Queue */}
              <div className={`min-w-0 flex flex-col space-y-${appConfig.compactView ? '4' : '6'} ${isFolderTaskDetail ? 'hidden' : ''}`}>

                {/* Task Queue Header */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <h2 className="whitespace-nowrap font-sans text-sm font-extrabold tracking-tight text-[var(--text-heading)]">
                        {isFolderTaskDetail ? 'Folder Tasks' : 'Task Queue'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const nextCollapsed = !isQueueCollapsed;
                          setQueueTransitionDirection(nextCollapsed ? 'collapse' : 'expand');
                          setIsQueueCollapsed(nextCollapsed);
                        }}
                        aria-label={isQueueCollapsed ? 'Expand task queue' : 'Collapse task queue'}
                        aria-expanded={!isQueueCollapsed}
                        aria-controls="task-queue-items"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-sm transition-colors hover:text-[var(--text-heading)]"
                        title={isQueueCollapsed ? 'Expand task queue' : 'Collapse task queue'}
                      >
                        {isQueueCollapsed
                          ? <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                      </button>

                      {isQueueCollapsed ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('all');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Show all active tasks"
                            aria-pressed={queueView === 'all' && !showOverdueTasks}
                            title="All tasks"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              queueView === 'all' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('deadline');
                              setQueueSort('deadline');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Set queue to deadline order"
                            aria-pressed={queueView === 'deadline' && !showOverdueTasks}
                            title="Deadline view"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              queueView === 'deadline' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('priority');
                              setQueueSort('priority');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Set queue to priority order"
                            aria-pressed={queueView === 'priority' && !showOverdueTasks}
                            title="Priority view"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              queueView === 'priority' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOverdueTasks((current) => !current)}
                            aria-label="Toggle overdue task filter"
                            aria-pressed={showOverdueTasks}
                            title="Overdue tasks"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                              showOverdueTasks
                                ? 'border-red-200 bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-red-200 hover:text-red-600'
                            }`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('all');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Show all active tasks"
                            aria-pressed={queueView === 'all' && !showOverdueTasks}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors ${
                              queueView === 'all' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            All
                          </button>
                          {queueView === 'all' && !showOverdueTasks && (
                            <div className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)] px-1.5 text-[9px] font-semibold text-[var(--text-muted)]">
                              <span className="whitespace-nowrap">Sort</span>
                              <SortDropdown
                                value={queueSort === 'name' || queueSort === 'date-asc' || queueSort === 'date-desc' ? queueSort : 'date-asc'}
                                onChange={(nextSort) => setQueueSort(nextSort as 'name' | 'date-asc' | 'date-desc')}
                                ariaLabel="Sort task queue"
                                compact
                                options={[
                                  { value: 'name', label: 'Name' },
                                  { value: 'date-asc', label: 'Oldest' },
                                  { value: 'date-desc', label: 'Newest' },
                                ]}
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('deadline');
                              setQueueSort('deadline');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Set queue to deadline order"
                            aria-pressed={queueView === 'deadline' && !showOverdueTasks}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors ${
                              queueView === 'deadline' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            Deadline
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQueueView('priority');
                              setQueueSort('priority');
                              setShowOverdueTasks(false);
                            }}
                            aria-label="Set queue to priority order"
                            aria-pressed={queueView === 'priority' && !showOverdueTasks}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[10px] font-semibold transition-colors ${
                              queueView === 'priority' && !showOverdueTasks
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                            }`}
                          >
                            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                            Priority
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOverdueTasks((current) => !current)}
                            aria-label="Toggle overdue task filter"
                            aria-pressed={showOverdueTasks}
                            title="Overdue tasks filter"
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                              showOverdueTasks
                                ? 'border-red-200 bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100'
                                : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-red-200 hover:text-red-600'
                            }`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isQueueCollapsed && (
                    <div
                      className={`space-y-2 ${queueTransitionDirection === 'collapse' ? 'queue-summary-opening' : ''}`}
                      aria-label="Available tasks"
                      onAnimationEnd={() => setQueueTransitionDirection(null)}
                    >
                      {queueTasks.length === 0 ? (
                        <p className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3 text-center text-xs text-[var(--text-muted)]">
                          No tasks
                        </p>
                      ) : (
                        queueTasks.map((task) => {
                          const isSelected = activeTask?.id === task.id;
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() =>
                                setSelectedTaskId((current) => current === task.id ? null : task.id)
                              }
                              title={task.title}
                              aria-pressed={isSelected}
                              className={`w-full rounded-xl border p-3 text-left text-xs font-semibold transition-colors ${
                                isSelected
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                                  : 'border-[var(--border-light)] bg-[var(--bg-card)] text-[var(--text-heading)] hover:border-[var(--color-primary)]'
                              }`}
                            >
                              <span className="block truncate">{task.title}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Timeline with vertical track & Connected Cards */}
                  <div
                    id="task-queue-items"
                    hidden={isQueueCollapsed}
                    className={`relative pl-9 space-y-3.5 ${queueTransitionDirection === 'expand' ? 'queue-timeline-opening' : ''}`}
                    onAnimationEnd={() => setQueueTransitionDirection(null)}
                  >
                    {/* Vertical connecting line */}
                    <div className="timeline-track" />

                    {queueTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-light)]">
                        {searchQuery.trim() && filteredTasks.length === 0
                          ? 'No tasks match this search.'
                          : 'No tasks left in the queue.'}
                      </div>
                    ) : (
                      queueTasks.map((task, idx) => {
                        const isSelected = activeTask?.id === task.id;
                        const taskDeadline = new Date(task.due_date);
                        const hasValidDeadline = !Number.isNaN(taskDeadline.getTime());
                        const isOverdue = hasValidDeadline && taskDeadline.getTime() < currentTime.getTime();
                        const isDueToday = hasValidDeadline &&
                          taskDeadline.getFullYear() === currentTime.getFullYear() &&
                          taskDeadline.getMonth() === currentTime.getMonth() &&
                          taskDeadline.getDate() === currentTime.getDate();
                        const deadlineTime = formatDeadlineTime(taskDeadline);
                        const deadlineLabel = !hasValidDeadline
                          ? 'No deadline'
                          : isOverdue
                            ? `Overdue · ${formatQueueDateByConfig(taskDeadline)}`
                            : isDueToday
                              ? `Due today at ${deadlineTime}`
                              : `Due ${formatQueueDateByConfig(taskDeadline)}`;
                        return (
                          <div key={task.id} className="relative group">
                            {/* Timeline Node Icon on the left line */}
                            <div className="absolute -left-9 top-6 z-10">
                              {isSelected ? (
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-sidebar)] text-white flex items-center justify-center shadow-md">
                                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                                </div>
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-[var(--border-light)] border-2 border-[var(--bg-canvas)] ml-2.5 mt-2" />
                              )}
                            </div>

                            {/* Task Card: Active card in solid accent, others in clean white */}
                            <div
                              onClick={() =>
                                setSelectedTaskId((current) => current === task.id ? null : task.id)
                              }
                              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-[var(--color-primary)] text-white shadow-lg'
                                  : 'bg-[var(--bg-card)] border border-[var(--border-light)] hover:border-[var(--color-primary)] text-[var(--text-heading)] shadow-sm'
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  {queueView === 'priority' && (
                                    <span
                                      className={`mb-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold ${getTaskPriorityPillClasses(getTaskPriorityLabel(task), isSelected)}`}
                                    >
                                      {getTaskPriorityLabel(task)}
                                    </span>
                                  )}

                                  <div
                                    className={`flex items-center gap-1 text-[11px] font-medium ${
                                      isSelected
                                        ? 'text-white/90'
                                        : isOverdue
                                          ? 'text-red-600'
                                          : isDueToday
                                            ? 'text-amber-600'
                                            : 'text-[var(--text-muted)]'
                                    }`}
                                    title={hasValidDeadline ? taskDeadline.toLocaleString() : 'No deadline set'}
                                  >
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    {deadlineLabel}
                                  </div>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-1.5">
                                  <span
                                    className={`relative mx-1 inline-flex ${
                                      isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                                    }`}
                                    aria-label={`${task.comment_count !== undefined ? task.comment_count : idx === 0 ? 3 : idx === 1 ? 7 : 5} comments`}
                                    title="Comments"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span className={`absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none ${
                                      isSelected
                                        ? 'bg-white text-[var(--color-primary)]'
                                        : 'bg-[var(--color-primary)] text-white'
                                    }`}>
                                      {task.comment_count !== undefined ? task.comment_count : idx === 0 ? 3 : idx === 1 ? 7 : 5}
                                    </span>
                                  </span>
                                  <span
                                    className={`relative mx-1 inline-flex ${
                                      isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'
                                    }`}
                                    aria-label={`${task.attachment_count ?? 0} attachments`}
                                    title="Attachments"
                                  >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    <span className={`absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold leading-none ${
                                      isSelected
                                        ? 'bg-white text-[var(--color-primary)]'
                                        : 'bg-[var(--color-primary)] text-white'
                                    }`}>
                                      {task.attachment_count ?? 0}
                                    </span>
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmation({
                                        title: `Archive "${task.title}"?`,
                                        description: 'This task will be archived and can be restored from history for 7 days.',
                                        confirmLabel: 'Archive task',
                                        onConfirm: () => handleDeleteTask(task.id),
                                      });
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      isSelected
                                        ? 'text-white/70 hover:text-white'
                                        : 'text-[var(--text-muted)] hover:text-red-500'
                                    }`}
                                    aria-label={`Delete "${task.title}"`}
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleComplete(task);
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      isSelected
                                        ? 'text-white/75 hover:text-white'
                                        : 'text-[var(--text-muted)] hover:text-emerald-600'
                                    }`}
                                    aria-label={`Mark "${task.title}" complete`}
                                    title="Mark complete"
                                  >
                                    <Circle className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <div
                                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: user.avatar_color || 'var(--color-primary)' }}
                                  aria-label={user.username}
                                  title={user.username}
                                >
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <h3
                                  className={`min-w-0 flex-1 break-words font-sans text-sm font-semibold leading-snug ${
                                    isSelected ? '!text-white' : 'text-[var(--text-heading)]'
                                  }`}
                                >
                                  {task.title}
                                </h3>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

              </div>
            </div>
        </div>
      </div>
      </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <TaskModal
          folders={folders.map((f) => ({ id: f.id, name: f.name, color_hex: f.color_hex }))}
          activeFolderId={activeFolderId}
          onClose={() => setIsTaskModalOpen(false)}
          onCreateTask={handleCreateTask}
          onCreateFolder={async (name) => {
            const res = await fetch('/api/folders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Failed to create folder.');
            }

            const createdFolder: FolderItem = {
              ...data.folder,
              is_owner: 1,
              is_shared: false,
              total_tasks: 0,
              pending_tasks: 0,
              collaborators: [],
            };
            setFolders((prev) => [...prev, createdFolder]);
            setActiveNav('folder');
            setActiveFolderId(createdFolder.id);
            setFolderTaskFilter('active');
            addToast('success', `Folder "${createdFolder.name}" created.`);
            return createdFolder;
          }}
        />
      )}

      {/* Task Details & Discussion Drawer */}
      {drawerTask && (
        <TaskDrawer
          task={drawerTask}
          folders={folders.map((f) => ({ id: f.id, name: f.name, color_hex: f.color_hex }))}
          onClose={() => {
            setDrawerTask(null);
            // Reload tasks to refresh any changes made in the drawer
            loadTasks(activeFolderId);
          }}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Folder Settings & Collaborators Modal */}
      {folderModal.isOpen && (
        <FolderModal
          folder={folderModal.folder}
          currentUserId={user.id}
          onClose={() => setFolderModal({ isOpen: false, folder: null, taskId: null })}
          onSave={handleSaveFolder}
          onRefreshFolders={() => {
            loadFolders();
            loadTasks(activeFolderId);
          }}
        />
      )}

      {confirmation && (
        <ConfirmDialog
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmation.onConfirm}
        />
      )}

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
