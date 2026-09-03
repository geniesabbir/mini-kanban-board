'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { Board } from '../../types';
import {
  Plus,
  Kanban,
  Users,
  CheckSquare,
  Columns,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Shield,
  Search,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BoardsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Board Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Board confirmation
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get('/api/boards');
      setBoards(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchBoards();
    }
  }, [user, isAuthLoading, router, fetchBoards]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await api.post('/api/boards', {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      router.push(`/boards/${res.data.id}`);
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message || 'Failed to create board. Please try again.',
      );
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/api/boards/${boardToDelete.id}`);
      setBoards((prev) => prev.filter((b) => b.id !== boardToDelete.id));
      setBoardToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete board');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBoards = boards.filter((board) => {
    if (activeTab === 'owned' && !board.isOwner) return false;
    if (activeTab === 'shared' && board.isOwner) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = board.title.toLowerCase().includes(q);
      const matchDesc = board.description?.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  const ownedCount = boards.filter((b) => b.isOwner).length;
  const sharedCount = boards.filter((b) => !b.isOwner).length;

  if (isAuthLoading || (isLoading && boards.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center py-28">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
          <p className="text-xs font-medium text-slate-500">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kanban Boards
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Collaborative boards and task tracking for your teams
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter boards..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Board</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All ({boards.length})
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'owned'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Boards ({ownedCount})
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeTab === 'shared'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Shared With Me ({sharedCount})
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Board Cards Grid */}
      {filteredBoards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {searchQuery
                ? 'No matching boards found'
                : activeTab === 'shared'
                ? 'No shared boards yet'
                : 'No boards created yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              {searchQuery
                ? `No board names or descriptions matched "${searchQuery}".`
                : activeTab === 'shared'
                ? 'Boards shared with your registered email will appear here automatically.'
                : 'Create your first board to start managing workflow states and tasks.'}
            </p>
          </div>
          {!searchQuery && activeTab !== 'shared' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Board</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => {
            const roleTag =
              board.currentUserRole === 'OWNER'
                ? { label: 'Owner', style: 'bg-slate-100 text-slate-700 border-slate-200' }
                : board.currentUserRole === 'EDITOR'
                ? { label: 'Editor', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                : { label: 'Viewer', style: 'bg-sky-50 text-sky-700 border-sky-200' };

            return (
              <div
                key={board.id}
                className="group relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Top tags */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleTag.style}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {roleTag.label}
                    </span>

                    {board.isOwner && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBoardToDelete(board);
                        }}
                        title="Delete Board"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Description */}
                  <Link href={`/boards/${board.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                        {board.title}
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition shrink-0 ml-1.5 opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 min-h-[2rem] leading-relaxed">
                      {board.description || 'No description provided.'}
                    </p>
                  </Link>
                </div>

                {/* Footer details */}
                <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-3.5">
                    <span className="flex items-center space-x-1" title="Tasks">
                      <CheckSquare className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {board.totalTasks ?? 0}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1" title="Columns">
                      <Columns className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {board.columnsCount ?? 0}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1" title="Collaborators">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {board.membersCount ?? 0}
                      </span>
                    </span>
                  </div>

                  {!board.isOwner && board.owner && (
                    <span className="text-slate-400 truncate max-w-[100px]" title={`Owned by ${board.owner.name}`}>
                      By {board.owner.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Board */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Create New Board</h2>
                <p className="text-xs text-slate-500">Set up a new workflow for your project</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Board Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Sprint Planning, Mobile Redesign"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Goals, context, or deliverables..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs disabled:opacity-50 transition"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Board</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {boardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Delete Board</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-800">{boardToDelete.title}</strong>? This will remove all columns and tasks permanently.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBoardToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBoard}
                disabled={isDeleting}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50 transition"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Board</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
