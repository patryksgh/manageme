// src/main.ts
import { LocalStorageApi, AuthService } from './api/LocalStorageApi'; // Upewnij się, że AuthService jest eksportowany z LocalStorageApi.ts lub importowany z osobnego pliku
import { type Project } from './models/Project';
import { type Story, type StoryPriority, type StoryStatus } from './models/Story'; // Dodaj StoryPriority i StoryStatus
import './styles/main.css'; // Importuj style
import { type Task, type TaskStatus } from './models/Task';

// Inicjalizacja API
const api = new LocalStorageApi();
const authService = new AuthService(); // Utwórz instancję AuthService

// --- Elementy DOM dla Projektów ---
const projectForm = document.getElementById('project-form') as HTMLFormElement;
const projectNameInput = document.getElementById('project-name') as HTMLInputElement;
const projectDescriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
const projectIdInput = document.getElementById('project-id') as HTMLInputElement;
const projectsListUl = document.getElementById('projects-list') as HTMLUListElement;

// --- Elementy DOM dla Użytkownika ---
const userDisplayNameElement = document.getElementById('user-display-name') as HTMLElement;

// --- Elementy DOM dla Historyjek ---
const storiesContainer = document.getElementById('stories-container') as HTMLElement;
const storyFormContainer = document.getElementById('story-form-container') as HTMLElement;
const storyForm = document.getElementById('story-form') as HTMLFormElement;
const storyNameInput = document.getElementById('story-name') as HTMLInputElement;
const storyDescriptionInput = document.getElementById('story-description') as HTMLTextAreaElement;
const storyPrioritySelect = document.getElementById('story-priority') as HTMLSelectElement;
const storyIdInput = document.getElementById('story-id') as HTMLInputElement;

// --- Elementy DOM dla Formularza Zadań (Modal) ---
const taskFormModal = document.getElementById('task-form-modal') as HTMLElement;
const closeTaskModalBtn = document.getElementById('close-task-modal-btn') as HTMLElement;
const taskForm = document.getElementById('task-form') as HTMLFormElement;
const taskFormTitle = document.getElementById('task-form-title') as HTMLElement;
const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
const taskProjectIdInput = document.getElementById('task-project-id') as HTMLInputElement;
const taskStoryIdInput = document.getElementById('task-story-id') as HTMLInputElement;
const taskNameInput = document.getElementById('task-name') as HTMLInputElement;
const taskDescriptionInput = document.getElementById('task-description') as HTMLTextAreaElement;
const taskPrioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
const taskEstimatedTimeInput = document.getElementById('task-estimated-time') as HTMLInputElement;

// --- Elementy DOM dla Szczegółów Zadania w Modalu ---
const taskDetailStoryName = document.getElementById('task-detail-story-name') as HTMLElement;
const taskDetailStatus = document.getElementById('task-detail-status') as HTMLElement;
const taskAssigneeSelect = document.getElementById('task-assignee') as HTMLSelectElement;
const assignTaskBtn = document.getElementById('assign-task-btn') as HTMLButtonElement;
const taskDetailStartDate = document.getElementById('task-detail-start-date') as HTMLElement;
const taskDetailEndDate = document.getElementById('task-detail-end-date') as HTMLElement;
const completeTaskBtn = document.getElementById('complete-task-btn') as HTMLButtonElement;

// --- Elementy DOM dla Tablicy Kanban ---
const kanbanSection = document.getElementById('kanban-section') as HTMLElement;
const kanbanBoard = document.getElementById('kanban-board') as HTMLElement;

// Zmienna przechowująca ID edytowanego/wyświetlanego zadania w modalu
let currentEditingTaskId: string | null = null; 

// ==========================================================================
// Funkcje związane z Modalem Zadań
// ==========================================================================
function openTaskModal(projectId: string, storyId: string, taskId?: string) {
  taskForm.reset();
  currentEditingTaskId = taskId || null;
  taskProjectIdInput.value = projectId;
  taskStoryIdInput.value = storyId;

  const story = api.getStoryById(projectId, storyId);
  taskDetailStoryName.textContent = story ? story.name : 'Nieznana historyjka';

  // Wypełnij listę przypisywalnych użytkowników (dev, devops)
  taskAssigneeSelect.innerHTML = '<option value="">-- Wybierz --</option>'; // Reset
  const assignableUsers = authService.getUsersByRoles(['developer', 'devops']);
  assignableUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName} (${user.role})`;
    taskAssigneeSelect.appendChild(option);
  });

  if (taskId) { // Edycja istniejącego zadania
    taskFormTitle.textContent = 'Edytuj Zadanie';
    const task = api.getTaskById(projectId, taskId);
    if (task) {
      taskIdInput.value = task.id;
      taskNameInput.value = task.name;
      taskDescriptionInput.value = task.description;
      taskPrioritySelect.value = task.priority;
      taskEstimatedTimeInput.value = task.estimatedTime.toString();
      
      // Wyświetl szczegóły zadania
      taskDetailStatus.textContent = task.status;
      taskAssigneeSelect.value = task.assignedUserId || '';
      taskDetailStartDate.textContent = task.startDate ? new Date(task.startDate).toLocaleString() : '-';
      taskDetailEndDate.textContent = task.endDate ? new Date(task.endDate).toLocaleString() : '-';

      // Logika przycisków akcji
      if (task.status === 'todo') {
        taskAssigneeSelect.disabled = false;
        assignTaskBtn.style.display = 'inline-block';
        completeTaskBtn.style.display = 'none';
      } else if (task.status === 'doing') {
        taskAssigneeSelect.disabled = true; // Nie można zmienić przypisania gdy jest 'doing' przez ten interfejs
        assignTaskBtn.style.display = 'none';
        completeTaskBtn.style.display = 'inline-block';
      } else { // done
        taskAssigneeSelect.disabled = true;
        assignTaskBtn.style.display = 'none';
        completeTaskBtn.style.display = 'none';
      }
    }
  } else { // Dodawanie nowego zadania
    taskFormTitle.textContent = 'Dodaj Nowe Zadanie';
    taskIdInput.value = ''; // Upewnij się, że jest puste
    // Ukryj/resetuj pola szczegółów dla nowego zadania
    taskDetailStatus.textContent = 'todo (nowe)';
    taskAssigneeSelect.value = '';
    taskAssigneeSelect.disabled = true; // Przypisanie dopiero po utworzeniu lub specjalnym przyciskiem
    assignTaskBtn.style.display = 'none'; // Pokazać dopiero po zapisaniu zadania (lub inaczej)
    taskDetailStartDate.textContent = '-';
    taskDetailEndDate.textContent = '-';
    completeTaskBtn.style.display = 'none';
  }
  taskFormModal.style.display = 'block';
}

function closeTaskModal() {
  taskFormModal.style.display = 'none';
  currentEditingTaskId = null;
}

closeTaskModalBtn.onclick = closeTaskModal;
window.onclick = (event) => { // Zamykanie po kliknięciu poza modalem
  if (event.target === taskFormModal) {
    closeTaskModal();
  }
};

taskForm.onsubmit = (event) => {
  event.preventDefault();
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

  if (id) { // Aktualizacja
    const existingTask = api.getTaskById(projectId, id);
    if (existingTask) {
      const updatedTaskData: Task = {
        ...existingTask, // Zachowaj status, assignedUserId, daty
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority,
        estimatedTime: taskData.estimatedTime,
      };
      api.updateTask(updatedTaskData);
    }
  } else { // Zapis nowego
    api.saveTask(taskData); // saveTask automatycznie ustawi status na 'todo'
  }
  closeTaskModal();
  renderKanbanBoard(projectId); // Odśwież Kanban
  renderStories(projectId); // Odśwież też listę historyjek (może wyświetlać liczbę zadań)
};

// Obsługa przypisywania użytkownika
assignTaskBtn.onclick = () => {
  if (!currentEditingTaskId || !taskProjectIdInput.value || !taskAssigneeSelect.value) return;
  
  const task = api.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
  const selectedUserId = taskAssigneeSelect.value;

  if (task && selectedUserId) {
    task.assignedUserId = selectedUserId;
    task.status = 'doing'; // Automatyczna zmiana statusu
    task.startDate = new Date().toISOString(); // Ustawienie daty startu
    api.updateTask(task);
    openTaskModal(task.projectId, task.storyId, task.id); // Odśwież modal
    renderKanbanBoard(task.projectId);
    renderStories(task.projectId);
  }
};

// Obsługa kończenia zadania
completeTaskBtn.onclick = () => {
  if (!currentEditingTaskId || !taskProjectIdInput.value) return;

  const task = api.getTaskById(taskProjectIdInput.value, currentEditingTaskId);
  if (task && task.status === 'doing') {
    task.status = 'done';
    task.endDate = new Date().toISOString();
    api.updateTask(task);
    openTaskModal(task.projectId, task.storyId, task.id); // Odśwież modal
    renderKanbanBoard(task.projectId);
    renderStories(task.projectId);
  }
};


// ==========================================================================
// Funkcje związane z Tablicą Kanban
// ==========================================================================
function renderKanbanBoard(projectId: string | null) {
  kanbanBoard.innerHTML = ''; // Wyczyść tablicę
  if (!projectId) {
    kanbanSection.style.display = 'none';
    return;
  }
  kanbanSection.style.display = 'block';
  const tasks = api.getTasks(projectId);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  kanbanBoard.appendChild(createKanbanColumn('Zadania: Do Zrobienia', todoTasks, projectId, 'todo'));
  kanbanBoard.appendChild(createKanbanColumn('Zadania: W Trakcie', doingTasks, projectId, 'doing'));
  kanbanBoard.appendChild(createKanbanColumn('Zadania: Ukończone', doneTasks, projectId, 'done'));
}

function createKanbanColumn(title: string, tasks: Task[], projectId: string, _status: TaskStatus): HTMLElement {
  const columnDiv = document.createElement('div');
  columnDiv.classList.add('story-column'); // Reużywamy stylów kolumn historyjek
  columnDiv.innerHTML = `<h3>${title} (${tasks.length})</h3>`;
  const ul = document.createElement('ul');

  if (tasks.length === 0) {
    ul.innerHTML = '<li>Brak zadań.</li>';
  } else {
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.classList.add('task-item'); // Nowa klasa dla zadań
      li.dataset.id = task.id;
      // Kliknięcie na zadanie otwiera modal do edycji/szczegółów
      li.onclick = () => openTaskModal(projectId, task.storyId, task.id);


      const story = api.getStoryById(projectId, task.storyId);
      const assignedUser = task.assignedUserId ? authService.getUserById(task.assignedUserId) : null;

      li.innerHTML = `
        <h4>${task.name}</h4>
        <p><small>Historyjka: ${story ? story.name : 'N/A'}</small></p>
        <p><small>Priorytet: ${task.priority}</small></p>
        <p><small>Czas: ${task.estimatedTime}h</small></p>
        ${assignedUser ? `<p><small>Przypisany: ${assignedUser.firstName} ${assignedUser.lastName}</small></p>` : ''}
        <div class="actions">
            <!-- Można dodać przyciski szybkiej zmiany statusu bezpośrednio na tablicy -->
        </div>
      `;
      ul.appendChild(li);
    });
  }
  columnDiv.appendChild(ul);
  return columnDiv;
}

// ==========================================================================
// Funkcje związane z Użytkownikiem
// ==========================================================================
function displayLoggedInUser() {
  const user = authService.getMockedUser();
  if (user) {
    userDisplayNameElement.textContent = `${user.firstName} ${user.lastName}`;
  } else {
    userDisplayNameElement.textContent = 'Niezalogowany';
  }
}

// ==========================================================================
// Funkcje związane z Projektami
// ==========================================================================
function renderProjects() {
  projectsListUl.innerHTML = '';
  const projects = api.getProjects();
  const activeProjectId = api.getActiveProjectId();

  if (projects.length === 0) {
    projectsListUl.innerHTML = '<li>Brak projektów. Dodaj nowy!</li>';
    return;
  }

  projects.forEach(project => {
    const li = document.createElement('li');
    li.classList.add('project-item');
    if (project.id === activeProjectId) {
      li.classList.add('active-project');
    }
    li.dataset.id = project.id;

    const projectInfoDiv = document.createElement('div');
    projectInfoDiv.classList.add('project-item-info');
    projectInfoDiv.innerHTML = `
      <strong>${project.name}</strong>
      <p><small>Opis: ${project.description}</small></p>
      <p><small>Utworzono: ${new Date(project.createdAt).toLocaleDateString()}</small></p>
    `;
    projectInfoDiv.onclick = () => selectActiveProject(project.id); // Kliknięcie wybiera projekt

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('project-item-actions');

    const selectButton = document.createElement('button');
    selectButton.textContent = 'Wybierz';
    selectButton.classList.add('select');
    selectButton.onclick = () => selectActiveProject(project.id);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edytuj';
    editButton.classList.add('edit');
    editButton.onclick = (e) => {
        e.stopPropagation();
        loadProjectForEditing(project.id);
    }

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Usuń';
    deleteButton.classList.add('delete');
    deleteButton.onclick = (e) => {
        e.stopPropagation();
        deleteProject(project.id);
    }
    
    actionsDiv.appendChild(selectButton);
    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);
    
    li.appendChild(projectInfoDiv);
    li.appendChild(actionsDiv);
    projectsListUl.appendChild(li);
  })
}

function loadProjectForEditing(id: string) {
  const project = api.getProjectById(id);
  if (project) {
    projectNameInput.value = project.name;
    projectDescriptionInput.value = project.description;
    projectIdInput.value = project.id;
  }
}

function deleteProject(id: string) {
  if (confirm('Czy na pewno chcesz usunąć ten projekt oraz wszystkie jego historyjki?')) {
    const wasActive = api.getActiveProjectId() === id;
    const success = api.deleteProject(id); // Metoda deleteProject w LocalStorageApi powinna czyścić aktywny projekt
    if (success) {
      renderProjects();
      if (wasActive) {
        clearStoriesView();
        storyFormContainer.style.display = 'none';
      }
    } else {
      alert('Nie udało się usunąć projektu.');
    }
  }
}

projectForm.onsubmit = (event) => {
  event.preventDefault();
  const name = projectNameInput.value;
  const description = projectDescriptionInput.value;
  const id = projectIdInput.value;

  if (id) {
    const projectToUpdate: Project = { 
        id, 
        name, 
        description, 
        createdAt: api.getProjectById(id)?.createdAt || new Date().toISOString() 
    };
    const updated = api.updateProject(projectToUpdate);
    if (!updated) {
        alert('Nie udało się zaktualizować projektu.');
    }
  } else {
    api.saveProject({ name, description });
  }

  projectForm.reset();
  projectIdInput.value = '';
  renderProjects();
};

function selectActiveProject(projectId: string) {
  api.setActiveProjectId(projectId);
  renderProjects();
  storyFormContainer.style.display = 'block';
  renderStories(projectId);
  renderKanbanBoard(projectId); // Dodaj renderowanie Kanbanu po wybraniu projektu
  storyForm.reset();
  storyIdInput.value = '';
}

// ==========================================================================
// Funkcje związane z Historyjkami
// ==========================================================================
function renderStories(projectId: string | null) {
  if (!projectId) {
    clearStoriesView();
    return;
  }
  
  storiesContainer.innerHTML = ''; // Wyczyść kontener

  const stories = api.getStories(projectId);

  const todoStories = stories.filter(s => s.status === 'todo');
  const doingStories = stories.filter(s => s.status === 'doing');
  const doneStories = stories.filter(s => s.status === 'done');

  const columnsDiv = document.createElement('div');
  columnsDiv.classList.add('stories-columns');

  columnsDiv.appendChild(createStoryColumn('Do Zrobienia (Todo)', todoStories, projectId));
  columnsDiv.appendChild(createStoryColumn('W Trakcie (Doing)', doingStories, projectId));
  columnsDiv.appendChild(createStoryColumn('Ukończone (Done)', doneStories, projectId));

  storiesContainer.appendChild(columnsDiv);
}

function createStoryColumn(title: string, stories: Story[], projectId: string): HTMLElement { // <-- W tej funkcji z Lab2
  const columnDiv = document.createElement('div');
  columnDiv.classList.add('story-column');
  columnDiv.innerHTML = `<h3>${title} (${stories.length})</h3>`;
  const ul = document.createElement('ul');

  if (stories.length === 0) {
    ul.innerHTML = '<li>Brak historyjek w tej kolumnie.</li>';
  } else {
    stories.forEach(story => {
      const li = document.createElement('li');
      li.classList.add('story-item');
      li.dataset.id = story.id;
      
      let priorityText = '';
      switch(story.priority) {
          case 'low': priorityText = 'Niski'; break;
          case 'medium': priorityText = 'Średni'; break;
          case 'high': priorityText = 'Wysoki'; break;
      }
      const owner = authService.getUserById(story.ownerId);
      const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : 'Nieznany';

      // Zlicz zadania dla tej historyjki
      const tasksForStory = api.getTasksByStoryId(projectId, story.id);
      const tasksCount = tasksForStory.length;
      const doneTasksCount = tasksForStory.filter(t => t.status === 'done').length;


      li.innerHTML = `
        <h4>${story.name}</h4>
        <p>${story.description}</p>
        <p><small>Priorytet: ${priorityText}</small></p>
        <p><small>Właściciel: ${ownerName}</small></p>
        <p><small>Zadania: ${doneTasksCount}/${tasksCount}</small></p> <!-- Licznik zadań -->
        <p><small>Utworzono: ${new Date(story.createdAt).toLocaleDateString()}</small></p>
        <div class="actions">
          <button class="edit-story">Edytuj Hist.</button>
          <button class="delete-story">Usuń Hist.</button>
          <button class="add-task-to-story-btn">Dodaj Zadanie</button> <!-- NOWY PRZYCISK -->
          ${story.status !== 'todo' ? `<button class="move-story" data-status="todo">Do Todo</button>` : ''}
          ${story.status !== 'doing' ? `<button class="move-story" data-status="doing">Do Doing</button>` : ''}
          ${story.status !== 'done' ? `<button class="move-story" data-status="done">Do Done</button>` : ''}
        </div>
      `;
      
      li.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(projectId, story.id));
      li.querySelector('.delete-story')?.addEventListener('click', () => deleteStoryFromList(projectId, story.id));
      li.querySelector('.add-task-to-story-btn')?.addEventListener('click', (e) => { // NOWA OBSŁUGA
          e.stopPropagation(); // Aby nie wywołać kliknięcia na całym elemencie li
          openTaskModal(projectId, story.id);
      });
      
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
    const story = api.getStoryById(projectId, storyId);
    if (story) {
        story.status = newStatus;
        api.updateStory(story);
        renderStories(projectId);
    }
}

function loadStoryForEditing(projectId: string, storyId: string) {
  const story = api.getStoryById(projectId, storyId);
  if (story) {
    storyNameInput.value = story.name;
    storyDescriptionInput.value = story.description;
    storyPrioritySelect.value = story.priority;
    storyIdInput.value = story.id;
    storyFormContainer.scrollIntoView({ behavior: 'smooth' }); // Przewiń do formularza
  }
}

function deleteStoryFromList(projectId: string, storyId: string) { // Zmieniona nazwa funkcji
  if (confirm('Czy na pewno chcesz usunąć tę historyjkę?')) {
    const success = api.deleteStory(projectId, storyId);
    if (success) {
      renderStories(projectId);
    } else {
      alert('Nie udało się usunąć historyjki.');
    }
  }
}

storyForm.onsubmit = (event) => {
  event.preventDefault();
  const activeProjectId = api.getActiveProjectId();
  if (!activeProjectId) {
    alert('Najpierw wybierz aktywny projekt!');
    return;
  }

  const name = storyNameInput.value;
  const description = storyDescriptionInput.value;
  const priority = storyPrioritySelect.value as StoryPriority;
  const id = storyIdInput.value;

  const currentUserId = authService.getCurrentUserId();

  if (id) {
    const storyToUpdate = api.getStoryById(activeProjectId, id);
    if(storyToUpdate) {
        storyToUpdate.name = name;
        storyToUpdate.description = description;
        storyToUpdate.priority = priority;
        api.updateStory(storyToUpdate);
    } else {
        alert('Nie znaleziono historyjki do aktualizacji.');
    }
  } else {
    api.saveStory({
      name,
      description,
      priority,
      projectId: activeProjectId,
      status: 'todo',
      ownerId: currentUserId,
    });
  }

  storyForm.reset();
  storyIdInput.value = '';
  renderStories(activeProjectId);
};

function clearStoriesView() {
    storiesContainer.innerHTML = '<p>Wybierz projekt, aby zobaczyć historyjki.</p>';
}

// ==========================================================================
// Inicjalizacja aplikacji
// ==========================================================================
function initApp() {
    displayLoggedInUser();
    renderProjects();
    const activeProjectId = api.getActiveProjectId();
    if (activeProjectId) {
        storyFormContainer.style.display = 'block';
        renderStories(activeProjectId);
        renderKanbanBoard(activeProjectId); // Renderuj Kanban przy starcie, jeśli jest aktywny projekt
    } else {
        clearStoriesView();
        storyFormContainer.style.display = 'none';
        kanbanSection.style.display = 'none'; // Ukryj Kanban, jeśli nie ma aktywnego projektu
    }
}

initApp();