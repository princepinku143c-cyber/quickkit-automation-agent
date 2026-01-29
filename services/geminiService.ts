import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Nexus, Synapse, NexusType, NexusSubtype, ChatMessage } from "../types";
import { AGENT_SYSTEM_PROMPT } from "./aiPrompts";
import { processArchitectRequest } from "./architect"; // IMPORTING THE NEW BRAIN
import { ArchitectResponse } from "./architect/types";

// --- UTILITY: SAFE JSON PARSER ---
const tryParseJSON = (text: string) => {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[1]); } catch (e2) {}
        }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
             try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch (e3) {}
        }
        return null; 
    }
};

const sanitizeInput = (input: string): string => {
    if (!input) return "";
    let clean = input.length > 20000 ? input.substring(0, 20000) + "...[TRUNCATED]" : input;
    return `USER_DATA_START\n${clean}\nUSER_DATA_END`;
};

// --- KEY VALIDATION LOGIC ---

export type ValidationResult = { status: 'VALID' | 'INVALID' | 'QUOTA' | 'ERROR'; message: string; latency?: number };

export const validateCredential = async (type: string, apiKey: string): Promise<ValidationResult> => {
    if (type === 'GEMINI') return validateGeminiKey(apiKey);
    if (type === 'OPENAI') return validateOpenAIKey(apiKey);
    
    if (apiKey.length < 5) return { status: 'INVALID', message: 'Too Short' };
    return { status: 'VALID', message: 'Format OK (No Ping)' };
};

export const validateGeminiKey = async (apiKey: string): Promise<ValidationResult> => {
    try {
        const cleanKey = apiKey.trim();
        if(!cleanKey) return { status: 'INVALID', message: 'Empty Key' };

        const start = Date.now();
        // Fix: Use mandatory named parameter for initialization
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: 'Hi',
        });
        
        const latency = Date.now() - start;
        return { status: 'VALID', message: 'Active', latency };

    } catch (error: any) {
        const msg = (error.message || '').toLowerCase();
        const status = (error.status || 0);

        if (msg.includes('429') || status === 429 || msg.includes('quota')) return { status: 'QUOTA', message: 'Quota Full' };
        if (msg.includes('401') || status === 401 || msg.includes('invalid')) return { status: 'INVALID', message: 'Invalid Key' };
        if (msg.includes('403') || status === 403 || msg.includes('permission')) return { status: 'INVALID', message: 'API Not Enabled' }; 
        if (msg.includes('400') || status === 400) return { status: 'INVALID', message: 'Bad Format' };
        
        return { status: 'ERROR', message: 'Network/Unknown Error' };
    }
};

export const validateOpenAIKey = async (apiKey: string): Promise<ValidationResult> => {
    const cleanKey = apiKey.trim();
    if (!cleanKey.startsWith('sk-')) {
        return { status: 'INVALID', message: 'Must start with sk-' };
    }
    try {
        const start = Date.now();
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cleanKey}` }
        });
        const latency = Date.now() - start;
        if (response.ok) return { status: 'VALID', message: 'Active', latency };
        if (response.status === 401) return { status: 'INVALID', message: 'Invalid Key' };
        if (response.status === 429) return { status: 'QUOTA', message: 'Quota Exceeded' };
        return { status: 'ERROR', message: `Error ${response.status}` };
    } catch (error: any) {
        return { status: 'VALID', message: 'Format Valid (CORS Blocked)', latency: 0 };
    }
};

// --- TOOL DEFINITIONS ---
const googleSheetsReadTool: FunctionDeclaration = {
  name: 'read_google_sheet',
  parameters: {
    type: Type.OBJECT,
    description: 'Fetch data from a Google Spreadsheet.',
    properties: {
      sheetId: { type: Type.STRING },
      range: { type: Type.STRING }
    },
    required: ['sheetId', 'range'],
  },
};

const googleSheetsWriteTool: FunctionDeclaration = {
  name: 'write_google_sheet',
  parameters: {
    type: Type.OBJECT,
    description: 'Write data to a Google Spreadsheet.',
    properties: {
      sheetId: { type: Type.STRING },
      range: { type: Type.STRING },
      data: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['sheetId', 'range', 'data'],
  },
};

/**
 * Runs the AI Agent Node (Runtime Execution)
 */
export const runAgentWithTools = async (config: any, userPrompt: string, userApiKey: string | undefined, contextData: any = {}) => {
    
    const apiOperation = async (ai: GoogleGenAI) => {
        const tools: any[] = [];
        if (config.enabledTools?.includes('web_search')) tools.push({ googleSearch: {} });
        if (config.enabledTools?.includes('sheets_read')) tools.push({ functionDeclarations: [googleSheetsReadTool] });
        if (config.enabledTools?.includes('sheets_write')) tools.push({ functionDeclarations: [googleSheetsWriteTool] });

        let safeContextString = "{}";
        try {
            safeContextString = JSON.stringify(contextData, (key, value) => {
                if (key === 'lastOutput') return undefined; 
                return value;
            });
        } catch (e) {
            safeContextString = "{ Error: Context data too complex }";
        }

        const safeUserPrompt = sanitizeInput(userPrompt || config.systemMessage);
        const fullPrompt = `CONTEXT_DATA: ${safeContextString}\n\nUSER_REQUEST_BELOW:\n${safeUserPrompt}`;

        const response = await ai.models.generateContent({
            // Fix: Upgrade to gemini-3-pro-preview for complex reasoning tasks
            model: config.model || 'gemini-3-pro-preview', 
            contents: fullPrompt,
            config: {
                systemInstruction: AGENT_SYSTEM_PROMPT, // IMPORTED FROM PROMPTS FILE
                tools: tools.length > 0 ? tools : undefined
            }
        });

        const text = response.text || "";
        let parsedData = tryParseJSON(text);

        return {
            text: text,
            parsed: parsedData, 
            functionCalls: response.functionCalls,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    };

    // Fix: Exclusively use process.env.API_KEY for the main identity, injected automatically
    const apiKey = userApiKey || process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    return await apiOperation(ai);
};

/**
 * Generates Video using Google Veo (SDK)
 */
export const generateVeoVideo = async (
    prompt: string, 
    resolution: '1080p' | '720p' = '720p',
    aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<{ videoUrl: string }> => {
    // Fix: Follow guidelines for mandatory paid API Key selection when using Veo models
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }
    
    // Fix: Create instance right before API call to ensure up-to-date selected key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, resolution, aspectRatio }
        });
        while (!operation.done) {
            // Fix: Poll with 10s interval for video operations as per guidelines
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        const rawUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (rawUri) {
            // Fix: Append API key to download link
            return { videoUrl: `${rawUri}&key=${process.env.API_KEY}` }; 
        }
    } catch (e: any) {
         // Fix: Handle key selection reset if entity not found
         if (e.message?.includes("Requested entity was not found.")) {
             await (window as any).aistudio.openSelectKey();
         }
         throw e;
    }
    throw new Error("Veo Generation failed.");
};

/**
 * THE ARCHITECT (Builder Engine)
 * Now delegates logic to services/architect/index.ts
 */
export const chatWithArchitect = async (
  userRequest: string, 
  history: ChatMessage[],
  systemApiKey: string, 
  currentNexuses: Nexus[] = [],
  currentSynapses: Synapse[] = [],
  projectContext: string = "Untitled Project",
  imageData?: string 
): Promise<ArchitectResponse> => {
  
  // Fix: Exclusively use process.env.API_KEY and named initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  return await processArchitectRequest(
      ai,
      userRequest,
      history,
      currentNexuses,
      currentSynapses,
      projectContext,
      imageData
  );
};