
import { ArchitectResponse } from "./types";

/**
 * Robust JSON extraction that survives hallucinations and markdown wrapping.
 */
export const safeJsonParse = <T>(input: string, fallback: T | null = null): T | null => {
    try {
        // 1. Try pure parse first (Best Case)
        return JSON.parse(input);
    } catch (e) {
        // 2. Try regex extraction for markdown blocks or partial text
        // Matches the largest block starting with { and ending with }
        const match = input.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                // console.warn("Deep parse failed", e2);
                return fallback;
            }
        }
        return fallback;
    }
};

/**
 * Validates the Architect Response Schema to ensure atomic updates.
 */
export const validateArchitectResponse = (data: any): ArchitectResponse => {
    const fallback: ArchitectResponse = {
        intent: 'EXPLAIN_FLOW',
        text: "I encountered an internal processing error. Please try rewording your request.",
        decisionLog: [],
        confidenceScore: 0,
        riskLevel: 'HIGH'
    };

    if (!data || typeof data !== 'object') return fallback;

    // Ensure required fields exist
    if (!data.intent || !data.text) return fallback;

    // Validate Patch Integrity if present
    if (data.patch) {
        if (!Array.isArray(data.patch.addNodes) || !Array.isArray(data.patch.addConnections)) {
            console.error("Validation Failed: Patch structure is corrupt.");
            return {
                ...data,
                text: "I generated a plan, but the structural integrity check failed. I will not apply changes to protect your workflow.",
                patch: undefined, // Strip corrupt patch
                validationError: "Patch schema mismatch"
            };
        }
    }

    // Validate Full Blueprint Integrity if present
    if (data.fullBlueprint) {
        if (!Array.isArray(data.fullBlueprint.nexuses) || !Array.isArray(data.fullBlueprint.synapses)) {
             console.error("Validation Failed: Blueprint structure is corrupt.");
             return {
                ...data,
                text: "I generated a full design, but the structural integrity check failed. No changes applied.",
                fullBlueprint: undefined,
                validationError: "Blueprint schema mismatch"
            };
        }
    }

    return data as ArchitectResponse;
};
