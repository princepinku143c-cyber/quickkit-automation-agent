
import { Nexus, Synapse, NexusType } from '../../types';
import { ChangeSet } from './types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export const simulatePatch = (currentNodes: Nexus[], currentWires: Synapse[], patch: ChangeSet): { nexuses: Nexus[], synapses: Synapse[] } => {
    let nextNodes = [...currentNodes];
    let nextWires = [...currentWires];
    if (patch.removeNodeIds) {
        nextNodes = nextNodes.filter(n => !patch.removeNodeIds.includes(n.id));
        nextWires = nextWires.filter(w => !patch.removeNodeIds.includes(w.sourceId) && !patch.removeNodeIds.includes(w.targetId));
    }
    if (patch.removeConnectionIds) nextWires = nextWires.filter(w => !patch.removeConnectionIds.includes(w.id));
    if (patch.updateNodes) {
        nextNodes = nextNodes.map(n => {
            const update = patch.updateNodes.find(u => u.id === n.id);
            return update ? { ...n, ...update } as Nexus : n;
        });
    }
    if (patch.addNodes) nextNodes = [...nextNodes, ...patch.addNodes];
    if (patch.addConnections) nextWires = [...nextWires, ...patch.addConnections];
    return { nexuses: nextNodes, synapses: nextWires };
};

export const validateGraph = (nexuses: Nexus[], synapses: Synapse[]): ValidationResult => {
    const errors: string[] = [];
    if (nexuses.length === 0) return { isValid: true, errors: [] };
    
    // Check 1: Must have at least one trigger
    const triggers = nexuses.filter(n => n.type === NexusType.TRIGGER);
    if (triggers.length === 0) {
        errors.push("Workflow needs a Trigger to start.");
    }
    
    // Check 2: Floating Nodes (Orphans) - Warning only, not critical error
    // We filter out single-node workflows because a single trigger is valid.
    if (nexuses.length > 1) {
        const connectedIds = new Set<string>();
        synapses.forEach(s => { connectedIds.add(s.sourceId); connectedIds.add(s.targetId); });
        const orphans = nexuses.filter(n => n.type !== NexusType.TRIGGER && !connectedIds.has(n.id));
        // We log it internally but don't block execution for "drafting" phases
        if (orphans.length > 0) console.warn("Orphan nodes detected:", orphans.length);
    }

    return { isValid: errors.length === 0, errors };
};
