'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, Priority } from '../../types';
import {
  Calendar,
  Edit2,
  Trash2,
  GripVertical,
  Clock,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  canEdit: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  LOW: {
    label: 'Low',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },
  MEDIUM: {
    label: 'Medium',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dotClass: 'bg-sky-500',
  },
  HIGH: {
    label: 'High',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dotClass: 'bg-amber-500',
  },
  URGENT: {
    label: 'Urgent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dotClass: 'bg-rose-500',
  },
};

export function TaskCard({
  task,
  index,
  canEdit,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

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
    <Draggable draggableId={task.id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-white rounded-lg border p-3 transition-shadow select-none ${
            snapshot.isDragging
              ? 'shadow-lg border-slate-400/90 ring-1 ring-slate-900/10 rotate-[0.5deg] scale-[1.01] z-50'
              : 'shadow-2xs border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          {/* Top row: Priority & Quick Actions */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium border ${priority.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dotClass}`} />
              <span>{priority.label}</span>
            </span>

            <div className="flex items-center space-x-0.5">
              {canEdit && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
                  <button
                    onClick={() => onEdit(task)}
                    title="Edit task"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    title="Delete task"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {canEdit && (
                <div
                  {...provided.dragHandleProps}
                  className="p-1 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing rounded"
                  title="Drag to rearrange"
                >
                  <GripVertical className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-medium text-slate-800 leading-snug break-words">
            {task.title}
          </h4>

          {/* Description snippet */}
          {task.description && (
            <p className="mt-1 text-[11.5px] text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Due date footer */}
          {due && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center">
              <span
                className={`inline-flex items-center space-x-1 text-[10.5px] font-medium ${
                  due.isOverdue ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{due.formatted}</span>
                {due.isOverdue && (
                  <span className="text-[10px] font-semibold text-rose-500 ml-0.5">(Overdue)</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
