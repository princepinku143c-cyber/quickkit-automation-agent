
import { NEXUS_DEFINITIONS } from '../../constants';
import { NexusSubtype } from '../../types';

// --- DATA DICTIONARY FOR AUTO-WIRING ---
// Defines exactly what data each node outputs, so the AI can map it correctly.
const OUTPUT_SCHEMA: Partial<Record<NexusSubtype, string>> = {
    [NexusSubtype.WEBHOOK]: 'Output: {{Node.data.body}} (JSON payload), {{Node.data.query}} (URL params)',
    [NexusSubtype.API_POLLER]: 'Output: {{Node.data.items}} (Array of new items detected)',
    [NexusSubtype.AGENT]: 'Output: {{Node.data.text}} (AI Response), {{Node.data.json}} (Structured Data)',
    [NexusSubtype.AI_ROUTER]: 'Output: {{Node.data.decision}} (Selected Category), {{Node.data.confidence}}',
    [NexusSubtype.HTTP_REQUEST]: 'Output: {{Node.data.data}} (Response Body), {{Node.data.status}}',
    [NexusSubtype.SHEETS_READ]: 'Output: {{Node.data.rows}} (Array of row objects)',
    [NexusSubtype.EMAIL]: 'Output: {{Node.data.messageId}}',
    [NexusSubtype.GMAIL]: 'Output: {{Node.data.threadId}}, {{Node.data.snippet}}',
    [NexusSubtype.CODE_JS]: 'Output: {{Node.data.result}} (Return value)',
};

// --- STRATEGIC GUIDELINES ---
// Promotes specific nodes (like Poller) over generic ones.
const PRO_TIPS: Partial<Record<NexusSubtype, string>> = {
    [NexusSubtype.API_POLLER]: '🔥 USE THIS for "watching", "monitoring", or "checking" external APIs. It handles dedup/state automatically. Better than Schedule + HTTP.',
    [NexusSubtype.AI_ROUTER]: '🧠 USE THIS for "deciding" or "classifying" text (e.g. Urgent vs Spam).',
    [NexusSubtype.AGENT]: '🤖 USE THIS for "generating", "summarizing", or "extracting" info.',
};

/**
 * Generates a high-density technical context of all available nodes.
 * Includes Inputs, Outputs, and Strategic Tips.
 */
export const getToolsContext = (): string => {
    const categories = Array.from(new Set(NEXUS_DEFINITIONS.map(d => d.category)));
    let context = "### ARCHITECT TOOLBOX (DEEP KNOWLEDGE):\n";

    categories.forEach(cat => {
        context += `\n[Category: ${cat}]\n`;
        const nodes = NEXUS_DEFINITIONS.filter(d => d.category === cat);
        nodes.forEach(node => {
            const output = OUTPUT_SCHEMA[node.subtype] ? ` | ${OUTPUT_SCHEMA[node.subtype]}` : '';
            const tip = PRO_TIPS[node.subtype] ? ` | NOTE: ${PRO_TIPS[node.subtype]}` : '';
            
            context += `- Type: "${node.subtype}" | Label: "${node.label}"${output}${tip}\n`;
        });
    });

    return context;
};
