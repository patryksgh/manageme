export type StoryPriority = 'low' | 'medium' | 'high';

export type StoryStatus = 'todo' | 'doing' | 'done';

export type StoryData = Omit<Story, 'id' | 'createdAt'>;

export interface Story {
  id: string;
  name: string;
  description: string;
  priority: StoryPriority;
  projectId: string;
  createdAt: string;
  status: StoryStatus;
  ownerId: string;
}