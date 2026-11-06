'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  Users, 
  UserPlus, 
  Trash2, 
  Check, 
  Search, 
  ShieldCheck, 
  LogOut, 
  AlertCircle 
} from 'lucide-react';

interface Collaborator {
  id: string;
  username: string;
  email: string;
  avatar_color?: string;
  joined_at?: string;
}

interface FolderData {
  id: string;
  name: string;
  color_hex: string;
  owner_id: string;
  is_owner: number;
  collaborators?: Collaborator[];
}

interface FolderModalProps {
  folder: FolderData | null;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    color_hex: string;
  }) => Promise<void>;
  onRefreshFolders?: () => void;
}

const PRESET_COLORS = [
  '#3E4B8E',
  '#2563EB',
  '#0D9488',
  '#10B981',
  '#D97706',
  '#EA580C',
  '#E11D48',
  '#7C3AED',
  '#475569',
];

export default function FolderModal({
  folder,
  currentUserId,
  onClose,
  onSave,
  onRefreshFolders,
}: FolderModalProps) {
  const isEditing = !!folder;

  const [name, setName] = useState(folder ? folder.name : '');
  const [colorHex, setColorHex] = useState(folder ? folder.color_hex : '#3E4B8E');
  const [collaborators, setCollaborators] = useState<Collaborator[]>(folder?.collaborators || []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Collaborator[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, 180);
  };

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColorHex(folder.color_hex);
      setCollaborators(folder.collaborators || []);
    }
  }, [folder]);

  useEffect(() => {
    if (!isEditing || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const existingIds = new Set(collaborators.map((c) => c.id));
          const filtered = (data.users || []).filter((u: Collaborator) => !existingIds.has(u.id));
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isEditing, collaborators]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Course / Folder name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        id: folder?.id,
        name: name.trim(),
        color_hex: colorHex,
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollaborator = async (targetUsername: string) => {
    if (!folder) return;
    setAddingUsername(targetUsername);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/folders/${folder.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add collaborator');
      }

      setCollaborators(data.collaborators || []);
      setSearchQuery('');
      setSearchResults([]);
      setSuccessMsg(`@${targetUsername} added to this folder.`);
      if (onRefreshFolders) onRefreshFolders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingUsername(null);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!folder) return;
    try {
      const res = await fetch(`/api/folders/${folder.id}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (userId === currentUserId) {
          if (onRefreshFolders) onRefreshFolders();
          handleClose();
        } else {
          setCollaborators((prev) => prev.filter((c) => c.id !== userId));
          if (onRefreshFolders) onRefreshFolders();
        }
      }
    } catch (err) {
      console.error('Failed to remove collaborator:', err);
    }
  };

  return (
    <>
      <div
        className={`modal-overlay folder-modal-overlay ${isClosing ? 'folder-modal-closing' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <div className="modal-content folder-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#E5E0D4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: colorHex }}
            >
              <Folder className="w-4 h-4" />
            </div>
            <h2 className="font-serif-heading text-lg font-bold text-[#172433]">
              {isEditing ? 'Folder Setting' : 'Create New Folder'}
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

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="px-6 pt-4 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Folder Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block">
              Course / Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS 101: Data Structures"
              className="input-field text-sm font-semibold"
              autoFocus
              required
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-2 block">
              Folder Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorHex(c)}
                  aria-label={`Set folder color to ${c}`}
                  aria-pressed={colorHex.toUpperCase() === c}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    colorHex.toUpperCase() === c ? 'ring-2 ring-[#172433] ring-offset-2 scale-105 shadow-sm' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {colorHex.toUpperCase() === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <label className="ml-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E5E0D4] px-2 py-1 text-[11px] font-semibold text-[#4F5D70] hover:bg-[#F5F2EA]">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value.toUpperCase())}
                  aria-label="Choose a custom folder color"
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                Custom
              </label>
            </div>
            <p className="mt-2 text-[10px] text-[#7A8796]">
              Selected: <span className="font-mono font-semibold">{colorHex}</span>
            </p>
          </div>

          {/* Peer Collaboration Section */}
          {isEditing && (
            <div className="pt-2 border-t border-[#E5E0D4]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#3E4B8E]" />
                  Peer Collaborators ({collaborators.length})
                </label>
                <span className="text-[10px] text-[#4F5D70] font-medium bg-[#EAE6DC] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Equal Co-working
                </span>
              </div>

              <p className="text-xs text-[#6A7889] mb-3">
                Invited peers can view, edit, and check off tasks jointly.
              </p>

              {/* Collaborators List */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F2EA] border border-[#E0DBD0] text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#152A42] flex items-center justify-center font-bold text-white text-[10px]">
                      ★
                    </div>
                    <span className="font-semibold text-[#172433]">
                      {folder.owner_id === currentUserId ? 'You (Owner)' : 'Creator'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7A8796]">Owner</span>
                </div>

                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F2EA] border border-[#E0DBD0] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm"
                        style={{ backgroundColor: c.avatar_color || '#3E4B8E' }}
                      >
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-[#172433]">@{c.username}</span>
                    </div>

                    {(folder.owner_id === currentUserId || c.id === currentUserId) && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCollaborator(c.id)}
                        className="text-[#8E9BAC] hover:text-red-600 p-1"
                        title={c.id === currentUserId ? 'Leave folder' : 'Remove collaborator'}
                      >
                        {c.id === currentUserId ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Username Search Box */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1 block">
                  Add Collaborator by Username
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8E9BAC] absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type student username (e.g. jordan_dev)..."
                    className="input-field collaborator-search-input text-xs"
                  />
                  {searching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="spinner" />
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-1.5 p-1 rounded-xl bg-white border border-[#DDD7C9] shadow-lg max-h-48 overflow-y-auto space-y-1">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F2EA] transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm"
                            style={{ backgroundColor: user.avatar_color || '#3E4B8E' }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-[#172433]">@{user.username}</span>
                            <span className="text-[10px] text-[#7A8796] block">{user.email}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={addingUsername === user.username}
                          onClick={() => handleAddCollaborator(user.username)}
                          className="btn-primary-blue text-[11px] py-1 px-3 flex items-center gap-1 shadow-sm"
                        >
                          {addingUsername === user.username ? (
                            <div className="spinner" />
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="mt-1.5 p-2 rounded-lg text-center text-xs text-[#7A8796] bg-[#F5F2EA]">
                    No matching accounts for "{searchQuery}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-0">
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
                disabled={saving}
                className="btn-primary-blue text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
              >
                {saving ? <div className="spinner" /> : <Check className="w-3.5 h-3.5" />}
                {isEditing ? 'Save Changes' : 'Create Folder'}
              </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}
