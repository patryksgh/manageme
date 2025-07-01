import { ApiService } from './api/ApiService';
import { type Project } from './models/Project';
import { type Story, type StoryPriority, type StoryStatus } from './models/Story';
import { type Task, type TaskStatus } from './models/Task';
import { type User } from './models/User'; // Upewnij się, że ten import jest
import './styles/main.css';

// Krok 2: Tworzymy jedną instancję naszego serwisu.
const apiService = new ApiService();

// Krok 3: Deklarujemy ZMIENNE dla elementów DOM.
// Nie przypisujemy im wartości od razu! Robimy to w initializeApp.
let loginFormContainer: HTMLElement | null = null;
let loginForm: HTMLFormElement | null = null;
let loginUsernameInput: HTMLInputElement | null = null;
let loginPasswordInput: HTMLInputElement | null = null;
let loginErrorP: HTMLParagraphElement | null = null;

let mainAppContent: HTMLElement | null = null;
let userActionsContainer: HTMLElement | null = null;
let userDisplayNameElement: HTMLElement | null = null;
let logoutButton: HTMLButtonElement | null = null;

let projectForm: HTMLFormElement | null = null;
let projectNameInput: HTMLInputElement | null = null;
let projectDescriptionInput: HTMLTextAreaElement | null = null;
let projectIdInput: HTMLInputElement | null = null;
let projectsListUl: HTMLUListElement | null = null;

let storiesContainer: HTMLElement | null = null;
let storyFormContainer: HTMLElement | null = null;
let storyForm: HTMLFormElement | null = null;
let storyNameInput: HTMLInputElement | null = null;
let storyDescriptionInput: HTMLTextAreaElement | null = null;
let storyPrioritySelect: HTMLSelectElement | null = null;
let storyIdInput: HTMLInputElement | null = null;

let taskFormModal: HTMLElement | null = null;
let closeTaskModalBtn: HTMLElement | null = null;
let taskForm: HTMLFormElement | null = null;
let taskFormTitle: HTMLElement | null = null;
let taskIdInput: HTMLInputElement | null = null;
let taskProjectIdInput: HTMLInputElement | null = null;
let taskStoryIdInput: HTMLInputElement | null = null;
let taskNameInput: HTMLInputElement | null = null;
let taskDescriptionInput: HTMLTextAreaElement | null = null;
let taskPrioritySelect: HTMLSelectElement | null = null;
let taskEstimatedTimeInput: HTMLInputElement | null = null;

let taskDetailStoryName: HTMLElement | null = null;
let taskDetailStatus: HTMLElement | null = null;
let taskAssigneeSelect: HTMLSelectElement | null = null;
let assignTaskBtn: HTMLButtonElement | null = null;
let taskDetailStartDate: HTMLElement | null = null;
let taskDetailEndDate: HTMLElement | null = null;
let completeTaskBtn: HTMLButtonElement | null = null;

let kanbanSection: HTMLElement | null = null;
let kanbanBoard: HTMLElement | null = null;

let currentEditingTaskId: string | null = null;

// ==========================================================================
// Funkcje pozostają w większości bez zmian, ale teraz będą używać
// zmiennych zadeklarowanych wyżej, które zostaną zainicjalizowane później.
// Zmieniamy też `api.` i `authService.` na `apiService.`.
// ==========================================================================

function openTaskModal(projectId: string, storyId: string, taskId?: string) {
  // Dodajemy zabezpieczenie na górze funkcji
  if (!taskForm || !taskProjectIdInput || !taskStoryIdInput || !taskDetailStoryName || !taskAssigneeSelect || !taskFormTitle || !taskIdInput || !taskNameInput || !taskDescriptionInput || !taskPrioritySelect || !taskEstimatedTimeInput || !taskDetailStatus || !assignTaskBtn || !completeTaskBtn || !taskDetailStartDate || !taskDetailEndDate || !taskFormModal) return;

  taskForm.reset();
  currentEditingTaskId = taskId || null;
  taskProjectIdInput.value = projectId;
  taskStoryIdInput.value = storyId;

  const story = apiService.getStoryById(projectId, storyId);
  taskDetailStoryName.textContent = story ? story.name : 'Nieznana historyjka';

  taskAssigneeSelect.innerHTML = '<option value="">-- Wybierz --</option>';
  const assignableUsers = apiService.getUsersByRoles(['developer', 'devops']);
  assignableUsers.forEach((user: User) => { // Dodajemy jawny typ
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
    taskAssigneeSelect!.appendChild(option);
  });

  if (taskId) {
    taskFormTitle.textContent = 'Edytuj Zadanie';
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
      if (task.status === 'todo') {
        taskAssigneeSelect.disabled = false;
        assignTaskBtn.style.display = 'inline-block';
        completeTaskBtn.style.display = 'none';
      } else if (task.status === 'doing') {
        taskAssigneeSelect.disabled = true;
        assignTaskBtn.style.display = 'none';
        completeTaskBtn.style.display = 'inline-block';
      } else {
        taskAssigneeSelect.disabled = true;
        assignTaskBtn.style.display = 'none';
        completeTaskBtn.style.display = 'none';
      }
    }
  } else {
    taskFormTitle.textContent = 'Dodaj Nowe Zadanie';
    taskIdInput.value = '';
    taskDetailStatus.textContent = 'todo (nowe)';
    taskAssigneeSelect.value = '';
    taskAssigneeSelect.disabled = true;
    assignTaskBtn.style.display = 'none';
    taskDetailStartDate.textContent = '-';
    taskDetailEndDate.textContent = '-';
    completeTaskBtn.style.display = 'none';
  }
  taskFormModal.style.display = 'block';
}

function closeTaskModal() {
  if (taskFormModal) taskFormModal.style.display = 'none';
  currentEditingTaskId = null;
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
  const todoTasks = tasks.filter((t: Task) => t.status === 'todo'); // Jawny typ
  const doingTasks = tasks.filter((t: Task) => t.status === 'doing'); // Jawny typ
  const doneTasks = tasks.filter((t: Task) => t.status === 'done'); // Jawny typ
  kanbanBoard.appendChild(createKanbanColumn('Zadania: Do Zrobienia', todoTasks, projectId, 'todo'));
  kanbanBoard.appendChild(createKanbanColumn('Zadania: W Trakcie', doingTasks, projectId, 'doing'));
  kanbanBoard.appendChild(createKanbanColumn('Zadania: Ukończone', doneTasks, projectId, 'done'));
}

function createKanbanColumn(title: string, tasks: Task[], projectId: string, _status: TaskStatus): HTMLElement {
  const columnDiv = document.createElement('div');
  columnDiv.classList.add('story-column');
  columnDiv.innerHTML = `<h3>${title} (${tasks.length})</h3>`;
  const ul = document.createElement('ul');
  if (tasks.length === 0) {
    ul.innerHTML = '<li>Brak zadań.</li>';
  } else {
    tasks.forEach((task: Task) => { // Jawny typ
      const li = document.createElement('li');
      li.classList.add('task-item');
      li.dataset.id = task.id;
      li.onclick = () => openTaskModal(projectId, task.storyId, task.id);
      const story = apiService.getStoryById(projectId, task.storyId);
      const assignedUser = task.assignedUserId ? apiService.getUserById(task.assignedUserId) : null;
      li.innerHTML = `
        <h4>${task.name}</h4>
        <p><small>Historyjka: ${story ? story.name : 'N/A'}</small></p>
        <p><small>Priorytet: ${task.priority}</small></p>
        <p><small>Czas: ${task.estimatedTime}h</small></p>
        ${assignedUser ? `<p><small>Przypisany: ${assignedUser.firstName} ${assignedUser.lastName}</small></p>` : ''}
      `;
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
    projectsListUl.innerHTML = '<li>Brak projektów. Dodaj nowy!</li>';
    return;
  }
  projects.forEach((project: Project) => { // Jawny typ
    const li = document.createElement('li');
    li.classList.add('project-item');
    if (project.id === activeProjectId) li.classList.add('active-project');
    li.dataset.id = project.id;
    const projectInfoDiv = document.createElement('div');
    projectInfoDiv.classList.add('project-item-info');
    projectInfoDiv.innerHTML = `
      <strong>${project.name}</strong>
      <p><small>Opis: ${project.description}</small></p>
      <p><small>Utworzono: ${new Date(project.createdAt).toLocaleDateString()}</small></p>
    `;
    projectInfoDiv.onclick = () => selectActiveProject(project.id);
    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('project-item-actions');
    const selectButton = document.createElement('button');
    selectButton.textContent = 'Wybierz';
    selectButton.classList.add('select');
    selectButton.onclick = () => selectActiveProject(project.id);
    const editButton = document.createElement('button');
    editButton.textContent = 'Edytuj';
    editButton.classList.add('edit');
    editButton.onclick = (e) => { e.stopPropagation(); loadProjectForEditing(project.id); };
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Usuń';
    deleteButton.classList.add('delete');
    deleteButton.onclick = (e) => { e.stopPropagation(); deleteProject(project.id); };
    actionsDiv.append(selectButton, editButton, deleteButton);
    li.append(projectInfoDiv, actionsDiv);
    projectsListUl!.appendChild(li);
  });
}

function loadProjectForEditing(id: string) {
  if (!projectNameInput || !projectDescriptionInput || !projectIdInput) return;
  const project = apiService.getProjectById(id);
  if (project) {
    projectNameInput.value = project.name;
    projectDescriptionInput.value = project.description;
    projectIdInput.value = project.id;
  }
}

function deleteProject(id: string) {
  if (confirm('Czy na pewno chcesz usunąć ten projekt oraz wszystkie jego historyjki?')) {
    const wasActive = apiService.getActiveProjectId() === id;
    const success = apiService.deleteProject(id);
    if (success) {
      renderProjects();
      if (wasActive) {
        clearStoriesView();
        if (storyFormContainer) storyFormContainer.style.display = 'none';
        if (kanbanSection) kanbanSection.style.display = 'none';
      }
    } else {
      alert('Nie udało się usunąć projektu.');
    }
  }
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
  const todoStories = stories.filter((s: Story) => s.status === 'todo'); // Jawny typ
  const doingStories = stories.filter((s: Story) => s.status === 'doing'); // Jawny typ
  const doneStories = stories.filter((s: Story) => s.status === 'done'); // Jawny typ
  const columnsDiv = document.createElement('div');
  columnsDiv.classList.add('stories-columns');
  columnsDiv.appendChild(createStoryColumn('Do Zrobienia (Todo)', todoStories, projectId));
  columnsDiv.appendChild(createStoryColumn('W Trakcie (Doing)', doingStories, projectId));
  columnsDiv.appendChild(createStoryColumn('Ukończone (Done)', doneStories, projectId));
  storiesContainer.appendChild(columnsDiv);
}

function createStoryColumn(title: string, stories: Story[], projectId: string): HTMLElement {
  const columnDiv = document.createElement('div');
  columnDiv.classList.add('story-column');
  columnDiv.innerHTML = `<h3>${title} (${stories.length})</h3>`;
  const ul = document.createElement('ul');
  if (stories.length === 0) {
    ul.innerHTML = '<li>Brak historyjek w tej kolumnie.</li>';
  } else {
    stories.forEach((story: Story) => { // Jawny typ
      const li = document.createElement('li');
      li.classList.add('story-item');
      li.dataset.id = story.id;
      let priorityText = '';
      switch (story.priority) {
        case 'low': priorityText = 'Niski'; break;
        case 'medium': priorityText = 'Średni'; break;
        case 'high': priorityText = 'Wysoki'; break;
      }
      const owner = apiService.getUserById(story.ownerId);
      const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : 'Nieznany';
      const tasksForStory = apiService.getTasksByStoryId(projectId, story.id);
      const tasksCount = tasksForStory.length;
      const doneTasksCount = tasksForStory.filter((t: Task) => t.status === 'done').length; // Jawny typ
      li.innerHTML = `
        <h4>${story.name}</h4>
        <p>${story.description}</p>
        <p><small>Priorytet: ${priorityText}</small></p>
        <p><small>Właściciel: ${ownerName}</small></p>
        <p><small>Zadania: ${doneTasksCount}/${tasksCount}</small></p>
        <p><small>Utworzono: ${new Date(story.createdAt).toLocaleDateString()}</small></p>
        <div class="actions">
          <button class="edit-story">Edytuj Hist.</button>
          <button class="delete-story">Usuń Hist.</button>
          <button class="add-task-to-story-btn">Dodaj Zadanie</button>
          ${story.status !== 'todo' ? `<button class="move-story" data-status="todo">Do Todo</button>` : ''}
          ${story.status !== 'doing' ? `<button class="move-story" data-status="doing">Do Doing</button>` : ''}
          ${story.status !== 'done' ? `<button class="move-story" data-status="done">Do Done</button>` : ''}
        </div>
      `;
      li.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(projectId, story.id));
      li.querySelector('.delete-story')?.addEventListener('click', () => deleteStoryFromList(projectId, story.id));
      li.querySelector('.add-task-to-story-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openTaskModal(projectId, story.id); });
      li.querySelectorAll('.move-story').forEach(button => {
        button.addEventListener('click', () => {
          const newStatus = (button as HTMLElement).dataset.status as StoryStatus;
          moveStory(projectId, story.id, newStatus);
        });
      });
      ul.appendChild(li);
    });
  }
  columnDiv.appendChild(ul);
  return columnDiv;
}

function moveStory(projectId: string, storyId: string, newStatus: StoryStatus) {
  const story = apiService.getStoryById(projectId, storyId);
  if (story) {
    story.status = newStatus;
    apiService.updateStory(story);
    renderStories(projectId);
  }
}

function loadStoryForEditing(projectId: string, storyId: string) {
  if (!storyNameInput || !storyDescriptionInput || !storyPrioritySelect || !storyIdInput || !storyFormContainer) return;
  const story = apiService.getStoryById(projectId, storyId);
  if (story) {
    storyNameInput.value = story.name;
    storyDescriptionInput.value = story.description;
    storyPrioritySelect.value = story.priority;
    storyIdInput.value = story.id;
    storyFormContainer.scrollIntoView({ behavior: 'smooth' });
  }
}

function deleteStoryFromList(projectId: string, storyId: string) {
  if (confirm('Czy na pewno chcesz usunąć tę historyjkę?')) {
    const success = apiService.deleteStory(projectId, storyId);
    if (success) {
      renderStories(projectId);
    } else {
      alert('Nie udało się usunąć historyjki.');
    }
  }
}

function clearStoriesView() {
  if (storiesContainer) storiesContainer.innerHTML = '<p>Wybierz projekt, aby zobaczyć historyjki.</p>';
}

// NOWA FUNKCJA DO ZARZĄDZANIA WIDOCZNOŚCIĄ
function updateUIBasedOnAuthState() {
  if (!loginFormContainer || !mainAppContent || !userActionsContainer || !userDisplayNameElement) return;

  if (apiService.isAuthenticated()) {
    // Użytkownik jest zalogowany
    loginFormContainer.style.display = 'none';
    mainAppContent.style.display = 'block';
    userActionsContainer.style.display = 'block';

    const user = apiService.getCurrentUser();
    if (user) {
      userDisplayNameElement.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
    } else {
      userDisplayNameElement.textContent = 'Błąd: Brak danych użytkownika';
    }

    // Po zalogowaniu, ładujemy dane aplikacji
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
    // Użytkownik jest niezalogowany
    loginFormContainer.style.display = 'block';
    mainAppContent.style.display = 'none';
    userActionsContainer.style.display = 'none';
  }
}

// GŁÓWNA FUNKCJA INICJALIZUJĄCA APLIKACJĘ
async function initializeApp() {
  // --- Pobranie referencji do elementów DOM ---
  loginFormContainer = document.getElementById('login-form-container') as HTMLElement;
  loginForm = document.getElementById('login-form') as HTMLFormElement;
  loginUsernameInput = document.getElementById('login-username') as HTMLInputElement;
  loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
  loginErrorP = document.getElementById('login-error') as HTMLParagraphElement;
  mainAppContent = document.getElementById('main-app-content') as HTMLElement;
  userActionsContainer = document.getElementById('user-actions-container') as HTMLElement;
  userDisplayNameElement = document.getElementById('user-display-name') as HTMLElement;
  logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
  projectForm = document.getElementById('project-form') as HTMLFormElement;
  projectNameInput = document.getElementById('project-name') as HTMLInputElement;
  projectDescriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
  projectIdInput = document.getElementById('project-id') as HTMLInputElement;
  projectsListUl = document.getElementById('projects-list') as HTMLUListElement;
  storiesContainer = document.getElementById('stories-container') as HTMLElement;
  storyFormContainer = document.getElementById('story-form-container') as HTMLElement;
  storyForm = document.getElementById('story-form') as HTMLFormElement;
  storyNameInput = document.getElementById('story-name') as HTMLInputElement;
  storyDescriptionInput = document.getElementById('story-description') as HTMLTextAreaElement;
  storyPrioritySelect = document.getElementById('story-priority') as HTMLSelectElement;
  storyIdInput = document.getElementById('story-id') as HTMLInputElement;
  taskFormModal = document.getElementById('task-form-modal') as HTMLElement;
  closeTaskModalBtn = document.getElementById('close-task-modal-btn') as HTMLElement;
  taskForm = document.getElementById('task-form') as HTMLFormElement;
  taskFormTitle = document.getElementById('task-form-title') as HTMLElement;
  taskIdInput = document.getElementById('task-id') as HTMLInputElement;
  taskProjectIdInput = document.getElementById('task-project-id') as HTMLInputElement;
  taskStoryIdInput = document.getElementById('task-story-id') as HTMLInputElement;
  taskNameInput = document.getElementById('task-name') as HTMLInputElement;
  taskDescriptionInput = document.getElementById('task-description') as HTMLTextAreaElement;
  taskPrioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
  taskEstimatedTimeInput = document.getElementById('task-estimated-time') as HTMLInputElement;
  taskDetailStoryName = document.getElementById('task-detail-story-name') as HTMLElement;
  taskDetailStatus = document.getElementById('task-detail-status') as HTMLElement;
  taskAssigneeSelect = document.getElementById('task-assignee') as HTMLSelectElement;
  assignTaskBtn = document.getElementById('assign-task-btn') as HTMLButtonElement;
  taskDetailStartDate = document.getElementById('task-detail-start-date') as HTMLElement;
  taskDetailEndDate = document.getElementById('task-detail-end-date') as HTMLElement;
  completeTaskBtn = document.getElementById('complete-task-btn') as HTMLButtonElement;
  kanbanSection = document.getElementById('kanban-section') as HTMLElement;
  kanbanBoard = document.getElementById('kanban-board') as HTMLElement;

  // --- Przypisanie Listenerów Zdarzeń ---
  if (loginForm) {
    loginForm.onsubmit = async (event) => {
      event.preventDefault();
      console.log('--- Krok 1: Formularz logowania wysłany. ---');
      
      if (loginErrorP) loginErrorP.textContent = '';
      if (loginUsernameInput && loginPasswordInput) {
        const username = loginUsernameInput.value;
        const password = loginPasswordInput.value;
        console.log(`--- Krok 2: Próbuję zalogować użytkownika: "${username}" z hasłem: "${password}" ---`);

        try {
          await apiService.login(username, password);
          console.log('--- Krok 4: Logowanie w ApiService zakończone sukcesem. Aktualizuję UI. ---');
          updateUIBasedOnAuthState();
        } catch (error) {
          console.error('--- BŁĄD: ApiService.login() zgłosił błąd! ---', error);
          if (loginErrorP && error instanceof Error) loginErrorP.textContent = error.message;
        }
      }
    };
  }

  if (logoutButton) {
    logoutButton.onclick = async () => {
      await apiService.logout();
      window.location.reload(); // Najprostszy sposób na zresetowanie stanu aplikacji
    };
  }

  if (closeTaskModalBtn) closeTaskModalBtn.onclick = closeTaskModal;
  window.onclick = (event) => { if (event.target === taskFormModal) closeTaskModal(); };

  if (taskForm) {
    taskForm.onsubmit = (event) => {
      event.preventDefault();
      if (!taskIdInput || !taskProjectIdInput || !taskStoryIdInput || !taskNameInput || !taskDescriptionInput || !taskPrioritySelect || !taskEstimatedTimeInput) return;
      const id = taskIdInput.value;
      const projectId = taskProjectIdInput.value;
      const storyId = taskStoryIdInput.value;
      const taskData = {
        name: taskNameInput.value,
        description: taskDescriptionInput.value,
        priority: taskPrioritySelect.value as StoryPriority,
        storyId: storyId,
        projectId: projectId,
        estimatedTime: parseFloat(taskEstimatedTimeInput.value),
      };
      if (id) {
        const existingTask = apiService.getTaskById(projectId, id);
        if (existingTask) {
          const updatedTask: Task = { ...existingTask, ...taskData };
          apiService.updateTask(updatedTask);
        }
      } else {
        apiService.saveTask(taskData);
      }
      closeTaskModal();
      renderKanbanBoard(projectId);
      renderStories(projectId);
    };
  }

  if (assignTaskBtn) {
    assignTaskBtn.onclick = () => {
      if (!currentEditingTaskId || !taskProjectIdInput || !taskAssigneeSelect || !taskStoryIdInput) return;
      const task = apiService.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
      const selectedUserId = taskAssigneeSelect.value;
      if (task && selectedUserId) {
        task.assignedUserId = selectedUserId;
        task.status = 'doing';
        task.startDate = new Date().toISOString();
        apiService.updateTask(task);
        openTaskModal(task.projectId, task.storyId, task.id);
        renderKanbanBoard(task.projectId);
        renderStories(task.projectId);
      }
    };
  }

  if (completeTaskBtn) {
    completeTaskBtn.onclick = () => {
      if (!currentEditingTaskId || !taskProjectIdInput || !taskStoryIdInput) return;
      const task = apiService.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
      if (task && task.status === 'doing') {
        task.status = 'done';
        task.endDate = new Date().toISOString();
        apiService.updateTask(task);
        openTaskModal(task.projectId, task.storyId, task.id);
        renderKanbanBoard(task.projectId);
        renderStories(task.projectId);
      }
    };
  }

  if (projectForm) {
    projectForm.onsubmit = (event) => {
      event.preventDefault();
      if (!projectNameInput || !projectDescriptionInput || !projectIdInput) return;
      const name = projectNameInput.value;
      const description = projectDescriptionInput.value;
      const id = projectIdInput.value;
      if (id) {
        const projectToUpdate: Project = { id, name, description, createdAt: apiService.getProjectById(id)?.createdAt || new Date().toISOString() };
        if (!apiService.updateProject(projectToUpdate)) alert('Nie udało się zaktualizować projektu.');
      } else {
        apiService.saveProject({ name, description });
      }
      projectForm!.reset();
      projectIdInput.value = '';
      renderProjects();
    };
  }

  if (storyForm) {
    storyForm.onsubmit = (event) => {
      event.preventDefault();
      if (!storyNameInput || !storyDescriptionInput || !storyPrioritySelect || !storyIdInput) return;
      const activeProjectId = apiService.getActiveProjectId();
      if (!activeProjectId) { alert('Najpierw wybierz aktywny projekt!'); return; }
      const name = storyNameInput.value;
      const description = storyDescriptionInput.value;
      const priority = storyPrioritySelect.value as StoryPriority;
      const id = storyIdInput.value;
      const currentUserId = apiService.getCurrentUser()?.id;
      if (!currentUserId) { alert('Błąd: Brak zalogowanego użytkownika.'); return; }
      if (id) {
        const storyToUpdate = apiService.getStoryById(activeProjectId, id);
        if (storyToUpdate) {
          storyToUpdate.name = name;
          storyToUpdate.description = description;
          storyToUpdate.priority = priority;
          apiService.updateStory(storyToUpdate);
        }
      } else {
        apiService.saveStory({ name, description, priority, projectId: activeProjectId, status: 'todo', ownerId: currentUserId });
      }
      storyForm!.reset();
      storyIdInput.value = '';
      renderStories(activeProjectId);
    };
  }

  // --- Inicjalizacja stanu UI przy starcie ---
  updateUIBasedOnAuthState();
}

// URUCHAMIAMY APLIKACJĘ DOPIERO PO ZAŁADOWANIU CAŁEGO HTML
document.addEventListener('DOMContentLoaded', initializeApp);