export interface User {
  id: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  notes: string | null;
  dueDate: string | null;
}
