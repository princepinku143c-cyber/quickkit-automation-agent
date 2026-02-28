
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Nexus, Synapse, NexusType, NexusSubtype, ChatMessage, Credential } from "../types";
import { AGENT_SYSTEM_PROMPT } from "./aiPrompts";
import { processArchitectRequest } from "./architect"; 
import { ArchitectResponse } from "./architect/types";

export interface ValidationResult {
    status: 'VALID' | 'INVALID';
    message: string;
}

// --- SAFETY UTILS ---
export const callAIWithTimeout = async <T>(apiCall: () => Promise<T>, timeoutMs: number = 15000): Promise<T> => {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    });

    try {
        const result = await Promise.race([
            apiCall(),
            timeoutPromise
        ]);
        clearTimeout(timeoutHandle!);
        return result;
    } catch (error) {
        clearTimeout(timeoutHandle!);
        throw error;
    }
};

// --- KEY RECOVERY UTILITY (Vault Priority) ---
export const getActiveGeminiKey = (): string => {
    try {
        // 1. Check Vault (User defined)
        const stored = localStorage.getItem('nexus_credentials');
        if (stored) {
            const credentials: Credential[] = JSON.parse(stored);
            const geminiCred = credentials.find(c => c.type === 'GEMINI');
            if (geminiCred && geminiCred.data.value) return geminiCred.data.value;
        }
    } catch (e) {}
    
    // 2. Fallback to Env
    return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
};

export const validateCredential = async (type: string, apiKey: string): Promise<ValidationResult> => {
    if (type === 'GEMINI') return validateGeminiKey(apiKey);
    if (type === 'OPENAI') return validateOpenAIKey(apiKey);
    if (apiKey.length < 5) return { status: 'INVALID', message: 'Too Short' };
    return { status: 'VALID', message: 'Format OK' };
};

export const validateOpenAIKey = async (apiKey: string): Promise<ValidationResult> => {
    if (apiKey.startsWith('sk-') && apiKey.length > 20) {
        return { status: 'VALID', message: 'Format OK' };
    }
    return { status: 'INVALID', message: 'Invalid OpenAI Key format' };
};

export const validateGeminiKey = async (apiKey: string): Promise<ValidationResult> => {
    try {
        const cleanKey = apiKey.trim();
        if(!cleanKey) return { status: 'INVALID', message: 'Empty Key' };
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        // Use a lightweight model for validation
        await callAIWithTimeout(() => ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'Ping' }), 5000);
        return { status: 'VALID', message: 'Active' };
    } catch (error: any) {
        return { status: 'INVALID', message: error.message || 'Key Rejected' };
    }
};

export const runAgentWithTools = async (config: any, userPrompt: string, userApiKey: string | undefined, contextData: any = {}) => {
    const apiKey = userApiKey || getActiveGeminiKey();
    
    if (!apiKey) return { text: "Error: API Key missing. Please add it in Credentials." };

    const ai = new GoogleGenAI({ apiKey });
    const tools: any[] = [];
    if (config.enabledTools?.includes('web_search')) tools.push({ googleSearch: {} });

    try {
        const response = await callAIWithTimeout<GenerateContentResponse>(() => ai.models.generateContent({
            model: config.model || 'gemini-3-pro-preview', 
            contents: `CONTEXT: ${JSON.stringify(contextData)}\nPROMPT: ${userPrompt}`,
            config: { systemInstruction: AGENT_SYSTEM_PROMPT, tools: tools.length > 0 ? tools : undefined }
        }), 20000);
        return { text: response.text || "", functionCalls: response.functionCalls };
    } catch (e: any) {
        return { text: `AI Error: ${e.message}` };
    }
};

export const chatWithArchitect = async (
  userRequest: string, 
  history: ChatMessage[],
  systemApiKey: string, 
  currentNexuses: Nexus[] = [],
  currentSynapses: Synapse[] = [],
  projectContext: string = "Untitled Project",
  imageData?: string 
): Promise<ArchitectResponse> => {
  const apiKey = getActiveGeminiKey();
  
  if (!apiKey) {
      throw new Error("Missing Gemini API Key. Please add it in the Credential Vault.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  return await processArchitectRequest(userRequest, currentNexuses, currentSynapses, projectContext);
};

// --- NEW: SPECIALIZED WORKFLOW ANALYSIS ---
export const analyzeWorkflow = async (
    intent: 'VALIDATE' | 'EXPLAIN' | 'OPTIMIZE',
    nexuses: Nexus[],
    synapses: Synapse[]
): Promise<string> => {
    const apiKey = getActiveGeminiKey();
    if (!apiKey) throw new Error("API Key required for analysis.");

    const ai = new GoogleGenAI({ apiKey });
    const graphJson = JSON.stringify({
        nodes: nexuses.map(n => ({ id: n.id, type: n.type, subtype: n.subtype, label: n.label })),
        connections: synapses
    });

    let systemPrompt = "";
    if (intent === 'VALIDATE') {
        systemPrompt = `You are a QA Engineer for an automation platform. Analyze the JSON workflow graph provided.
        Identify:
        1. Missing start/trigger nodes.
        2. Broken connections (nodes not reachable from trigger).
        3. Potential infinite loops.
        4. Logic gaps.
        Return a bulleted list of "CRITICAL ERRORS", "WARNINGS", and a "STABILITY SCORE" (0-100). Use Markdown.`;
    } else if (intent === 'EXPLAIN') {
        systemPrompt = `You are a Product Manager explaining a technical workflow to a non-technical client.
        Analyze the JSON workflow graph provided.
        Write a concise, plain-english summary of:
        1. What triggers this workflow?
        2. What actions does it perform?
        3. What is the final outcome?
        Avoid jargon. Use emojis for readability. Use Markdown.`;
    } else if (intent === 'OPTIMIZE') {
        systemPrompt = `You are a Senior Solutions Architect. Analyze the JSON workflow graph provided.
        Suggest 3 specific optimizations for:
        1. Cost reduction (API calls).
        2. Performance (latency/parallelism).
        3. Reliability (error handling).
        If the flow is already optimal, say so. Use Markdown.`;
    }

    const response = await callAIWithTimeout<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `WORKFLOW_GRAPH:\n${graphJson}`,
        config: { systemInstruction: systemPrompt }
    }), 12000);

    return response.text || "Analysis complete.";
};
