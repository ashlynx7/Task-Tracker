'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  AlertCircle, 
  MessageSquare, 
  Folder, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles, 
  Search
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  is_completed: number;
  folder_id: string;
  folder_name?: string;
  folder_color?: string;
  creator_username?: string;
  comment_count?: number;
  attachment_count?: number;
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onOpenTaskDrawer: (task: Task) => void;
  onOpenNewTaskModal: () => void;
  activeFolderName?: string;
}

export default function TaskList({
  tasks,
  onToggleComplete,
  onOpenTaskDrawer,
  onOpenNewTaskModal,
  activeFolderName = 'All Tasks',
}: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterText, setFilterText] = useState('');

  const now = new Date().getTime();

  // Filter tasks by search
  const filteredTasks = tasks.filter((t) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
  });

  const pendingTasks = filteredTasks.filter((t) => t.is_completed === 0);
  const completedTasks = filteredTasks.filter((t) => t.is_completed === 1);

  // Group pending into overdue and upcoming
  const overdueTasks = pendingTasks.filter((t) => new Date(t.due_date).getTime() < now);
  const upcomingTasks = pendingTasks.filter((t) => new Date(t.due_date).getTime() >= now);

  const formatDueDisplay = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const diffMs = d.getTime() - now;
      const isOverdue = diffMs < 0;
      const absDiff = Math.abs(diffMs);

      const hours = Math.floor(absDiff / (1000 * 3600));
      const days = Math.floor(hours / 24);

      const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (isOverdue) {
        if (hours < 1) return { text: `Overdue (< 1h ago · ${timeStr})`, isOverdue: true, isAmber: false };
        if (hours < 24) return { text: `Overdue by ${hours}h (${timeStr})`, isOverdue: true, isAmber: false };
        return { text: `Overdue by ${days}d (${dateStr} at ${timeStr})`, isOverdue: true, isAmber: false };
      }

      // Upcoming
      if (hours < 24) {
        return { text: `Due in ${hours}h (${timeStr})`, isOverdue: false, isAmber: true };
      }
      if (days === 1) {
        return { text: `Due tomorrow at ${timeStr}`, isOverdue: false, isAmber: false };
      }
      if (days < 7) {
        return { text: `Due in ${days} days (${dateStr} at ${timeStr})`, isOverdue: false, isAmber: false };
      }
      return { text: `Due ${dateStr} at ${timeStr}`, isOverdue: false, isAmber: false };
    } catch {
      return { text: 'Invalid date', isOverdue: false, isAmber: false };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search assignments or keywords..."
            className="input-field text-xs pl-10 pr-4 py-2 bg-[#131826]"
          />
        </div>

        <button
          onClick={onOpenNewTaskModal}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Main Task Feed */}
      {tasks.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-[#131826] border border-dashed border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-[#3E4B8E]/20 text-[#a2b0ee] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No coursework tasks in {activeFolderName}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
            Stay ahead of college deadlines by creating your syllabus assignments and deliverables.
          </p>
          <button
            onClick={onOpenNewTaskModal}
            className="btn btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Overdue Tasks (Restrained Red Warning Bar) */}
          {overdueTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Overdue Deadlines ({overdueTasks.length})</span>
              </div>

              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onOpenTaskDrawer={onOpenTaskDrawer}
                    formatDueDisplay={formatDueDisplay}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Chronological Upcoming Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8b9ce2]" />
                <span>Upcoming Coursework ({upcomingTasks.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium normal-case">
                Chronological order
              </span>
            </div>

            {upcomingTasks.length === 0 && overdueTasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-lg bg-[#131826] border border-[rgba(255,255,255,0.06)]">
                All upcoming tasks are complete.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onOpenTaskDrawer={onOpenTaskDrawer}
                    formatDueDisplay={formatDueDisplay}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Completed Section (Collapsible) */}
          {completedTasks.length > 0 && (
            <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Completed Tasks ({completedTasks.length})</span>
                </div>
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompleted && (
                <div className="space-y-2 mt-2">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={onToggleComplete}
                      onOpenTaskDrawer={onOpenTaskDrawer}
                      formatDueDisplay={formatDueDisplay}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onToggleComplete,
  onOpenTaskDrawer,
  formatDueDisplay,
}: {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onOpenTaskDrawer: (task: Task) => void;
  formatDueDisplay: (isoDate: string) => { text: string; isOverdue: boolean; isAmber: boolean };
}) {
  const isCompleted = task.is_completed === 1;
  const dueInfo = formatDueDisplay(task.due_date);

  return (
    <div
      onClick={() => onOpenTaskDrawer(task)}
      className={`p-3.5 rounded-lg flex items-center gap-3.5 cursor-pointer border transition-colors ${
        isCompleted
          ? 'bg-[#101421] border-[rgba(255,255,255,0.05)] opacity-60'
          : dueInfo.isOverdue
          ? 'bg-[#161a28] border-red-500/30 hover:border-red-500/50'
          : 'bg-[#131826] border-[rgba(255,255,255,0.07)] hover:border-[#3E4B8E]'
      }`}
    >
      {/* Checkbox Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className={`p-1 rounded transition-colors flex-shrink-0 ${
          isCompleted 
            ? 'text-emerald-400 hover:text-emerald-300' 
            : dueInfo.isOverdue
            ? 'text-red-400 hover:text-red-300'
            : 'text-slate-400 hover:text-[#8b9ce2]'
        }`}
        title={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-semibold transition-colors ${
              isCompleted 
                ? 'line-through text-slate-400' 
                : 'text-white'
            }`}
          >
            {task.title}
          </span>

          {/* Folder Tag */}
          {task.folder_name && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1"
              style={{
                backgroundColor: `${task.folder_color || '#3E4B8E'}25`,
                color: task.folder_color || '#a9b7ee',
              }}
            >
              <Folder className="w-2.5 h-2.5" />
              {task.folder_name}
            </span>
          )}
        </div>

        {/* Due Date & Meta */}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
          <span
            className={`flex items-center gap-1 font-medium ${
              dueInfo.isOverdue 
                ? 'text-red-400 font-semibold' 
                : dueInfo.isAmber 
                ? 'text-amber-400 font-semibold' 
                : 'text-slate-400'
            }`}
          >
            <Clock className="w-3 h-3" />
            {dueInfo.text}
          </span>

          {task.comment_count !== undefined && task.comment_count > 0 && (
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <MessageSquare className="w-3 h-3 text-[#8b9ce2]" />
              {task.comment_count}
            </span>
          )}

          {task.attachment_count !== undefined && task.attachment_count > 0 && (
            <span className="text-slate-400 font-medium" title={`${task.attachment_count} attachment(s)`}>
              {task.attachment_count}
            </span>
          )}

          {task.creator_username && (
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              by @{task.creator_username}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
