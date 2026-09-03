'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, Priority } from '../../types';
import {
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
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
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    leftBorderClass: string;
  }
> = {
  LOW: {
    label: 'Low',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dotClass: 'bg-teal-500',
    leftBorderClass: 'border-l-teal-400',
  },
  MEDIUM: {
    label: 'Medium',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dotClass: 'bg-indigo-500',
    leftBorderClass: 'border-l-indigo-400',
  },
  HIGH: {
    label: 'High',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dotClass: 'bg-amber-500',
    leftBorderClass: 'border-l-amber-400',
  },
  URGENT: {
    label: 'Urgent',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
    leftBorderClass: 'border-l-rose-500',
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
          {...(canEdit ? provided.dragHandleProps : {})}
          onClick={() => {
            if (canEdit) onEdit(task);
          }}
          className={`group relative bg-white rounded-xl border border-l-[3.5px] p-3.5 select-none transition-all duration-200 ${
            priority.leftBorderClass
          } ${
            canEdit
              ? 'cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
              : 'cursor-default'
          } ${
            snapshot.isDragging
              ? 'shadow-2xl border-indigo-400 ring-2 ring-indigo-500/20 rotate-1 scale-[1.03] z-50 bg-white/95 !cursor-grabbing'
              : 'shadow-2xs border-slate-200/80'
          }`}
        >
          {/* Top row: Priority & Action Buttons */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold border transition-colors ${priority.badgeClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${priority.dotClass} ${
                  task.priority === 'URGENT' ? 'animate-pulse' : ''
                }`}
              />
              <span>{priority.label}</span>
            </span>

            {canEdit && (
              <div
                className="opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center space-x-1"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Edit task"
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all active:scale-90 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Delete task"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all active:scale-90 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-semibold text-slate-800 leading-snug break-words group-hover:text-indigo-950 transition-colors">
            {task.title}
          </h4>

          {/* Description snippet */}
          {task.description && (
            <p className="mt-1 text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Due date footer */}
          {due && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold transition-colors ${
                  due.isOverdue
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                    : 'bg-slate-50 text-slate-500 border border-slate-200/60'
                }`}
              >
                {due.isOverdue ? (
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-400" />
                )}
                <span>{due.formatted}</span>
                {due.isOverdue && (
                  <span className="text-[10px] text-rose-500 font-bold ml-0.5">Overdue</span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
