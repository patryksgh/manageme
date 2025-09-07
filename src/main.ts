describe('ManagMe E2E Tests', () => {
    beforeEach(() => {
        const userEmail = 'andrzej@gmail.com';
        const userPassword = '123123';
        cy.session([userEmail, userPassword], () => {
            cy.visit('/');
            cy.get('#login-email').type(userEmail);
            cy.get('#login-password').type(userPassword);
            cy.get('#login-form button[type="submit"]').click();
            cy.get('#main-app-content').should('be.visible');
        }, { cacheAcrossSpecs: true });
        cy.visit('/');
    });

    it('should run the full CRUD cycle for projects, stories, and tasks', () => {
        const projectName = `Testowy Projekt ${Date.now()}`;
        const storyName = `Historyjka ${Date.now()}`;
        const taskName = `Testowe Zadanie ${Date.now()}`;
        const editedProjectName = `${projectName} (Edytowany)`;
        const sanitizedProjectName = projectName.replace(/\s+/g, '-').toLowerCase();
        const sanitizedEditedProjectName = editedProjectName.replace(/\s+/g, '-').toLowerCase();
        const sanitizedStoryName = storyName.replace(/\s+/g, '-').toLowerCase();

        // --- CREATE PROJECT ---
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.createProject(projectName, 'Opis projektu testowego.');
        cy.wait('@writeRequest');
        cy.get(`[data-cy="project-item-${sanitizedProjectName}"]`, { timeout: 5000 }).should('be.visible');

        // --- SELECT PROJECT ---
        cy.selectProject(projectName);
        cy.wait(200);

        // --- CREATE STORY ---
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.createStory(storyName, 'Opis historyjki testowej.');
        cy.wait('@writeRequest');
        cy.get(`[data-cy="story-card-${sanitizedStoryName}"]`, { timeout: 5000 }).should('be.visible');
        cy.wait(150);
        
        // --- CREATE TASK ---
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.wait(100);
        cy.createTask(storyName, taskName);
        cy.wait('@writeRequest');
        cy.get('#kanban-board .story-column[data-status="todo"] .task-item', { timeout: 5000 }).should('have.length.at.least', 1);        
        cy.wait(100);

        // --- EDIT PROJECT ---
        cy.get(`[data-cy="project-item-${sanitizedProjectName}"]`).within(() => {
            cy.get('button[title="Edytuj"]').click();
        });
        cy.get('#project-name').clear().type(editedProjectName);
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.get('#project-form button[type="submit"]').click();
        cy.wait('@writeRequest');
        cy.get(`[data-cy="project-item-${sanitizedEditedProjectName}"]`, { timeout: 5000 }).should('be.visible');
        cy.get(`[data-cy="project-item-${sanitizedProjectName}"]`).should('not.exist');
        
        // --- DELETE STORY ---
        cy.get(`[data-cy="story-card-${sanitizedStoryName}"]`).within(() => {
            cy.get('button[title="Usuń"]').click({ force: true });
        });
        cy.get('#confirmation-modal').should('be.visible');
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.get('#confirm-delete-btn').click();
        cy.wait('@writeRequest');
        cy.get(`[data-cy="story-card-${sanitizedStoryName}"]`, { timeout: 5000 }).should('not.exist');
        
        // --- DELETE PROJECT ---
        cy.get(`[data-cy="project-item-${sanitizedEditedProjectName}"]`).within(() => {
            cy.get('button[title="Usuń"]').click({ force: true });
        });
        cy.get('#confirmation-modal').should('be.visible');
        cy.intercept('POST', '**/google.firestore.v1.Firestore/Write/**').as('writeRequest');
        cy.get('#confirm-delete-btn').click();
        cy.wait('@writeRequest');
        cy.get(`[data-cy="project-item-${sanitizedEditedProjectName}"]`, { timeout: 5000 }).should('not.exist');
    });
});