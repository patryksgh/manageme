import { type StoryPriority } from './Story';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskData = Omit<Task, 'id' | 'createdAt' | 'status'>;

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