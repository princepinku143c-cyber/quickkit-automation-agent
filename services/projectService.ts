import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { Project, NexusType, NexusSubtype } from '../types';

const PROJECTS_COLLECTION = 'projects';

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

export const createProject = async (userId: string, projectData: Partial<Project>): Promise<string> => {
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
    ...projectData,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nexuses: projectData.nexuses || [],
    synapses: projectData.synapses || [],
    settings: projectData.settings || { clientVariables: {} }
  });
  return docRef.id;
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now()
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDocs(query(collection(db, PROJECTS_COLLECTION), where('__name__', '==', projectId)));
  if (docSnap.empty) return null;
  return { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Project;
};

export const subscribeToProjects = (userId: string, callback: (projects: Project[]) => void) => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Project));
    callback(projects);
  });
};

export const checkDbConnection = async (): Promise<boolean> => {
    try {
        await getDocs(query(collection(db, PROJECTS_COLLECTION), limit(1)));
        return true;
    } catch (e) {
        console.error("DB Connection Check Failed:", e);
        return false;
    }
};
