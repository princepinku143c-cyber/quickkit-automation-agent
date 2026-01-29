
import { Nexus, Synapse, NexusType } from '../../types';
import { ChangeSet } from './types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Simulates a patch on top of current state to check if the result is valid.
 */
export const simulatePatch = (currentNodes: Nexus[], currentWires: Synapse[], patch: ChangeSet): { nexuses: Nexus[], synapses: Synapse[] } => {
    let nextNodes = [...currentNodes];
    let nextWires = [...currentWires];

    // 1. Deletions
    if (patch.removeNodeIds) {
        nextNodes = nextNodes.filter(n => !patch.removeNodeIds.includes(n.id));
        // Auto-cleanup wires of deleted nodes
        nextWires = nextWires.filter(w => !patch.removeNodeIds.includes(w.sourceId) && !patch.removeNodeIds.includes(w.targetId));
    }
    if (patch.removeConnectionIds) {
        nextWires = nextWires.filter(w => !patch.removeConnectionIds.includes(w.id));
    }

    // 2. Updates
    if (patch.updateNodes) {
        nextNodes = nextNodes.map(n => {
            const update = patch.updateNodes.find(u => u.id === n.id);
            return update ? { ...n, ...update } as Nexus : n;
        });
    }

    // 3. Additions
    if (patch.addNodes) nextNodes = [...nextNodes, ...patch.addNodes];
    if (patch.addConnections) nextWires = [...nextWires, ...patch.addConnections];

    return { nexuses: nextNodes, synapses: nextWires };
};

/**
 * Ensures the generated graph meets production safety standards.
 */
export const validateGraph = (nexuses: Nexus[], synapses: Synapse[]): ValidationResult => {
    const errors: string[] = [];

    if (nexuses.length === 0) return { isValid: true, errors: [] };

    // 1. Trigger Check
    const hasTrigger = nexuses.some(n => n.type === NexusType.TRIGGER);
    if (!hasTrigger) {
        errors.push("Workflow is missing a Trigger node.");
    }

    // 2. Orphan Check (Nodes with 0 connections)
    if (nexuses.length > 1) {
        const connectedIds = new Set<string>();
        synapses.forEach(s => {
            connectedIds.add(s.sourceId);
            connectedIds.add(s.targetId);
        });

        const orphans = nexuses.filter(n => !connectedIds.has(n.id) && n.type !== NexusType.TRIGGER);
        if (orphans.length > 0) {
            errors.push(`${orphans.length} node(s) are floating and not connected to any logic.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
