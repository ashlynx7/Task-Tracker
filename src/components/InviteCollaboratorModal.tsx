'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Folder, Users, X } from 'lucide-react';
import InviteCollaboratorPanel, { InviteCandidate } from './InviteCollaboratorPanel';

interface Collaborator extends InviteCandidate {
  joined_at?: string;
}

interface FolderOption {
  id: string;
  name: string;
  color_hex: string;
  owner_id: string;
  collaborators?: Collaborator[];
}

interface InviteCollaboratorModalProps {
  folders: FolderOption[];
  currentUserId: string;
  initialFolderId?: string | null;
  onClose: () => void;
  onInvited?: () => void;
}

export default function InviteCollaboratorModal({
  folders,
  currentUserId,
  initialFolderId,
  onClose,
  onInvited,
}: InviteCollaboratorModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    initialFolderId || folders[0]?.id || ''
  );
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) || folders[0],
    [folders, selectedFolderId]
  );

  useEffect(() => {
    setCollaborators(selectedFolder?.collaborators || []);
  }, [selectedFolder]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay folder-modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content folder-modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invite collaborator"
      >
        <div className="px-5 py-3 border-b border-[#E5E0D4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: selectedFolder?.color_hex || '#3E4B8E' }}
            >
              <Users className="w-4 h-4" />
            </div>
            <h2 className="font-serif-heading text-lg font-bold text-[#172433]">
              Invite Collaborator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite dialog"
            className="p-1 rounded text-[#7A8796] hover:text-[#172433] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-6 space-y-4">
          {folders.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#EAE6DC] text-[#3E4B8E] flex items-center justify-center mx-auto mb-3">
                <Folder className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#172433] mb-1">No folders to share yet</p>
              <p className="text-xs text-[#6A7889]">
                Create a folder first, then invite classmates to work in it with you.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="invite-folder-select"
                  className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1.5 block"
                >
                  Folder to share
                </label>
                <select
                  id="invite-folder-select"
                  value={selectedFolder?.id || ''}
                  onChange={(event) => setSelectedFolderId(event.target.value)}
                  className="input-field text-sm font-semibold"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-[#F5F2EA] border border-[#E0DBD0] text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#172433]">
                    {collaborators.length === 0
                      ? 'Only you have access'
                      : `${collaborators.length} collaborator${collaborators.length === 1 ? '' : 's'} already in this folder`}
                  </span>
                  <span className="text-[10px] text-[#7A8796]">Owner: you</span>
                </div>
                {collaborators.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {collaborators.map((collaborator) => (
                      <span
                        key={collaborator.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E0DBD0] px-2 py-0.5 text-[10px] font-semibold text-[#172433]"
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: collaborator.avatar_color || '#3E4B8E' }}
                        >
                          {collaborator.username.charAt(0).toUpperCase()}
                        </span>
                        @{collaborator.username}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <InviteCollaboratorPanel
                key={selectedFolder?.id}
                folderId={selectedFolder?.id || ''}
                excludeIds={[currentUserId, ...collaborators.map((collaborator) => collaborator.id)]}
                onAdded={(nextCollaborators) => {
                  setCollaborators(nextCollaborators);
                  if (onInvited) onInvited();
                }}
                autoFocus
              />
            </>
          )}

          <div className="flex items-center justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
