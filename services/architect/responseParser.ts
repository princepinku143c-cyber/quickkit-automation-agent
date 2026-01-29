
/**
 * Advanced parser to isolate and validate the blueprint JSON from conversational AI text.
 */
export const parseArchitectResponse = (text: string) => {
    let blueprint = null;
    
    // 1. Look for the custom blueprint block first
    const blueprintMatch = text.match(/```(?:json)?_?blueprint\s*([\s\S]*?)\s*```/);
    
    // 2. Fallback to any JSON object that looks like a blueprint
    const jsonMatch = text.match(/({[\s\S]*"nexuses"[\s\S]*"synapses"[\s\S]*})/);

    const match = blueprintMatch || jsonMatch;

    if (match) {
        try {
            // Remove non-printable characters and invisible breaks
            const cleanJson = match[1].replace(/[\u0000-\u0019]+/g, "");
            blueprint = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Architect Parser: JSON validation failed.", e);
        }
    }

    // Strip the code blocks to leave only the natural language explanation
    const cleanText = text
        .replace(/```(?:json)?_?blueprint[\s\S]*?```/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .trim();

    return { 
        text: cleanText || "Blueprint generated successfully.", 
        blueprint 
    };
};
