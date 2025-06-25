export type StoryPriority = 'low' | 'medium' | 'high';
export type StoryStatus = 'todo' | 'doing' | 'done';

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: string; // ID projektu, do którego należy historyjka
  createdAt: string; // ISO date string
  status: StoryStatus;
  ownerId: string; // ID użytkownika będącego właścicielem
}