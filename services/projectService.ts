
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';
import { Project } from '../types';

const COLLECTION_NAME = 'projects';

/**
 * Creates a new project draft in Firestore.
 */
export const createProject = async (projectData: { title: string; description?: string }): Promise<Project> => {
    console.log('🔍 DEBUG: createProject called');
    
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated. Please sign in first.');
    if (!db) throw new Error('Firestore instance is missing.');

    const now = Date.now();
    
    const newProject = {
        userId: currentUser.uid,
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

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newProject);
        console.log('✅ SUCCESS: Project created with ID:', docRef.id);
        return { id: docRef.id, ...newProject } as Project;
    } catch (error: any) {
        console.error('❌ FIRESTORE WRITE FAILED:', error);
        throw new Error(`Save Failed: ${error.message}`);
    }
};

/**
 * Real-time subscription to projects.
 */
export const subscribeToProjects = (userId: string, callback: (projects: Project[]) => void): Unsubscribe => {
    if (!db) return () => {};

    // Ensure we are querying correctly
    const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId)
    );

    console.log(`📡 STARTER LISTENER for user: ${userId}`);

    return onSnapshot(q, (snapshot) => {
        console.log(`📥 SNAPSHOT EVENT: Found ${snapshot.size} docs`);
        
        const projects = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure arrays exist to prevent UI crashes
                nexuses: data.nexuses || [],
                synapses: data.synapses || [],
                tags: data.tags || []
            };
        }) as Project[];
        
        // Client-side sort (Newest first)
        projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        
        callback(projects);
    }, (error) => {
        console.error("❌ LISTENER ERROR:", error);
    });
};

/**
 * Direct Fetch (Fallback for manual refresh)
 */
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    if (!db) return [];
    console.log("🔄 Manual Fetch triggered");
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId)
        );
        
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        })) as Project[];

        projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        console.log(`🔄 Manual Fetch retrieved ${projects.length} projects`);
        return projects;
    } catch (e) {
        console.error("❌ Manual Fetch Error: ", e);
        return [];
    }
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!db) return;
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Date.now(),
            lastSavedAt: Date.now()
        });
    } catch (error) {
        console.error('❌ Update Error:', error);
        throw error;
    }
};

export const deleteProject = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error('❌ Delete Error:', error);
        throw error;
    }
};
