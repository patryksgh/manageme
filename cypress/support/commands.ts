Cypress.Commands.add('login', (email, password) => {
    cy.session([email, password], () => {
        cy.visit('/');
        cy.get('#login-email').type(email, { delay: 30});
        cy.get('#login-password').type(password, { delay: 30 });
        cy.get('#login-form button[type="submit"]').click();
        cy.get('#main-app-content').should('be.visible');
    });
});

Cypress.Commands.add('createProject', (name, description) => {
    cy.get('#project-name').should('be.visible').and('be.enabled').clear().type(name, { delay: 30 });
    cy.get('#project-description').should('be.visible').and('be.enabled').clear().type(description, { delay: 30 });
    cy.get('#project-form button[type="submit"]').click();
});

Cypress.Commands.add('selectProject', (name) => {
    cy.contains('.list-group-item', name).click();
    cy.contains('.list-group-item.active', name).should('exist');
});

Cypress.Commands.add('createStory', (name, description) => {
    cy.get('#story-form-container').should('be.visible');
    cy.get('#story-name').should('be.visible').and('be.enabled').clear().type(name, { delay: 100 });
    cy.get('#story-description').should('be.visible').and('be.enabled').clear().type(description, { delay: 100 });
    cy.get('#story-form button[type="submit"]').click();
});

Cypress.Commands.add('createTask', (storyName, taskName) => {
    const sanitizedStoryName = storyName.replace(/\s+/g, '-').toLowerCase();
    cy.get(`[data-cy="story-card-${sanitizedStoryName}"]`).within(() => {
        cy.get('button[title="Dodaj zadanie"]').click();
    });
    cy.get('#task-form-modal').should('be.visible');
    cy.get('#task-name').should('be.visible').and('be.enabled').clear().type(taskName, { delay: 30 });
    cy.get('#task-description').should('be.visible').and('be.enabled').clear().type('Opis zadania testowego', { delay: 30 });
    cy.get('#task-form button[type="submit"]').click();
    cy.get('#task-form-modal').should('not.be.visible');
});