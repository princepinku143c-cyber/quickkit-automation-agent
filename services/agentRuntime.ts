import { NexusConfig, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

/**
 * Simulates calling an LLM Provider with the system's API Key.
 */
export const runAgentInference = async (
  config: NexusConfig, 
  userMessage: string, 
  history: ChatMessage[]
): Promise<string> => {
  
  // Fix: Obtained exclusively from the environment variable process.env.API_KEY
  const apiKey = config.apiKey || process.env.API_KEY;

  if (!apiKey) {
      return "Error: No API Keys pre-configured. Ensure process.env.API_KEY is available.";
  }

  const memoryLimit = config.memoryWindow || 5;
  const recentHistory = history.slice(-memoryLimit);

  if (config.provider === 'gemini') {
    try {
        // Fix: Use mandatory named parameter for initialization
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        let fullPrompt = `System: ${config.systemMessage || 'You are a helpful assistant.'}\n\n`;
        recentHistory.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
        });
        fullPrompt += `User: ${userMessage}\nModel:`;

        const response = await ai.models.generateContent({
            // Fix: Ensure correct full model name is used
            model: config.model || 'gemini-3-flash-preview',
            contents: fullPrompt,
        });

        // Fix: Simple and direct access to generated text content
        return response.text || "No response generated.";

    } catch (error: any) {
        console.error("Agent Runtime Error:", error);
        return `Error: ${error.message || "Provider failed"}`;
    }
  }

  return `Error: Unsupported provider ${config.provider}`;
};