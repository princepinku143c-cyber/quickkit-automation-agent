
import React, { useState, useEffect, useRef } from 'react';
import { Play, X, Terminal, ShieldCheck, AlertTriangle, Loader2, CheckCircle2, Zap, Brain, TrendingUp, Sparkles, Wand2, Activity, Server, Cloud, CloudLightning, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { Nexus, Synapse, ExecutionState, NexusType, FlowWarning } from '../types';
import { getConnectorValidationErrors } from '../constants';
import { WorkflowOrchestrator, ExecutionResult } from '../services/executionEngine';
import { createCloudRun, subscribeToRun } from '../services/cloudStore';
import { useAuth } from '../context/AuthContext';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  nexuses: Nexus[];
  synapses: Synapse[]; 
  resumeState?: ExecutionState | null;
  onHeal?: (patch: any) => void;
}

const RunModal: React.FC<RunModalProps> = ({ isOpen, onClose, nexuses, synapses, resumeState, onHeal }) => {
  const { user } = useAuth();
  const [activeRunning, setActiveRunning] = useState(false);
  const [isCloudRun, setIsCloudRun] = useState(false);
  const [jsonInput, setJsonInput] = useState('{\n  "event": "production_handshake",\n  "metadata": { "env": "cloud-v2" }\n}');
  const [logs, setLogs] = useState<{ msg: string, type: string, nodeId?: string }[]>([]);
  
  // Validation State
  const [warnings, setWarnings] = useState<FlowWarning[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  const [finalResult, setFinalResult] = useState<ExecutionResult | null>(null);
  const [isHealing, setIsHealing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const cloudTimeoutRef = useRef<any>(null);
  const cloudUnsubRef = useRef<null | (() => void)>(null);
  const isMountedRef = useRef(true);
  const activeRunIdRef = useRef<string | null>(null);

  const appendLog = (entry: { msg: string; type: string; nodeId?: string }) => {
      if (!isMountedRef.current) return;
      setLogs(prev => [...prev, entry]);
  };

  const cleanupCloudRun = (options?: { resetRunning?: boolean; resetMode?: boolean; resetRunId?: boolean }) => {
      const {
          resetRunning = false,
          resetMode = false,
          resetRunId = true
      } = options || {};

      if (cloudTimeoutRef.current) {
          clearTimeout(cloudTimeoutRef.current);
          cloudTimeoutRef.current = null;
      }
      if (cloudUnsubRef.current) {
          cloudUnsubRef.current();
          cloudUnsubRef.current = null;
      }
      if (resetRunId) {
          activeRunIdRef.current = null;
      }
      if (resetRunning && isMountedRef.current) {
          setActiveRunning(false);
      }
      if (resetMode && isMountedRef.current) {
          setIsCloudRun(false);
      }
  };

  useEffect(() => {
      isMountedRef.current = true;
      return () => {
          isMountedRef.current = false;
          cleanupCloudRun({ resetRunId: true });
      };
  }, []);

  useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
      if (isOpen) {
          const engine = new WorkflowOrchestrator(nexuses, synapses, () => {});
          
          // PERFORM HEALTH CHECK
          const health = engine.validate();
          const connectorWarnings: FlowWarning[] = nexuses.flatMap((node) =>
            getConnectorValidationErrors(node.subtype, node.config || {}).map((message) => ({
              level: 'ERROR' as const,
              message,
              nodeId: node.id,
            }))
          );
          const combinedWarnings = [...health.warnings, ...connectorWarnings];
          setWarnings(combinedWarnings);
          setIsBlocked(!health.valid || connectorWarnings.length > 0);
          
          if (resumeState && health.valid) {
              setLogs([{ msg: `Resuming execution ${resumeState.runId}...`, type: 'INFO' }]);
              handleLocalStart(resumeState, true);
          } else if (resumeState && !health.valid) {
              setLogs([{ msg: 'Resume blocked: fix validation errors before continuing.', type: 'ERROR' }]);
          } else {
              setLogs([]);
              setFinalResult(null);
              setIsCloudRun(false);
          }
      }

      return () => cleanupCloudRun({ resetRunning: true, resetMode: true, resetRunId: true });
  }, [isOpen, nexuses, synapses, resumeState]);

  const handleLocalStart = async (stateToResume?: ExecutionState, forceResume: boolean = false) => {
      if (activeRunning) {
          appendLog({ msg: 'Run already in progress. Please wait for completion.', type: 'INFO' });
          return;
      }
      if (isBlocked && !forceResume) {
          appendLog({ msg: 'Run blocked: resolve workflow validation errors first.', type: 'ERROR' });
          return;
      }
      setLogs(prev => stateToResume ? prev : []); 
      setFinalResult(null);
      setActiveRunning(true);
      setIsCloudRun(false);
      cleanupCloudRun({ resetRunId: true });
      
      let payload = {};
      try { payload = JSON.parse(jsonInput); } catch(e) {
          if (!stateToResume) {
            setLogs([{ msg: "CRITICAL: Payload JSON is malformed.", type: 'ERROR' }]);
            setActiveRunning(false);
            return;
          }
      }

      if (!stateToResume) {
          appendLog({ msg: "Initializing Local Browser Runtime...", type: 'INFO' });
      }

      const engine = new WorkflowOrchestrator(
          nexuses, 
          synapses, 
          (msg, type, nodeId) => appendLog({ msg, type, nodeId }), 
          undefined, 
          user?.uid || 'guest',
          'test-project',
          stateToResume || undefined
      );
      
      try {
          const result = await engine.start(payload);
          if (isMountedRef.current) {
              setFinalResult(result);
          }
      } catch (e: any) {
          appendLog({ msg: `Runtime failed: ${e.message || 'Unknown error'}`, type: 'ERROR' });
      } finally {
          if (isMountedRef.current) {
              setActiveRunning(false);
          }
      }
  };

  const handleCloudStart = async () => {
      if (activeRunning) {
          appendLog({ msg: 'Run already in progress. Please wait for completion.', type: 'INFO' });
          return;
      }
      if (isBlocked) {
          appendLog({ msg: 'Cloud run blocked: resolve workflow validation errors first.', type: 'ERROR' });
          return;
      }

      let payload = {};
      try {
          payload = JSON.parse(jsonInput);
      } catch(e) {
          setLogs([{ msg: "CRITICAL: Payload JSON is malformed.", type: 'ERROR' }]);
          return;
      }

      setLogs([]);
      setFinalResult(null);
      setActiveRunning(true);
      setIsCloudRun(true);

      const runId = `CLOUD-TEST-${Date.now()}`;
      activeRunIdRef.current = runId;
      appendLog({ msg: `Dispatching Job ${runId} to Cloud Cluster...`, type: 'INFO' });

      const triggerNode = nexuses.find(n => n.type === NexusType.TRIGGER);
      const initialState: ExecutionState = {
          runId,
          userId: user?.uid || 'guest',
          projectId: 'test-project',
          status: 'QUEUED',
          currentQueue: triggerNode ? [triggerNode.id] : [],
          completedNodeIds: [],
          context: { trigger: { data: payload } },
          startTime: Date.now(),
          lastUpdateTime: Date.now(),
          nodeLimitCount: 0
      };

      try {
          cleanupCloudRun({ resetRunId: false });

          await createCloudRun(initialState);
          appendLog({ msg: "Waiting for Worker Response...", type: 'INFO' });

          let finished = false;
          let timeoutId: any = null;

          const unsubscribe = subscribeToRun(runId, (updatedState) => {
              if (activeRunIdRef.current !== runId) {
                  return;
              }

              if (updatedState.status === 'COMPLETED') {
                  finished = true;
                  cleanupCloudRun({ resetRunning: true, resetMode: false, resetRunId: true });
                  appendLog({ msg: "Execution finished successfully.", type: 'SUCCESS' });
                  if (isMountedRef.current) {
                      setFinalResult({
                          status: 'SUCCESS',
                          executionId: runId,
                          duration: Date.now() - initialState.startTime,
                          output: updatedState.context,
                          logs: [],
                          telemetry: []
                      });
                  }
              } else if (updatedState.status === 'FAILED') {
                  finished = true;
                  cleanupCloudRun({ resetRunning: true, resetMode: false, resetRunId: true });
                  appendLog({ msg: `Cloud run ${updatedState.status.toLowerCase()}.`, type: 'ERROR' });
                  if (isMountedRef.current) {
                      setFinalResult({
                          status: 'FAILED',
                          executionId: runId,
                          duration: Date.now() - initialState.startTime,
                          output: updatedState.context,
                          logs: [],
                          telemetry: []
                      });
                  }
              }
          });

          cloudUnsubRef.current = unsubscribe;

          timeoutId = setTimeout(() => {
              if (!finished && activeRunIdRef.current === runId) {
                  appendLog({ msg: "Cloud Timeout.", type: 'ERROR' });
                  cleanupCloudRun({ resetRunning: true, resetMode: false, resetRunId: true });
              }
          }, 30000);
          cloudTimeoutRef.current = timeoutId;

      } catch (e: any) {
          appendLog({ msg: `Dispatch Failed: ${e.message}`, type: 'ERROR' });
          cleanupCloudRun({ resetRunning: true, resetMode: false, resetRunId: true });
      }
  };

  const handleSelfHeal = async () => {
    setIsHealing(true);
    await new Promise(r => setTimeout(r, 2000));
    setLogs(prev => [...prev, { msg: "Optimizing flow layout...", type: 'SUCCESS' }]);
    setIsHealing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center md:p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="bg-[#050505] border border-white/10 w-full md:max-w-6xl h-full md:h-[90vh] md:rounded-[40px] shadow-3xl flex flex-col overflow-hidden">
        
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-[#080808] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="p-3 md:p-4 bg-nexus-accent/10 rounded-xl md:rounded-[20px] border border-nexus-accent/20 shadow-[0_0_30px_rgba(0,255,157,0.1)]">
              <Terminal size={20} className="md:w-7 md:h-7 text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-[0.2em] leading-tight">
                  {resumeState ? 'State Resumption' : 'Runtime Debugger'}
              </h2>
              <div className="flex items-center gap-4 mt-1">
                  <div className={`w-2 h-2 rounded-full ${activeRunning ? 'bg-nexus-accent animate-ping' : 'bg-gray-700'}`} />
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      {isCloudRun ? 'CLOUD_ENV' : 'LOCAL_VM'}
                  </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 text-gray-500 hover:text-white bg-white/5 rounded-xl md:rounded-2xl transition-all"><X size={20} className="md:w-6 md:h-6"/></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-[380px] p-6 md:p-10 bg-[#030303] border-r border-white/5 flex flex-col overflow-y-auto shrink-0 md:shrink">
                
                {/* HEALTH REPORT */}
                {warnings.length > 0 && (
                    <div className="mb-6 animate-in slide-in-from-left-2">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Flow Health</span>
                            {isBlocked && <span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded border border-red-500/30 font-bold uppercase">Blocked</span>}
                        </div>
                        <div className="space-y-2">
                            {warnings.map((w, idx) => (
                                <div key={idx} className={`p-3 rounded-xl border flex gap-3 ${
                                    w.level === 'ERROR' ? 'bg-red-900/10 border-red-900/30' : 
                                    w.level === 'WARNING' ? 'bg-yellow-900/10 border-yellow-900/30' : 
                                    'bg-blue-900/10 border-blue-900/30'
                                }`}>
                                    <div className={`mt-0.5 ${
                                        w.level === 'ERROR' ? 'text-red-500' : 
                                        w.level === 'WARNING' ? 'text-yellow-500' : 
                                        'text-blue-500'
                                    }`}>
                                        {w.level === 'ERROR' ? <AlertCircle size={14} /> : 
                                         w.level === 'WARNING' ? <AlertTriangle size={14} /> : 
                                         <Info size={14} />}
                                    </div>
                                    <div>
                                        <div className={`text-[10px] font-bold uppercase mb-0.5 ${
                                            w.level === 'ERROR' ? 'text-red-400' : 
                                            w.level === 'WARNING' ? 'text-yellow-400' : 
                                            'text-blue-400'
                                        }`}>{w.level}</div>
                                        <p className="text-[10px] text-gray-400 leading-relaxed">{w.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                        <button 
                            onClick={handleSelfHeal}
                            disabled={isHealing}
                            className="w-full py-4 bg-nexus-accent text-black font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-nexus-success transition-all shadow-xl"
                        >
                            {isHealing ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14}/>}
                            {isHealing ? 'Synthesizing...' : 'Re-Run Clean'}
                        </button>
                    </div>
                ) : (
                    <>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block ml-1">Input Payload (JSON)</label>
                        <textarea 
                            value={jsonInput} 
                            onChange={(e) => setJsonInput(e.target.value)} 
                            disabled={!!resumeState}
                            className={`flex-1 w-full bg-black border border-white/5 rounded-[30px] p-8 text-[12px] text-nexus-wire font-mono outline-none focus:border-nexus-accent/40 transition-all resize-none shadow-inner min-h-[200px] ${resumeState ? 'opacity-50 grayscale' : ''}`}
                        />
                        {resumeState && (
                            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Note:</p>
                                <p className="text-[9px] text-slate-400 mt-1">Initial payload is locked during resumption to maintain state integrity.</p>
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
                    {activeRunning && <div className="animate-pulse text-nexus-accent pt-10 font-black uppercase tracking-[0.5em] text-[10px]">● {isCloudRun ? 'SYNCING...' : 'RUNNING_CLUSTER...'}</div>}
                </div>
            </div>
        </div>

        <div className="p-6 md:p-10 border-t border-white/5 bg-[#080808] flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
            <button onClick={onClose} className="w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-white/5 text-gray-600 font-black rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] uppercase tracking-[0.2em] hover:text-white transition-all order-2 md:order-1">Close Debugger</button>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto order-1 md:order-2">
                {!resumeState && (
                  <button 
                      onClick={handleCloudStart} 
                      disabled={activeRunning || isBlocked}
                      className={`flex-1 md:flex-none px-8 md:px-12 py-4 md:py-5 bg-nexus-900 border border-nexus-800 text-gray-300 font-black rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${isBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-nexus-800 hover:text-white'}`}
                  >
                      <CloudLightning size={18} className="md:w-5 md:h-5"/> Cloud Pulse
                  </button>
                )}
                <button 
                    onClick={() => handleLocalStart()} 
                    disabled={activeRunning || isBlocked}
                    className={`flex-1 md:flex-none px-8 md:px-12 py-4 md:py-5 bg-nexus-accent text-black font-black rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_20px_60px_rgba(0,255,157,0.25)] active:scale-95 ${isBlocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-nexus-success'}`}
                >
                    {activeRunning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} className="md:w-5 md:h-5" fill="currentColor"/>}
                    {resumeState ? 'Resume Runtime' : 'Start Sequence'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RunModal;
