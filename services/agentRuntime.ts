
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
  
  // Use process.env.API_KEY exclusively as per SDK guidelines
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("⚠️ API Key missing from environment variable process.env.API_KEY.");
  }

  // Filter history based on memory window
  const memoryLimit = config.memoryWindow || 5;
  const recentHistory = history.slice(-memoryLimit);

  // --- GOOGLE GEMINI IMPLEMENTATION ---
  if (config.provider === 'gemini') {
    try {
      // Initializing GoogleGenAI with process.env.API_KEY as required by coding guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // Construct prompt with history manually for Gemini
      let fullPrompt = `System: ${config.systemMessage || 'You are a helpful assistant.'}\n\n`;
      
      recentHistory.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
      });
      
      fullPrompt += `User: ${userMessage}\nModel:`;

      const response = await ai.models.generateContent({
        // Updated default model to gemini-3-flash-preview as per guidelines for Basic Text Tasks
        model: config.model || 'gemini-3-flash-preview',
        contents: fullPrompt,
      });

      return response.text || "No response generated.";

    } catch (error: any) {
      console.error("Gemini Error:", error);
      return `Error calling Gemini: ${error.message}.`;
    }
  }

  return "Provider not supported or configured.";
};
