// =======================================================================
// ===           ApiService.ts - WERSJA Z getAllUsers                  ===
// =======================================================================
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, writeBatch, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase-config";
import type { Project } from "../models/Project";
import type { Story, StoryData } from "../models/Story";
import type { Task, TaskData, TaskStatus } from "../models/Task";
import type { User, UserRole } from "../models/User";

export class ApiService {
  private currentUser: User | null = null;
  public onAuthStateChangeCallback: ((user: User | null) => void) | null = null;
  constructor() { this.listenToAuthChanges(); }
  private listenToAuthChanges() { onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => { this.currentUser = firebaseUser ? await this.getUserDocById(firebaseUser.uid) : null; if (this.onAuthStateChangeCallback) { this.onAuthStateChangeCallback(this.currentUser); } }); }
  async login(email: string, password: string): Promise<User> { const uc = await signInWithEmailAndPassword(auth, email, password); const doc = await this.getUserDocById(uc.user.uid); if (doc) return doc; throw new Error("Błąd danych."); }
  async logout(): Promise<void> { await signOut(auth); }
  async register(email: string, password: string, userData: { firstName: string; lastName: string; role: UserRole; }): Promise<User> { const uc = await createUserWithEmailAndPassword(auth, email, password); const newUser: User = { id: uc.user.uid, email, ...userData }; await this.setUserDoc(newUser); return newUser; }
  isAuthenticated(): boolean { return !!this.currentUser; }
  getCurrentUser(): User | null { return this.currentUser; }
  async getUserDocById(id: string): Promise<User | null> { const ref = doc(db, "users", id); const snap = await getDoc(ref); return snap.exists() ? snap.data() as User : null; }
  async setUserDoc(user: User): Promise<void> { await setDoc(doc(db, "users", user.id), user); }
  
  // === NOWA METODA ===
  async getAllUsers(): Promise<User[]> {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  }
  
  private activeProjectId: string | null = null;
  setActiveProjectId(projectId: string): void { this.activeProjectId = projectId; }
  getActiveProjectId(): string | null { return this.activeProjectId; }
  async getProjects(): Promise<Project[]> { const q = collection(db, "projects"); const s = await getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() } as Project)); }
  async saveProject(data: { name: string; description: string; }): Promise<Project> { const d = { ...data, createdAt: new Date().toISOString() }; const ref = await addDoc(collection(db, "projects"), d); return { id: ref.id, ...d }; }
  async getProjectById(id: string): Promise<Project | null> { const ref = doc(db, "projects", id); const s = await getDoc(ref); return s.exists() ? { id: s.id, ...s.data() } as Project : null; }
  async updateProject(p: Project): Promise<void> { const { id, ...data } = p; await updateDoc(doc(db, "projects", id), data as any); }
  async deleteProject(id: string): Promise<void> { const b = writeBatch(db); b.delete(doc(db, "projects", id)); const ss = await getDocs(query(collection(db, "stories"), where("projectId", "==", id))); ss.forEach(d => b.delete(d.ref)); const ts = await getDocs(query(collection(db, "tasks"), where("projectId", "==", id))); ts.forEach(d => b.delete(d.ref)); await b.commit(); }
  async getStories(projectId: string): Promise<Story[]> { const q = query(collection(db, "stories"), where("projectId", "==", projectId)); const s = await getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() } as Story)); }
  async getStoryById(id: string): Promise<Story | null> { const ref = doc(db, "stories", id); const s = await getDoc(ref); return s.exists() ? { id: s.id, ...s.data() } as Story : null; }
  async saveStory(data: StoryData): Promise<Story> { const d = { ...data, createdAt: new Date().toISOString() }; const ref = await addDoc(collection(db, "stories"), d); return { id: ref.id, ...d }; }
  async updateStory(s: Story): Promise<void> { const { id, ...data } = s; await updateDoc(doc(db, "stories", id), data as any); }
  async deleteStory(id: string): Promise<void> { const b = writeBatch(db); b.delete(doc(db, "stories", id)); const ts = await getDocs(query(collection(db, "tasks"), where("storyId", "==", id))); ts.forEach(d => b.delete(d.ref)); await b.commit(); }
  async getTasks(projectId: string): Promise<Task[]> { const q = query(collection(db, "tasks"), where("projectId", "==", projectId)); const s = await getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() } as Task)); }
  async getTasksByStoryId(id: string): Promise<Task[]> { const q = query(collection(db, "tasks"), where("storyId", "==", id)); const s = await getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() } as Task)); }
  async getTaskById(id: string): Promise<Task | null> { const ref = doc(db, "tasks", id); const s = await getDoc(ref); return s.exists() ? { id: s.id, ...s.data() } as Task : null; }
  async saveTask(data: TaskData): Promise<Task> { const d = { ...data, createdAt: new Date().toISOString(), status: 'todo' as TaskStatus }; const ref = await addDoc(collection(db, "tasks"), d); return { id: ref.id, ...d }; }
  async updateTask(t: Task): Promise<void> { const { id, ...data } = t; await updateDoc(doc(db, "tasks", id), data as any); }
}