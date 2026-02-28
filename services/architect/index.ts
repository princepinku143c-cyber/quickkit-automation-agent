
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Nexus, Synapse } from '../../types';
import { ARCHITECT_PERSONA } from './systemPersona';
import { getToolsContext } from './knowledgeBase';
import { ArchitectResponse } from './types';
import { validateGraph, simulatePatch } from './validator';
import { findSimilarWorkflows } from '../memoryService';
import { getArchitectMemories } from '../cloudStore';
import { callAIWithTimeout, getActiveGeminiKey } from '../geminiService';
import { safeJsonParse, validateArchitectResponse } from './responseParser';
import { AI_MODELS } from '../../constants';

const applySmartLayout = (currentNodes: Nexus[], newNodes: Nexus[]): Nexus[] => {
    let maxX = currentNodes.length > 0 ? Math.max(...currentNodes.map(n => n.position.x)) + 400 : 100;

    return newNodes.map((node, index) => {
        if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
            return {
                ...node,
                position: {
                    x: maxX + (index * 350),
                    y: 300
                }
            };
        }
        return node;
    });
};

export const processArchitectRequest = async (
    ai: GoogleGenAI,
    userRequest: string,
    history: ChatMessage[],
    currentNexuses: Nexus[],
    currentSynapses: Synapse[],
    projectContext: string,
    imageData?: string
): Promise<ArchitectResponse> => {
    
    const toolsContext = getToolsContext();
    const canvasState = JSON.stringify({
        nodes: currentNexuses.map(n => ({ id: n.id, label: n.label, type: n.subtype, config: n.config })),
        connections: currentSynapses
    });

    // --- REINFORCEMENT LEARNING: FETCH MEMORIES ---
    // The architect learns from past successful blueprints
    const learnedPatterns = await getArchitectMemories(5);

    const baseInstruction = `${ARCHITECT_PERSONA}\n\nTOOLS:\n${toolsContext}\n\nCANVAS_STATE:\n${canvasState}\n\n${learnedPatterns}`;
    
    // 🔥 SMART ROUTING ENGINE: Decide between Pro (Intelligence) and Flash (Cost/Speed)
    // We analyze the request complexity to save costs.
    const isComplexRequest = 
        userRequest.length > 600 || 
        currentNexuses.length > 12 || 
        history.length > 6 ||
        (userRequest.toLowerCase().includes('complex') && userRequest.length > 200) ||
        userRequest.toLowerCase().includes('deep reasoning') ||
        userRequest.toLowerCase().includes('refactor') ||
        userRequest.toLowerCase().includes('optimization');

    const model = isComplexRequest ? AI_MODELS.ARCHITECT : AI_MODELS.RUNTIME;
    
    console.log(`[Architect] Routing to ${model} (Complexity: ${isComplexRequest ? 'HIGH' : 'LOW'})`);
    
    const client = new GoogleGenAI({ apiKey: getActiveGeminiKey() });

    try {
        // 1. CALL WITH TIMEOUT (15s)
        const response = await callAIWithTimeout<GenerateContentResponse>(() => client.models.generateContent({
            model: model,
            contents: [
                { role: 'user', parts: [{ text: baseInstruction }] },
                ...history.slice(-6).map(m => ({ 
                    role: m.role === 'assistant' ? 'model' : 'user', 
                    parts: [{ text: m.content }] 
                })),
                { role: 'user', parts: [{ text: `NEW_USER_REQUEST: ${userRequest}` }] }
            ],
            config: { 
                temperature: 0.2,
                ...(isComplexRequest ? { thinkingConfig: { thinkingBudget: 4000 } } : {}) // Only use thinking for Pro
            }
        }), 18000); // 18s total budget including network

        let rawText = response.text || "{}";
        
        // 2. CLEANUP & SAFE PARSE
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = safeJsonParse<ArchitectResponse>(rawText);

        if (!parsed) {
            throw new Error("INVALID_JSON_RESPONSE");
        }

        // 3. STRUCTURAL VALIDATION
        const validatedOutput = validateArchitectResponse(parsed);

        // 4. POST-PROCESS (Layout)
        if (validatedOutput.patch?.addNodes) {
            validatedOutput.patch.addNodes = applySmartLayout(currentNexuses, validatedOutput.patch.addNodes);
        }

        return validatedOutput;

    } catch (err: any) {
        console.error("Architect Kernel Error:", err);
        
        // Return a safe fallback response instead of crashing
        let friendlyError = "I encountered a system error.";
        if (err.message === 'AI_TIMEOUT') friendlyError = "I'm taking too long to think. Please try a simpler request.";
        if (err.message === 'INVALID_JSON_RESPONSE') friendlyError = "My internal structure generator failed. Please ask again.";

        return {
            intent: 'EXPLAIN_FLOW',
            text: `⚠️ **System Alert**: ${friendlyError}`,
            decisionLog: [],
            confidenceScore: 0,
            riskLevel: 'HIGH',
            validationError: err.message
        };
    }
};
