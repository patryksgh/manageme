Cypress.Commands.add('login', (email, password) => {
    cy.visit('/');
    cy.get('#login-email').type(email);
    cy.get('#login-password').type(password);
    cy.get('#login-form button[type="submit"]').click();
    cy.get('#main-app-content').should('be.visible');
});

Cypress.Commands.add('createProject', (name, description) => {
    cy.get('#project-name').type(name);
    cy.get('#project-description').type(description);
    cy.get('#project-form button[type="submit"]').click();
    cy.contains('.list-group-item', name).should('be.visible');
});

Cypress.Commands.add('selectProject', (name) => {
    cy.contains('.list-group-item', name).click();
    cy.contains('.list-group-item.active', name).should('exist');
});

Cypress.Commands.add('createStory', (name, description) => {
    cy.get('#story-form-container').should('be.visible');
    cy.get('#story-name').type(name);
    cy.get('#story-description').type(description);
    cy.get('#story-form button[type="submit"]').click();
    cy.wait(1000); 
    cy.contains('.card-header h4', name).should('be.visible');
});

Cypress.Commands.add('createTask', (storyName, taskName) => {
    cy.contains('.card', storyName).within(() => {
        cy.get('button[title="Dodaj zadanie"]').click()
    });
    cy.get('#task-form-modal').should('be.visible');
    cy.get('#task-name').type(taskName);
    cy.get('#task-description').type('Opis zadania testowego');
    cy.get('#task-form button[type="submit"]').click();
    cy.get('#task-form-modal').should('not.be.visible');
    cy.contains('.task-item h4', taskName).should('be.visible');
});