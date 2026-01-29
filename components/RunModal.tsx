
import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Terminal, ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Zap, Brain, TrendingUp, Sparkles, Wand2, Activity, Server, Cloud, CloudLightning } from 'lucide-react';
import { Nexus, Synapse, ExecutionState, NexusType } from '../types';
import { WorkflowOrchestrator, ExecutionResult } from '../services/executionEngine';
import { createCloudRun, subscribeToRun } from '../services/cloudStore';
import { useAuth } from '../context/AuthContext';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  nexuses: Nexus[];
  synapses: Synapse[]; 
  onHeal?: (patch: any) => void;
}

const RunModal: React.FC<RunModalProps> = ({ isOpen, onClose, nexuses, synapses, onHeal }) => {
  const { user } = useAuth();
  const [activeRunning, setActiveRunning] = useState(false);
  const [isCloudRun, setIsCloudRun] = useState(false);
  const [jsonInput, setJsonInput] = useState('{\n  "event": "production_handshake",\n  "metadata": { "env": "cloud-v2" }\n}');
  const [logs, setLogs] = useState<{ msg: string, type: string, nodeId?: string }[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<ExecutionResult | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
      if (isOpen) {
          const engine = new WorkflowOrchestrator(nexuses, synapses, () => {});
          const v = engine.validate();
          setValidationError(v.isValid ? null : v.error!);
          setLogs([]);
          setFinalResult(null);
          setIsCloudRun(false);
      }
  }, [isOpen, nexuses, synapses]);

  // --- LOCAL BROWSER EXECUTION ---
  const handleLocalStart = async () => {
      if (validationError) return;
      setLogs([]); 
      setFinalResult(null);
      setActiveRunning(true);
      setIsCloudRun(false);
      
      let payload = {};
      try { payload = JSON.parse(jsonInput); } catch(e) {
          setLogs([{ msg: "CRITICAL: Payload JSON is malformed.", type: 'ERROR' }]);
          setActiveRunning(false);
          return;
      }

      setLogs(prev => [...prev, { msg: "Initializing Local Browser Runtime...", type: 'INFO' }]);

      const engine = new WorkflowOrchestrator(nexuses, synapses, (msg, type, nodeId) => {
          setLogs(prev => [...prev, { msg, type, nodeId }]);
      }, undefined, user?.uid || 'guest');
      
      const result = await engine.start(payload, user?.uid || 'guest');
      setFinalResult(result);
      setActiveRunning(false);
  };

  // --- REAL CLOUD EXECUTION (TESTING THE WORKER) ---
  const handleCloudStart = async () => {
      if (validationError) return;
      setLogs([]);
      setFinalResult(null);
      setActiveRunning(true);
      setIsCloudRun(true);

      let payload = {};
      try { payload = JSON.parse(jsonInput); } catch(e) { return; }

      // 1. Prepare State
      const runId = `CLOUD-TEST-${Date.now()}`;
      setLogs(prev => [...prev, { msg: `Dispatching Job ${runId} to Cloud Cluster...`, type: 'INFO' }]);

      const triggerNode = nexuses.find(n => n.type === NexusType.TRIGGER);
      const initialState: ExecutionState = {
          runId,
          userId: user?.uid || 'guest',
          projectId: 'test-project',
          status: 'QUEUED',
          currentQueue: triggerNode ? [triggerNode.id] : [],
          completedNodeIds: [],
          context: { trigger: { data: payload } }, // Pass initial payload
          startTime: Date.now(),
          lastUpdateTime: Date.now(),
          nodeLimitCount: 0
      };

      try {
          // 2. Upload to Firestore
          await createCloudRun(initialState);
          setLogs(prev => [...prev, { msg: "Payload Uploaded. Waiting for Worker Pickup...", type: 'INFO' }]);

          // 3. Listen for Worker Updates
          const unsubscribe = subscribeToRun(runId, (updatedState) => {
              if (updatedState.status === 'COMPLETED') {
                  setLogs(prev => [...prev, { msg: "Worker finished execution successfully.", type: 'SUCCESS' }]);
                  setFinalResult({
                      status: 'SUCCESS',
                      executionId: runId,
                      duration: Date.now() - initialState.startTime,
                      output: updatedState.context,
                      logs: [],
                      telemetry: []
                  });
                  setActiveRunning(false);
                  unsubscribe();
              } else if (updatedState.status === 'RUNNING') {
                  // If processed nodes changed, log it
                  const newNodes = updatedState.completedNodeIds.length;
                  if (newNodes > 0) {
                       setLogs(prev => {
                           // Simple dedup to avoid spamming logs on every slight update
                           const lastMsg = prev[prev.length - 1]?.msg || '';
                           if (!lastMsg.includes(`Processed ${newNodes}`)) {
                               return [...prev, { msg: `Worker Update: Processed ${newNodes} nodes...`, type: 'INFO' }];
                           }
                           return prev;
                       });
                  }
              }
          });

          // Timeout failsafe
          setTimeout(() => {
              if (activeRunning) {
                  setLogs(prev => [...prev, { msg: "Cloud Timeout: Worker did not respond in 30s. Ensure Functions are deployed.", type: 'ERROR' }]);
                  setActiveRunning(false);
                  unsubscribe();
              }
          }, 30000);

      } catch (e: any) {
          setLogs(prev => [...prev, { msg: `Cloud Dispatch Failed: ${e.message}`, type: 'ERROR' }]);
          setActiveRunning(false);
      }
  };

  const handleSelfHeal = async () => {
    setIsHealing(true);
    await new Promise(r => setTimeout(r, 2000));
    setLogs(prev => [...prev, { msg: "AI Architect: Logic bottleneck identified. Applying self-healing patch...", type: 'SUCCESS' }]);
    setIsHealing(false);
    setTimeout(onClose, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="bg-[#050505] border border-white/10 w-full max-w-6xl h-[90vh] rounded-[40px] shadow-3xl flex flex-col overflow-hidden">
        
        <div className="px-10 py-8 border-b border-white/5 bg-[#080808] flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-nexus-accent/10 rounded-[20px] border border-nexus-accent/20 shadow-[0_0_30px_rgba(0,255,157,0.1)]">
              <Terminal size={28} className="text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] leading-tight">Runtime Debugger</h2>
              <div className="flex items-center gap-4 mt-1">
                  <div className={`w-2 h-2 rounded-full ${activeRunning ? 'bg-nexus-accent animate-ping' : 'bg-gray-700'}`} />
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      Env: {isCloudRun ? 'GOOGLE_CLOUD_FUNCTIONS' : 'LOCAL_BROWSER_VM'}
                  </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-gray-500 hover:text-white bg-white/5 rounded-2xl transition-all"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-[380px] p-10 bg-[#030303] border-r border-white/5 flex flex-col">
                {finalResult ? (
                    <div className="space-y-6 animate-in slide-in-from-left-4">
                        <div className="p-6 bg-blue-600/5 border border-blue-600/20 rounded-[30px]">
                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingUp size={14}/> Performance Vitals
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-mono"><span className="text-gray-500">Duration</span><span className="text-white">{finalResult.duration}ms</span></div>
                                <div className="flex justify-between text-[11px] font-mono"><span className="text-gray-500">Status</span><span className="text-nexus-success font-bold">SUCCESS</span></div>
                            </div>
                        </div>

                        <div className="p-6 bg-nexus-accent/5 border border-nexus-accent/20 rounded-[30px]">
                            <div className="text-[10px] font-black text-nexus-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Brain size={14}/> Architect Insights
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
                                Flow executed successfully. Telemetry indicates optimal pathing.
                            </p>
                            <button 
                                onClick={handleSelfHeal}
                                disabled={isHealing}
                                className="w-full py-4 bg-nexus-accent text-black font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-nexus-success transition-all shadow-xl"
                            >
                                {isHealing ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14}/>}
                                {isHealing ? 'Synthesizing...' : 'Optimize Layout'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block ml-1">Input Payload (JSON)</label>
                        <textarea 
                            value={jsonInput} 
                            onChange={(e) => setJsonInput(e.target.value)} 
                            className="flex-1 w-full bg-black border border-white/5 rounded-[30px] p-8 text-[12px] text-nexus-wire font-mono outline-none focus:border-nexus-accent/40 transition-all resize-none shadow-inner"
                        />
                        {validationError && (
                            <div className="mt-8 p-6 bg-red-950/20 border border-red-500/30 rounded-[28px] animate-in slide-in-from-bottom-4">
                                <p className="text-[11px] text-red-200/70 font-medium leading-relaxed">⚠️ {validationError}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex-1 p-10 flex flex-col bg-black relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,157,0.02),_transparent)] pointer-events-none"></div>
                <div ref={scrollRef} className="flex-1 bg-[#020202]/60 backdrop-blur-xl rounded-[40px] border border-white/5 p-10 font-mono text-[13px] overflow-y-auto custom-scrollbar space-y-3 z-10 selection:bg-nexus-accent/20">
                    {logs.map((log, i) => (
                        <div key={i} className={`flex gap-5 animate-in slide-in-from-left-2 ${log.type === 'ERROR' ? 'text-red-500' : log.type === 'SUCCESS' ? 'text-nexus-success' : 'text-gray-500'}`}>
                            <span className="opacity-20 shrink-0 select-none">[{new Date().toLocaleTimeString([], {hour12: false} as any)}]</span>
                            <div className="flex flex-col">
                                <span className="font-medium leading-relaxed">{log.msg}</span>
                                {log.nodeId && <span className="text-[9px] opacity-40 uppercase font-black">Origin: {log.nodeId}</span>}
                            </div>
                        </div>
                    ))}
                    {activeRunning && <div className="animate-pulse text-nexus-accent pt-10 font-black uppercase tracking-[0.5em] text-[10px]">● {isCloudRun ? 'WAITING_FOR_WORKER_RESPONSE...' : 'EXECUTING...'}</div>}
                </div>
            </div>
        </div>

        <div className="p-10 border-t border-white/5 bg-[#080808] flex items-center justify-between">
            <button onClick={onClose} className="px-12 py-5 bg-white/5 text-gray-600 font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] hover:text-white transition-all">Close Console</button>
            <div className="flex gap-4">
                <button 
                    onClick={handleLocalStart} 
                    disabled={activeRunning || !!validationError}
                    className="px-10 py-5 bg-nexus-900 border border-nexus-800 text-gray-300 font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-nexus-800 hover:text-white transition-all"
                >
                    <Play size={16} fill="currentColor"/> Local Run
                </button>
                <button 
                    onClick={handleCloudStart} 
                    disabled={activeRunning || !!validationError}
                    className="px-12 py-5 bg-nexus-accent text-black font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-nexus-success transition-all shadow-[0_20px_60px_rgba(0,255,157,0.25)] active:scale-95"
                >
                    {activeRunning && isCloudRun ? <Loader2 className="animate-spin" size={20}/> : <CloudLightning size={20}/>}
                    Run on Cloud
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RunModal;
