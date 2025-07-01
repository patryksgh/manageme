export type StoryPriority = 'low' | 'medium' | 'high';
export type StoryStatus = 'todo' | 'doing' | 'done';

// Ten typ reprezentuje dane, które wysyłamy do Firestore, aby utworzyć NOWĄ historyjkę.
// Nie zawiera `id` ani `createdAt`, ponieważ Firestore je generuje.
export type StoryData = Omit<Story, 'id' | 'createdAt'>;

// To jest pełny obiekt historyjki, który odczytujemy z Firestore.
export interface Story {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: string;
  createdAt: string; // ISO date string
  status: StoryStatus;
  ownerId: string;
}