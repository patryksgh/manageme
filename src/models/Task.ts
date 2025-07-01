import { type StoryPriority } from './Story';
export type TaskStatus = 'todo' | 'doing' | 'done';

// Ten typ reprezentuje dane, które wysyłamy do Firestore, aby utworzyć NOWE zadanie.
// Nie zawiera `id`, `createdAt`, ani `status`, ponieważ są one generowane automatycznie.
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'status'>;

// To jest pełny obiekt zadania, który odczytujemy z Firestore.
export interface Task {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  storyId: string;
  projectId: string;
  estimatedTime: number;
  status: TaskStatus;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  assignedUserId?: string;
}