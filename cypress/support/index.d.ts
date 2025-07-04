declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
    createProject(name: string, description: string): Chainable<void>;
    selectProject(name: string): Chainable<void>;
    createStory(name: string, description: string): Chainable<void>;
    createTask(storyName: string, taskName: string): Chainable<void>;
  }
}