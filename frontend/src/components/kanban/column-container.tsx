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
  Circle,
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
    <div className="w-[300px] shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200/70 max-h-full">
      {/* Column Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center space-x-2 flex-1 min-w-0 pr-2">
          {isEditingTitle ? (
            <div className="flex items-center space-x-1 w-full">
              <input
                type="text"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                disabled={isSavingTitle}
                className="w-full px-2 py-0.5 text-xs font-semibold bg-white border border-slate-400 rounded focus:outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <h3
                onClick={() => canEdit && setIsEditingTitle(true)}
                className={`text-xs font-semibold text-slate-800 truncate ${
                  canEdit ? 'cursor-pointer hover:text-indigo-600' : ''
                }`}
                title={canEdit ? 'Click to rename' : column.title}
              >
                {column.title}
              </h3>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold bg-slate-200/80 text-slate-600 shrink-0">
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
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteColumn(column.id, column.title)}
              title="Delete column"
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2.5 space-y-2 overflow-y-auto min-h-[140px] transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? 'bg-slate-200/40' : ''
            }`}
          >
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-24 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 rounded-lg">
                <p className="text-[11px] text-slate-400">No tasks in this column</p>
                {canEdit && (
                  <button
                    onClick={() => onAddTask(column.id, column.title)}
                    className="mt-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition"
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
        <div className="p-2 border-t border-slate-200/40">
          <button
            onClick={() => onAddTask(column.id, column.title)}
            className="w-full py-1.5 px-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white/80 transition text-xs font-medium flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
