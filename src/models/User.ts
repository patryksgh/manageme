export type UserRole = 'admin' | 'devops' | 'developer' | 'product-owner';

// Krok 2: Tworzymy nowy, wewnętrzny typ, który ROZSZERZA typ User o pole password.
// Będziemy go używać tylko wewnątrz ApiService.
export interface UserWithPassword extends User {
  password?: string; // Hasło jest opcjonalne, bo nie chcemy go zawsze przesyłać
}

// Krok 3: Główny interfejs User pozostaje bez zmian (bez hasła).
// Tego typu będziemy używać w całej reszcie aplikacji.
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}