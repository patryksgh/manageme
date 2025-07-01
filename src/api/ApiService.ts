import type { Project } from "../models/Project";
import type { Story } from "../models/Story";
import type { Task } from "../models/Task";
// Krok 1: Importujemy nasz nowy typ UserWithPassword
import type { User, UserRole, UserWithPassword } from "../models/User";

// Ta klasa będzie teraz naszym jedynym źródłem prawdy o danych.
export class ApiService {
  // Symulacja bazy danych użytkowników
  // Krok 2: Zmieniamy typ tablicy na UserWithPassword[], aby TypeScript wiedział, że pole 'password' jest dozwolone.
  private users: UserWithPassword[] = [
    { id: 'user-1', username: 'patryk', password: '123', firstName: 'Andrzej', lastName: 'Duda', role: 'developer' },
    { id: 'user-2', username: 'devops', password: 'ops123', firstName: 'Anna', lastName: 'Nowak', role: 'devops' },
    { id: 'user-3', username: 'po', password: 'owner123', firstName: 'Piotr', lastName: 'Zieliński', role: 'product-owner' }
  ];

  constructor() {
    // Inicjalizacja, jeśli potrzebna
  }

  // ===== METODY AUTORYZACJI (z Lab 4) =====

  async login(username: string, password: string): Promise<User> {
    await new Promise(res => setTimeout(res, 500));
    // Krok 3: Dodajemy jawny typ dla 'u', aby uniknąć błędu 'any'
    const user = this.users.find((u: UserWithPassword) => u.username === username && u.password === password);

    if (user) {
      const { password, ...userToStore } = user; // To jest bezpieczne, bo 'user' jest typu UserWithPassword
      localStorage.setItem('managme_auth_token', `fake-jwt-for-${user.id}`);
      localStorage.setItem('managme_user', JSON.stringify(userToStore));
      return userToStore;
    }
    throw new Error('Nieprawidłowa nazwa użytkownika lub hasło.');
  }

  async logout(): Promise<void> {
    localStorage.removeItem('managme_auth_token');
    localStorage.removeItem('managme_user');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('managme_auth_token') !== null;
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('managme_user');
    return userJson ? JSON.parse(userJson) as User : null;
  }

  // ===== METODY ZARZĄDZANIA UŻYTKOWNIKAMI (stary AuthService) =====
  
  getUserById(id: string): User | undefined {
    const user = this.users.find((u: UserWithPassword) => u.id === id); // Jawny typ
    if (!user) return undefined;
    const { password, ...userToReturn } = user;
    return userToReturn;
  }

  getUsersByRoles(roles: UserRole[]): User[] {
    return this.users
      .filter((u: UserWithPassword) => roles.includes(u.role)) // Jawny typ
      .map((u: UserWithPassword) => { // Jawny typ
        const { password, ...userToReturn } = u;
        return userToReturn;
      });
  }

  // ===== METODY ZARZĄDZANIA PROJEKTAMI, HISTORYJKAMI, ZADANIAMI (stary LocalStorageApi) =====

  private getItems<T>(key: string): T[] {
    const itemsJson = localStorage.getItem(key);
    return itemsJson ? JSON.parse(itemsJson) : [];
  }

  private setItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
  }
  
  // -- Projekty --
  getProjects(): Project[] { return this.getItems<Project>('projects'); }
  saveProject(projectData: { name: string, description: string }): Project {
    const projects = this.getProjects();
    const newProject: Project = { ...projectData, id: `proj-${Date.now()}`, createdAt: new Date().toISOString() };
    this.setItems('projects', [...projects, newProject]);
    return newProject;
  }
  getProjectById(id: string): Project | undefined { return this.getProjects().find((p: Project) => p.id === id); }
  updateProject(updatedProject: Project): boolean {
    let projects = this.getProjects();
    const index = projects.findIndex((p: Project) => p.id === updatedProject.id);
    if (index === -1) return false;
    projects[index] = updatedProject;
    this.setItems('projects', projects);
    return true;
  }
  deleteProject(id: string): boolean {
    let projects = this.getProjects();
    const initialLength = projects.length;
    projects = projects.filter((p: Project) => p.id !== id);
    if (projects.length === initialLength) return false;
    this.setItems('projects', projects);
    this.setItems('stories', this.getStories().filter((s: Story) => s.projectId !== id));
    this.setItems('tasks', this.getTasks().filter((t: Task) => t.projectId !== id));
    if (this.getActiveProjectId() === id) localStorage.removeItem('activeProjectId');
    return true;
  }
  setActiveProjectId(projectId: string): void { localStorage.setItem('activeProjectId', projectId); }
  getActiveProjectId(): string | null { return localStorage.getItem('activeProjectId'); }

  // -- Historyjki --
  getStories(projectId?: string): Story[] {
    const allStories = this.getItems<Story>('stories');
    return projectId ? allStories.filter((s: Story) => s.projectId === projectId) : allStories;
  }
  getStoryById(projectId: string, storyId: string): Story | undefined { return this.getStories(projectId).find((s: Story) => s.id === storyId); }
  saveStory(storyData: Omit<Story, 'id' | 'createdAt'>): Story {
    const stories = this.getStories();
    const newStory: Story = { ...storyData, id: `story-${Date.now()}`, createdAt: new Date().toISOString() };
    this.setItems('stories', [...stories, newStory]);
    return newStory;
  }
  updateStory(updatedStory: Story): void {
    let stories = this.getStories();
    const index = stories.findIndex((s: Story) => s.id === updatedStory.id);
    if (index !== -1) {
      stories[index] = updatedStory;
      this.setItems('stories', stories);
    }
  }
  deleteStory(projectId: string, storyId: string): boolean {
    let stories = this.getStories();
    const initialLength = stories.length;
    stories = stories.filter((s: Story) => s.id !== storyId);
    if (stories.length === initialLength) return false;
    this.setItems('stories', stories);
    this.setItems('tasks', this.getTasks(projectId).filter((t: Task) => t.storyId !== storyId));
    return true;
  }

  // -- Zadania --
  getTasks(projectId?: string): Task[] {
    const allTasks = this.getItems<Task>('tasks');
    return projectId ? allTasks.filter((t: Task) => t.projectId === projectId) : allTasks;
  }
  getTasksByStoryId(projectId: string, storyId: string): Task[] { return this.getTasks(projectId).filter((t: Task) => t.storyId === storyId); }
  getTaskById(projectId: string, taskId: string): Task | undefined { return this.getTasks(projectId).find((t: Task) => t.id === taskId); }
  saveTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = { ...taskData, id: `task-${Date.now()}`, createdAt: new Date().toISOString(), status: 'todo' };
    this.setItems('tasks', [...tasks, newTask]);
    return newTask;
  }
  updateTask(updatedTask: Task): void {
    let tasks = this.getTasks();
    const index = tasks.findIndex((t: Task) => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.setItems('tasks', tasks);
    }
  }
}