import { GoogleGenAI, Type } from "@google/genai";
import { Blueprint, NexusType, NexusSubtype } from "../../types";
import { ArchitectResponse } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * AI Architect Service
 * Handles complex workflow generation and logic optimization
 */

/**
 * Generates a workflow blueprint from a natural language description
 */
export const processArchitectRequest = async (prompt: string, currentNexuses: any[], currentSynapses: any[], context?: string): Promise<ArchitectResponse> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the NexusStream Architect. 
    Current Workflow: ${JSON.stringify({ nexuses: currentNexuses, synapses: currentSynapses })}
    Context: ${context || 'None'}
    User Request: ${prompt}
    
    If the user wants to build/modify a workflow, provide a clear explanation AND a JSON blueprint.
    If it's just a question, provide a detailed technical answer.
    
    Blueprint Rules:
    - Use subtypes: WEBHOOK, AI_AGENT, DB_OPERATION, CUSTOM_JS, ROUTER, LOOP, EMAIL_SEND, HTTP_REQUEST.
    - Ensure logical connections.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING, description: "CREATE_FLOW, MODIFY_FLOW, DEBUG_FLOW, EXPLAIN_FLOW, OPTIMIZE_FLOW" },
          text: { type: Type.STRING },
          decisionLog: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reason: { type: Type.STRING },
                action: { type: Type.STRING },
                affectedNodes: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          confidenceScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING, description: "LOW, MEDIUM, HIGH" },
          fullBlueprint: {
            type: Type.OBJECT,
            properties: {
              nexuses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    subtype: { type: Type.STRING },
                    label: { type: Type.STRING },
                    position: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      }
                    },
                    config: { type: Type.OBJECT }
                  }
                }
              },
              synapses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    sourceId: { type: Type.STRING },
                    targetId: { type: Type.STRING }
                  }
                }
              }
            }
          },
          validationError: { type: Type.STRING }
        },
        required: ["intent", "text", "confidenceScore", "riskLevel"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { 
        intent: 'EXPLAIN_FLOW',
        text: response.text || "I processed your request but couldn't generate a valid blueprint.",
        decisionLog: [],
        confidenceScore: 50,
        riskLevel: 'LOW'
    };
  }
};

/**
 * Analyzes an existing workflow for potential improvements
 */
export const analyzeWorkflow = async (intent: string, nexuses: any[], synapses: any[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this automation workflow with intent: ${intent}
    Nodes: ${JSON.stringify(nexuses)}
    Connections: ${JSON.stringify(synapses)}`,
  });
  return response.text || "No analysis available.";
};

export const ArchitectService = {
  generateBlueprint: async (prompt: string): Promise<Blueprint> => {
      const res = await processArchitectRequest(prompt, [], []);
      if (!res.fullBlueprint) throw new Error("No blueprint generated");
      // Map fullBlueprint to Blueprint if needed, but they should be compatible or I should fix the types
      return {
          id: `bp-${Date.now()}`,
          title: "AI Generated Blueprint",
          description: res.text,
          category: "AI",
          nexuses: res.fullBlueprint.nexuses,
          synapses: res.fullBlueprint.synapses
      };
  },
  analyzeWorkflow
};
