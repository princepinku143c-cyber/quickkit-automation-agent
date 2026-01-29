
import { Nexus, Synapse, NexusSubtype, NexusType, ExecutionState } from '../types';
import { saveExecutionLog, checkRateLimit, saveRunState, clearRunState } from './cloudStore'; 
import { TelemetryReport } from './architect/types';
import { GoogleGenAI } from "@google/genai";

export type LogCallback = (log: string, type: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS', nodeId?: string, data?: any) => void;

export interface ExecutionResult {
    status: 'SUCCESS' | 'FAILED' | 'ABORTED' | 'RESUMED';
    executionId: string;
    duration: number;
    output: any;
    logs: string[];
    telemetry: TelemetryReport[];
}

const MAX_NODES_PER_RUN = 500; 
const RUN_TIMEOUT_MS = 120000;

export class WorkflowOrchestrator {
    private nexuses: Nexus[];
    private synapses: Synapse[];
    private state: ExecutionState;
    private logger: LogCallback;
    private telemetry: TelemetryReport[] = [];

    constructor(nexuses: Nexus[], synapses: Synapse[], logger: LogCallback, runId?: string, userId: string = 'guest', projectId: string = 'unknown') {
        this.nexuses = nexuses;
        this.synapses = synapses;
        this.logger = logger;
        
        this.state = {
            runId: runId || `KERNEL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            userId,
            projectId,
            status: 'QUEUED',
            currentQueue: [],
            completedNodeIds: [],
            context: {},
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
            nodeLimitCount: 0
        };
    }

    public async runSingleNode(node: Nexus, inputData: any = {}): Promise<any> {
        this.state.context['trigger'] = { data: inputData };
        return await this.runNodeLogic(node);
    }

    public validate(): { isValid: boolean; error?: string } {
        const triggers = this.nexuses.filter(n => n.type === NexusType.TRIGGER);
        if (triggers.length === 0) return { isValid: false, error: "CRITICAL: Workflow is headless. Add a Trigger." };
        if (triggers.length > 1) return { isValid: false, error: "CRITICAL: Multiple entry points detected." };
        return { isValid: true };
    }

    private async runNodeLogic(node: Nexus): Promise<any> {
        const startTime = Date.now();
        const config = node.config;
        
        // --- ROBUST INTERPOLATION ENGINE ---
        // Handles {{NodeName.data.field}} securely.
        const interpolate = (val: any): any => {
            if (typeof val !== 'string') return val;
            
            // Check if the entire string is a variable (e.g. "{{webhook.body}}") - Return Object
            const exactMatch = val.match(/^\{\{(.+?)\}\}$/);
            if (exactMatch && val.split('{{').length === 2) {
                const path = exactMatch[1].trim().split('.');
                let current: any = this.state.context;
                for (const p of path) {
                    if (current && current[p] !== undefined) current = current[p];
                    else return undefined; // Return undefined for exact matches so defaults can be used
                }
                return current;
            }

            // String replacement (e.g. "Hello {{name}}") - Return String
            return val.replace(/\{\{(.*?)\}\}/g, (_: string, path: string) => {
                const parts = path.trim().split('.');
                let current: any = this.state.context;
                for (const p of parts) {
                    // Normalize node names (spaces to underscores) to match context keys
                    const cleanKey = p.replace(/\s+/g, '_');
                    // Check both original and cleaned key
                    if (current && current[p] !== undefined) current = current[p];
                    else if (current && current[cleanKey] !== undefined) current = current[cleanKey];
                    else return ``; // Fail gracefully to empty string
                }
                return typeof current === 'object' ? JSON.stringify(current) : String(current);
            });
        };

        let result: any;
        try {
            // Simulated Production Jitter/Latency
            const baseLatency = node.type === NexusType.ACTION ? 800 : 300;
            await new Promise(r => setTimeout(r, baseLatency + Math.random() * 500));

            // Deep interpolate the config object
            const processedConfig: any = {};
            for (const [key, value] of Object.entries(config)) {
                if (typeof value === 'string') {
                    processedConfig[key] = interpolate(value);
                } else {
                    processedConfig[key] = value;
                }
            }

            switch (node.subtype) {
                case NexusSubtype.CONDITION:
                    const logic = interpolate(config.condition || "true");
                    // Safety: Ensure logic is a string before eval
                    const safeLogic = typeof logic === 'string' ? logic : String(logic);
                    const res = new Function('input', 'vars', `try { return !!(${safeLogic}); } catch(e) { return false; }`)(this.state.context.trigger?.data || {}, this.state.context);
                    result = { result: res };
                    break;
                
                case NexusSubtype.AI_ROUTER:
                    // --- SMART ROUTER (The Competitor Killer) ---
                    const input = typeof processedConfig.input === 'string' ? processedConfig.input : JSON.stringify(processedConfig.input);
                    const routes = config.routes || [];
                    this.logger(`[AI Brain] Analyzing: "${(input || '').substring(0, 30)}..."`, "INFO", node.id);
                    
                    try {
                        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
                        
                        // Smart Prompt ensuring JSON output
                        const routeLabels = routes.map((r: any) => r.label).join(', ');
                        const prompt = `
                            You are a semantic router. Analyze the input and select the best category from: [${routeLabels}].
                            Input: "${input}"
                            
                            Return strictly valid JSON:
                            {
                                "category": "Selected Label",
                                "confidence": 0.95,
                                "reasoning": "Why you chose this category in 1 short sentence."
                            }
                        `;
                        
                        // Mock fallback for demo if no key
                        let classification = { category: routes[0]?.label || 'default', confidence: 1, reasoning: "Default path (Mock)" };
                        
                        if (process.env.API_KEY) {
                             const resp = await ai.models.generateContent({ 
                                 model: 'gemini-3-flash-preview', 
                                 contents: prompt,
                                 config: { responseMimeType: 'application/json' }
                             });
                             classification = JSON.parse(resp.text || '{}');
                        }
                        
                        // Find matching route ID by Fuzzy Match
                        const match = routes.find((r: any) => classification.category.toLowerCase().includes(r.label.toLowerCase()));
                        
                        this.logger(`[AI Brain] Decision: ${classification.category} (${(classification.confidence * 100).toFixed(0)}%) - ${classification.reasoning}`, "SUCCESS", node.id);

                        result = { 
                            routeId: match ? match.id : 'default', 
                            decision: classification.category,
                            confidence: classification.confidence,
                            reasoning: classification.reasoning
                        };
                    } catch (e) {
                        this.logger("AI Routing failed, defaulting to first path.", "WARN", node.id);
                        result = { routeId: routes[0]?.id, error: "AI Failed, using default" };
                    }
                    break;
                case NexusSubtype.HTTP_REQUEST:
                    result = { status: 200, mockResponse: true, timestamp: Date.now(), data: { message: "Mock API Success" } };
                    break;
                case NexusSubtype.CODE_JS:
                    const runner = new Function('input', 'vars', config.code || "return { processed: true }");
                    result = runner(this.state.context.trigger?.data || {}, this.state.context);
                    break;
                case NexusSubtype.AGENT:
                    // Simulated AI Response if not calling real API in test mode
                    result = { text: `Processed: ${processedConfig.systemMessage}`, confidence: 0.99 };
                    break;
                case NexusSubtype.API_POLLER:
                    // Poller logic usually runs outside, but if triggered manually:
                    result = { items: [{ id: 1, title: "New Item" }], count: 1 };
                    break;
                default:
                    // For generic nodes, pass through the interpolated config as output for debugging
                    result = { success: true, processedConfig };
            }

            const latency = Date.now() - startTime;
            const dataSize = JSON.stringify(result).length / 1024; // KB

            this.telemetry.push({
                nodeId: node.id,
                latency,
                dataSize,
                status: 'success'
            });

            return result;
        } catch (err: any) {
            this.telemetry.push({
                nodeId: node.id,
                latency: Date.now() - startTime,
                dataSize: 0,
                status: 'error',
                error: err.message
            });
            throw err;
        }
    }

    public async start(payload: any, userId: string): Promise<ExecutionResult> {
        this.logger(`[System] Initializing Kernel Cluster ${this.state.runId}...`, "INFO");
        
        const rl = await checkRateLimit(userId, 50, 60); 
        if (!rl.allowed) {
            this.logger("CRITICAL: Global rate limit exceeded.", "ERROR");
            return { status: 'FAILED', executionId: this.state.runId, duration: 0, output: null, logs: [], telemetry: [] };
        }

        const v = this.validate();
        if (!v.isValid) return { status: 'FAILED', executionId: this.state.runId, duration: 0, output: null, logs: [], telemetry: [] };

        this.state.status = 'RUNNING';
        // Normalize context keys to match what interpolation expects
        this.state.context['trigger'] = { data: payload };
        
        // Find Trigger
        const trigger = this.nexuses.find(n => n.type === NexusType.TRIGGER)!;
        
        // Also add the trigger's Label to context for easy access (e.g. {{Webhook.data...}})
        const triggerKey = trigger.label.replace(/\s+/g, '_');
        this.state.context[triggerKey] = { data: payload };

        this.state.currentQueue = [trigger.id];
        
        const startTime = Date.now();
        while (this.state.currentQueue.length > 0) {
            if (this.state.nodeLimitCount > MAX_NODES_PER_RUN || (Date.now() - startTime > RUN_TIMEOUT_MS)) {
                this.logger("CIRCUIT BREAKER: Process killed due to limit overflow.", "ERROR");
                break;
            }

            const nodeId = this.state.currentQueue.shift()!;
            const node = this.nexuses.find(n => n.id === nodeId)!;

            try {
                this.logger(`[Node] Executing ${node.label}...`, "INFO", node.id);
                const out = await this.runNodeLogic(node);
                this.state.completedNodeIds.push(nodeId);
                this.state.nodeLimitCount++;
                
                // Save output to context using Label (normalized) for easy referencing
                const contextKey = node.label.replace(/\s+/g, '_');
                this.state.context[contextKey] = { data: out };
                this.state.context[node.id] = { data: out }; // Also save by ID for robustness

                let nextEdges = this.synapses.filter(s => s.sourceId === nodeId);
                
                // Logic Flow Control
                if (node.subtype === NexusSubtype.CONDITION) {
                    nextEdges = nextEdges.filter(e => e.sourceHandle === (out.result ? 'true' : 'false'));
                }
                // AI Router Flow Control (Handles Route ID Mapping)
                else if (node.subtype === NexusSubtype.AI_ROUTER) {
                    nextEdges = nextEdges.filter(e => e.sourceHandle === out.routeId);
                }

                nextEdges.forEach(edge => {
                    if (!this.state.completedNodeIds.includes(edge.targetId) && !this.state.currentQueue.includes(edge.targetId)) {
                        this.state.currentQueue.push(edge.targetId);
                    }
                });
                
                await saveRunState(this.state);
            } catch (err: any) {
                this.logger(`[Fatal] Execution Fault in ${node.label}: ${err.message}`, "ERROR", node.id);
                break; // Stop on error for now (unless Error Handler exists)
            }
        }

        return {
            status: 'SUCCESS',
            executionId: this.state.runId,
            duration: Date.now() - startTime,
            output: this.state.context,
            logs: [],
            telemetry: this.telemetry
        };
    }
}
