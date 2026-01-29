
/**
 * NEXUS STREAM - BACKEND WORKER (Firebase Cloud Functions)
 * 
 * This file handles "Tab Closed" execution.
 * It listens to the Firestore 'active_runs' collection and processes the DAG.
 * 
 * DEPLOY INSTRUCTIONS:
 * 1. firebase init functions
 * 2. Copy this content to functions/src/index.ts
 * 3. firebase deploy --only functions
 */

import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

// --- TYPE DEFINITIONS ---
interface ExecutionState {
    runId: string;
    status: string;
    currentQueue: string[];
    completedNodeIds: string[];
    context: any;
    nodeLimitCount?: number;
}

// --- WORKER TRIGGER ---
export const onWorkflowTrigger = onDocumentCreated('active_runs/{runId}', async (event) => {
    const snap = event.data;
    if (!snap) return;

    const state = snap.data() as ExecutionState;
    console.log(`[Worker] Started Workflow: ${state.runId}`);
    
    // Only process if status is QUEUED to avoid infinite loops on updates
    if (state.status === 'QUEUED') {
        await processWorkflow(state);
    }
});

// --- CORE EXECUTION LOOP ---
async function processWorkflow(state: ExecutionState) {
    const { runId } = state;
    
    // Mark as RUNNING immediately so frontend sees pickup
    await db.collection('active_runs').doc(runId).update({ status: 'RUNNING' });

    // In a real scenario, we would fetch the full graph here.
    // For this simulation/test, we consume the queue and simulate "work".
    // If the queue has items (like the trigger ID), we pretend to process them.
    
    // Safety limit
    let steps = 0;
    const maxSteps = 10;

    // We simulate finding next nodes. Since we don't have the full graph in `state`,
    // we will just process what is in the queue + add a dummy "success" step.
    
    while (state.currentQueue.length > 0 && steps < maxSteps) {
        const nodeId = state.currentQueue.shift();
        if (!nodeId) break;

        console.log(`[Worker] Executing Node: ${nodeId}`);
        
        // 1. Simulate Processing Latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Update State
        state.completedNodeIds.push(nodeId);
        
        // 3. Mock "Next Step" Logic
        // If this was the trigger, let's pretend it triggered a 'process' node
        if (state.completedNodeIds.length === 1) {
            state.currentQueue.push('worker_simulated_process_node');
        } else if (state.completedNodeIds.length === 2) {
            state.currentQueue.push('worker_simulated_finish_node');
        }

        // 4. Persist Intermediate State (Heartbeat)
        await db.collection('active_runs').doc(runId).set({
            ...state,
            lastUpdateTime: Date.now(),
            status: 'RUNNING'
        }, { merge: true });
        
        steps++;
    }

    // Final Completion
    await db.collection('active_runs').doc(runId).update({ 
        status: 'COMPLETED',
        completedNodeIds: state.completedNodeIds,
        lastUpdateTime: Date.now()
    });
    console.log(`[Worker] Finished Workflow: ${runId}`);
}

// --- CLOUD POLLER (The n8n Killer) ---
export const universalPoller = onSchedule('every 1 minutes', async (event) => {
    const activePollers = await db.collection('pollers').where('status', '==', 'active').get();
    
    activePollers.forEach(async (doc) => {
        const config = doc.data();
        try {
            const res = await axios.get(config.url);
            // Logic to detect changes vs last run
            // If new data -> Trigger Workflow
            console.log(`[Poller] Checked ${config.url}, status: ${res.status}`);
        } catch (e) {
            console.error(`Poller Failed: ${doc.id}`);
        }
    });
});
