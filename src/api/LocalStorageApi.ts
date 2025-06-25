// src/api/LocalStorageApi.ts
import { type Project } from '../models/Project';

const PROJECTS_KEY = 'managme_projects';

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
      id: Date.now().toString(), // Prosty generator ID
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
      return true;
    }
    return false;
  }
}