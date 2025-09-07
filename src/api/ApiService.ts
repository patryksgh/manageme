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
    private activeProjectId: string | null = null;
    public onAuthStateChangeCallback: ((user: User | null) => void) | null = null;

    constructor() {
        this.listenToAuthChanges();
    }

    private listenToAuthChanges() {
        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                this.currentUser = await this.getUserDocById(firebaseUser.uid);
            } else {
                this.currentUser = null;
            }

            if (this.onAuthStateChangeCallback) {
                this.onAuthStateChangeCallback(this.currentUser);
            }
        });
    }

    // autoryzacja użytkownika

    async login(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await this.getUserDocById(userCredential.user.uid);

        if (userDoc) {
            return userDoc;
        }
        throw new Error("Nie znaleziono danych użytkownika po zalogowaniu.");
    }

    async logout(): Promise<void> {
        await signOut(auth);
    }

    async register(email: string, password: string, userData: { firstName: string; lastName: string; role: UserRole; }): Promise<User> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = {
            id: userCredential.user.uid,
            email,
            ...userData
        };
        await this.setUserDoc(newUser);
        return newUser;
    }

    isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    async getUserDocById(id: string): Promise<User | null> {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? (userSnap.data() as User) : null;
    }

    async setUserDoc(user: User): Promise<void> {
        await setDoc(doc(db, "users", user.id), user);
    }

    async getAllUsers(): Promise<User[]> {
        const usersQuery = query(collection(db, "users"));
        const snapshot = await getDocs(usersQuery);
        return snapshot.docs.map(doc => doc.data() as User);
    }

    // zarządzanie projektami

    setActiveProjectId(projectId: string): void {
        this.activeProjectId = projectId;
    }

    getActiveProjectId(): string | null {
        return this.activeProjectId;
    }

    async getProjects(): Promise<Project[]> {
        const projectsCollection = collection(db, "projects");
        const snapshot = await getDocs(projectsCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }

    async saveProject(data: { name: string; description: string; }): Promise<Project> {
        const projectData = {
            ...data,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "projects"), projectData);
        return { id: docRef.id, ...projectData };
    }
    
    async getProjectById(id: string): Promise<Project | null> {
        const projectRef = doc(db, "projects", id);
        const snapshot = await getDoc(projectRef);
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Project) : null;
    }
    
    async updateProject(project: Project): Promise<void> {
        const { id, ...data } = project;
        await updateDoc(doc(db, "projects", id), data);
    }
    
    async deleteProject(id: string): Promise<void> {
        const batch = writeBatch(db);
        
        batch.delete(doc(db, "projects", id));
        
        const storiesSnapshot = await getDocs(query(collection(db, "stories"), where("projectId", "==", id)));
        storiesSnapshot.forEach(storyDoc => batch.delete(storyDoc.ref));
        
        const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("projectId", "==", id)));
        tasksSnapshot.forEach(taskDoc => batch.delete(taskDoc.ref));
        
        await batch.commit();
    }
    
    // stories
    
    async getStories(projectId: string): Promise<Story[]> {
        const storiesQuery = query(collection(db, "stories"), where("projectId", "==", projectId));
        const snapshot = await getDocs(storiesQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
    }
    
    async getStoryById(id: string): Promise<Story | null> {
        const storyRef = doc(db, "stories", id);
        const snapshot = await getDoc(storyRef);
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Story) : null;
    }
    
    async saveStory(data: StoryData): Promise<Story> {
        const storyData = {
            ...data,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "stories"), storyData);
        return { id: docRef.id, ...storyData };
    }
    
    async updateStory(story: Story): Promise<void> {
        const { id, ...data } = story;
        await updateDoc(doc(db, "stories", id), data);
    }
    
    async deleteStory(id: string): Promise<void> {
        const batch = writeBatch(db);
        
        batch.delete(doc(db, "stories", id));
        
        const tasksSnapshot = await getDocs(query(collection(db, "tasks"), where("storyId", "==", id)));
        tasksSnapshot.forEach(taskDoc => batch.delete(taskDoc.ref));
        
        await batch.commit();
    }
    
    // tasks

    async getTasks(projectId: string): Promise<Task[]> {
        const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
        const snapshot = await getDocs(tasksQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    }

    async getTasksByStoryId(storyId: string): Promise<Task[]> {
        const tasksQuery = query(collection(db, "tasks"), where("storyId", "==", storyId));
        const snapshot = await getDocs(tasksQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    }
    
    async getTaskById(id: string): Promise<Task | null> {
        const taskRef = doc(db, "tasks", id);
        const snapshot = await getDoc(taskRef);
        return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Task) : null;
    }
    
    async saveTask(data: TaskData): Promise<Task> {
        const taskData = {
            ...data,
            createdAt: new Date().toISOString(),
            status: 'todo' as TaskStatus,
        };
        const docRef = await addDoc(collection(db, "tasks"), taskData);
        return { id: docRef.id, ...taskData };
    }
    
    async updateTask(task: Task): Promise<void> {
        const { id, ...data } = task;
        await updateDoc(doc(db, "tasks", id), data);
    }
}