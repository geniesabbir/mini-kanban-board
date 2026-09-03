'use client';

import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column, Task } from '../../types';
import { TaskCard } from './task-card';
import {
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface ColumnContainerProps {
  column: Column;
  canEdit: boolean;
  onAddTask: (columnId: string, columnTitle: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  onDeleteColumn: (columnId: string, columnTitle: string) => void;
}

// Map column names to rich color palettes
function getColumnColorTheme(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('progress') || lower.includes('doing')) {
    return {
      dot: 'bg-indigo-500 ring-2 ring-indigo-100',
      pill: 'bg-indigo-100 text-indigo-700',
      topBar: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      dropBg: 'bg-indigo-50/40 ring-2 ring-indigo-300/60',
    };
  }
  if (lower.includes('done') || lower.includes('completed')) {
    return {
      dot: 'bg-emerald-500 ring-2 ring-emerald-100',
      pill: 'bg-emerald-100 text-emerald-700',
      topBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      dropBg: 'bg-emerald-50/40 ring-2 ring-emerald-300/60',
    };
  }
  if (lower.includes('review') || lower.includes('qa') || lower.includes('test')) {
    return {
      dot: 'bg-amber-500 ring-2 ring-amber-100',
      pill: 'bg-amber-100 text-amber-800',
      topBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
      dropBg: 'bg-amber-50/40 ring-2 ring-amber-300/60',
    };
  }
  // Default (e.g. To Do, Backlog)
  return {
    dot: 'bg-slate-400 ring-2 ring-slate-200',
    pill: 'bg-slate-200 text-slate-700',
    topBar: 'bg-gradient-to-r from-slate-400 to-slate-500',
    dropBg: 'bg-slate-200/50 ring-2 ring-slate-300/60',
  };
}

export function ColumnContainer({
  column,
  canEdit,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateColumnTitle,
  onDeleteColumn,
}: ColumnContainerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const theme = getColumnColorTheme(column.title);

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue.trim() === column.title) {
      setTitleValue(column.title);
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      await onUpdateColumnTitle(column.id, titleValue.trim());
      setIsEditingTitle(false);
    } catch {
      setTitleValue(column.title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setTitleValue(column.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="w-[305px] shrink-0 flex flex-col bg-slate-100/80 rounded-2xl border border-slate-200/80 max-h-full shadow-2xs overflow-hidden transition-all duration-200">
      {/* Top Colorful Accent Line */}
      <div className={`h-1 w-full ${theme.topBar}`} />

      {/* Column Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/60 bg-slate-50/50">
        <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
          {isEditingTitle ? (
            <div className="flex items-center space-x-1 w-full animate-fade-in">
              <input
                type="text"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                disabled={isSavingTitle}
                className="w-full px-2 py-0.5 text-xs font-semibold bg-white border border-indigo-400 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all active:scale-90"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
              <h3
                onClick={() => canEdit && setIsEditingTitle(true)}
                className={`text-xs font-bold text-slate-800 truncate transition-colors ${
                  canEdit ? 'cursor-pointer hover:text-indigo-600' : ''
                }`}
                title={canEdit ? 'Click to rename column' : column.title}
              >
                {column.title}
              </h3>
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10.5px] font-bold shrink-0 transition-transform ${theme.pill}`}
              >
                {column.tasks.length}
              </span>
            </div>
          )}
        </div>

        {canEdit && !isEditingTitle && (
          <div className="flex items-center space-x-0.5 shrink-0">
            <button
              onClick={() => onAddTask(column.id, column.title)}
              title="Add task to column"
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all active:scale-90 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteColumn(column.id, column.title)}
              title="Delete column"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all active:scale-90 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Droppable Task List with animated drop zone */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[160px] transition-all duration-200 ${
              snapshot.isDraggingOver ? theme.dropBg : ''
            }`}
          >
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-300/80 rounded-xl bg-white/40">
                <p className="text-[11.5px] text-slate-400 font-medium">Empty column</p>
                {canEdit && (
                  <button
                    onClick={() => onAddTask(column.id, column.title)}
                    className="mt-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    + Add task
                  </button>
                )}
              </div>
            )}

            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                canEdit={canEdit}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Bottom quick add button */}
      {canEdit && (
        <div className="p-2 border-t border-slate-200/40 bg-slate-50/40">
          <button
            onClick={() => onAddTask(column.id, column.title)}
            className="w-full py-1.5 px-2.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-all duration-150 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
