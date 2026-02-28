
import { Blueprint } from '../types';

const MEMORY_KEY = 'nexus_blueprints_memory';

/**
 * Saves a blueprint to the local "Vector" memory.
 * In a real app, this would push to Pinecone/Weaviate.
 */
export const saveWorkflowToMemory = (blueprint: Blueprint) => {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        const memories: Blueprint[] = stored ? JSON.parse(stored) : [];
        
        // Update if exists, else add
        const idx = memories.findIndex(m => m.id === blueprint.id);
        if (idx >= 0) {
            memories[idx] = blueprint;
        } else {
            memories.push(blueprint);
        }
        
        localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
    } catch (e) {
        console.error("Memory Save Failed:", e);
    }
};

/**
 * Finds relevant workflows based on keyword matching (Simulated Semantic Search).
 */
export const findSimilarWorkflows = (userRequest: string): Blueprint[] => {
    try {
        const stored = localStorage.getItem(MEMORY_KEY);
        if (!stored) return [];
        
        const memories: Blueprint[] = JSON.parse(stored);
        const keywords = userRequest.toLowerCase().split(' ').filter(w => w.length > 3);
        
        const scored = memories.map(bp => {
            let score = 0;
            const text = (bp.title + " " + bp.description).toLowerCase();
            keywords.forEach(word => {
                if (text.includes(word)) score++;
            });
            return { bp, score };
        });

        // Return top 3 matches with score > 0
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.bp);
    } catch (e) {
        return [];
    }
};
