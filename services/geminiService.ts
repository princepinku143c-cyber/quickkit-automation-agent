
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Nexus, Synapse, NexusType, NexusSubtype, ChatMessage } from "../types";

// Zero-Cost Tool Definitions for Agentic Workflows
const googleSheetsReadTool: FunctionDeclaration = {
  name: 'read_google_sheet',
  parameters: {
    type: Type.OBJECT,
    description: 'Use this tool to fetch data from a Google Spreadsheet. Helpful for getting lead lists or price data.',
    properties: {
      sheetId: { type: Type.STRING, description: 'The ID of the spreadsheet (found in URL).' },
      range: { type: Type.STRING, description: 'Cell range like Sheet1!A1:B10.' }
    },
    required: ['sheetId', 'range'],
  },
};

const googleSheetsWriteTool: FunctionDeclaration = {
  name: 'write_google_sheet',
  parameters: {
    type: Type.OBJECT,
    description: 'Use this tool to save or update data in a Google Spreadsheet. Best for logging results or status updates.',
    properties: {
      sheetId: { type: Type.STRING, description: 'The ID of the spreadsheet.' },
      range: { type: Type.STRING, description: 'Target sheet or range.' },
      data: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The row of data to write.' }
    },
    required: ['sheetId', 'range', 'data'],
  },
};

/**
 * Runs the AI Agent block.
 * It uses tools autonomously based on the current workflow data.
 */
export const runAgentWithTools = async (config: any, userPrompt: string, apiKey: string, contextData: any = {}) => {
    // ALWAYS use process.env.API_KEY as per instructions
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const tools: any[] = [];
    
    if (config.enabledTools?.includes('web_search')) tools.push({ googleSearch: {} });
    if (config.enabledTools?.includes('sheets_read')) tools.push({ functionDeclarations: [googleSheetsReadTool] });
    if (config.enabledTools?.includes('sheets_write')) tools.push({ functionDeclarations: [googleSheetsWriteTool] });

    // This is the core 'Brain' of the block
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `BLOCK CONTEXT: ${JSON.stringify(contextData)}\n\nUSER PROMPT: ${userPrompt || config.systemMessage}`,
        config: {
            systemInstruction: "You are an Automation Brain. Analyze context data, use tools if necessary, and output the final result. If using tools, explain why in your text response.",
            tools: tools.length > 0 ? tools : undefined
        }
    });

    return {
        text: response.text,
        functionCalls: response.functionCalls,
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};

/**
 * The Architect: Helps user build workflows via Chat.
 */
export const chatWithArchitect = async (
  userRequest: string, 
  history: ChatMessage[],
  apiKey: string,
  currentNexuses: Nexus[] = [],
  currentSynapses: Synapse[] = []
): Promise<{ text: string; blueprint?: any; groundingUrls?: string[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const systemInstruction = `
    You are the "NexusStream Architect". Your job is to help users build automation workflows using a visual block system.
    
    AVAILABLE BLOCKS:
    - TRIGGER: WEBHOOK, CHAT_TRIGGER
    - ACTION: AGENT (uses tools), SHEETS_READ, SHEETS_WRITE, WHATSAPP, HTTP_REQUEST, LOGGER
    - LOGIC: CONDITION (IF/ELSE)

    RULES:
    1. Always return a helpful text explanation.
    2. If the user asks to build/modify something, return a valid JSON blueprint inside \`\`\`json_blueprint\`\`\` block.
    3. Ensure blocks are connected logically via Synapses.
    4. Current Canvas State is provided below. Build upon it.
    
    CURRENT CANVAS:
    Nexuses: ${JSON.stringify(currentNexuses)}
    Synapses: ${JSON.stringify(currentSynapses)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: userRequest }] }
    ],
    config: { tools: [{ googleSearch: {} }] }
  });

  const text = response.text;
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || [];
  
  let blueprint = undefined;
  const match = text.match(/```json_blueprint\s*([\s\S]*?)\s*```/);
  if (match) {
    try { blueprint = JSON.parse(match[1]); } catch(e) { console.error("Blueprint Parse Error", e); }
  }

  return { text, blueprint, groundingUrls: urls };
};
