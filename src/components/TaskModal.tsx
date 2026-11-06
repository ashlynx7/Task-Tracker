'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Folder, 
  Check, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

interface FolderOption {
  id: string;
  name: string;
  color_hex: string;
}

interface TaskModalProps {
  folders: FolderOption[];
  activeFolderId: string;
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    due_date: string;
    folder_id: string | null;
  }) => Promise<void>;
  onCreateFolder: (name: string) => Promise<FolderOption>;
}

export default function TaskModal({
  folders,
  activeFolderId,
  onClose,
  onCreateTask,
  onCreateFolder,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(
    activeFolderId !== 'all' && folders.some((f) => f.id === activeFolderId)
      ? activeFolderId
      : ''
  );

  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 180);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date & time.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim(),
        due_date: new Date(dueDate).toISOString(),
        folder_id: folderId,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required.');
      return;
    }

    setCreatingFolder(true);
    setError(null);
    try {
      const folder = await onCreateFolder(newFolderName.trim());
      setFolderId(folder.id);
      setNewFolderName('');
      setAddingFolder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <div
      className={`modal-overlay task-modal-overlay ${isClosing ? 'task-modal-closing' : ''}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="modal-content task-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="task-modal-section task-modal-header flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3E4B8E] text-white shadow-sm">
              <Check className="h-4 w-4" />
            </div>
            <h2 className="font-serif-heading text-lg font-bold text-[#172433]">
              Create New Task
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            className="p-1 rounded text-[#7A8796] hover:text-[#172433] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="task-modal-section space-y-4 p-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Real-time Multiplayer Cursors..."
              className="input-field text-sm font-semibold"
              autoFocus
              required
            />
          </div>

          {/* Folder & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-[#3E4B8E]" />
                Folder / Module <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFolderMenuOpen((open) => !open)}
                  className="input-field flex cursor-pointer items-center justify-between rounded-[14px] text-left text-xs"
                >
                  <span className="truncate text-[#172433]">
                    {folders.find((folder) => folder.id === folderId)?.name || 'No folder'}
                  </span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="ml-2 h-3.5 w-3.5 flex-shrink-0 text-[#7A8796]">
                    <path d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" />
                  </svg>
                </button>

                {isFolderMenuOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[18px] border border-[#E5E0D4] bg-white p-1.5 shadow-lg shadow-slate-900/10">
                    <button
                      type="button"
                      onClick={() => {
                        setFolderId('');
                        setIsFolderMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-xs font-medium text-[#172433] transition hover:bg-[#F5F2EA] ${!folderId ? 'bg-[#EFF4FF] text-[#3E4B8E]' : ''}`}
                    >
                      <span>No folder</span>
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => {
                          setFolderId(folder.id);
                          setIsFolderMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-xs font-medium text-[#172433] transition hover:bg-[#F5F2EA] ${folderId === folder.id ? 'bg-[#EFF4FF] text-[#3E4B8E]' : ''}`}
                      >
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setAddingFolder(true);
                        setError(null);
                        setIsFolderMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-xs font-medium text-[#172433] transition hover:bg-[#F5F2EA]"
                    >
                      <span className="text-base leading-none">+</span>
                      <span>Add new folder...</span>
                    </button>
                  </div>
                )}
              </div>
              {!folderId && (
                <p className="mt-1 text-[11px] text-[#7A8796]">
                  This task will not be placed in a folder.
                </p>
              )}
              {addingFolder && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleCreateFolder();
                      }
                    }}
                    placeholder="New folder name"
                    aria-label="New folder name"
                    className="input-field min-w-0 flex-1 text-xs"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateFolder()}
                    disabled={creatingFolder}
                    className="btn-primary-blue px-3 text-xs"
                  >
                    {creatingFolder ? <div className="spinner" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingFolder(false);
                      setNewFolderName('');
                      setError(null);
                    }}
                    className="btn-secondary px-3 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Due Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field text-xs cursor-pointer"
                required
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
          <div className="flex items-center gap-1.5 flex-wrap">
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#7A8796]" />
              Description & Requirements
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add requirements, rubrics, or study partner notes..."
              className="input-field text-xs leading-relaxed resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="-mt-2 flex items-center justify-end gap-2.5 pt-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isClosing}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-blue text-xs py-2 px-4 shadow-sm"
            >
              {submitting ? <div className="spinner" /> : <Check className="w-3.5 h-3.5" />}
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
