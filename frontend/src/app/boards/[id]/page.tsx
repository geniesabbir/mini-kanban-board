'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api';
import { Board, Column, Task, Priority } from '../../../types';
import { ColumnContainer } from '../../../components/kanban/column-container';
import { TaskModal } from '../../../components/kanban/task-modal';
import { ShareModal } from '../../../components/kanban/share-modal';
import {
  ArrowLeft,
  Users,
  Plus,
  Shield,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Lock,
  X,
  Sparkles,
} from 'lucide-react';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Search & Filters inside the board
  const [taskFilter, setTaskFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeColumnForNewTask, setActiveColumnForNewTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // New Column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  // Delete Column confirmation state
  const [columnToDelete, setColumnToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get(`/api/boards/${boardId}`);
      setBoard(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load board or unauthorized',
      );
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && boardId) {
      fetchBoard();
    }
  }, [user, isAuthLoading, boardId, router, fetchBoard]);

  const canEdit =
    board?.currentUserRole === 'OWNER' || board?.currentUserRole === 'EDITOR';

  // Task Drag and Drop Handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (!board || !canEdit) return;

    // Snapshot current state for rollback if network fails
    const previousBoard = { ...board };

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const sourceIndex = source.index;
    const destIndex = destination.index;

    // Build optimistic state
    const newColumns =
      board.columns?.map((col) => ({
        ...col,
        tasks: [...col.tasks],
      })) || [];

    const sourceCol = newColumns.find((c) => c.id === sourceColId);
    const destCol = newColumns.find((c) => c.id === destColId);

    if (!sourceCol || !destCol) return;

    // Remove task from source
    const [movedTask] = sourceCol.tasks.splice(sourceIndex, 1);
    if (!movedTask) return;

    // Update moved task properties
    movedTask.columnId = destColId;

    // Insert into destination
    destCol.tasks.splice(destIndex, 0, movedTask);

    // Re-index orders
    sourceCol.tasks.forEach((t, i) => {
      t.order = i;
    });
    destCol.tasks.forEach((t, i) => {
      t.order = i;
    });

    // Optimistically update UI
    setBoard({
      ...board,
      columns: newColumns,
    });

    try {
      // Sync with Task Movement API
      await api.patch(`/api/tasks/${draggableId}/move`, {
        targetColumnId: destColId,
        targetOrder: destIndex,
      });
    } catch (err: any) {
      console.error('Task move failed:', err);
      // Rollback on error
      setBoard(previousBoard);
      alert(
        err.response?.data?.message ||
          'Failed to move task. Reverting to previous position.',
      );
    }
  };

  // Filtered columns for search/filter
  const displayedColumns = useMemo(() => {
    if (!board?.columns) return [];
    if (!taskFilter.trim() && priorityFilter === 'ALL') {
      return board.columns;
    }

    const q = taskFilter.toLowerCase().trim();

    return board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        const matchesQuery =
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q);
        const matchesPriority =
          priorityFilter === 'ALL' || t.priority === priorityFilter;
        return matchesQuery && matchesPriority;
      }),
    }));
  }, [board?.columns, taskFilter, priorityFilter]);

  // Task Operations
  const handleOpenCreateTask = (columnId: string, columnTitle: string) => {
    setActiveColumnForNewTask({ id: columnId, title: columnTitle });
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveColumnForNewTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data: {
    title: string;
    description?: string;
    priority: Priority;
    dueDate?: string;
  }) => {
    if (editingTask) {
      // Update existing task
      const res = await api.patch(`/api/tasks/${editingTask.id}`, data);
      const updatedTask = res.data;

      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const newCols = prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === updatedTask.id ? { ...t, ...updatedTask } : t,
          ),
        }));
        return { ...prev, columns: newCols };
      });
    } else if (activeColumnForNewTask) {
      // Create new task
      const res = await api.post('/api/tasks', {
        columnId: activeColumnForNewTask.id,
        ...data,
      });
      const createdTask = res.data;

      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const newCols = prev.columns.map((col) => {
          if (col.id === activeColumnForNewTask.id) {
            return { ...col, tasks: [...col.tasks, createdTask] };
          }
          return col;
        });
        return { ...prev, columns: newCols };
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/api/tasks/${taskId}`);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        const newCols = prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        }));
        return { ...prev, columns: newCols };
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Column Operations
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !board) return;

    setIsCreatingColumn(true);
    try {
      const res = await api.post('/api/columns', {
        boardId: board.id,
        title: newColumnTitle.trim(),
      });
      const newCol = res.data;
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: [...(prev.columns || []), newCol],
        };
      });
      setNewColumnTitle('');
      setIsAddingColumn(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add column');
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    const res = await api.patch(`/api/columns/${columnId}`, {
      title: newTitle,
    });
    const updated = res.data;

    setBoard((prev) => {
      if (!prev || !prev.columns) return prev;
      return {
        ...prev,
        columns: prev.columns.map((c) =>
          c.id === columnId ? { ...c, title: updated.title } : c,
        ),
      };
    });
  };

  const handleDeleteColumn = async () => {
    if (!columnToDelete) return;
    setIsDeletingColumn(true);

    try {
      await api.delete(`/api/columns/${columnToDelete.id}`);
      setBoard((prev) => {
        if (!prev || !prev.columns) return prev;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnToDelete.id),
        };
      });
      setColumnToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete column');
    } finally {
      setIsDeletingColumn(false);
    }
  };

  if (isAuthLoading || (isLoading && !board)) {
    return (
      <div className="flex-1 flex items-center justify-center py-28">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex-1 max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Denied or Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'This board does not exist or you do not have permission to access it.'}
        </p>
        <Link
          href="/boards"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Boards</span>
        </Link>
      </div>
    );
  }

  const roleTag =
    board.currentUserRole === 'OWNER'
      ? { label: 'Owner', style: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs' }
      : board.currentUserRole === 'EDITOR'
      ? { label: 'Editor', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs' }
      : { label: 'Viewer (Read-only)', style: 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs' };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            href="/boards"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95 cursor-pointer"
            title="All Boards"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
                {board.title}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${roleTag.style} shrink-0`}
              >
                <Shield className="w-3 h-3 mr-1" />
                {roleTag.label}
              </span>
            </div>
            {board.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-lg mt-0.5">
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search, Filters & Members Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Filter input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              placeholder="Filter tasks..."
              className="w-36 sm:w-48 pl-7 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Members / Share button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Members</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              {1 + (board.members?.length || 0)}
            </span>
          </button>
        </div>
      </div>

      {/* Read-Only Notice for Viewers */}
      {!canEdit && (
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 text-xs text-sky-800 flex items-center justify-center space-x-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>
            You have <strong>Viewer</strong> access to this board. Task movement and editing are in read-only mode.
          </span>
        </div>
      )}

      {/* Kanban Board Container */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-auto bg-slate-50/70">
        {isMounted ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="inline-flex items-start space-x-4 h-full pb-4">
              {displayedColumns.map((column) => (
                <ColumnContainer
                  key={column.id}
                  column={column}
                  canEdit={canEdit}
                  onAddTask={handleOpenCreateTask}
                  onEditTask={handleOpenEditTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateColumnTitle={handleUpdateColumnTitle}
                  onDeleteColumn={(colId, colTitle) =>
                    setColumnToDelete({ id: colId, title: colTitle })
                  }
                />
              ))}

              {/* Add Column Button / Form */}
              {canEdit && (
                <div className="w-[305px] shrink-0">
                  {isAddingColumn ? (
                    <form
                      onSubmit={handleAddColumn}
                      className="bg-white rounded-2xl border border-indigo-200 p-3.5 shadow-md space-y-3 animate-fade-in"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="e.g. QA & Testing"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          type="submit"
                          disabled={isCreatingColumn || !newColumnTitle.trim()}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-sm shadow-indigo-500/25 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {isCreatingColumn ? 'Adding...' : 'Add Column'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingColumn(false);
                            setNewColumnTitle('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full py-3 px-3.5 rounded-2xl border-2 border-dashed border-slate-300/90 hover:border-indigo-400 hover:bg-white/80 hover:text-indigo-600 text-xs font-semibold text-slate-500 transition-all duration-200 flex items-center justify-center space-x-2 shadow-2xs hover:shadow-xs group"
                    >
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <span>Add Column</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </DragDropContext>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}
      </div>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        columnTitle={activeColumnForNewTask?.title}
      />

      {/* Share / Member Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        boardId={board.id}
        isOwner={board.currentUserRole === 'OWNER'}
        owner={board.owner}
        members={board.members || []}
        onMembersUpdated={fetchBoard}
      />

      {/* Delete Column Confirmation Modal */}
      {columnToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-3 animate-pop-in">
            <h3 className="text-sm font-bold text-slate-900">Delete Column</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete &ldquo;
              <strong className="text-slate-800">{columnToDelete.title}</strong>&rdquo;?
              All tasks in this column will be permanently removed.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setColumnToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteColumn}
                disabled={isDeletingColumn}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50 transition active:scale-95"
              >
                {isDeletingColumn ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Column</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
