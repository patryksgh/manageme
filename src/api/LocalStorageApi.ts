import { type Project } from '../models/Project';
import { type Story } from '../models/Story';
import { type User } from '../models/User';

const PROJECTS_KEY = 'managme_projects';
const STORIES_KEY_PREFIX = 'managme_stories_'; 
const ACTIVE_PROJECT_ID_KEY = 'managme_active_project_id';

export class LocalStorageApi {
  getProjects(): Project[] {
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    return projectsJson ? JSON.parse(projectsJson) : [];
  }

  getProjectById(id: string): Project | undefined {
    const projects = this.getProjects();
    return projects.find(project => project.id === id);
  }

  saveProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project {
    const projects = this.getProjects();
    const newProject: Project = {
      ...projectData,
      id: `project_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return newProject;
  }

  updateProject(updatedProject: Project): Project | undefined {
    let projects = this.getProjects();
    const projectIndex = projects.findIndex(p => p.id === updatedProject.id);
    if (projectIndex > -1) {
      projects[projectIndex] = updatedProject;
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      return updatedProject;
    }
    return undefined;
  }

  deleteProject(id: string): boolean {
    let projects = this.getProjects();
    const initialLength = projects.length;
    projects = projects.filter(project => project.id !== id);
    if (projects.length < initialLength) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      localStorage.removeItem(`${STORIES_KEY_PREFIX}${id}`);
      if (this.getActiveProjectId() === id) {
          this.clearActiveProjectId();
      }
      return true;
    }
    return false;
  }

  setActiveProjectId(projectId: string): void {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId);
  }

  getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  }

  clearActiveProjectId(): void {
    localStorage.removeItem(ACTIVE_PROJECT_ID_KEY);
  }


  private getStoriesStorageKey(projectId: string): string {
    return `${STORIES_KEY_PREFIX}${projectId}`;
  }

  getStories(projectId: string): Story[] {
    const storiesJson = localStorage.getItem(this.getStoriesStorageKey(projectId));
    return storiesJson ? JSON.parse(storiesJson) : [];
  }

  getStoryById(projectId: string, storyId: string): Story | undefined {
    const stories = this.getStories(projectId);
    return stories.find(story => story.id === storyId);
  }

  saveStory(storyData: Omit<Story, 'id' | 'createdAt'>): Story {
    const stories = this.getStories(storyData.projectId);
    const newStory: Story = {
      ...storyData,
      id: `story_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    stories.push(newStory);
    localStorage.setItem(this.getStoriesStorageKey(storyData.projectId), JSON.stringify(stories));
    return newStory;
  }

  updateStory(updatedStory: Story): Story | undefined {
    let stories = this.getStories(updatedStory.projectId);
    const storyIndex = stories.findIndex(s => s.id === updatedStory.id);
    if (storyIndex > -1) {
      stories[storyIndex] = updatedStory;
      localStorage.setItem(this.getStoriesStorageKey(updatedStory.projectId), JSON.stringify(stories));
      return updatedStory;
    }
    return undefined;
  }

  deleteStory(projectId: string, storyId: string): boolean {
    let stories = this.getStories(projectId);
    const initialLength = stories.length;
    stories = stories.filter(story => story.id !== storyId);
    if (stories.length < initialLength) {
      localStorage.setItem(this.getStoriesStorageKey(projectId), JSON.stringify(stories));
      return true;
    }
    return false;
  }
}

export class AuthService {
  private static MOCKED_USER_ID = 'user-123-admin';

  getMockedUser(): User {
    return {
      id: AuthService.MOCKED_USER_ID,
      firstName: 'Jan',
      lastName: 'Kowalski (Admin)',
    };
  }

  getCurrentUserId(): string {
    return AuthService.MOCKED_USER_ID;
  }
}