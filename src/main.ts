import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

import { ApiService } from './api/ApiService';
import type { Story, StoryData, StoryPriority } from './models/Story';
import type { Task, TaskData, TaskStatus } from './models/Task';
import type { User, UserRole } from './models/User';
import './styles/main.css';

const apiService = new ApiService();

document.addEventListener('DOMContentLoaded', () => {
    
    // STAN APLIKACJI 
    let taskModalInstance: bootstrap.Modal | null, confirmationModalInstance: bootstrap.Modal | null;
    let onConfirmDelete: (() => void) | null, currentEditingTaskId: string | null;


    // Sekcja Uwierzytelniania
    const authContainer = document.getElementById('auth-container')!;
    const loginFormContainer = document.getElementById('login-form-container')!;
    const registerFormContainer = document.getElementById('register-form-container')!;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const loginEmailInput = document.getElementById('login-email') as HTMLInputElement;
    const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
    const loginErrorP = document.getElementById('login-error') as HTMLParagraphElement;
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const registerFirstNameInput = document.getElementById('register-firstname') as HTMLInputElement;
    const registerLastNameInput = document.getElementById('register-lastname') as HTMLInputElement;
    const registerEmailInput = document.getElementById('register-email') as HTMLInputElement;
    const registerPasswordInput = document.getElementById('register-password') as HTMLInputElement;
    const registerRoleSelect = document.getElementById('register-role') as HTMLSelectElement;
    const registerErrorP = document.getElementById('register-error') as HTMLParagraphElement;
    const showRegisterLink = document.getElementById('show-register-link') as HTMLAnchorElement;
    const showLoginLink = document.getElementById('show-login-link') as HTMLAnchorElement;

    // Główny Layout Aplikacji
    const mainAppContent = document.getElementById('main-app-content')!;
    const userActionsContainer = document.getElementById('user-actions-container')!;
    const userDisplayNameElement = document.getElementById('user-display-name')!;
    const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
    const themeSwitch = document.getElementById('theme-switch') as HTMLInputElement;

    // Sekcja Projektów
    const projectForm = document.getElementById('project-form') as HTMLFormElement;
    const projectNameInput = document.getElementById('project-name') as HTMLInputElement;
    const projectDescriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
    const projectIdInput = document.getElementById('project-id') as HTMLInputElement;
    const projectsListUl = document.getElementById('projects-list') as HTMLUListElement;

    // Sekcja Historyjek
    const storiesContainer = document.getElementById('stories-container')!;
    const storyFormContainer = document.getElementById('story-form-container')!;
    const storyForm = document.getElementById('story-form') as HTMLFormElement;
    const storyNameInput = document.getElementById('story-name') as HTMLInputElement;
    const storyDescriptionInput = document.getElementById('story-description') as HTMLTextAreaElement;
    const storyPrioritySelect = document.getElementById('story-priority') as HTMLSelectElement;
    const storyIdInput = document.getElementById('story-id') as HTMLInputElement;

    // Sekcja Tablicy Kanban
    const kanbanSection = document.getElementById('kanban-section')!;
    const kanbanBoard = document.getElementById('kanban-board')!;

    // Modal Tworzenia/Edycji Zadań
    const taskFormModalEl = document.getElementById('task-form-modal')!;
    const taskForm = document.getElementById('task-form') as HTMLFormElement;
    const taskFormTitleLabel = document.getElementById('task-form-title-label')!;
    const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
    const taskProjectIdInput = document.getElementById('task-project-id') as HTMLInputElement;
    const taskStoryIdInput = document.getElementById('task-story-id') as HTMLInputElement;
    const taskNameInput = document.getElementById('task-name') as HTMLInputElement;
    const taskDescriptionInput = document.getElementById('task-description') as HTMLTextAreaElement;
    const taskPrioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
    const taskEstimatedTimeInput = document.getElementById('task-estimated-time') as HTMLInputElement;
    const taskDetailStoryName = document.getElementById('task-detail-story-name')!;
    const taskDetailStatus = document.getElementById('task-detail-status')!;
    const taskAssigneeSelect = document.getElementById('task-assignee') as HTMLSelectElement;
    const assignTaskBtn = document.getElementById('assign-task-btn') as HTMLButtonElement;
    const taskDetailStartDate = document.getElementById('task-detail-start-date')!;
    const taskDetailEndDate = document.getElementById('task-detail-end-date')!;
    const completeTaskBtn = document.getElementById('complete-task-btn') as HTMLButtonElement;

    // Modal Potwierdzenia Usunięcia
    const confirmationModalBody = document.getElementById('confirmation-modal-body')!;
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn') as HTMLButtonElement;


    // INICJALIZACJA BIBLIOTEK ZEWNĘTRZNYCH

    if (taskFormModalEl) taskModalInstance = new bootstrap.Modal(taskFormModalEl);
    const confirmationModalEl = document.getElementById('confirmation-modal');
    if (confirmationModalEl) confirmationModalInstance = new bootstrap.Modal(confirmationModalEl);

    // FUNKCJE POMOCNICZE I OBSŁUGI UI 
    function showConfirmationModal(message: string, onConfirm: () => void) { onConfirmDelete = onConfirm; 
        if(confirmationModalBody) confirmationModalBody.textContent = message; confirmationModalInstance?.show(); }
    function setTheme(theme: 'light' | 'dark') { document.documentElement.setAttribute('data-bs-theme', theme); localStorage.setItem('managme_theme', theme); 
        if (themeSwitch) themeSwitch.checked = theme === 'dark'; }
    function toggleTheme() { const currentTheme = document.documentElement.getAttribute('data-bs-theme'); setTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
    function clearStoriesView() {
        if (storiesContainer) {
            storiesContainer.innerHTML = '<div class="alert alert-info">Wybierz projekt z listy.</div>';
        }
    }
    // GŁÓWNE FUNKCJE RENDERUJĄCE
    async function selectActiveProject(projectId: string) {
        apiService.setActiveProjectId(projectId);
        await renderProjects();
        if (storyFormContainer) storyFormContainer.style.display = 'block';
        await renderStories(projectId);
        await renderKanbanBoard(projectId);
        storyForm.reset();
        storyIdInput.value = '';
    }

    // Otwiera i przygotowuje modal do tworzenia lub edycji zadania

    async function openTaskModal(projectId: string, storyId: string, taskId?: string) {
        taskForm.reset();
        currentEditingTaskId = taskId || null;
        taskProjectIdInput.value = projectId;
        taskStoryIdInput.value = storyId;
        const story = await apiService.getStoryById(storyId);
        taskDetailStoryName.textContent = story ? story.name : 'N/A';
        taskAssigneeSelect.innerHTML = '<option value="">-- Wybierz --</option>';
        const allUsers = await apiService.getAllUsers();
        allUsers.forEach((user: User) => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
            taskAssigneeSelect.appendChild(option);
        });
        if (taskId) {
            taskFormTitleLabel.textContent = 'Edytuj Zadanie';
            const task = await apiService.getTaskById(taskId);
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
        taskModalInstance?.show();
    }

    // Listę projektów

    async function renderProjects() {
        if (!projectsListUl) return;
        projectsListUl.innerHTML = '<li class="list-group-item">Ładowanie...</li>';
        try {
            const projects = await apiService.getProjects();
            const activeProjectId = apiService.getActiveProjectId();
            projectsListUl.innerHTML = '';
            if (projects.length === 0) {
                projectsListUl.innerHTML = '<li class="list-group-item text-muted">Brak projektów.</li>';
            } else {
                projects.forEach((project) => {
                    const li = document.createElement('li');
                    const sanitizedName = project.name.replace(/\s+/g, '-').toLowerCase();
                    li.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-start ${project.id === activeProjectId ? 'active' : ''}`;
                    li.style.cursor = 'pointer';
                    li.setAttribute('data-cy', `project-item-${sanitizedName}`);
                    li.addEventListener('click', () => selectActiveProject(project.id));
                    const projectInfoDiv = document.createElement('div');
                    projectInfoDiv.className = 'ms-2 me-auto';
                    projectInfoDiv.innerHTML = `<div class="fw-bold">${project.name}</div><small class="text-muted">${project.description}</small>`;
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'btn-group';
                    const editButton = document.createElement('button');
                    editButton.className = 'btn btn-sm btn-outline-secondary';
                    editButton.title = 'Edytuj';
                    editButton.innerHTML = '✏️';
                    editButton.addEventListener('click', (e: Event) => { e.stopPropagation(); loadProjectForEditing(project.id); });
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'btn btn-sm btn-outline-danger';
                    deleteButton.title = 'Usuń';
                    deleteButton.innerHTML = '🗑️';
                    deleteButton.addEventListener('click', (e: Event) => { e.stopPropagation(); deleteProject(project.id, project.name); });
                    actionsDiv.append(editButton, deleteButton);
                    li.append(projectInfoDiv, actionsDiv);
                    projectsListUl.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Błąd w renderProjects:", error);
            projectsListUl.innerHTML = '<li class="list-group-item list-group-item-danger">Błąd ładowania.</li>';
        }
    }
  
    // Kanaban historyjki

    async function renderStories(projectId: string | null) {
        if (!storiesContainer) return;
        if (!projectId) {
            clearStoriesView();
            return;
        }
        storiesContainer.innerHTML = '<div class="alert alert-info">Ładowanie...</div>';
        try {
            const stories = await apiService.getStories(projectId);
            storiesContainer.innerHTML = '';
            const todoStories = stories.filter((s: Story) => s.status === 'todo');
            const columnsDiv = document.createElement('div');
            columnsDiv.className = 'stories-columns';
            columnsDiv.appendChild(await createStoryColumn('Do Zrobienia', todoStories, projectId));
            storiesContainer.appendChild(columnsDiv);
        } catch (error) {
            console.error("Błąd w renderStories:", error);
            storiesContainer.innerHTML = '<div class="alert alert-danger">Błąd ładowania historyjek.</div>';
        }
    }
    
    // Kanaban zadania

    async function renderKanbanBoard(projectId: string | null) {
        if (!kanbanBoard) return;
        kanbanBoard.innerHTML = '';
        if (!projectId) {
            if (kanbanSection) kanbanSection.style.display = 'none';
            return;
        }
        if (kanbanSection) kanbanSection.style.display = 'block';
        try {
            const tasks = await apiService.getTasks(projectId);
            kanbanBoard.innerHTML = '';
            const todoTasks = tasks.filter((t: Task) => t.status === 'todo');
            const doingTasks = tasks.filter((t: Task) => t.status === 'doing');
            const doneTasks = tasks.filter((t: Task) => t.status === 'done');
            kanbanBoard.appendChild(await createKanbanColumn('Do Zrobienia', todoTasks, projectId));
            kanbanBoard.appendChild(await createKanbanColumn('W Trakcie', doingTasks, projectId));
            kanbanBoard.appendChild(await createKanbanColumn('Ukończone', doneTasks, projectId));
        } catch (error) {
            console.error("Błąd Kanban:", error);
            kanbanBoard.innerHTML = '<div class="alert alert-danger">Błąd ładowania zadań.</div>';
        }
    }

    // Funkcja fabryczna tworząca pojedynczą kolumnę z kartami historyjek

    async function createStoryColumn(title: string, stories: Story[], projectId: string): Promise<HTMLElement> {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'story-column';
        columnDiv.dataset.status = title.includes('Do Zrobienia') ? 'todo' : title.includes('W Trakcie') ? 'doing' : 'done';
        columnDiv.innerHTML = `<h3 class="h5">${title} <span class="badge bg-secondary rounded-pill">${stories.length}</span></h3>`;
        if (stories.length === 0) {
            columnDiv.innerHTML += '<p class="text-muted small">Brak historyjek.</p>';
        } else {
            for (const story of stories) {
                const card = document.createElement('div');
                card.className = 'card story-item mb-3';
                const sanitizedName = story.name.replace(/\s+/g, '-').toLowerCase();
                card.setAttribute('data-cy', `story-card-${sanitizedName}`);
                let ownerName = 'N/A', tasksCount = 0, doneTasksCount = 0;
                try {
                    const owner = await apiService.getUserDocById(story.ownerId);
                    if (owner) ownerName = owner.firstName;
                    const tasksForStory = await apiService.getTasksByStoryId(story.id);
                    tasksCount = tasksForStory.length;
                    doneTasksCount = tasksForStory.filter((t: Task) => t.status === 'done').length;
                } catch (error) {
                    console.warn(`Nie wczytano danych dla "${story.name}"`, error);
                }
                const priorityMap: { [key in StoryPriority]: { text: string; color: string } } = { low: { text: 'Niski', color: 'info' }, medium: { text: 'Średni', color: 'warning' }, high: { text: 'Wysoki', color: 'danger' } };
                const priorityDetails = priorityMap[story.priority] || { text: 'Brak', color: 'secondary' };
                card.innerHTML = `<div class="card-header d-flex justify-content-between align-items-center"><h4 class="h6 mb-0">${story.name}</h4><span class="badge text-bg-${priorityDetails.color}">${priorityDetails.text}</span></div><div class="card-body"><p class="card-text">${story.description}</p><div class="progress mb-2"><div class="progress-bar" style="width: ${tasksCount > 0 ? (doneTasksCount / tasksCount) * 100 : 0}%"></div></div><p class="card-text"><small class="text-muted">Zadania: ${doneTasksCount}/${tasksCount} | Właściciel: ${ownerName}</small></p></div><div class="card-footer text-end"><div class="btn-group"><button class="btn btn-sm btn-outline-secondary edit-story" title="Edytuj">✏️</button><button class="btn btn-sm btn-outline-danger delete-story" title="Usuń">🗑️</button><button class="btn btn-sm btn-primary add-task-to-story-btn" title="Dodaj zadanie">+</button></div></div>`;
                card.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(story.id));
                card.querySelector('.delete-story')?.addEventListener('click', () => deleteStoryFromList(story.id, story.name));
                card.querySelector('.add-task-to-story-btn')?.addEventListener('click', (e: Event) => { e.stopPropagation(); openTaskModal(projectId, story.id); });
                columnDiv.appendChild(card);
            }
        }
        return columnDiv;
    }

    // Funkcja fabryczna tworząca pojedynczą kolumnę dla tablicy Kanban

    async function createKanbanColumn(title: string, tasks: Task[], projectId: string): Promise<HTMLElement> {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'story-column kanban-board-column';
        columnDiv.dataset.status = title.includes('Do Zrobienia') ? 'todo' : title.includes('W Trakcie') ? 'doing' : 'done';
        columnDiv.innerHTML = `<h3 class="h5">${title} <span class="badge bg-secondary rounded-pill">${tasks.length}</span></h3>`;
        const ul = document.createElement('ul');
        ul.className = 'list-unstyled';
        if (tasks.length === 0) {
            ul.innerHTML = '<li class="text-muted p-2 no-tasks-li">Brak zadań.</li>';
        } else {
            for (const task of tasks) {
                const li = document.createElement('li');
                li.className = 'card task-item mb-2';
                li.dataset.id = task.id;
                li.addEventListener('click', () => openTaskModal(projectId, task.storyId, task.id));
                const story = await apiService.getStoryById(task.storyId);
                const assignedUser = task.assignedUserId ? await apiService.getUserDocById(task.assignedUserId) : null;
                li.innerHTML = `<div class="card-body p-2"><h4 class="card-title h6 mb-1">${task.name}</h4><p class="card-text small text-muted mb-1">Historyjka: ${story ? story.name : 'N/A'}</p>${assignedUser ? `<p class="card-text small mb-0">Przypisany: ${assignedUser.firstName} ${assignedUser.lastName}</p>` : ''}</div>`;
                ul.appendChild(li);
            }
        }
        columnDiv.appendChild(ul);
        return columnDiv;
    }
    
    // Wczytuje dane projektu do formularza w celu edycji

    async function loadProjectForEditing(id: string) {
        const project = await apiService.getProjectById(id);
        if (project) {
            projectNameInput.value = project.name;
            projectDescriptionInput.value = project.description;
            projectIdInput.value = project.id;
            projectNameInput.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Wczytuje dane historyjki do formularza w celu edycji

    async function loadStoryForEditing(storyId: string) {
        const story = await apiService.getStoryById(storyId);
        if (story) {
            storyNameInput.value = story.name;
            storyDescriptionInput.value = story.description;
            storyPrioritySelect.value = story.priority;
            storyIdInput.value = story.id;
            storyFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // Logikę usuwania projektu

    function deleteProject(id: string, name: string) {
        showConfirmationModal(`Czy na pewno chcesz usunąć projekt "${name}"?`, async () => {
            await apiService.deleteProject(id);
            await renderProjects();
            if (apiService.getActiveProjectId() === id) {
                apiService.setActiveProjectId('');
                clearStoriesView();
                if (storyFormContainer) storyFormContainer.style.display = 'none';
                if (kanbanSection) kanbanSection.style.display = 'none';
            }
        });
    }
    
    // Logikę usuwania historyjki
    
    function deleteStoryFromList(storyId: string, name: string) {
        showConfirmationModal(`Czy na pewno chcesz usunąć historyjkę "${name}"?`, async () => {
            const activeProjectId = apiService.getActiveProjectId();
            await apiService.deleteStory(storyId);
            if (activeProjectId) await selectActiveProject(activeProjectId);
        });
    }
 
    // Aktualizuje UI w zależności od stanu zalogowania użytkownika
    
    async function updateUIBasedOnAuthState(user: User | null) {
        try {
            if (user) {
                authContainer.style.display = 'none';
                mainAppContent.style.display = 'block';
                userActionsContainer.style.display = 'flex';
                userDisplayNameElement.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
                
                await renderProjects();
                const activeProjectId = apiService.getActiveProjectId();
                
                if (activeProjectId) {
                    await selectActiveProject(activeProjectId);
                } else {
                    clearStoriesView();
                    if (storyFormContainer) storyFormContainer.style.display = 'none';
                    if (kanbanSection) kanbanSection.style.display = 'none';
                }
            } else {
                authContainer.style.display = 'block';
                mainAppContent.style.display = 'none';
                userActionsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error("Krytyczny błąd UI:", error);
            mainAppContent.innerHTML = `<div class="alert alert-danger">Krytyczny błąd.</div>`;
        }
    }

    // EVENT LISTENERY APLIKACJI
    
    // Listenery dla Autentykacji
    showRegisterLink?.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer.style.display = 'none'; registerFormContainer.style.display = 'block'; });
    showLoginLink?.addEventListener('click', (e) => { e.preventDefault(); registerFormContainer.style.display = 'none'; loginFormContainer.style.display = 'block'; });
    loginForm?.addEventListener('submit', async (event) => { event.preventDefault(); 
        loginErrorP.textContent = ''; 
        try { await apiService.login(loginEmailInput.value, loginPasswordInput.value); } 
        catch (error) { loginErrorP.textContent = "Błąd logowania."; } });
    registerForm?.addEventListener('submit', async (event) => { event.preventDefault(); 
        registerErrorP.textContent = ''; 
        try { const userData = { firstName: registerFirstNameInput.value, lastName: registerLastNameInput.value, role: registerRoleSelect.value as UserRole }; 
        await apiService.register(registerEmailInput.value, registerPasswordInput.value, userData); } 
        catch (error) { registerErrorP.textContent = "Błąd rejestracji."; } });
    logoutButton?.addEventListener('click', async () => { await apiService.logout(); window.location.reload(); });

    // Listenery dla Formularzy (Projekty, Historyjki, Zadania)
    projectForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = projectNameInput.value, description = projectDescriptionInput.value, id = projectIdInput.value;
        if (id) {
            const projectToUpdate = await apiService.getProjectById(id);
            if (projectToUpdate) await apiService.updateProject({ ...projectToUpdate, name, description });
        } else {
            await apiService.saveProject({ name, description });
        }
        projectForm.reset(); projectIdInput.value = '';
        await renderProjects();
    });
    
    storyForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const activeProjectId = apiService.getActiveProjectId();
        if (!activeProjectId) return;
        const name = storyNameInput.value, description = storyDescriptionInput.value, priority = storyPrioritySelect.value as StoryPriority, id = storyIdInput.value;
        const currentUserId = apiService.getCurrentUser()?.id;
        if (!currentUserId) return;
        const storyData: StoryData = { name, description, priority, projectId: activeProjectId, ownerId: currentUserId, status: 'todo' };
        if (id) {
            const storyToUpdate = await apiService.getStoryById(id);
            if (storyToUpdate) await apiService.updateStory({ ...storyToUpdate, ...storyData });
        } else {
            await apiService.saveStory(storyData);
        }
        await selectActiveProject(activeProjectId);
    });

    taskForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = taskIdInput.value, projectId = taskProjectIdInput.value, storyId = taskStoryIdInput.value;
        const taskData: TaskData = { name: taskNameInput.value, description: taskDescriptionInput.value, priority: taskPrioritySelect.value as StoryPriority, storyId, projectId, estimatedTime: parseFloat(taskEstimatedTimeInput.value) };
        taskModalInstance?.hide();
        if (id) {
            const existingTask = await apiService.getTaskById(id);
            if (existingTask) await apiService.updateTask({ ...existingTask, ...taskData });
        } else {
            const taskToSave = { ...taskData, status: 'todo' as TaskStatus };
            await apiService.saveTask(taskToSave);
        }
        await selectActiveProject(projectId);
    });

    // Listenery dla Akcji na Zadaniach
    assignTaskBtn?.addEventListener('click', async () => { if (!currentEditingTaskId) return; const task = await apiService.getTaskById(currentEditingTaskId); if (task && taskAssigneeSelect.value) { task.assignedUserId = taskAssigneeSelect.value; task.status = 'doing'; task.startDate = new Date().toISOString(); await apiService.updateTask(task); await selectActiveProject(task.projectId); openTaskModal(task.projectId, task.storyId, task.id); } });
    completeTaskBtn?.addEventListener('click', async () => { if (!currentEditingTaskId) return; const task = await apiService.getTaskById(currentEditingTaskId); if (task && task.status === 'doing') { task.status = 'done'; task.endDate = new Date().toISOString(); await apiService.updateTask(task); await selectActiveProject(task.projectId); openTaskModal(task.projectId, task.storyId, task.id); } });
    
    // Listenery dla UI (Modale, Motyw)
    confirmDeleteBtn?.addEventListener('click', () => { if (onConfirmDelete) { onConfirmDelete(); onConfirmDelete = null; } confirmationModalInstance?.hide(); });
    themeSwitch?.addEventListener('change', toggleTheme);
    
    // INICJALIZACJA APLIKACJI
    apiService.onAuthStateChangeCallback = updateUIBasedOnAuthState;
    const savedTheme = localStorage.getItem('managme_theme') as 'light' | 'dark' | null;
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || preferredTheme);
});