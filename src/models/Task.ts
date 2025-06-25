import { type StoryPriority } from './Story'; // Zaimportuj StoryPriority, jeśli chcesz go reużyć
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority; // Możemy reużyć typ priorytetu z historyjki
  storyId: string;         // ID historyjki, do której przynależy zadanie
  projectId: string;       // ID projektu (dla łatwiejszego filtrowania)
  estimatedTime: number;   // Przewidywany czas wykonania w godzinach (np.)
  status: TaskStatus;      // Użyj zdefiniowanego powyżej TaskStatus
  createdAt: string;       // ISO date string
  startDate?: string;      // ISO date string - opcjonalne, ustawiane przy przejściu do 'doing'
  endDate?: string;        // ISO date string - opcjonalne, ustawiane przy przejściu do 'done'
  assignedUserId?: string; // ID użytkownika odpowiedzialnego (developer lub devops)
}