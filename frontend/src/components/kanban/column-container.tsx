'use client';

import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column, Task } from '../../types';
import { TaskCard } from './task-card';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
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
    <div className="w-80 shrink-0 flex flex-col bg-gray-100/70 rounded-2xl border border-gray-200/80 max-h-full">
      {/* Column Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200/60">
        <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
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
                className="w-full px-2 py-1 text-sm font-semibold bg-white border border-indigo-400 rounded-md focus:outline-none"
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 truncate">
              <h3
                onClick={() => canEdit && setIsEditingTitle(true)}
                className={`text-sm font-bold text-gray-900 truncate ${
                  canEdit ? 'cursor-pointer hover:text-indigo-600' : ''
                }`}
                title={canEdit ? 'Click to rename column' : column.title}
              >
                {column.title}
              </h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200/80 text-gray-700 shrink-0">
                {column.tasks.length}
              </span>
            </div>
          )}
        </div>

        {canEdit && !isEditingTitle && (
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => onAddTask(column.id, column.title)}
              title="Add Task to Column"
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteColumn(column.id, column.title)}
              title="Delete Column"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
            className={`flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[140px] transition-colors rounded-b-2xl ${
              snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
            }`}
          >
            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400">No tasks yet</p>
                {canEdit && (
                  <button
                    onClick={() => onAddTask(column.id, column.title)}
                    className="mt-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    + Add first task
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
        <div className="p-2.5 border-t border-gray-200/50">
          <button
            onClick={() => onAddTask(column.id, column.title)}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
