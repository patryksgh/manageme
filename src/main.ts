// src/main.ts
import { LocalStorageApi } from './api/LocalStorageApi';
import { type Project } from './models/Project';
import './styles/main.css'; // Importuj style

// Inicjalizacja API
const api = new LocalStorageApi();

// Elementy DOM
const projectForm = document.getElementById('project-form') as HTMLFormElement;
const projectNameInput = document.getElementById('project-name') as HTMLInputElement;
const projectDescriptionInput = document.getElementById('project-description') as HTMLTextAreaElement;
const projectIdInput = document.getElementById('project-id') as HTMLInputElement;
const projectsListUl = document.getElementById('projects-list') as HTMLUListElement;

// Funkcja do renderowania listy projektów
function renderProjects() {
  projectsListUl.innerHTML = ''; // Wyczyść listę przed renderowaniem
  const projects = api.getProjects();

  if (projects.length === 0) {
    projectsListUl.innerHTML = '<li>Brak projektów. Dodaj nowy!</li>';
    return;
  }

  projects.forEach(project => {
    const li = document.createElement('li');
    li.classList.add('project-item');
    li.dataset.id = project.id; // Przechowuj ID dla łatwiejszego dostępu

    const projectInfoDiv = document.createElement('div');
    projectInfoDiv.innerHTML = `
      <strong>${project.name}</strong>
      <p><small>Opis: ${project.description}</small></p>
      <p><small>Utworzono: ${new Date(project.createdAt).toLocaleDateString()}</small></p>
    `;

    const actionsDiv = document.createElement('div');

    const editButton = document.createElement('button');
    editButton.textContent = 'Edytuj';
    editButton.classList.add('edit');
    editButton.onclick = () => loadProjectForEditing(project.id);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Usuń';
    deleteButton.classList.add('delete');
    deleteButton.onclick = () => deleteProject(project.id);

    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);
    
    li.appendChild(projectInfoDiv);
    li.appendChild(actionsDiv);
    projectsListUl.appendChild(li);
  });
}

// Funkcja do ładowania danych projektu do formularza edycji
function loadProjectForEditing(id: string) {
  const project = api.getProjectById(id);
  if (project) {
    projectNameInput.value = project.name;
    projectDescriptionInput.value = project.description;
    projectIdInput.value = project.id; // Ustaw ukryte pole ID
  }
}

// Funkcja do usuwania projektu
function deleteProject(id: string) {
  if (confirm('Czy na pewno chcesz usunąć ten projekt?')) {
    const success = api.deleteProject(id);
    if (success) {
      renderProjects(); // Odśwież listę
    } else {
      alert('Nie udało się usunąć projektu.');
    }
  }
}

// Obsługa formularza
projectForm.onsubmit = (event) => {
  event.preventDefault();

  const name = projectNameInput.value;
  const description = projectDescriptionInput.value;
  const id = projectIdInput.value; // Pobierz ID z ukrytego pola

  if (id) {
    // Aktualizacja istniejącego projektu
    const projectToUpdate: Project = { 
        id, 
        name, 
        description, 
        // createdAt nie jest zmieniane przy aktualizacji, ale LocalStorageApi.updateProject tego oczekuje
        // więc musimy pobrać oryginalną datę utworzenia
        createdAt: api.getProjectById(id)?.createdAt || new Date().toISOString() 
    };
    const updated = api.updateProject(projectToUpdate);
    if (!updated) {
        alert('Nie udało się zaktualizować projektu.');
    }
  } else {
    // Dodawanie nowego projektu
    api.saveProject({ name, description });
  }

  projectForm.reset(); // Wyczyść formularz
  projectIdInput.value = ''; // Wyczyść ukryte pole ID
  renderProjects(); // Odśwież listę projektów
};

// Inicjalne renderowanie projektów przy starcie aplikacji
function initApp() {
    renderProjects();
}

initApp();