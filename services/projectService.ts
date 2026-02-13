
import { db, auth } from './firebase';
import { Project, NexusType, NexusSubtype } from '../types';
import { verifyProjectCreationLimit } from './usageGuard';
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
        description: projectData.description || 'New automated workflow.',
        status: 'DRAFT', 
        nexuses: [],   
        synapses: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        lastSavedAt: now
    };

    // Try Cloud if possible
    if (db && auth?.currentUser && !auth.currentUser.isAnonymous) {
        try {
            // 🔥 CORE LIMIT CHECK: Block creation if limit hit
            await verifyProjectCreationLimit(uid);

            // Atomic Operation: Create Project AND Increment Usage
            const batch = db.batch();
            const projectRef = db.collection(COLLECTION_NAME).doc();
            const userRef = db.collection('users').doc(uid);

            batch.set(projectRef, newProjectData);
            batch.update(userRef, { 
                'usage.workflows': firebase.firestore.FieldValue.increment(1) 
            });

            await batch.commit();
            
            return { id: projectRef.id, ...newProjectData } as Project;
        } catch (e: any) {
            // If the error comes from our guard, rethrow it to UI
            if (e.message === 'PROJECT_LIMIT_REACHED') {
                throw e; 
            }
            console.warn("Firebase restricted or network fail, saving to Virtual DB.", e);
        }
    }

    // VIRTUAL DB PERSISTENCE (Guest Mode or Cloud Error Fallback)
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
                // Add local-only projects if any were created during offline session
                const localData = getLocalDb().filter(p => p.userId === uid);
                const combined = [...projects, ...localData.filter(lp => !projects.find(rp => rp.id === lp.id))];
                combined.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                callback(combined);
            }, (err) => {
                console.error("Cloud sub failed, falling back to local.");
                callback(getLocalDb().filter(p => p.userId === uid));
            });
    }

    // 2. If Guest, use Polling for Virtual DB (Simulates Realtime)
    const sync = () => {
        const localData = getLocalDb().filter(p => p.userId === uid);
        callback(localData);
    };
    
    sync(); // Initial Load
    const interval = setInterval(sync, 2000); 
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
    const now = Date.now();
    
    // Cloud Update
    if (db && !id.startsWith('local_')) {
        try {
            const { id: _, ...safeUpdates } = updates as any;
            await db.collection(COLLECTION_NAME).doc(id).update({
                ...safeUpdates,
                updatedAt: now,
                lastSavedAt: now
            });
            return;
        } catch (e) { console.error("Cloud update failed, syncing local..."); }
    }

    // Virtual DB Update (Guest or Fallback)
    const dbData = getLocalDb();
    const idx = dbData.findIndex(p => p.id === id);
    if (idx !== -1) {
        dbData[idx] = { 
            ...dbData[idx], 
            ...updates, 
            updatedAt: now, 
            lastSavedAt: now 
        };
        saveLocalDb(dbData);
    }
};

export const deleteProject = async (id: string) => {
    if (db && !id.startsWith('local_')) {
        try {
            // Atomic: Delete Project AND Decrement Usage
            const batch = db.batch();
            const projectRef = db.collection(COLLECTION_NAME).doc(id);
            const uid = auth?.currentUser?.uid;
            
            if (uid) {
                const userRef = db.collection('users').doc(uid);
                batch.delete(projectRef);
                batch.update(userRef, { 
                    'usage.workflows': firebase.firestore.FieldValue.increment(-1) 
                });
                await batch.commit();
            } else {
                await projectRef.delete();
            }
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
