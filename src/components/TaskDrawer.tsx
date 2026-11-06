'use client';

import React, { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  X, 
  Send, 
  Trash2, 
  Calendar, 
  Folder, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Clock, 
  Save, 
  AlertCircle
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  is_completed: number;
  folder_id: string | null;
  folder_name?: string;
  folder_color?: string;
  creator_username?: string;
}

interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_username: string;
  author_avatar_color: string;
  is_author: number;
}

interface FolderOption {
  id: string;
  name: string;
  color_hex: string;
}

interface TaskDrawerProps {
  task: Task | null;
  folders: FolderOption[];
  onClose: () => void;
  onUpdateTask: (updatedTask: Partial<Task> & { id: string }) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export default function TaskDrawer({
  task,
  folders,
  onClose,
  onUpdateTask,
  onDeleteTask,
}: TaskDrawerProps) {
  if (!task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState('');
  const [folderId, setFolderId] = useState(task.folder_id || '');
  const [isCompleted, setIsCompleted] = useState(task.is_completed === 1);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [savingTask, setSavingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setFolderId(task.folder_id || '');
    setIsCompleted(task.is_completed === 1);

    if (task.due_date) {
      const d = new Date(task.due_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}T${hours}:${mins}`);
    }

    loadComments();
  }, [task.id]);

  const applyPreset = (daysOffset: number, hours: number, mins: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(hours, mins, 0, 0);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const h = String(target.getHours()).padStart(2, '0');
    const m = String(target.getMinutes()).padStart(2, '0');
    setDueDate(`${year}-${month}-${day}T${h}:${m}`);
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleSaveDetails = async () => {
    setSavingTask(true);
    setError(null);
    try {
      await onUpdateTask({
        id: task.id,
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
        folder_id: folderId,
        is_completed: isCompleted ? 1 : 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleComplete = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    await onUpdateTask({
      id: task.id,
      is_completed: nextState ? 1 : 0,
    });
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return 'just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white border-l border-[#E5E0D4] shadow-2xl z-[1100] flex flex-col animation-drawerSlide">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E0D4] flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleComplete}
              className={`p-1 rounded transition-colors ${
                isCompleted 
                  ? 'text-emerald-600 hover:text-emerald-700' 
                  : 'text-[#8E9BAC] hover:text-[#172433]'
              }`}
              title={isCompleted ? 'Mark pending' : 'Mark complete'}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 fill-emerald-100 text-emerald-600" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <span className="font-serif-heading text-base font-bold text-[#172433]">
              Task Discussion & Details
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded text-[#8E9BAC] hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#8E9BAC] hover:text-[#172433] hover:bg-black/5 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-sm font-semibold"
              placeholder="Task title..."
            />
          </div>

          {/* Folder & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-[#3E4B8E]" />
                Folder / Move task to
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="input-field cursor-pointer text-xs"
              >
                <option value="">Not in any folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {!folderId && (
                <p className="mt-1 text-[11px] text-[#7A8796]">
                  This task is not in any folder.
                </p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field text-xs cursor-pointer"
              />
              {dueDate && !Number.isNaN(new Date(dueDate).getTime()) && (
                <p className="mt-1 text-[11px] text-[#7A8796]">
                  Deadline:{' '}
                  <span className="font-semibold text-[#172433]">
                    {new Date(dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(dueDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Fast Due Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap -mt-2">
            <span className="text-[10px] text-[#8E9BAC] font-bold uppercase tracking-wider mr-1">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => applyPreset(0, 23, 59)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F2EA] hover:bg-[#ECE7DC] text-[#4F5D70] border border-[#DDD7C9] transition-colors"
            >
              Tonight 11:59 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(1, 17, 0)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F2EA] hover:bg-[#ECE7DC] text-[#4F5D70] border border-[#DDD7C9] transition-colors"
            >
              Tomorrow 5:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3, 23, 59)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F2EA] hover:bg-[#ECE7DC] text-[#4F5D70] border border-[#DDD7C9] transition-colors"
            >
              In 3 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7, 17, 0)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F2EA] hover:bg-[#ECE7DC] text-[#4F5D70] border border-[#DDD7C9] transition-colors"
            >
              Next Week
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field text-xs leading-relaxed resize-none"
              placeholder="Add requirements, rubrics, or study notes..."
            />
          </div>

          {/* Save Task Details Button */}
          <button
            onClick={handleSaveDetails}
            disabled={savingTask}
            className="btn-secondary text-xs w-full flex items-center justify-center gap-2 py-2"
          >
            {savingTask ? <div className="spinner" /> : <Save className="w-3.5 h-3.5" />}
            Save Task Changes
          </button>

          <hr className="border-[#E5E0D4]" />

          {/* Task Discussion Stream */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-serif-heading text-base font-bold text-[#172433] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#3E4B8E]" />
                Discussion Thread ({comments.length})
              </span>
            </div>

            {/* Comment Stream */}
            <div className="space-y-2.5 mb-4">
              {loadingComments ? (
                <div className="p-4 text-center text-xs text-[#7A8796]">
                  <div className="spinner mx-auto mb-2" />
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="p-5 text-center rounded-xl bg-[#F5F2EA] border border-[#E0DBD0] text-[#7A8796]">
                  <p className="text-xs font-medium">
                    No comments yet. Start a discussion with your group.
                  </p>
                </div>
              ) : (
                comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3.5 rounded-xl bg-[#F5F2EA] border border-[#E0DBD0] flex items-start gap-3 relative group"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: comm.author_avatar_color || '#3E4B8E' }}
                    >
                      {comm.author_username?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#172433]">
                          @{comm.author_username}
                        </span>
                        <span className="text-[10px] text-[#7A8796] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatRelativeTime(comm.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-[#3E4A5B] mt-1 whitespace-pre-wrap leading-relaxed">
                        {comm.content}
                      </p>
                    </div>

                    {comm.is_author === 1 && (
                      <button
                        onClick={() => handleDeleteComment(comm.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-[#8E9BAC] hover:text-red-600 transition-opacity text-xs"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2 items-center">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a message for collaborators..."
                className="input-field text-xs flex-1"
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn-primary-blue text-xs py-2 px-3.5 flex items-center gap-1.5 flex-shrink-0 shadow-sm"
              >
                {submittingComment ? <div className="spinner" /> : <Send className="w-3.5 h-3.5" />}
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Archive "${task.title}"?`}
          description="This task will be archived and can be restored from history for 7 days."
          confirmLabel="Archive task"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await onDeleteTask(task.id);
            onClose();
          }}
        />
      )}
    </>
  );
}
