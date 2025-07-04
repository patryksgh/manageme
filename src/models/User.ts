export type UserRole = 'product-owner' | 'developer' | 'devops';

export interface User {
  id: string;
  email: string; 
  firstName: string;
  lastName: string;
  role: UserRole;
}