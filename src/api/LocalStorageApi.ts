// src/api/LocalStorageApi.ts
import { type Project } from '../models/Project';
import { type Story } from '../models/Story';
import { type User, type UserRole } from '../models/User'; // UserRole jest potrzebne dla AuthService
import { type Task } from '../models/Task';

const PROJECTS_KEY = 'managme_projects';
const ACTIVE_PROJECT_ID_KEY = 'managme_active_project_id';

const STORIES_KEY_PREFIX = 'managme_stories_';
const TASKS_KEY_PREFIX = 'managme_tasks_';

export class LocalStorageApi {
  // --- Metody dla Projektów ---

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
      // Usuń powiązane historyjki i zadania
      localStorage.removeItem(this.getStoriesStorageKey(id));
      localStorage.removeItem(this.getTasksStorageKey(id));
      // Jeśli usuwany projekt był aktywny, wyczyść go
      if (this.getActiveProjectId() === id) {
          this.clearActiveProjectId();
      }
      return true;
    }
    return false;
  }

  // --- Metody dla Aktywnego Projektu ---
  setActiveProjectId(projectId: string): void {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId);
  }

  getActiveProjectId(): string | null {
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  }

  clearActiveProjectId(): void {
    localStorage.removeItem(ACTIVE_PROJECT_ID_KEY);
  }

  // --- Metody dla Historyjek ---
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
      // Usuń powiązane zadania
      let tasks = this.getTasks(projectId);
      tasks = tasks.filter(task => task.storyId !== storyId);
      localStorage.setItem(this.getTasksStorageKey(projectId), JSON.stringify(tasks));
      return true;
    }
    return false;
  }

  // --- Metody dla Zadań ---
  private getTasksStorageKey(projectId: string): string {
    return `${TASKS_KEY_PREFIX}${projectId}`;
  }

  getTasks(projectId: string): Task[] {
    const tasksJson = localStorage.getItem(this.getTasksStorageKey(projectId));
    return tasksJson ? JSON.parse(tasksJson) : [];
  }

  getTasksByStoryId(projectId: string, storyId: string): Task[] {
    const allTasksForProject = this.getTasks(projectId);
    return allTasksForProject.filter(task => task.storyId === storyId);
  }

  getTaskById(projectId: string, taskId: string): Task | undefined {
    const tasks = this.getTasks(projectId);
    return tasks.find(task => task.id === taskId);
  }

  saveTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
    const tasks = this.getTasks(taskData.projectId);
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'todo', // Domyślny status nowego zadania
    };
    tasks.push(newTask);
    localStorage.setItem(this.getTasksStorageKey(taskData.projectId), JSON.stringify(tasks));
    return newTask;
  }

  updateTask(updatedTask: Task): Task | undefined {
    let tasks = this.getTasks(updatedTask.projectId);
    const taskIndex = tasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex > -1) {
      tasks[taskIndex] = updatedTask;
      localStorage.setItem(this.getTasksStorageKey(updatedTask.projectId), JSON.stringify(tasks));
      return updatedTask;
    }
    return undefined;
  }

  deleteTask(projectId: string, taskId: string): boolean {
    let tasks = this.getTasks(projectId);
    const initialLength = tasks.length;
    tasks = tasks.filter(task => task.id !== taskId);
    if (tasks.length < initialLength) {
      localStorage.setItem(this.getTasksStorageKey(projectId), JSON.stringify(tasks));
      return true;
    }
    return false;
  }
}

// ==========================================================================
// Serwis Autoryzacji (Mock)
// ==========================================================================
export class AuthService {
  private static MOCKED_ADMIN_ID = 'user-001-admin'; // ID dla domyślnego admina

  private static mockedUsers: User[] = [
    { id: AuthService.MOCKED_ADMIN_ID, firstName: 'Alicja', lastName: 'Administratorka', role: 'admin' },
    { id: 'user-002-dev', firstName: 'Bartosz', lastName: 'Developer', role: 'developer' },
    { id: 'user-003-devops', firstName: 'Celina', lastName: 'DevOps', role: 'devops' },
    { id: 'user-004-dev', firstName: 'Damian', lastName: 'Developer', role: 'developer' },
    { id: 'user-005-admin', firstName: 'Edward', lastName: 'SuperAdmin', role: 'admin' }, // Dodatkowy admin dla testów
  ];

  getMockedUser(): User {
    // Zwraca pierwszego użytkownika z rolą admin z listy
    const adminUser = AuthService.mockedUsers.find(user => user.id === AuthService.MOCKED_ADMIN_ID);
    if (!adminUser) {
        // Zabezpieczenie, gdyby admin nie został znaleziony (nie powinno się zdarzyć)
        console.error("Mocked admin user not found! Returning first user.");
        return AuthService.mockedUsers[0];
    }
    return adminUser;
  }

  getCurrentUserId(): string {
    return this.getMockedUser().id;
  }

  getAllMockedUsers(): User[] {
    return AuthService.mockedUsers;
  }

  getUsersByRoles(roles: UserRole[]): User[] {
    return AuthService.mockedUsers.filter(user => roles.includes(user.role));
  }

  getUserById(userId: string): User | undefined {
    return AuthService.mockedUsers.find(user => user.id === userId);
  }
}