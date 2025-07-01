// =======================================================================
// ===                    PLIK main.ts - WERSJA FINALNA                ===
// =======================================================================

import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

import { ApiService } from './api/ApiService';
import { type Project } from './models/Project';
import { type Story, type StoryPriority } from './models/Story';
import { type Task, type TaskStatus } from './models/Task';
import { type User } from './models/User';
import './styles/main.css';

// --- Instancje i zmienne globalne ---
const apiService = new ApiService();
let taskModalInstance: bootstrap.Modal | null = null;
let confirmationModalInstance: bootstrap.Modal | null = null;
let onConfirmDelete: (() => void) | null = null;
let currentEditingTaskId: string | null = null;

// --- Deklaracje zmiennych dla elementów DOM ---
let loginFormContainer: HTMLElement | null, loginForm: HTMLFormElement | null, loginUsernameInput: HTMLInputElement | null, loginPasswordInput: HTMLInputElement | null, loginErrorP: HTMLParagraphElement | null, mainAppContent: HTMLElement | null, userActionsContainer: HTMLElement | null, userDisplayNameElement: HTMLElement | null, logoutButton: HTMLButtonElement | null, projectForm: HTMLFormElement | null, projectNameInput: HTMLInputElement | null, projectDescriptionInput: HTMLTextAreaElement | null, projectIdInput: HTMLInputElement | null, projectsListUl: HTMLUListElement | null, storiesContainer: HTMLElement | null, storyFormContainer: HTMLElement | null, storyForm: HTMLFormElement | null, storyNameInput: HTMLInputElement | null, storyDescriptionInput: HTMLTextAreaElement | null, storyPrioritySelect: HTMLSelectElement | null, storyIdInput: HTMLInputElement | null, taskFormModalEl: HTMLElement | null, taskForm: HTMLFormElement | null, taskFormTitleLabel: HTMLElement | null, taskIdInput: HTMLInputElement | null, taskProjectIdInput: HTMLInputElement | null, taskStoryIdInput: HTMLInputElement | null, taskNameInput: HTMLInputElement | null, taskDescriptionInput: HTMLTextAreaElement | null, taskPrioritySelect: HTMLSelectElement | null, taskEstimatedTimeInput: HTMLInputElement | null, taskDetailStoryName: HTMLElement | null, taskDetailStatus: HTMLElement | null, taskAssigneeSelect: HTMLSelectElement | null, assignTaskBtn: HTMLButtonElement | null, taskDetailStartDate: HTMLElement | null, taskDetailEndDate: HTMLElement | null, completeTaskBtn: HTMLButtonElement | null, kanbanSection: HTMLElement | null, kanbanBoard: HTMLElement | null, confirmationModalBody: HTMLElement | null, confirmDeleteBtn: HTMLButtonElement | null, themeSwitch: HTMLInputElement | null;

// ==========================================================================
// FUNKCJE POMOCNICZE (MODALE, MOTYWY, DRAG&DROP)
// ==========================================================================
function showConfirmationModal(message: string, onConfirm: () => void) {
  if (!confirmationModalInstance || !confirmationModalBody) return;
  onConfirmDelete = onConfirm;
  confirmationModalBody.textContent = message;
  confirmationModalInstance.show();
}

function setTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('managme_theme', theme);
  if (themeSwitch) themeSwitch.checked = theme === 'dark';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-bs-theme');
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function handleDragStart(e: DragEvent) {
  const target = e.target as HTMLElement;
  if (target?.classList.contains('task-item')) {
    e.dataTransfer?.setData('text/plain', target.dataset.id || '');
    setTimeout(() => { target.classList.add('d-none'); }, 0);
  }
}

function handleDragEnd(e: DragEvent) {
  const target = e.target as HTMLElement;
  target?.classList.remove('d-none');
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const targetColumn = (e.target as HTMLElement).closest('.story-column') as HTMLElement;
  if (targetColumn) {
    const newStatus = targetColumn.dataset.status as TaskStatus;
    const taskId = e.dataTransfer?.getData('text/plain');
    const activeProjectId = apiService.getActiveProjectId();
    if (newStatus && taskId && activeProjectId) {
      const task = apiService.getTaskById(activeProjectId, taskId);
      if (task) {
        task.status = newStatus;
        apiService.updateTask(task);
        renderKanbanBoard(activeProjectId);
        renderStories(activeProjectId);
      }
    }
  }
}

// ==========================================================================
// GŁÓWNE FUNKCJE APLIKACJI
// ==========================================================================

// --- Przeciążanie funkcji, aby rozwiązać problem z opcjonalnym argumentem ---
function openTaskModal(projectId: string, storyId: string): void;
function openTaskModal(projectId: string, storyId: string, taskId: string): void;
function openTaskModal(projectId: string, storyId: string, taskId?: string): void {
  if (!taskForm || !taskProjectIdInput || !taskStoryIdInput || !taskDetailStoryName || !taskAssigneeSelect || !taskFormTitleLabel || !taskIdInput || !taskNameInput || !taskDescriptionInput || !taskPrioritySelect || !taskEstimatedTimeInput || !taskDetailStatus || !assignTaskBtn || !completeTaskBtn || !taskDetailStartDate || !taskDetailEndDate || !taskModalInstance) return;

  taskForm.reset();
  currentEditingTaskId = taskId || null;
  taskProjectIdInput.value = projectId;
  taskStoryIdInput.value = storyId;

  const story = apiService.getStoryById(projectId, storyId);
  taskDetailStoryName.textContent = story ? story.name : 'Nieznana historyjka';

  taskAssigneeSelect.innerHTML = '<option value="">-- Wybierz --</option>';
  const assignableUsers = apiService.getUsersByRoles(['developer', 'devops']);
  assignableUsers.forEach((user: User) => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
    taskAssigneeSelect!.appendChild(option);
  });

  if (taskId) {
    taskFormTitleLabel.textContent = 'Edytuj Zadanie';
    const task = apiService.getTaskById(projectId, taskId);
    if (task) {
      taskIdInput.value = task.id;
      taskNameInput.value = task.name;
      taskDescriptionInput.value = task.description;
      taskPrioritySelect.value = task.priority;
      taskEstimatedTimeInput.value = task.estimatedTime.toString();
      taskDetailStatus.textContent = task.status;
      taskAssigneeSelect.value = task.assignedUserId || '';
      taskDetailStartDate.textContent = task.startDate ? new Date(task.startDate).toLocaleString() : '-';
      taskDetailEndDate.textContent = task.endDate ? new Date(task.endDate).toLocaleString() : '-';
      const isTodo = task.status === 'todo', isDoing = task.status === 'doing';
      taskAssigneeSelect.disabled = !isTodo;
      assignTaskBtn.style.display = isTodo ? 'inline-block' : 'none';
      completeTaskBtn.style.display = isDoing ? 'inline-block' : 'none';
    }
  } else {
    taskFormTitleLabel.textContent = 'Dodaj Nowe Zadanie';
    taskIdInput.value = '';
    taskDetailStatus.textContent = 'todo (nowe)';
    taskAssigneeSelect.value = '';
    taskAssigneeSelect.disabled = true;
    assignTaskBtn.style.display = 'none';
    taskDetailStartDate.textContent = '-';
    taskDetailEndDate.textContent = '-';
    completeTaskBtn.style.display = 'none';
  }
  taskModalInstance.show();
}

function renderKanbanBoard(projectId: string | null) {
  if (!kanbanBoard || !kanbanSection) return;
  kanbanBoard.innerHTML = '';
  if (!projectId) {
    kanbanSection.style.display = 'none';
    return;
  }
  kanbanSection.style.display = 'block';
  const tasks = apiService.getTasks(projectId);
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doingTasks = tasks.filter((t) => t.status === 'doing');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  kanbanBoard.appendChild(createKanbanColumn('Do Zrobienia', todoTasks, projectId, 'todo'));
  kanbanBoard.appendChild(createKanbanColumn('W Trakcie', doingTasks, projectId, 'doing'));
  kanbanBoard.appendChild(createKanbanColumn('Ukończone', doneTasks, projectId, 'done'));
  kanbanBoard.addEventListener('dragstart', handleDragStart);
  kanbanBoard.addEventListener('dragend', handleDragEnd);
  kanbanBoard.addEventListener('dragover', handleDragOver);
  kanbanBoard.addEventListener('drop', handleDrop);
}

function createKanbanColumn(title: string, tasks: Task[], projectId: string, status: TaskStatus): HTMLElement {
  const columnDiv = document.createElement('div');
  columnDiv.className = 'story-column';
  columnDiv.dataset.status = status;
  columnDiv.innerHTML = `<h3 class="h5">${title} <span class="badge bg-secondary rounded-pill">${tasks.length}</span></h3>`;
  const ul = document.createElement('ul');
  ul.className = 'list-unstyled';
  if (tasks.length === 0) {
    ul.innerHTML = '<li class="text-muted p-2">Brak zadań w tej kolumnie.</li>';
  } else {
    tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'card task-item mb-2';
      li.dataset.id = task.id;
      li.draggable = true;
      li.addEventListener('click', () => openTaskModal(projectId, task.storyId, task.id));
      const story = apiService.getStoryById(projectId, task.storyId);
      const assignedUser = task.assignedUserId ? apiService.getUserById(task.assignedUserId) : null;
      li.innerHTML = `<div class="card-body p-2"><h4 class="card-title h6 mb-1">${task.name}</h4><p class="card-text small text-muted mb-1">Historyjka: ${story ? story.name : 'N/A'}</p>${assignedUser ? `<p class="card-text small mb-0">Przypisany: ${assignedUser.firstName} ${assignedUser.lastName}</p>` : ''}</div>`;
      ul.appendChild(li);
    });
  }
  columnDiv.appendChild(ul);
  return columnDiv;
}

function renderProjects() {
  if (!projectsListUl) return;
  projectsListUl.innerHTML = '';
  const projects = apiService.getProjects();
  const activeProjectId = apiService.getActiveProjectId();
  if (projects.length === 0) {
    projectsListUl.innerHTML = '<li class="list-group-item text-muted">Brak projektów. Dodaj nowy!</li>';
    return;
  }
  projects.forEach((project) => {
    const li = document.createElement('li');
    li.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-start ${project.id === activeProjectId ? 'active' : ''}`;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => selectActiveProject(project.id));
    const projectInfoDiv = document.createElement('div');
    projectInfoDiv.className = 'ms-2 me-auto';
    projectInfoDiv.innerHTML = `<div class="fw-bold">${project.name}</div><small class="text-muted">${project.description}</small>`;
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'btn-group';
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-outline-secondary';
    editButton.title = 'Edytuj projekt';
    editButton.innerHTML = '✏️';
    editButton.addEventListener('click', (e) => { e.stopPropagation(); loadProjectForEditing(project.id); });
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-outline-danger';
    deleteButton.title = 'Usuń projekt';
    deleteButton.innerHTML = '🗑️';
    deleteButton.addEventListener('click', (e) => { e.stopPropagation(); deleteProject(project.id, project.name); });
    actionsDiv.append(editButton, deleteButton);
    li.append(projectInfoDiv, actionsDiv);
    projectsListUl!.appendChild(li);
  });
}

function loadStoryForEditing(projectId: string, storyId: string) {
  if (!storyNameInput || !storyDescriptionInput || !storyPrioritySelect || !storyIdInput || !storyFormContainer) return;
  const story = apiService.getStoryById(projectId, storyId);
  if (story) {
    storyNameInput.value = story.name;
    storyDescriptionInput.value = story.description;
    storyPrioritySelect.value = story.priority;
    storyIdInput.value = story.id;
    storyFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function loadProjectForEditing(id: string) {
  if (!projectNameInput || !projectDescriptionInput || !projectIdInput) return;
  const project = apiService.getProjectById(id);
  if (project) {
    projectNameInput.value = project.name;
    projectDescriptionInput.value = project.description;
    projectIdInput.value = project.id;
    projectNameInput.scrollIntoView({ behavior: 'smooth' });
  }
}

function deleteProject(id: string, name: string) {
  showConfirmationModal(`Czy na pewno chcesz usunąć projekt "${name}" oraz wszystkie jego historyjki i zadania?`, () => {
    if (apiService.deleteProject(id)) {
      renderProjects();
      const wasActive = apiService.getActiveProjectId() === id;
      if (wasActive) {
        clearStoriesView();
        if (storyFormContainer) storyFormContainer.style.display = 'none';
        if (kanbanSection) kanbanSection.style.display = 'none';
      }
    } else {
      alert('Nie udało się usunąć projektu.');
    }
  });
}

function selectActiveProject(projectId: string) {
  if (!storyFormContainer || !storyForm || !storyIdInput) return;
  apiService.setActiveProjectId(projectId);
  renderProjects();
  storyFormContainer.style.display = 'block';
  renderStories(projectId);
  renderKanbanBoard(projectId);
  storyForm.reset();
  storyIdInput.value = '';
}

function renderStories(projectId: string | null) {
  if (!storiesContainer) return;
  if (!projectId) {
    clearStoriesView();
    return;
  }
  storiesContainer.innerHTML = '';
  const stories = apiService.getStories(projectId);
  const todoStories = stories.filter((s) => s.status === 'todo');
  const doingStories = stories.filter((s) => s.status === 'doing');
  const doneStories = stories.filter((s) => s.status === 'done');
  const columnsDiv = document.createElement('div');
  columnsDiv.className = 'stories-columns';
  columnsDiv.appendChild(createStoryColumn('Do Zrobienia (Todo)', todoStories, projectId));
  columnsDiv.appendChild(createStoryColumn('W Trakcie (Doing)', doingStories, projectId));
  columnsDiv.appendChild(createStoryColumn('Ukończone (Done)', doneStories, projectId));
  storiesContainer.appendChild(columnsDiv);
}

function createStoryColumn(title: string, stories: Story[], projectId: string): HTMLElement {
  const columnDiv = document.createElement('div');
  columnDiv.className = 'story-column';
  columnDiv.innerHTML = `<h3 class="h5">${title} <span class="badge bg-secondary rounded-pill">${stories.length}</span></h3>`;
  if (stories.length === 0) {
    columnDiv.innerHTML += '<p class="text-muted small">Brak historyjek w tej kolumnie.</p>';
  } else {
    stories.forEach((story) => {
      const card = document.createElement('div');
      card.className = 'card story-item mb-3';
      card.dataset.id = story.id;
      const priorityMap = { low: { text: 'Niski', color: 'info' }, medium: { text: 'Średni', color: 'warning' }, high: { text: 'Wysoki', color: 'danger' } };
      const owner = apiService.getUserById(story.ownerId);
      const tasksForStory = apiService.getTasksByStoryId(projectId, story.id);
      const doneTasksCount = tasksForStory.filter((t) => t.status === 'done').length;
      card.innerHTML = `<div class="card-header d-flex justify-content-between align-items-center"><h4 class="h6 mb-0">${story.name}</h4><span class="badge text-bg-${priorityMap[story.priority].color}">${priorityMap[story.priority].text}</span></div><div class="card-body"><p class="card-text">${story.description}</p><div class="progress mb-2" role="progressbar"><div class="progress-bar" style="width: ${tasksForStory.length > 0 ? (doneTasksCount / tasksForStory.length) * 100 : 0}%"></div></div><p class="card-text"><small class="text-muted">Zadania: ${doneTasksCount}/${tasksForStory.length} | Właściciel: ${owner ? owner.firstName : 'N/A'}</small></p></div><div class="card-footer text-end"><div class="btn-group"><button class="btn btn-sm btn-outline-secondary edit-story" title="Edytuj historyjkę">✏️</button><button class="btn btn-sm btn-outline-danger delete-story" title="Usuń historyjkę">🗑️</button><button class="btn btn-sm btn-primary add-task-to-story-btn" title="Dodaj zadanie">+</button></div></div>`;
      card.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(projectId, story.id));
      card.querySelector('.delete-story')?.addEventListener('click', () => deleteStoryFromList(projectId, story.id, story.name));
      card.querySelector('.add-task-to-story-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openTaskModal(projectId, story.id); });
      columnDiv.appendChild(card);
    });
  }
  return columnDiv;
}

function deleteStoryFromList(projectId: string, storyId: string, name: string) {
  showConfirmationModal(`Czy na pewno chcesz usunąć historyjkę "${name}"?`, () => {
    if (apiService.deleteStory(projectId, storyId)) {
      renderStories(projectId);
    } else {
      alert('Nie udało się usunąć historyjki.');
    }
  });
}

function clearStoriesView() {
  if (storiesContainer) storiesContainer.innerHTML = '<div class="alert alert-info">Wybierz projekt z listy, aby zobaczyć jego historyjki i tablicę zadań.</div>';
}

function updateUIBasedOnAuthState() {
  if (!loginFormContainer || !mainAppContent || !userActionsContainer || !userDisplayNameElement) return;
  if (apiService.isAuthenticated()) {
    loginFormContainer.style.display = 'none';
    mainAppContent.style.display = 'block';
    userActionsContainer.style.display = 'flex';
    const user = apiService.getCurrentUser();
    userDisplayNameElement.textContent = user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Błąd';
    renderProjects();
    const activeProjectId = apiService.getActiveProjectId();
    if (activeProjectId) {
      if (storyFormContainer) storyFormContainer.style.display = 'block';
      renderStories(activeProjectId);
      renderKanbanBoard(activeProjectId);
    } else {
      clearStoriesView();
      if(storyFormContainer) storyFormContainer.style.display = 'none';
      if (kanbanSection) kanbanSection.style.display = 'none';
    }
  } else {
    loginFormContainer.style.display = 'block';
    mainAppContent.style.display = 'none';
    userActionsContainer.style.display = 'none';
  }
}

// =======================================================================
// ===               GŁÓWNA FUNKCJA INICJALIZUJĄCA                     ===
// =======================================================================
function initializeApp() {
  // Pobranie referencji do elementów DOM
  loginFormContainer = document.getElementById('login-form-container');
  loginForm = document.getElementById('login-form') as HTMLFormElement;
  loginUsernameInput = document.getElementById('login-username') as HTMLInputElement;
  loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
  loginErrorP = document.getElementById('login-error') as HTMLParagraphElement;
  mainAppContent = document.getElementById('main-app-content');
  userActionsContainer = document.getElementById('user-actions-container');
  userDisplayNameElement = document.getElementById('user-display-name');
  logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
  projectForm = document.getElementById('project-form') as HTMLFormElement;
  projectNameInput = document.getElementById('project-name') as HTMLInputElement;
  projectDescriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
  projectIdInput = document.getElementById('project-id') as HTMLInputElement;
  projectsListUl = document.getElementById('projects-list') as HTMLUListElement;
  storiesContainer = document.getElementById('stories-container');
  storyFormContainer = document.getElementById('story-form-container');
  storyForm = document.getElementById('story-form') as HTMLFormElement;
  storyNameInput = document.getElementById('story-name') as HTMLInputElement;
  storyDescriptionInput = document.getElementById('story-description') as HTMLTextAreaElement;
  storyPrioritySelect = document.getElementById('story-priority') as HTMLSelectElement;
  storyIdInput = document.getElementById('story-id') as HTMLInputElement;
  taskFormModalEl = document.getElementById('task-form-modal');
  taskForm = document.getElementById('task-form') as HTMLFormElement;
  taskFormTitleLabel = document.getElementById('task-form-title-label');
  taskIdInput = document.getElementById('task-id') as HTMLInputElement;
  taskProjectIdInput = document.getElementById('task-project-id') as HTMLInputElement;
  taskStoryIdInput = document.getElementById('task-story-id') as HTMLInputElement;
  taskNameInput = document.getElementById('task-name') as HTMLInputElement;
  taskDescriptionInput = document.getElementById('task-description') as HTMLTextAreaElement;
  taskPrioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
  taskEstimatedTimeInput = document.getElementById('task-estimated-time') as HTMLInputElement;
  taskDetailStoryName = document.getElementById('task-detail-story-name');
  taskDetailStatus = document.getElementById('task-detail-status');
  taskAssigneeSelect = document.getElementById('task-assignee') as HTMLSelectElement;
  assignTaskBtn = document.getElementById('assign-task-btn') as HTMLButtonElement;
  taskDetailStartDate = document.getElementById('task-detail-start-date');
  taskDetailEndDate = document.getElementById('task-detail-end-date');
  completeTaskBtn = document.getElementById('complete-task-btn') as HTMLButtonElement;
  kanbanSection = document.getElementById('kanban-section');
  kanbanBoard = document.getElementById('kanban-board');
  confirmationModalBody = document.getElementById('confirmation-modal-body');
  confirmDeleteBtn = document.getElementById('confirm-delete-btn') as HTMLButtonElement;
  themeSwitch = document.getElementById('theme-switch') as HTMLInputElement;

  // Inicjalizacja instancji modali Bootstrapa
  if (taskFormModalEl) taskModalInstance = new bootstrap.Modal(taskFormModalEl);
  const confirmationModalEl = document.getElementById('confirmation-modal');
  if (confirmationModalEl) confirmationModalInstance = new bootstrap.Modal(confirmationModalEl);
  
  // --- Przypisanie Listenerów Zdarzeń ---
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!loginUsernameInput || !loginPasswordInput || !loginErrorP) return;
    loginErrorP.textContent = '';
    try { await apiService.login(loginUsernameInput.value, loginPasswordInput.value); updateUIBasedOnAuthState(); }
    catch (error) { if (error instanceof Error) loginErrorP.textContent = error.message; }
  });

  logoutButton?.addEventListener('click', () => {
    apiService.logout();
    window.location.reload();
  });

  taskForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!taskIdInput || !taskProjectIdInput || !taskStoryIdInput || !taskNameInput || !taskDescriptionInput || !taskPrioritySelect || !taskEstimatedTimeInput) return;
    const id = taskIdInput.value, projectId = taskProjectIdInput.value, storyId = taskStoryIdInput.value;
    const taskData = { name: taskNameInput.value, description: taskDescriptionInput.value, priority: taskPrioritySelect.value as StoryPriority, storyId, projectId, estimatedTime: parseFloat(taskEstimatedTimeInput.value) };
    if (id) { const existingTask = apiService.getTaskById(projectId, id); if (existingTask) apiService.updateTask({ ...existingTask, ...taskData }); }
    else { apiService.saveTask(taskData); }
    taskModalInstance?.hide();
    renderKanbanBoard(projectId);
    renderStories(projectId);
  });
  
  assignTaskBtn?.addEventListener('click', () => {
    if (!currentEditingTaskId || !taskProjectIdInput || !taskAssigneeSelect) return;
    const task = apiService.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
    if (task && taskAssigneeSelect.value) {
      task.assignedUserId = taskAssigneeSelect.value;
      task.status = 'doing';
      task.startDate = new Date().toISOString();
      apiService.updateTask(task);
      openTaskModal(task.projectId, task.storyId, task.id);
      renderKanbanBoard(task.projectId);
      renderStories(task.projectId);
    }
  });

  completeTaskBtn?.addEventListener('click', () => {
    if (!currentEditingTaskId || !taskProjectIdInput) return;
    const task = apiService.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
    if (task && task.status === 'doing') {
      task.status = 'done';
      task.endDate = new Date().toISOString();
      apiService.updateTask(task);
      openTaskModal(task.projectId, task.storyId, task.id);
      renderKanbanBoard(task.projectId);
      renderStories(task.projectId);
    }
  });

  projectForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!projectNameInput || !projectDescriptionInput || !projectIdInput) return;
    const name = projectNameInput.value, description = projectDescriptionInput.value, id = projectIdInput.value;
    if (id) { const projectToUpdate: Project = { id, name, description, createdAt: apiService.getProjectById(id)?.createdAt || new Date().toISOString() }; if (!apiService.updateProject(projectToUpdate)) alert('Błąd aktualizacji.'); }
    else { apiService.saveProject({ name, description }); }
    projectForm!.reset();
    projectIdInput.value = '';
    renderProjects();
  });

  storyForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!storyNameInput || !storyDescriptionInput || !storyPrioritySelect || !storyIdInput) return;
    const activeProjectId = apiService.getActiveProjectId();
    if (!activeProjectId) { alert('Wybierz projekt!'); return; }
    const name = storyNameInput.value, description = storyDescriptionInput.value, priority = storyPrioritySelect.value as StoryPriority, id = storyIdInput.value;
    const currentUserId = apiService.getCurrentUser()?.id;
    if (!currentUserId) { alert('Błąd użytkownika!'); return; }
    if (id) { const storyToUpdate = apiService.getStoryById(activeProjectId, id); if (storyToUpdate) { storyToUpdate.name = name; storyToUpdate.description = description; storyToUpdate.priority = priority; apiService.updateStory(storyToUpdate); } }
    else { apiService.saveStory({ name, description, priority, projectId: activeProjectId, status: 'todo', ownerId: currentUserId }); }
    storyForm!.reset();
    storyIdInput.value = '';
    renderStories(activeProjectId);
  });
  
  confirmDeleteBtn?.addEventListener('click', () => {
    if (onConfirmDelete) {
      onConfirmDelete();
      onConfirmDelete = null;
    }
    confirmationModalInstance?.hide();
  });

  themeSwitch?.addEventListener('change', toggleTheme);

  // Inicjalizacja stanu UI przy starcie
  const savedTheme = localStorage.getItem('managme_theme') as 'light' | 'dark' | null;
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(savedTheme || preferredTheme);
  updateUIBasedOnAuthState();
}

// URUCHOMIENIE APLIKACJI
document.addEventListener('DOMContentLoaded', initializeApp);