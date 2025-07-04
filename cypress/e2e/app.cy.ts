describe('ManagMe E2E Tests', () => {
    beforeEach(() => {
        const userEmail = 'andrzej.duda@gmail.com';
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
        const storyName = `Testowa Historyjka ${Date.now()}`;
        const taskName = `Testowe Zadanie ${Date.now()}`;
        const editedProjectName = `${projectName} (Edytowany)`;

        // CREATE
        cy.createProject(projectName, 'Opis projektu testowego.');
        cy.selectProject(projectName);
        cy.createStory(storyName, 'Opis historyjki testowej.');
        cy.createTask(storyName, taskName);

        // EDIT
        cy.contains('.list-group-item', projectName).within(() => {
            cy.get('button[title="Edytuj"]').click();
        });
        cy.get('#project-name').clear().type(editedProjectName);
        cy.get('#project-form button[type="submit"]').click();
        cy.wait(1500);
        cy.contains('.list-group-item', editedProjectName).should('be.visible');
        cy.contains('.list-group-item', projectName).should('not.exist');
        
        // DRAG & DROP
        const dataTransfer = new DataTransfer();
        cy.contains('.task-item', taskName).trigger('dragstart', { dataTransfer });
        cy.get('.story-column[data-status="doing"]').trigger('drop', { dataTransfer });
        cy.wait(500);
        cy.get('.story-column[data-status="doing"]').contains('.task-item', taskName).should('be.visible');

        // DELETE
        cy.contains('.card', storyName).within(() => {
            cy.get('button[title="Usuń"]').click();
        });
        cy.get('#confirmation-modal').should('be.visible');
        cy.get('#confirm-delete-btn').click();
        cy.wait(1500);
        cy.contains('.card', storyName).should('not.exist');
        
        cy.contains('.list-group-item', editedProjectName).within(() => {
            cy.get('button[title="Usuń"]').click();
        });
        cy.get('#confirmation-modal').should('be.visible');
        cy.get('#confirm-delete-btn').click();
        cy.wait(1500);
        cy.get('#projects-list').contains('.list-group-item', editedProjectName).should('not.exist');
    });
});