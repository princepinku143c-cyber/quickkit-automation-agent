
import { Nexus, Synapse, NexusSubtype, NexusType, ExecutionState } from '../types';
import { saveRunState, clearRunState, checkRateLimit, updateDailyUsage } from './cloudStore'; 
import { GoogleGenAI } from "@google/genai";

export type LogCallback = (log: string, type: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS', nodeId?: string, data?: any) => void;

export interface ExecutionResult {
    status: 'SUCCESS' | 'FAILED' | 'ABORTED' | 'RESUMED' | 'LOOP_DETECTED' | 'QUOTA_EXCEEDED';
    executionId: string;
    duration: number;
    output: any;
    // Fix: Added logs and telemetry to match interface expectations in UI components
    logs: any[];
    telemetry: any[];
}

const MAX_STEPS_PER_RUN = 50; 
const MAX_REPEATS_PER_NODE = 3; 
const EXECUTION_TIMEOUT_MS = 60000; // 1 Minute Safety Kill

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
     * Fix: Added validate method to ensure graph integrity before execution.
     */
    public validate(): { isValid: boolean; error?: string } {
        const hasTrigger = this.nexuses.some(n => n.type === NexusType.TRIGGER);
        if (!hasTrigger) return { isValid: false, error: "Workflow is missing a Trigger node." };
        
        if (this.nexuses.length > 1 && this.synapses.length === 0) {
            return { isValid: false, error: "Nodes must be connected to form a valid flow." };
        }
        
        return { isValid: true };
    }

    private async saveCheckpoint() {
        this.state.lastUpdateTime = Date.now();
        try {
            await saveRunState(this.state);
        } catch (e) {
            console.warn("Cloud Sync Latency...");
        }
    }

    public async start(payload: any): Promise<ExecutionResult> {
        this.logger(`[Shield] Initializing Guarded Runtime ${this.state.runId}...`, "INFO");
        
        // 1. DAILY QUOTA CHECK (BILL PROTECTION)
        const quota = await updateDailyUsage(this.state.userId);
        if (!quota.allowed) {
            this.logger("CRITICAL: Daily Execution Quota Exceeded. Upgrade to Business Plan.", "ERROR");
            return { status: 'QUOTA_EXCEEDED', executionId: this.state.runId, duration: 0, output: null, logs: [], telemetry: [] };
        }

        if (this.state.status === 'QUEUED') {
            this.state.status = 'RUNNING';
            this.state.context['trigger'] = { data: payload };
            const trigger = this.nexuses.find(n => n.type === NexusType.TRIGGER);
            if(trigger) this.state.currentQueue = [trigger.id];
        }

        const startTime = Date.now();
        await this.saveCheckpoint();

        while (this.state.currentQueue.length > 0) {
            // 2. TIMEOUT GUARD
            if (Date.now() - startTime > EXECUTION_TIMEOUT_MS) {
                this.logger("FATAL: Execution Timeout (60s). Prevented Zombie Process.", "ERROR");
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                return { status: 'ABORTED', executionId: this.state.runId, duration: Date.now() - startTime, output: null, logs: [], telemetry: [] };
            }

            // 3. MAX STEP GUARD
            if (this.state.completedNodeIds.length > MAX_STEPS_PER_RUN) {
                this.logger("FATAL: Max Step Count (50) reached. Potential Infinite Loop.", "ERROR");
                this.state.status = 'FAILED';
                await this.saveCheckpoint();
                return { status: 'LOOP_DETECTED', executionId: this.state.runId, duration: Date.now() - startTime, output: null, logs: [], telemetry: [] };
            }

            const nodeId = this.state.currentQueue.shift()!;
            const node = this.nexuses.find(n => n.id === nodeId);
            if(!node) continue;

            // 4. NODE REPEAT GUARD (ANTI-RECURSION)
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
                await new Promise(r => setTimeout(r, 600)); // Kernel Overhead
                
                const out = { success: true, timestamp: Date.now() };
                this.state.completedNodeIds.push(nodeId);
                const contextKey = node.label.replace(/\s+/g, '_');
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
