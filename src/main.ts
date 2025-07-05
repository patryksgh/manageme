import 'bootstrap/dist/css/bootstrap.min.css';
import * as bootstrap from 'bootstrap';

import { ApiService } from './api/ApiService';
import type { Story, StoryData, StoryPriority } from './models/Story';
import type { Task, TaskData, TaskStatus } from './models/Task';
import type { User, UserRole } from './models/User';
import './styles/main.css';

// --- GŁÓWNA INSTANCJA SERWISU I ZMIENNE STANU ---

const apiService = new ApiService();

let modalInstances: {
    task: bootstrap.Modal | null;
    confirmation: bootstrap.Modal | null;
} = {
    task: null,
    confirmation: null,
};

let onConfirmDelete: (() => void) | null = null;
let currentEditingTaskId: string | null = null;


// --- SELEKTORY ELEMENTÓW DOM DLA CZYTELNOŚCI ---

const ui = {
    // Kontenery główne
    authContainer: document.getElementById('auth-container')!,
    mainAppContent: document.getElementById('main-app-content')!,
    userActionsContainer: document.getElementById('user-actions-container')!,
    kanbanSection: document.getElementById('kanban-section')!,
    storiesContainer: document.getElementById('stories-container')!,

    // Autoryzacja
    loginFormContainer: document.getElementById('login-form-container')!,
    registerFormContainer: document.getElementById('register-form-container')!,
    loginForm: document.getElementById('login-form') as HTMLFormElement,
    registerForm: document.getElementById('register-form') as HTMLFormElement,
    loginEmailInput: document.getElementById('login-email') as HTMLInputElement,
    loginPasswordInput: document.getElementById('login-password') as HTMLInputElement,
    loginErrorP: document.getElementById('login-error') as HTMLParagraphElement,
    registerFirstNameInput: document.getElementById('register-firstname') as HTMLInputElement,
    registerLastNameInput: document.getElementById('register-lastname') as HTMLInputElement,
    registerEmailInput: document.getElementById('register-email') as HTMLInputElement,
    registerPasswordInput: document.getElementById('register-password') as HTMLInputElement,
    registerRoleSelect: document.getElementById('register-role') as HTMLSelectElement,
    registerErrorP: document.getElementById('register-error') as HTMLParagraphElement,
    showRegisterLink: document.getElementById('show-register-link') as HTMLAnchorElement,
    showLoginLink: document.getElementById('show-login-link') as HTMLAnchorElement,
    userDisplayNameElement: document.getElementById('user-display-name')!,
    logoutButton: document.getElementById('logout-button') as HTMLButtonElement,

    // Projekty
    projectForm: document.getElementById('project-form') as HTMLFormElement,
    projectNameInput: document.getElementById('project-name') as HTMLInputElement,
    projectDescriptionInput: document.getElementById('project-description') as HTMLTextAreaElement,
    projectIdInput: document.getElementById('project-id') as HTMLInputElement,
    projectsListUl: document.getElementById('projects-list') as HTMLUListElement,

    // Historyjki (Stories)
    storyFormContainer: document.getElementById('story-form-container')!,
    storyForm: document.getElementById('story-form') as HTMLFormElement,
    storyNameInput: document.getElementById('story-name') as HTMLInputElement,
    storyDescriptionInput: document.getElementById('story-description') as HTMLTextAreaElement,
    storyPrioritySelect: document.getElementById('story-priority') as HTMLSelectElement,
    storyIdInput: document.getElementById('story-id') as HTMLInputElement,

    // Zadania (Tasks) i Modal
    taskFormModalEl: document.getElementById('task-form-modal')!,
    taskForm: document.getElementById('task-form') as HTMLFormElement,
    taskFormTitleLabel: document.getElementById('task-form-title-label')!,
    taskIdInput: document.getElementById('task-id') as HTMLInputElement,
    taskProjectIdInput: document.getElementById('task-project-id') as HTMLInputElement,
    taskStoryIdInput: document.getElementById('task-story-id') as HTMLInputElement,
    taskNameInput: document.getElementById('task-name') as HTMLInputElement,
    taskDescriptionInput: document.getElementById('task-description') as HTMLTextAreaElement,
    taskPrioritySelect: document.getElementById('task-priority') as HTMLSelectElement,
    taskEstimatedTimeInput: document.getElementById('task-estimated-time') as HTMLInputElement,
    taskDetailStoryName: document.getElementById('task-detail-story-name')!,
    taskDetailStatus: document.getElementById('task-detail-status')!,
    taskAssigneeSelect: document.getElementById('task-assignee') as HTMLSelectElement,
    assignTaskBtn: document.getElementById('assign-task-btn') as HTMLButtonElement,
    taskDetailStartDate: document.getElementById('task-detail-start-date')!,
    taskDetailEndDate: document.getElementById('task-detail-end-date')!,
    completeTaskBtn: document.getElementById('complete-task-btn') as HTMLButtonElement,

    // Kanban
    kanbanBoard: document.getElementById('kanban-board')!,

    // Modal potwierdzenia
    confirmationModalEl: document.getElementById('confirmation-modal')!,
    confirmationModalBody: document.getElementById('confirmation-modal-body')!,
    confirmDeleteBtn: document.getElementById('confirm-delete-btn') as HTMLButtonElement,

    // Inne
    themeSwitch: document.getElementById('theme-switch') as HTMLInputElement,
};


// --- FUNKCJE POMOCNICZE I UŻYTKOWE ---

/**
 * Ustawia motyw aplikacji (jasny/ciemny) i zapisuje wybór w localStorage.
 * @param {'light' | 'dark'} theme - Nazwa motywu.
 */
function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('managme_theme', theme);
    if (ui.themeSwitch) {
        ui.themeSwitch.checked = theme === 'dark';
    }
}

/** Przełącza motyw aplikacji. */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Wyświetla modal z prośbą o potwierdzenie akcji.
 * @param message - Wiadomość do wyświetlenia.
 * @param onConfirm - Funkcja, która zostanie wykonana po potwierdzeniu.
 */
function showConfirmationModal(message: string, onConfirm: () => void) {
    onConfirmDelete = onConfirm;
    if (ui.confirmationModalBody) {
        ui.confirmationModalBody.textContent = message;
    }
    modalInstances.confirmation?.show();
}

/** Czyści widok historyjek, gdy żaden projekt nie jest wybrany. */
function clearStoriesView() {
    if (ui.storiesContainer) {
        ui.storiesContainer.innerHTML = '<div class="alert alert-info">Wybierz projekt z listy.</div>';
    }
}


// --- OBSŁUGA PRZECIĄGNIJ I UPUŚĆ (DRAG & DROP) ---

function handleDragStart(e: DragEvent) {
    const target = e.target as HTMLElement;
    if (target?.classList.contains('task-item')) {
        e.dataTransfer?.setData('text/plain', target.dataset.id || '');
        // Używamy setTimeout, aby uniknąć "mrugania" elementu podczas przeciągania
        setTimeout(() => target.classList.add('is-dragging'), 0);
    }
}

function handleDragEnd(e: DragEvent) {
    (e.target as HTMLElement)?.classList.remove('is-dragging');
}

function handleDragOver(e: DragEvent) {
    e.preventDefault(); // Niezbędne, aby umożliwić upuszczenie elementu
}

async function handleDrop(e: DragEvent) {
    e.preventDefault();
    const targetColumn = (e.target as HTMLElement).closest('.story-column');
    if (!targetColumn) return;

    const newStatus = (targetColumn as HTMLElement).dataset.status as TaskStatus;
    const taskId = e.dataTransfer?.getData('text/plain');
    const activeProjectId = apiService.getActiveProjectId();

    if (!newStatus || !taskId || !activeProjectId) return;

    try {
        const task = await apiService.getTaskById(taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            await apiService.updateTask(task);
            // Odśwież widoki po zmianie
            await renderKanbanBoard(activeProjectId);
            await renderStories(activeProjectId);
        }
    } catch (error) {
        console.error("Błąd podczas zmiany statusu zadania:", error);
    }
}


// --- FUNKCJE RENDERUJĄCE KOMPONENTY ---

/**
 * Renderuje listę projektów użytkownika.
 */
async function renderProjects() {
    if (!ui.projectsListUl) return;
    ui.projectsListUl.innerHTML = '<li class="list-group-item">Ładowanie...</li>';

    try {
        const projects = await apiService.getProjects();
        const activeProjectId = apiService.getActiveProjectId();
        ui.projectsListUl.innerHTML = '';

        if (projects.length === 0) {
            ui.projectsListUl.innerHTML = '<li class="list-group-item text-muted">Brak projektów.</li>';
            return;
        }

        projects.forEach((project) => {
            const li = document.createElement('li');
            const sanitizedName = project.name.replace(/\s+/g, '-').toLowerCase();
            li.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-start ${
                project.id === activeProjectId ? 'active' : ''
            }`;
            li.style.cursor = 'pointer';
            li.setAttribute('data-cy', `project-item-${sanitizedName}`);
            li.addEventListener('click', () => selectActiveProject(project.id));

            li.innerHTML = `
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${project.name}</div>
                    <small class="text-muted">${project.description}</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-secondary" title="Edytuj">✏️</button>
                    <button class="btn btn-sm btn-outline-danger" title="Usuń">🗑️</button>
                </div>
            `;
            
            li.querySelector('.btn-outline-secondary')?.addEventListener('click', (e) => {
                e.stopPropagation();
                loadProjectForEditing(project.id);
            });
            li.querySelector('.btn-outline-danger')?.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteProject(project.id, project.name);
            });

            ui.projectsListUl.appendChild(li);
        });
    } catch (error) {
        console.error("Błąd w renderProjects:", error);
        ui.projectsListUl.innerHTML = '<li class="list-group-item list-group-item-danger">Błąd ładowania projektów.</li>';
    }
}

/**
 * Tworzy i zwraca kolumnę dla tablicy Kanban.
 * @param title - Tytuł kolumny.
 * @param tasks - Lista zadań do wyświetlenia w kolumnie.
 * @param projectId - ID bieżącego projektu.
 * @returns Element HTMLElement reprezentujący kolumnę.
 */
async function createKanbanColumn(title: string, tasks: Task[], projectId: string): Promise<HTMLElement> {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'story-column';
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
            li.draggable = true;
            li.addEventListener('click', () => openTaskModal(projectId, task.storyId, task.id));

            const story = await apiService.getStoryById(task.storyId);
            const assignedUser = task.assignedUserId ? await apiService.getUserDocById(task.assignedUserId) : null;

            li.innerHTML = `
                <div class="card-body p-2">
                    <h4 class="card-title h6 mb-1">${task.name}</h4>
                    <p class="card-text small text-muted mb-1">Historyjka: ${story ? story.name : 'N/A'}</p>
                    ${assignedUser ? `<p class="card-text small mb-0">Przypisany: ${assignedUser.firstName} ${assignedUser.lastName}</p>` : ''}
                </div>`;
            ul.appendChild(li);
        }
    }
    columnDiv.appendChild(ul);
    return columnDiv;
}

/**
 * Renderuje tablicę Kanban dla aktywnego projektu.
 * @param projectId - ID aktywnego projektu.
 */
async function renderKanbanBoard(projectId: string | null) {
    if (!ui.kanbanBoard || !ui.kanbanSection) return;

    if (!projectId) {
        ui.kanbanSection.style.display = 'none';
        return;
    }
    ui.kanbanSection.style.display = 'block';
    
    try {
        const tasks = await apiService.getTasks(projectId);
        ui.kanbanBoard.innerHTML = ''; // Wyczyść przed renderowaniem

        const todoTasks = tasks.filter((t) => t.status === 'todo');
        const doingTasks = tasks.filter((t) => t.status === 'doing');
        const doneTasks = tasks.filter((t) => t.status === 'done');

        ui.kanbanBoard.appendChild(await createKanbanColumn('Do Zrobienia', todoTasks, projectId));
        ui.kanbanBoard.appendChild(await createKanbanColumn('W Trakcie', doingTasks, projectId));
        ui.kanbanBoard.appendChild(await createKanbanColumn('Ukończone', doneTasks, projectId));

    } catch (error) {
        console.error("Błąd podczas renderowania tablicy Kanban:", error);
        ui.kanbanBoard.innerHTML = '<div class="alert alert-danger">Błąd ładowania zadań na tablicę.</div>';
    }
}

/**
 * Tworzy i zwraca kolumnę z historyjkami.
 * @param title - Tytuł kolumny.
 * @param stories - Lista historyjek do wyświetlenia.
 * @param projectId - ID bieżącego projektu.
 * @returns Element HTMLElement reprezentujący kolumnę.
 */
async function createStoryColumn(title: string, stories: Story[], projectId: string): Promise<HTMLElement> {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'story-column';
    columnDiv.innerHTML = `<h3 class="h5">${title} <span class="badge bg-secondary rounded-pill">${stories.length}</span></h3>`;

    if (stories.length === 0) {
        columnDiv.innerHTML += '<p class="text-muted small">Brak historyjek.</p>';
    } else {
        for (const story of stories) {
            const card = document.createElement('div');
            card.className = 'card story-item mb-3';
            const sanitizedName = story.name.replace(/\s+/g, '-').toLowerCase();
            card.setAttribute('data-cy', `story-card-${sanitizedName}`);

            let ownerName = 'Brak';
            let tasksCount = 0, doneTasksCount = 0;
            try {
                const owner = await apiService.getUserDocById(story.ownerId);
                if (owner) ownerName = `${owner.firstName} ${owner.lastName}`;
                const tasksForStory = await apiService.getTasksByStoryId(story.id);
                tasksCount = tasksForStory.length;
                doneTasksCount = tasksForStory.filter((t) => t.status === 'done').length;
            } catch (error) {
                console.warn(`Nie udało się wczytać pełnych danych dla historyjki "${story.name}"`, error);
            }

            const priorityMap: { [key in StoryPriority]: { text: string; color: string } } = {
                low: { text: 'Niski', color: 'info' },
                medium: { text: 'Średni', color: 'warning' },
                high: { text: 'Wysoki', color: 'danger' },
            };
            const priorityDetails = priorityMap[story.priority] || { text: 'Brak', color: 'secondary' };
            const progress = tasksCount > 0 ? (doneTasksCount / tasksCount) * 100 : 0;
            
            card.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4 class="h6 mb-0">${story.name}</h4>
                    <span class="badge text-bg-${priorityDetails.color}">${priorityDetails.text}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${story.description}</p>
                    <div class="progress mb-2" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <p class="card-text"><small class="text-muted">Zadania: ${doneTasksCount}/${tasksCount} | Właściciel: ${ownerName}</small></p>
                </div>
                <div class="card-footer text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary edit-story" title="Edytuj">✏️</button>
                        <button class="btn btn-sm btn-outline-danger delete-story" title="Usuń">🗑️</button>
                        <button class="btn btn-sm btn-primary add-task-to-story-btn" title="Dodaj zadanie">+</button>
                    </div>
                </div>`;
            
            card.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(story.id));
            card.querySelector('.delete-story')?.addEventListener('click', () => handleDeleteStory(story.id, story.name));
            card.querySelector('.add-task-to-story-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskModal(projectId, story.id);
            });
            columnDiv.appendChild(card);
        }
    }
    return columnDiv;
}

/**
 * Renderuje widok z historyjkami dla aktywnego projektu.
 * @param projectId - ID aktywnego projektu.
 */
async function renderStories(projectId: string | null) {
    if (!ui.storiesContainer) return;

    if (!projectId) {
        clearStoriesView();
        return;
    }
    ui.storiesContainer.innerHTML = '<div class="alert alert-info">Ładowanie historyjek...</div>';

    try {
        const stories = await apiService.getStories(projectId);
        ui.storiesContainer.innerHTML = '';

        const todoStories = stories.filter((s) => s.status === 'todo');
        const doingStories = stories.filter((s) => s.status === 'doing');
        const doneStories = stories.filter((s) => s.status === 'done');
        
        const columnsDiv = document.createElement('div');
        columnsDiv.className = 'stories-columns';

        columnsDiv.appendChild(await createStoryColumn('Do Zrobienia', todoStories, projectId));
        columnsDiv.appendChild(await createStoryColumn('W Trakcie', doingStories, projectId));
        columnsDiv.appendChild(await createStoryColumn('Ukończone', doneStories, projectId));
        
        ui.storiesContainer.appendChild(columnsDiv);
    } catch (error) {
        console.error("Błąd w renderStories:", error);
        ui.storiesContainer.innerHTML = '<div class="alert alert-danger">Błąd ładowania historyjek.</div>';
    }
}


// --- AKCJE I OPERACJE NA DANYCH ---

/**
 * Aktualizuje UI w zależności od stanu autoryzacji.
 * @param user - Zalogowany użytkownik lub null.
 */
async function updateUIOnAuthStateChange(user: User | null) {
    if (user) {
        ui.authContainer.style.display = 'none';
        ui.mainAppContent.style.display = 'block';
        ui.userActionsContainer.style.display = 'flex';
        ui.userDisplayNameElement.textContent = `${user.firstName} ${user.lastName} (${user.role})`;

        await renderProjects();
        const activeProjectId = apiService.getActiveProjectId();
        
        if (activeProjectId) {
            if(ui.storyFormContainer) ui.storyFormContainer.style.display = 'block';
            await renderStories(activeProjectId);
            await renderKanbanBoard(activeProjectId);
        } else {
            clearStoriesView();
            if(ui.storyFormContainer) ui.storyFormContainer.style.display = 'none';
            if(ui.kanbanSection) ui.kanbanSection.style.display = 'none';
        }
    } else {
        ui.authContainer.style.display = 'block';
        ui.mainAppContent.style.display = 'none';
        ui.userActionsContainer.style.display = 'none';
    }
}

/**
 * Ustawia wybrany projekt jako aktywny i odświeża widoki.
 * @param projectId - ID wybranego projektu.
 */
async function selectActiveProject(projectId: string) {
    apiService.setActiveProjectId(projectId);
    
    // Zresetuj formularz historyjki przy zmianie projektu
    ui.storyForm.reset();
    ui.storyIdInput.value = '';

    if (ui.storyFormContainer) {
        ui.storyFormContainer.style.display = 'block';
    }

    await renderProjects();
    await renderStories(projectId);
    await renderKanbanBoard(projectId);
}

/**
 * Wczytuje dane projektu do formularza w celu edycji.
 * @param id - ID projektu do edycji.
 */
async function loadProjectForEditing(id: string) {
    try {
        const project = await apiService.getProjectById(id);
        if (project) {
            ui.projectNameInput.value = project.name;
            ui.projectDescriptionInput.value = project.description;
            ui.projectIdInput.value = project.id;
            ui.projectNameInput.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error("Błąd wczytywania projektu do edycji:", error);
    }
}

/**
 * Inicjuje proces usuwania projektu po potwierdzeniu.
 * @param id - ID projektu do usunięcia.
 * @param name - Nazwa projektu do wyświetlenia w potwierdzeniu.
 */
function handleDeleteProject(id: string, name: string) {
    showConfirmationModal(`Czy na pewno chcesz usunąć projekt "${name}"? Spowoduje to usunięcie wszystkich powiązanych historyjek i zadań.`, async () => {
        try {
            await apiService.deleteProject(id);
            await renderProjects();

            if (apiService.getActiveProjectId() === id) {
                apiService.setActiveProjectId('');
                clearStoriesView();
                if (ui.storyFormContainer) ui.storyFormContainer.style.display = 'none';
                if (ui.kanbanSection) ui.kanbanSection.style.display = 'none';
            }
        } catch (error) {
            console.error("Błąd podczas usuwania projektu:", error);
        }
    });
}

/**
 * Wczytuje dane historyjki do formularza w celu edycji.
 * @param storyId - ID historyjki do edycji.
 */
async function loadStoryForEditing(storyId: string) {
    try {
        const story = await apiService.getStoryById(storyId);
        if (story) {
            ui.storyNameInput.value = story.name;
            ui.storyDescriptionInput.value = story.description;
            ui.storyPrioritySelect.value = story.priority;
            ui.storyIdInput.value = story.id;
            ui.storyFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error("Błąd wczytywania historyjki do edycji:", error);
    }
}

/**
 * Inicjuje proces usuwania historyjki po potwierdzeniu.
 * @param storyId - ID historyjki do usunięcia.
 * @param name - Nazwa historyjki do wyświetlenia w potwierdzeniu.
 */
function handleDeleteStory(storyId: string, name: string) {
    showConfirmationModal(`Czy na pewno chcesz usunąć historyjkę "${name}"?`, async () => {
        try {
            await apiService.deleteStory(storyId);
            const activeProjectId = apiService.getActiveProjectId();
            if (activeProjectId) {
                await renderStories(activeProjectId);
            }
        } catch (error) {
            console.error("Błąd podczas usuwania historyjki:", error);
        }
    });
}

/**
 * Otwiera modal do tworzenia lub edycji zadania.
 * @param projectId - ID projektu, do którego należy zadanie.
 * @param storyId - ID historyjki, do której należy zadanie.
 * @param taskId - Opcjonalne ID zadania do edycji.
 */
async function openTaskModal(projectId: string, storyId: string, taskId?: string) {
    ui.taskForm.reset();
    currentEditingTaskId = taskId || null;
    ui.taskProjectIdInput.value = projectId;
    ui.taskStoryIdInput.value = storyId;

    try {
        // Wypełnij dane podstawowe i listę użytkowników
        const story = await apiService.getStoryById(storyId);
        ui.taskDetailStoryName.textContent = story ? story.name : 'N/A';
        ui.taskAssigneeSelect.innerHTML = '<option value="">-- Wybierz programistę --</option>';
        const allUsers = await apiService.getAllUsers();
        allUsers.forEach((user) => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
            ui.taskAssigneeSelect.appendChild(option);
        });

        // Dostosuj modal w zależności od tego, czy edytujemy, czy tworzymy zadanie
        if (taskId) {
            ui.taskFormTitleLabel.textContent = 'Edytuj Zadanie';
            const task = await apiService.getTaskById(taskId);
            if (task) {
                ui.taskIdInput.value = task.id;
                ui.taskNameInput.value = task.name;
                ui.taskDescriptionInput.value = task.description;
                ui.taskPrioritySelect.value = task.priority;
                ui.taskEstimatedTimeInput.value = task.estimatedTime.toString();
                ui.taskDetailStatus.textContent = task.status;
                ui.taskAssigneeSelect.value = task.assignedUserId || '';
                ui.taskDetailStartDate.textContent = task.startDate ? new Date(task.startDate).toLocaleString() : '-';
                ui.taskDetailEndDate.textContent = task.endDate ? new Date(task.endDate).toLocaleString() : '-';

                const isTodo = task.status === 'todo';
                const isDoing = task.status === 'doing';
                ui.taskAssigneeSelect.disabled = !isTodo;
                ui.assignTaskBtn.style.display = isTodo ? 'inline-block' : 'none';
                ui.completeTaskBtn.style.display = isDoing ? 'inline-block' : 'none';
            }
        } else {
            ui.taskFormTitleLabel.textContent = 'Dodaj Nowe Zadanie';
            ui.taskIdInput.value = '';
            ui.taskDetailStatus.textContent = 'todo (nowe)';
            ui.taskAssigneeSelect.value = '';
            ui.taskAssigneeSelect.disabled = true;
            ui.assignTaskBtn.style.display = 'none';
            ui.taskDetailStartDate.textContent = '-';
            ui.taskDetailEndDate.textContent = '-';
            ui.completeTaskBtn.style.display = 'none';
        }
        
        modalInstances.task?.show();
    } catch (error) {
        console.error("Błąd podczas otwierania modala zadania:", error);
        // Można dodać powiadomienie dla użytkownika
    }
}


// --- HANDLERY ZDARZEŃ ---

function handleShowRegisterForm(e: Event) {
    e.preventDefault();
    ui.loginFormContainer.style.display = 'none';
    ui.registerFormContainer.style.display = 'block';
}

function handleShowLoginForm(e: Event) {
    e.preventDefault();
    ui.registerFormContainer.style.display = 'none';
    ui.loginFormContainer.style.display = 'block';
}

async function handleLoginSubmit(event: SubmitEvent) {
    event.preventDefault();
    ui.loginErrorP.textContent = '';
    try {
        await apiService.login(ui.loginEmailInput.value, ui.loginPasswordInput.value);
    } catch (error) {
        console.error("Błąd logowania:", error);
        ui.loginErrorP.textContent = "Nieprawidłowy e-mail lub hasło.";
    }
}

async function handleRegisterSubmit(event: SubmitEvent) {
    event.preventDefault();
    ui.registerErrorP.textContent = '';
    try {
        const userData = {
            firstName: ui.registerFirstNameInput.value,
            lastName: ui.registerLastNameInput.value,
            role: ui.registerRoleSelect.value as UserRole,
        };
        await apiService.register(ui.registerEmailInput.value, ui.registerPasswordInput.value, userData);
        // Po udanej rejestracji można automatycznie zalogować lub przełączyć na formularz logowania
        handleShowLoginForm(event); 
    } catch (error) {
        console.error("Błąd rejestracji:", error);
        ui.registerErrorP.textContent = "Błąd podczas rejestracji. Spróbuj ponownie.";
    }
}

async function handleLogout() {
    await apiService.logout();
    // Przeładowanie strony jest prostym sposobem na zresetowanie stanu aplikacji
    window.location.reload();
}

async function handleProjectFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const name = ui.projectNameInput.value;
    const description = ui.projectDescriptionInput.value;
    const id = ui.projectIdInput.value;

    try {
        if (id) {
            const projectToUpdate = await apiService.getProjectById(id);
            if (projectToUpdate) {
                await apiService.updateProject({ ...projectToUpdate, name, description });
            }
        } else {
            await apiService.saveProject({ name, description });
        }
        ui.projectForm.reset();
        ui.projectIdInput.value = '';
        await renderProjects();
    } catch (error) {
        console.error("Błąd zapisu projektu:", error);
    }
}

async function handleStoryFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const activeProjectId = apiService.getActiveProjectId();
    const currentUserId = apiService.getCurrentUser()?.id;

    if (!activeProjectId || !currentUserId) {
        alert("Nie wybrano aktywnego projektu lub użytkownik nie jest zalogowany.");
        return;
    }
    
    const storyData: StoryData = {
        name: ui.storyNameInput.value,
        description: ui.storyDescriptionInput.value,
        priority: ui.storyPrioritySelect.value as StoryPriority,
        projectId: activeProjectId,
        status: 'todo',
        ownerId: currentUserId,
    };
    const id = ui.storyIdInput.value;

    try {
        if (id) {
            const storyToUpdate = await apiService.getStoryById(id);
            if (storyToUpdate) {
                await apiService.updateStory({ ...storyToUpdate, ...storyData });
            }
        } else {
            await apiService.saveStory(storyData);
        }
        ui.storyForm.reset();
        ui.storyIdInput.value = '';
        await renderStories(activeProjectId);
    } catch (error) {
        console.error("Błąd zapisu historyjki:", error);
    }
}

async function handleTaskFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    const id = ui.taskIdInput.value;
    const projectId = ui.taskProjectIdInput.value;
    const storyId = ui.taskStoryIdInput.value;

    const taskData: TaskData = {
        name: ui.taskNameInput.value,
        description: ui.taskDescriptionInput.value,
        priority: ui.taskPrioritySelect.value as StoryPriority,
        storyId,
        projectId,
        estimatedTime: parseFloat(ui.taskEstimatedTimeInput.value) || 0,
    };

    try {
        if (id) {
            const existingTask = await apiService.getTaskById(id);
            if (existingTask) {
                await apiService.updateTask({ ...existingTask, ...taskData });
            }
        } else {
            await apiService.saveTask(taskData);
        }
        
        modalInstances.task?.hide();
        await renderKanbanBoard(projectId);
        await renderStories(projectId);
    } catch (error) {
        console.error("Błąd zapisu zadania:", error);
    }
}

async function handleAssignTask() {
    if (!currentEditingTaskId) return;

    try {
        const task = await apiService.getTaskById(currentEditingTaskId);
        if (task && ui.taskAssigneeSelect.value) {
            task.assignedUserId = ui.taskAssigneeSelect.value;
            task.status = 'doing';
            task.startDate = new Date().toISOString();
            await apiService.updateTask(task);
            
            // Odśwież widoki
            await openTaskModal(task.projectId, task.storyId, task.id);
            await renderKanbanBoard(task.projectId);
            await renderStories(task.projectId);
        }
    } catch (error) {
        console.error("Błąd przypisywania zadania:", error);
    }
}

async function handleCompleteTask() {
    if (!currentEditingTaskId) return;
    try {
        const task = await apiService.getTaskById(currentEditingTaskId);
        if (task && task.status === 'doing') {
            task.status = 'done';
            task.endDate = new Date().toISOString();
            await apiService.updateTask(task);

            // Odśwież widoki
            await openTaskModal(task.projectId, task.storyId, task.id);
            await renderKanbanBoard(task.projectId);
            await renderStories(task.projectId);
        }
    } catch (error) {
        console.error("Błąd oznaczania zadania jako ukończone:", error);
    }
}

function handleConfirmDelete() {
    if (onConfirmDelete) {
        onConfirmDelete();
        onConfirmDelete = null; // Wyczyść po wykonaniu
    }
    modalInstances.confirmation?.hide();
}


// --- GŁÓWNY PUNKT WEJŚCIOWY APLIKACJI ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja instancji modali Bootstrap
    if (ui.taskFormModalEl) {
        modalInstances.task = new bootstrap.Modal(ui.taskFormModalEl);
    }
    if (ui.confirmationModalEl) {
        modalInstances.confirmation = new bootstrap.Modal(ui.confirmationModalEl);
    }

    // Ustawienie motywu
    const savedTheme = localStorage.getItem('managme_theme') as 'light' | 'dark' | null;
    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme || preferredTheme);
    
    // Podpięcie callbacku do serwisu API
    apiService.onAuthStateChangeCallback = updateUIOnAuthStateChange;

    // Przypisanie handlerów do elementów UI
    ui.showRegisterLink?.addEventListener('click', handleShowRegisterForm);
    ui.showLoginLink?.addEventListener('click', handleShowLoginForm);
    ui.loginForm?.addEventListener('submit', handleLoginSubmit);
    ui.registerForm?.addEventListener('submit', handleRegisterSubmit);
    ui.logoutButton?.addEventListener('click', handleLogout);

    ui.projectForm?.addEventListener('submit', handleProjectFormSubmit);
    ui.storyForm?.addEventListener('submit', handleStoryFormSubmit);
    ui.taskForm?.addEventListener('submit', handleTaskFormSubmit);
    
    ui.assignTaskBtn?.addEventListener('click', handleAssignTask);
    ui.completeTaskBtn?.addEventListener('click', handleCompleteTask);
    
    ui.confirmDeleteBtn?.addEventListener('click', handleConfirmDelete);
    ui.themeSwitch?.addEventListener('change', toggleTheme);

    // Przypisanie handlerów do tablicy Kanban (delegacja zdarzeń)
    ui.kanbanBoard?.addEventListener('dragstart', handleDragStart);
    ui.kanbanBoard?.addEventListener('dragend', handleDragEnd);
    ui.kanbanBoard?.addEventListener('dragover', handleDragOver);
    ui.kanbanBoard?.addEventListener('drop', handleDrop);
});