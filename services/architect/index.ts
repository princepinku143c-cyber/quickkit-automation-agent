
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Nexus, Synapse } from '../../types';
import { ARCHITECT_PERSONA } from './systemPersona';
import { getToolsContext } from './knowledgeBase';
import { ArchitectResponse } from './types';
import { validateGraph, simulatePatch } from './validator';
import { findSimilarWorkflows } from '../memoryService';

// --- SMART LAYOUT ENGINE ---
const applySmartLayout = (currentNodes: Nexus[], newNodes: Nexus[]): Nexus[] => {
    let maxX = 0;
    
    // Find the furthest right point of the current graph
    currentNodes.forEach(n => {
        if (n.position.x > maxX) maxX = n.position.x;
    });

    if (currentNodes.length > 0) maxX += 400; // Add gap after existing flow
    else maxX = 100; // Start point

    return newNodes.map((node, index) => {
        // If the AI gave 0,0 or undefined, we auto-place it in a sequence
        if (!node.position || (node.position.x === 0 && node.position.y === 0)) {
            return {
                ...node,
                position: {
                    x: maxX + (index * 350), // Move right for each new node
                    y: 300 // Keep centered vertically
                }
            };
        }
        return node;
    });
};

// --- VARIABLE CHEAT SHEET ---
// This helps the AI map data correctly by knowing standard outputs
const VARIABLE_CHEAT_SHEET = `
**COMMON VARIABLE MAPPINGS (Use these patterns):**
- Webhook Input: {{Trigger_Name.data.body}} or {{Trigger_Name.data.query}}
- AI Output: {{Agent_Name.data.text}}
- HTTP Response: {{Http_Request.data.data}}
- Email Subject: {{Email_Trigger.data.subject}}
- Google Sheet Row: {{Sheet_Read.data.rows}}
`;

// --- SELF-CORRECTION LOOP ---
export const processArchitectRequest = async (
    ai: GoogleGenAI,
    userRequest: string,
    history: ChatMessage[],
    currentNexuses: Nexus[],
    currentSynapses: Synapse[],
    projectContext: string,
    imageData?: string
): Promise<ArchitectResponse> => {
    
    // 1. Context Injection
    const toolsContext = getToolsContext();
    const canvasState = JSON.stringify({
        nodes: currentNexuses.map(n => ({ id: n.id, label: n.label, type: n.subtype, config: n.config, position: n.position })),
        connections: currentSynapses
    });

    // 2. Memory Injection (RAG)
    const similarFlows = findSimilarWorkflows(userRequest);
    let memoryContext = "";
    if (similarFlows.length > 0) {
        memoryContext = `\n\n**RELEVANT PAST WORKFLOWS (USE FOR INSPIRATION):**\n${JSON.stringify(similarFlows.map(f => ({ name: f.name, nodes: f.nexuses.map(n => n.subtype) })), null, 2)}`;
    }

    const baseInstruction = `${ARCHITECT_PERSONA}\n${toolsContext}\n${VARIABLE_CHEAT_SHEET}\n${memoryContext}\n**PROJECT CONTEXT:** "${projectContext}"\n**CURRENT_CANVAS_STATE:** ${canvasState}`;
    
    let attempts = 0;
    let lastError = "";

    // RETRY LOOP (Reflexion)
    while (attempts < 2) {
        try {
            let promptParts: any[] = [{ text: userRequest }];
            
            if (lastError) {
                // If retrying, inject the error into the prompt (Self-Correction)
                promptParts = [{ text: `PREVIOUS ATTEMPT FAILED. Error: ${lastError}. \nPlease fix the JSON structure and try again. Ensure 'patch' contains valid 'addNodes' and 'addConnections'.\n\nOriginal Request: ${userRequest}` }];
            } else if (imageData) {
                const dataMatch = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
                if (dataMatch) promptParts.push({ inlineData: { mimeType: dataMatch[1], data: dataMatch[2] } });
            }

            // 3. Model Power (Gemini 3 Pro + Thinking 4000)
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview", 
                contents: [
                    { role: 'user', parts: [{ text: baseInstruction }] },
                    ...history.slice(-4).map(m => ({ 
                        role: m.role === 'assistant' ? 'model' : 'user', 
                        parts: [{ text: m.content }] 
                    })),
                    { role: 'user', parts: promptParts }
                ],
                config: { 
                    maxOutputTokens: 20000, 
                    temperature: 0.3, 
                    // CRITICAL: The "Soch" (Reasoning) Engine
                    thinkingConfig: { thinkingBudget: 4000 }
                }
            });

            const rawText = response.text || "{}";
            
            // Extract JSON from Markdown block
            const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : rawText;

            let output: ArchitectResponse = JSON.parse(jsonString);

            // 4. Post-Processing: Smart Layout
            if (output.patch && output.patch.addNodes) {
                output.patch.addNodes = applySmartLayout(currentNexuses, output.patch.addNodes);
            }

            // 5. Validation (Safety Check)
            let finalState = { nexuses: currentNexuses, synapses: currentSynapses };
            if (output.fullBlueprint) finalState = output.fullBlueprint;
            else if (output.patch) finalState = simulatePatch(currentNexuses, currentSynapses, output.patch);

            if (output.intent !== 'EXPLAIN_FLOW' && (output.fullBlueprint || output.patch)) {
                const validation = validateGraph(finalState.nexuses, finalState.synapses);
                if (!validation.isValid) {
                    throw new Error(`Validation Failed: ${validation.errors[0]}`);
                }
            }

            return output;

        } catch (err: any) {
            console.warn(`Architect attempt ${attempts + 1} failed:`, err);
            lastError = err.message;
            attempts++;
        }
    }

    // Fallback if AI fails twice
    return {
        intent: 'EXPLAIN_FLOW',
        text: `I attempted to build the flow, but encountered a structural error: ${lastError}. Please simplify the request or try manual mode.`,
        decisionLog: [],
        confidenceScore: 0,
        riskLevel: 'HIGH'
    };
};
