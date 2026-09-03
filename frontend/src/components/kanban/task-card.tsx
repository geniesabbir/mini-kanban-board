'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, Priority } from '../../types';
import {
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; badge: string; dot: string }> = {
  LOW: {
    label: 'Low',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  MEDIUM: {
    label: 'Medium',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  HIGH: {
    label: 'High',
    badge: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dot: 'bg-orange-500',
  },
  URGENT: {
    label: 'Urgent',
    badge: 'bg-red-50 text-red-700 border-red-200/80',
    dot: 'bg-red-500',
  },
};

export function TaskCard({
  task,
  index,
  canEdit,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const overdue = isPast(date) && !isToday(date);

    return {
      formatted: format(date, 'MMM d'),
      isOverdue: overdue,
    };
  };

  const due = formatDueDate(task.dueDate);

  return (
    <Draggable
      draggableId={task.id}
      index={index}
      isDragDisabled={!canEdit}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-white rounded-xl border p-4 transition-all select-none ${
            snapshot.isDragging
              ? 'shadow-xl border-indigo-400 ring-2 ring-indigo-500/20 rotate-1 scale-[1.02] z-50'
              : 'shadow-2xs border-gray-200/90 hover:border-gray-300 hover:shadow-sm'
          } ${!canEdit ? 'cursor-default' : ''}`}
        >
          {/* Header row: Priority Badge & Actions */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityInfo.badge}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`}
              />
              <span>{priorityInfo.label}</span>
            </span>

            <div className="flex items-center space-x-1">
              {canEdit && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
                  <button
                    onClick={() => onEdit(task)}
                    title="Edit Task"
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    title="Delete Task"
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {canEdit && (
                <div
                  {...provided.dragHandleProps}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-gray-900 leading-snug break-words">
            {task.title}
          </h4>

          {/* Description snippet if exists */}
          {task.description && (
            <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Footer details: Due date */}
          {due && (
            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span
                className={`inline-flex items-center space-x-1 text-[11px] font-medium ${
                  due.isOverdue ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{due.formatted}</span>
                {due.isOverdue && (
                  <span className="text-[10px] font-semibold text-red-600">(Overdue)</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
