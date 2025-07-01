// =======================================================================
// ===           ApiService.ts - WERSJA Z CALLBACKIEM                    ===
// =======================================================================
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  writeBatch,
  setDoc
} from "firebase/firestore";

import { auth, db } from "../firebase-config";
import type { Project } from "../models/Project";
import type { Story, StoryData } from "../models/Story";
import type { Task, TaskData, TaskStatus } from "../models/Task";
import type { User, UserRole } from "../models/User";

export class ApiService {
  private currentUser: User | null = null;
  public onAuthStateChangeCallback: (() => void) | null = null; // <-- NOWA WŁAŚCIWOŚĆ

  constructor() {
    this.listenToAuthChanges();
  }

  private listenToAuthChanges() {
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Firebase auth state changed. User:', firebaseUser?.email); // Log do debugowania
      if (firebaseUser) {
        const userDoc = await this.getUserDocById(firebaseUser.uid);
        this.currentUser = userDoc;
      } else {
        this.currentUser = null;
      }
      
      // Po każdej zmianie stanu, wywołujemy callback, jeśli jest ustawiony
      if (this.onAuthStateChangeCallback) {
        console.log('Wywołuję onAuthStateChangeCallback...'); // Log do debugowania
        this.onAuthStateChangeCallback();
      }
    });
  }

  // Reszta metod pozostaje taka sama, jak w poprzedniej poprawionej wersji...
  // (login, logout, register, etc.)
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await this.getUserDocById(userCredential.user.uid);
    if (userDoc) { this.currentUser = userDoc; return userDoc; }
    throw new Error("Nie znaleziono danych użytkownika po zalogowaniu.");
  }
  async logout(): Promise<void> { await signOut(auth); this.currentUser = null; }
  async register(email: string, password: string, userData: { firstName: string, lastName: string, role: UserRole }): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser: User = { id: userCredential.user.uid, email: email, ...userData };
    await this.setUserDoc(newUser);
    return newUser;
  }
  isAuthenticated(): boolean { return !!this.currentUser; }
  getCurrentUser(): User | null { return this.currentUser; }
  async getUserDocById(id: string): Promise<User | null> { const userRef = doc(db, "users", id); const userSnap = await getDoc(userRef); return userSnap.exists() ? userSnap.data() as User : null; }
  async setUserDoc(user: User): Promise<void> { const userRef = doc(db, "users", user.id); await setDoc(userRef, user); }
  async getUsersByRoles(roles: UserRole[]): Promise<User[]> { if (roles.length === 0) return []; const q = query(collection(db, "users"), where("role", "in", roles)); const querySnapshot = await getDocs(q); return querySnapshot.docs.map(doc => doc.data() as User); }
  async getProjects(): Promise<Project[]> { const q = collection(db, "projects"); const snapshot = await getDocs(q); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)); }
  async saveProject(projectData: { name: string, description: string }): Promise<Project> { const data = { ...projectData, createdAt: new Date().toISOString() }; const docRef = await addDoc(collection(db, "projects"), data); return { id: docRef.id, ...data }; }
  async getProjectById(id: string): Promise<Project | null> { const docRef = doc(db, "projects", id); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Project : null; }
  async updateProject(updatedProject: Project): Promise<void> { const { id, ...data } = updatedProject; await updateDoc(doc(db, "projects", id), data as any); }
  async deleteProject(id: string): Promise<void> { const batch = writeBatch(db); batch.delete(doc(db, "projects", id)); const storiesSnapshot = await getDocs(query(collection(db, "stories"), where("projectId", "==", id))); storiesSnapshot.forEach(doc => batch.delete(doc.ref)); const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("projectId", "==", id))); tasksSnapshot.forEach(doc => batch.delete(doc.ref)); await batch.commit(); }
  private activeProjectId: string | null = null;
  setActiveProjectId(projectId: string): void { this.activeProjectId = projectId; }
  getActiveProjectId(): string | null { return this.activeProjectId; }
  async getStories(projectId: string): Promise<Story[]> { const q = query(collection(db, "stories"), where("projectId", "==", projectId)); const snapshot = await getDocs(q); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)); }
  async getStoryById(storyId: string): Promise<Story | null> { const docRef = doc(db, "stories", storyId); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Story : null; }
  async saveStory(storyData: StoryData): Promise<Story> { const data = { ...storyData, createdAt: new Date().toISOString() }; const docRef = await addDoc(collection(db, "stories"), data); return { id: docRef.id, ...data }; }
  async updateStory(updatedStory: Story): Promise<void> { const { id, ...data } = updatedStory; await updateDoc(doc(db, "stories", id), data as any); }
  async deleteStory(storyId: string): Promise<void> { const batch = writeBatch(db); batch.delete(doc(db, "stories", storyId)); const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("storyId", "==", storyId))); tasksSnapshot.forEach(doc => batch.delete(doc.ref)); await batch.commit(); }
  async getTasks(projectId: string): Promise<Task[]> { const q = query(collection(db, "tasks"), where("projectId", "==", projectId)); const snapshot = await getDocs(q); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)); }
  async getTasksByStoryId(storyId: string): Promise<Task[]> { const q = query(collection(db, "tasks"), where("storyId", "==", storyId)); const snapshot = await getDocs(q); return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)); }
  async getTaskById(taskId: string): Promise<Task | null> { const docRef = doc(db, "tasks", taskId); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Task : null; }
  async saveTask(taskData: TaskData): Promise<Task> { const data = { ...taskData, createdAt: new Date().toISOString(), status: 'todo' as TaskStatus }; const docRef = await addDoc(collection(db, "tasks"), data); return { id: docRef.id, ...data }; }
  async updateTask(updatedTask: Task): Promise<void> { const { id, ...data } = updatedTask; await updateDoc(doc(db, "tasks", id), data as any); }
}