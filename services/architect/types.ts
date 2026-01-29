
import { Nexus, Synapse } from '../../types';

export type ArchitectIntent = 'CREATE_FLOW' | 'MODIFY_FLOW' | 'DEBUG_FLOW' | 'EXPLAIN_FLOW' | 'OPTIMIZE_FLOW';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Decision {
    reason: string;
    action: string;
    affectedNodes: string[];
}

export interface ChangeSet {
    addNodes: Nexus[];
    updateNodes: Partial<Nexus>[];
    removeNodeIds: string[];
    addConnections: Synapse[];
    removeConnectionIds: string[];
}

export interface ArchitectResponse {
    intent: ArchitectIntent;
    text: string;
    decisionLog: Decision[];
    confidenceScore: number;
    riskLevel: RiskLevel;
    patch?: ChangeSet;
    fullBlueprint?: { nexuses: Nexus[], synapses: Synapse[] };
    validationError?: string;
}

export interface TelemetryReport {
    nodeId: string;
    latency: number;
    dataSize: number;
    status: 'success' | 'error';
    error?: string;
}
