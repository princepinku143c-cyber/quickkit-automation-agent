
import { db, auth } from './firebase';
import { Project, NexusType, NexusSubtype } from '../types';
import firebase from 'firebase/compat/app';

const COLLECTION_NAME = 'projects';
const LOCAL_STORAGE_DB = 'nexus_virtual_db_projects';

// Helper: Get UID (Real or Persistent Guest)
const getStorageUid = () => {
    if (auth?.currentUser && !auth.currentUser.isAnonymous) return auth.currentUser.uid;
    let anon = localStorage.getItem('nexus_anon_id');
    if (!anon) {
        anon = `anon_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('nexus_anon_id', anon);
    }
    return anon;
};

// Helper: Local DB Operations for Guests
const getLocalDb = (): Project[] => {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_DB) || '[]');
    } catch { return []; }
};

const saveLocalDb = (projects: Project[]) => {
    localStorage.setItem(LOCAL_STORAGE_DB, JSON.stringify(projects));
};

export const createProject = async (projectData: { title: string; description?: string }): Promise<Project> => {
    const uid = getStorageUid();
    const now = Date.now();
    const newProjectData: any = {
        userId: uid,
        title: projectData.title,
        description: projectData.description || '',
        status: 'DRAFT', 
        nexuses: [],   
        synapses: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        lastSavedAt: now
    };

    // Try Cloud if possible, fallback to Virtual DB for Guests
    if (db && auth?.currentUser && !auth.currentUser.isAnonymous) {
        try {
            const docRef = await db.collection(COLLECTION_NAME).add(newProjectData);
            return { id: docRef.id, ...newProjectData } as Project;
        } catch (e) {
            console.warn("Firebase restricted, saving to Virtual DB.");
        }
    }

    // VIRTUAL DB PERSISTENCE (Guest Mode)
    const localId = `local_${Date.now()}`;
    const fullProject = { id: localId, ...newProjectData } as Project;
    const dbData = getLocalDb();
    dbData.unshift(fullProject);
    saveLocalDb(dbData);
    return fullProject;
};

export const subscribeToProjects = (userId: string, callback: (projects: Project[]) => void): () => void => {
    const uid = userId || getStorageUid();

    // 1. If Real User, use Firebase Snapshot
    if (db && auth?.currentUser && !auth.currentUser.isAnonymous && !uid.startsWith('anon_')) {
        return db.collection(COLLECTION_NAME)
            .where("userId", "==", uid)
            .onSnapshot((snapshot) => {
                const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
                projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                callback(projects);
            });
    }

    // 2. If Guest, use Polling for Virtual DB (Simulates Realtime)
    const sync = () => {
        const localData = getLocalDb().filter(p => p.userId === uid);
        callback(localData);
    };
    
    sync(); // Initial Load
    const interval = setInterval(sync, 1500); 
    return () => clearInterval(interval);
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const uid = userId || getStorageUid();
    
    if (db && auth?.currentUser && !auth.currentUser.isAnonymous && !uid.startsWith('anon_')) {
        try {
            const snapshot = await db.collection(COLLECTION_NAME).where("userId", "==", uid).get();
            let projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
            projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            return projects;
        } catch (e) { return getLocalDb().filter(p => p.userId === uid); }
    }

    return getLocalDb().filter(p => p.userId === uid);
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
    const uid = getStorageUid();
    
    // Cloud Update
    if (db && !id.startsWith('local_')) {
        try {
            const { id: _, ...safeUpdates } = updates as any;
            await db.collection(COLLECTION_NAME).doc(id).update({
                ...safeUpdates,
                updatedAt: Date.now(),
                lastSavedAt: Date.now()
            });
            return;
        } catch (e) { console.error("Cloud update failed, syncing local..."); }
    }

    // Virtual DB Update (Guest)
    const dbData = getLocalDb();
    const idx = dbData.findIndex(p => p.id === id);
    if (idx !== -1) {
        dbData[idx] = { 
            ...dbData[idx], 
            ...updates, 
            updatedAt: Date.now(), 
            lastSavedAt: Date.now() 
        };
        saveLocalDb(dbData);
    }
};

export const deleteProject = async (id: string) => {
    if (db && !id.startsWith('local_')) {
        try {
            await db.collection(COLLECTION_NAME).doc(id).delete();
            return;
        } catch (e) {}
    }

    const dbData = getLocalDb();
    saveLocalDb(dbData.filter(p => p.id !== id));
};

export const checkDbConnection = async (): Promise<{ status: 'CONNECTED' | 'LOCKED' | 'OFFLINE' }> => {
    if (!db) return { status: 'OFFLINE' };
    try {
        await db.collection(COLLECTION_NAME).limit(1).get();
        return { status: 'CONNECTED' };
    } catch (e: any) {
        if (e.code === 'permission-denied') return { status: 'LOCKED' };
        return { status: 'OFFLINE' };
    }
};
