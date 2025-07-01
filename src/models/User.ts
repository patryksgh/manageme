// src/models/User.ts

export type UserRole = 'product-owner' | 'developer' | 'devops';

export interface User {
  id: string; // To będzie teraz UID z Firebase
  email: string; // Dodajemy to pole
  firstName: string;
  lastName: string;
  role: UserRole;
}