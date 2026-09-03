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
  Edit2,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BoardsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared'>('all');

  // Create Board Modal state
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
      // Navigate straight to the newly created board!
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
    if (activeTab === 'owned') return board.isOwner;
    if (activeTab === 'shared') return !board.isOwner;
    return true;
  });

  const ownedCount = boards.filter((b) => b.isOwner).length;
  const sharedCount = boards.filter((b) => !b.isOwner).length;

  if (isAuthLoading || (isLoading && boards.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
            Workspaces & Boards
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage and collaborate on team Kanban boards.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs hover:shadow-md transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Board</span>
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'all'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          All Boards ({boards.length})
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'owned'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Created by Me ({ownedCount})
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'shared'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Shared with Me ({sharedCount})
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Boards Grid */}
      {filteredBoards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {activeTab === 'shared'
                ? 'No shared boards found'
                : 'No Kanban boards yet'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'shared'
                ? 'When other team members share their boards with your email, they will appear here.'
                : 'Create your first board to start tracking tasks and workflow states.'}
            </p>
          </div>
          {activeTab !== 'shared' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Board</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => {
            const roleBadgeColor =
              board.currentUserRole === 'OWNER'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : board.currentUserRole === 'EDITOR'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div
                key={board.id}
                className="group relative bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadgeColor}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {board.currentUserRole === 'OWNER'
                        ? 'Owner'
                        : board.currentUserRole === 'EDITOR'
                        ? 'Editor'
                        : 'Viewer (Read-only)'}
                    </span>

                    {board.isOwner && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBoardToDelete(board);
                        }}
                        title="Delete Board"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Title & Description */}
                  <Link href={`/boards/${board.id}`} className="block">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition line-clamp-1">
                      {board.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                      {board.description || 'No description provided.'}
                    </p>
                  </Link>
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5" title="Tasks">
                      <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {board.totalTasks ?? 0}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1.5" title="Columns">
                      <Columns className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {board.columnsCount ?? 0}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1.5" title="Collaborators">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {board.membersCount ?? 0}
                      </span>
                    </span>
                  </div>

                  {!board.isOwner && board.owner && (
                    <span className="truncate max-w-[110px]" title={`Owned by ${board.owner.name}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Board</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Board Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Sprint Planning, Mobile Redesign"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the purpose or team goals for this board..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-60 transition"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Delete Board</h3>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900">{boardToDelete.title}</strong>? All
              columns and tasks in this board will be permanently removed.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setBoardToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBoard}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs disabled:opacity-60 transition"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
