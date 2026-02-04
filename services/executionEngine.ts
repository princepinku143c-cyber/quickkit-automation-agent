
import { Nexus, Synapse, NexusSubtype, NexusType, ExecutionState, FlowWarning } from '../types';
import { saveRunState, clearRunState, checkRateLimit, updateDailyUsage } from './cloudStore'; 
import { GoogleGenAI } from "@google/genai";

export type LogCallback = (log: string, type: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS', nodeId?: string, data?: any) => void;

export interface ExecutionResult {
    status: 'SUCCESS' | 'FAILED' | 'ABORTED' | 'RESUMED' | 'LOOP_DETECTED' | 'QUOTA_EXCEEDED';
    executionId: string;
    duration: number;
    output: any;
    logs: any[];
    telemetry: any[];
}

const MAX_STEPS_PER_RUN = 50; 
const MAX_REPEATS_PER_NODE = 3; 
const EXECUTION_TIMEOUT_MS = 60000; 

// NON-BLOCKING YIELD: Prevents the UI from freezing during execution loops
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export class WorkflowOrchestrator {
    private nexuses: Nexus[];
    private synapses: Synapse[];
    private state: ExecutionState;
    private logger: LogCallback;
    private nodeExecutionCounts: Map<string, number> = new Map();

    constructor(nexuses: Nexus[], synapses: Synapse[], logger: LogCallback, runId?: string, userId: string = 'guest', projectId: string = 'unknown', initialState?: ExecutionState) {
        this.nexuses = nexuses;
        this.synapses = synapses;
        this.logger = logger;
        
        if (initialState) {
            this.state = initialState;
            this.logger(`[Kernel] Persistence: Resuming Session ${this.state.runId}...`, 'INFO');
        } else {
            this.state = {
                runId: runId || `RUN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
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
    }

    /**
     * STRUCTURE GUARD:
     * Validates the workflow topology without throwing errors.
     * Returns a categorized list of issues.
     */
    public validate(): { valid: boolean; warnings: FlowWarning[] } {
        const warnings: FlowWarning[] = [];
        const nodeIds = new Set(this.nexuses.map(n => n.id));

        // 1. Check for Empty Canvas
        if (this.nexuses.length === 0) {
            warnings.push({
                level: 'INFO',
                message: 'Canvas is empty. Add nodes to start building.'
            });
            return { valid: false, warnings }; // Technically valid empty state, but not runnable
        }

        // 2. Check for Trigger (Critical)
        const hasTrigger = this.nexuses.some(n => n.type === NexusType.TRIGGER);
        if (!hasTrigger) {
            warnings.push({
                level: 'ERROR',
                message: 'Workflow missing a Trigger node. Logic cannot start.'
            });
        }

        // 3. Check for Orphan Edges (Data Integrity)
        this.synapses.forEach(s => {
            if (!nodeIds.has(s.sourceId) || !nodeIds.has(s.targetId)) {
                warnings.push({
                    level: 'ERROR',
                    message: 'Corrupt connection detected (phantom edge). Save & Reload recommended.'
                });
            }
        });

        // 4. Check for Disconnected Nodes (Unreachable Logic)
        if (this.nexuses.length > 1) {
            const connectedIds = new Set<string>();
            this.synapses.forEach(s => { 
                if (nodeIds.has(s.sourceId) && nodeIds.has(s.targetId)) {
                    connectedIds.add(s.sourceId); 
                    connectedIds.add(s.targetId); 
                }
            });
            
            this.nexuses.forEach(n => {
                if (n.type !== NexusType.TRIGGER && !connectedIds.has(n.id)) {
                    warnings.push({
                        level: 'WARNING',
                        message: `Node "${n.label}" is disconnected and will not run.`,
                        nodeId: n.id
                    });
                }
            });
        }

        // 5. Single Node Warning
        if (this.nexuses.length === 1 && hasTrigger) {
            warnings.push({
                level: 'WARNING',
                message: 'Single node workflow. Connect an Action to do something useful.'
            });
        }

        // Blocking if any ERROR level warnings exist
        const hasCriticalErrors = warnings.some(w => w.level === 'ERROR');
        
        return { 
            valid: !hasCriticalErrors, 
            warnings 
        };
    }

    private async saveCheckpoint() {
        this.state.lastUpdateTime = Date.now();
        try {
            await saveRunState(this.state);
        } catch (e) {
            console.warn("Cloud Sync Latency...");
        }
    }

    // SANITIZATION: Prevents JS errors with special chars in node names
    private getSafeContextKey(label: string): string {
        return (label || 'node').replace(/[^a-zA-Z0-9_]/g, '_');
    }

    public async start(payload: any): Promise<ExecutionResult> {
        this.logger(`[Shield] Initializing Guarded Runtime ${this.state.runId}...`, "INFO");
        
        const quota = await updateDailyUsage(this.state.userId);
        if (!quota.allowed) {
            this.logger("CRITICAL: Daily Execution Quota Exceeded. Upgrade to Business Plan.", "ERROR");
            return { status: 'QUOTA_EXCEEDED', executionId: this.state.runId, duration: 0, output: null, logs: [], telemetry: [] };
        }

        if (this.state.status === 'QUEUED') {
            this.state.status = 'RUNNING';
            this.state.context['trigger'] = { data: payload };
            const trigger = this.nexuses.find(n => n.type === NexusType.TRIGGER);
            if(trigger) {
                this.state.currentQueue = [trigger.id];
                const safeLabel = this.getSafeContextKey(trigger.label);
                this.state.context[safeLabel] = { data: payload };
            }
        }

        const startTime = Date.now();
        await this.saveCheckpoint();

        while (this.state.currentQueue.length > 0) {
            // CRITICAL: Allow UI to breathe
            await yieldToMain();

            if (Date.now() - startTime > EXECUTION_TIMEOUT_MS) {
                this.logger("FATAL: Execution Timeout (60s). Prevented Zombie Process.", "ERROR");
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                return { status: 'ABORTED', executionId: this.state.runId, duration: Date.now() - startTime, output: null, logs: [], telemetry: [] };
            }

            if (this.state.completedNodeIds.length > MAX_STEPS_PER_RUN) {
                this.logger("FATAL: Max Step Count (50) reached. Potential Infinite Loop.", "ERROR");
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                return { status: 'LOOP_DETECTED', executionId: this.state.runId, duration: Date.now() - startTime, output: null, logs: [], telemetry: [] };
            }

            const nodeId = this.state.currentQueue.shift()!;
            const node = this.nexuses.find(n => n.id === nodeId);
            if(!node) continue;

            const count = (this.nodeExecutionCounts.get(nodeId) || 0) + 1;
            if (count > MAX_REPEATS_PER_NODE) {
                this.logger(`FATAL: Cyclic Loop detected at node [${node.label}]. Aborting.`, "ERROR", node.id);
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                return { status: 'LOOP_DETECTED', executionId: this.state.runId, duration: Date.now() - startTime, output: null, logs: [], telemetry: [] };
            }
            this.nodeExecutionCounts.set(nodeId, count);

            try {
                this.logger(`[Node] Executing ${node.label}...`, "INFO", node.id);
                
                // Simulate Work (Replace with actual execution logic)
                await new Promise(r => setTimeout(r, 600)); 
                
                const out = { success: true, timestamp: Date.now() };
                this.state.completedNodeIds.push(nodeId);
                
                const contextKey = this.getSafeContextKey(node.label);
                this.state.context[contextKey] = { data: out };

                const nextEdges = this.synapses.filter(s => s.sourceId === nodeId);
                nextEdges.forEach(edge => {
                    if (!this.state.currentQueue.includes(edge.targetId)) {
                        this.state.currentQueue.push(edge.targetId);
                    }
                });
                
                await this.saveCheckpoint();
            } catch (err: any) {
                this.logger(`[Fatal] Execution Fault: ${err.message}`, "ERROR", node.id);
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                break;
            }
        }

        this.state.status = 'COMPLETED';
        await clearRunState(this.state.runId);

        return {
            status: 'SUCCESS',
            executionId: this.state.runId,
            duration: Date.now() - startTime,
            output: this.state.context,
            logs: [],
            telemetry: []
        };
    }
}
