export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: Role;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  isOwner?: boolean;
  currentUserRole?: Role;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: BoardMember[];
  columns?: Column[];
  membersCount?: number;
  columnsCount?: number;
  totalTasks?: number;
  createdAt: string;
  updatedAt: string;
}
