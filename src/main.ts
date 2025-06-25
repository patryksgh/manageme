// src/main.ts
import { LocalStorageApi, AuthService } from './api/LocalStorageApi'; // Upewnij się, że AuthService jest eksportowany z LocalStorageApi.ts lub importowany z osobnego pliku
import { type Project } from './models/Project';
import { type Story, type StoryPriority, type StoryStatus } from './models/Story'; // Dodaj StoryPriority i StoryStatus
import './styles/main.css'; // Importuj style

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
  });
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
  renderProjects(); // Prerenderuj, aby podświetlić
  storyFormContainer.style.display = 'block'; // Pokaż formularz historyjek
  renderStories(projectId); // Wyrenderuj historyjki
  storyForm.reset(); // Wyczyść formularz historyjek
  storyIdInput.value = ''; // Wyczyść ID historyjki na formularzu
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

function createStoryColumn(title: string, stories: Story[], projectId: string): HTMLElement {
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

      // Proste pobranie imienia i nazwiska właściciela (mock)
      const owner = authService.getMockedUser(); // Zakładamy, że mock user jest właścicielem wszystkich story
      const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : 'Nieznany';

      li.innerHTML = `
        <h4>${story.name}</h4>
        <p>${story.description}</p>
        <p><small>Priorytet: ${priorityText}</small></p>
        <p><small>Właściciel: ${ownerName} (ID: ${story.ownerId})</small></p>
        <p><small>Utworzono: ${new Date(story.createdAt).toLocaleDateString()}</small></p>
        <div class="actions">
          <button class="edit-story">Edytuj</button>
          <button class="delete-story">Usuń</button>
          ${story.status !== 'todo' ? `<button class="move-story" data-status="todo">Do Todo</button>` : ''}
          ${story.status !== 'doing' ? `<button class="move-story" data-status="doing">Do Doing</button>` : ''}
          ${story.status !== 'done' ? `<button class="move-story" data-status="done">Do Done</button>` : ''}
        </div>
      `;
      
      li.querySelector('.edit-story')?.addEventListener('click', () => loadStoryForEditing(projectId, story.id));
      li.querySelector('.delete-story')?.addEventListener('click', () => deleteStoryFromList(projectId, story.id)); // Zmieniona nazwa, żeby nie kolidowała z deleteProject
      
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
    } else {
        clearStoriesView();
        storyFormContainer.style.display = 'none';
    }
}

initApp();