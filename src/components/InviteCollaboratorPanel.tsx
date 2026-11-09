'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Search, UserPlus } from 'lucide-react';

export interface InviteCandidate {
  id: string;
  username: string;
  email: string;
  avatar_color?: string;
}

interface InviteCollaboratorPanelProps {
  folderId: string;
  excludeIds: string[];
  onAdded: (collaborators: InviteCandidate[], addedUser: InviteCandidate | null) => void;
  autoFocus?: boolean;
}

export default function InviteCollaboratorPanel({
  folderId,
  excludeIds,
  onAdded,
  autoFocus = false,
}: InviteCollaboratorPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setActiveIndex(-1);
    setError(null);
    setSuccess(null);
  }, [folderId]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      setActiveIndex(-1);
      return;
    }

    let cancelled = false;
    setSearching(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          throw new Error('Search failed');
        }
        const data = await res.json();
        if (cancelled) return;
        const users: InviteCandidate[] = data.users || [];
        setResults(users);
        setSearched(true);
        setActiveIndex(users.length > 0 ? 0 : -1);
      } catch {
        if (cancelled) return;
        setResults([]);
        setSearched(false);
        setActiveIndex(-1);
        setError('Could not search for users. Check your connection and try again.');
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, folderId]);

  const excluded = new Set(excludeIds);
  const visibleResults = results.filter((user) => !excluded.has(user.id));
  const resolvedActiveIndex =
    visibleResults.length === 0
      ? -1
      : Math.min(activeIndex < 0 ? 0 : activeIndex, visibleResults.length - 1);

  const invite = async (rawUsername: string) => {
    const username = rawUsername.trim();
    if (!username) {
      setError('Type a username to invite.');
      inputRef.current?.focus();
      return;
    }

    setAddingUsername(username.toLowerCase());
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/folders/${folderId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Could not invite @${username}.`);
      }

      const addedName = data.addedUser?.username || username;
      setSuccess(`@${addedName} added to this folder.`);
      setQuery('');
      setResults([]);
      setSearched(false);
      setActiveIndex(-1);
      onAdded(data.collaborators || [], data.addedUser || null);
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not invite @${username}.`);
    } finally {
      setAddingUsername(null);
    }
  };

  const moveActive = (delta: number) => {
    if (visibleResults.length === 0) return;
    setActiveIndex((prev) => {
      if (prev < 0) return delta > 0 ? 0 : visibleResults.length - 1;
      const next = prev + delta;
      if (next < 0) return visibleResults.length - 1;
      if (next >= visibleResults.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = resolvedActiveIndex >= 0 ? visibleResults[resolvedActiveIndex] : null;
      if (selected) {
        void invite(selected.username);
      } else if (query.trim()) {
        void invite(query.trim());
      }
    } else if (event.key === 'Escape') {
      if (results.length > 0 || searched) {
        setResults([]);
        setSearched(false);
        setActiveIndex(-1);
      }
    }
  };

  const activeOptionId = resolvedActiveIndex >= 0 ? `invite-option-${resolvedActiveIndex}` : undefined;
  const showEmpty =
    searched && !searching && query.trim().length >= 2 && visibleResults.length === 0;

  return (
    <div>
      <label
        htmlFor={`invite-input-${folderId}`}
        className="text-[11px] font-bold uppercase tracking-wider text-[#7A8796] mb-1 block"
      >
        Invite by Username
      </label>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[#8E9BAC] absolute left-3.5 top-3 pointer-events-none" />
        <input
          id={`invite-input-${folderId}`}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={visibleResults.length > 0}
          aria-controls={`invite-results-${folderId}`}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setError(null);
            setSuccess(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a username, then press Enter"
          className="input-field collaborator-search-input text-xs"
          autoComplete="off"
          spellCheck={false}
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="spinner" />
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {searching
          ? 'Searching users'
          : visibleResults.length > 0
          ? `${visibleResults.length} matching users`
          : showEmpty
          ? 'No matching users'
          : ''}
      </p>

      {error && (
        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {visibleResults.length > 0 && (
        <div
          id={`invite-results-${folderId}`}
          role="listbox"
          aria-label="Matching users"
          className="mt-1.5 p-1 rounded-xl bg-white border border-[#DDD7C9] shadow-lg max-h-48 overflow-y-auto space-y-1"
        >
          {visibleResults.map((user, index) => (
            <button
              type="button"
              key={user.id}
              id={`invite-option-${index}`}
              role="option"
              aria-selected={index === resolvedActiveIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => void invite(user.username)}
              disabled={addingUsername === user.username.toLowerCase()}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-xs text-left ${
                index === resolvedActiveIndex ? 'bg-[#F5F2EA]' : 'hover:bg-[#F5F2EA]'
              }`}
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

              <span className="btn-primary-blue text-[11px] py-1 px-3 flex items-center gap-1 shadow-sm">
                {addingUsername === user.username.toLowerCase() ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    Add
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {showEmpty && (
        <div className="mt-1.5 p-2 rounded-lg text-center text-xs text-[#7A8796] bg-[#F5F2EA]">
          {results.length > 0
            ? 'Everyone matching that username is already in this folder.'
            : `No matching accounts for "${query.trim()}". Press Enter to invite that exact username.`}
        </div>
      )}
    </div>
  );
}
