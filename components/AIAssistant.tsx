
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Loader2, Brain, CheckCircle, Layout, GitMerge, Cpu, ShieldCheck, ArrowRight, Activity, Terminal, BookOpen, Zap, AlertTriangle, Lock, Crown } from 'lucide-react';
import { chatWithArchitect, analyzeWorkflow } from '../services/geminiService';
import { Nexus, Synapse, ChatMessage, PlanTier } from '../types';
import { ArchitectResponse, Decision } from '../services/architect/types';
import { saveArchitectMemory } from '../services/cloudStore';
import { PLAN_LIMITS } from '../constants';
import { checkAndIncrementAI } from '../services/usageGuard'; // 🔥 NEW IMPORT
import { useAuth } from '../context/AuthContext'; // To get uid

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStream: (nexuses: Nexus[], synapses: Synapse[]) => void;
  currentNexuses: Nexus[];
  currentSynapses: Synapse[];
  projectContext?: string;
  userPlan?: PlanTier; // Injected from App
  onUpgrade?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, onClose, onApplyStream, currentNexuses, currentSynapses, projectContext = "New Workflow", userPlan = 'FREE', onUpgrade
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingChanges, setPendingChanges] = useState<ArchitectResponse | null>(null);
  const [thinkingStep, setThinkingStep] = useState<string>('');
  
  // Note: We no longer track local 'promptCount' for logic, only for immediate UI feedback if needed.
  // The authority is now Firestore via checkAndIncrementAI.
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingStep, pendingChanges]);

  useEffect(() => {
      if (isOpen && messages.length === 0) {
          setMessages([{
              id: 'init',
              role: 'assistant',
              content: `**NexusStream Architect Prime Online.**\n\nI am ready to synthesize your automation stack. Describe your goal in natural language (e.g., "Build a lead scraper that saves to Sheets and alerts Slack").`,
              timestamp: Date.now()
          }]);
      }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // --- 🔥 REAL SAAS USAGE GUARD ---
    if (user) {
        const allowed = await checkAndIncrementAI(user.uid);
        if (!allowed) {
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'system', 
                content: `🔒 **Free Plan Limit Reached.**\n\nYou’ve used all your free AI prompts for this month.\nUpgrade to Pro to continue designing workflows with AI.`, 
                timestamp: Date.now() 
            }]);
            return;
        }
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setPendingChanges(null);

    const steps = [
        "Synthesizing Requirements...", 
        "Architecting Graph Topology...", 
        "Injecting Safety Guards...", 
        "Mapping Neural Variables...",
        "Final Logic Validation..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
        if(stepIdx < steps.length) setThinkingStep(steps[stepIdx++]);
    }, 1500);

    try {
      const result = await chatWithArchitect(userMsg.content, messages, "", currentNexuses, currentSynapses, projectContext);
      
      clearInterval(interval);
      setThinkingStep('');
      
      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: result.text, 
          timestamp: Date.now(),
          metadata: result 
      }]);

      if ((result.patch || result.fullBlueprint) && !result.validationError) {
          setPendingChanges(result);
      } else if (result.validationError) {
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              content: `🔒 **Safety Guard**: Changes rejected due to: ${result.validationError}. State protected.`,
              timestamp: Date.now()
          }]);
      }

    } catch (err: any) {
      clearInterval(interval);
      setThinkingStep('');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `CRITICAL FAULT: ${err.message}. Connection reset.`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysis = async (intent: 'VALIDATE' | 'EXPLAIN' | 'OPTIMIZE') => {
      // Analysis also consumes quota
      if (user) {
          const allowed = await checkAndIncrementAI(user.uid);
          if (!allowed) {
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `🔒 Limit Reached. Upgrade to run analysis.`, timestamp: Date.now() }]);
              return;
          }
      }

      if (isLoading) return;
      setIsLoading(true);
      setThinkingStep(`Running ${intent.toLowerCase()} analysis protocol...`);
      
      try {
          const labels = { 'VALIDATE': 'Run QA Check', 'EXPLAIN': 'Explain this flow', 'OPTIMIZE': 'Optimize Logic' };
          const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: `[SYSTEM COMMAND]: ${labels[intent]}`, timestamp: Date.now() };
          setMessages(prev => [...prev, userMsg]);

          const resultText = await analyzeWorkflow(intent, currentNexuses, currentSynapses);
          
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: resultText,
              timestamp: Date.now()
          }]);
      } catch (e: any) {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: "Analysis Failed: " + e.message, timestamp: Date.now() }]);
      } finally {
          setIsLoading(false);
          setThinkingStep('');
      }
  };

  const handleApply = async () => {
      if (!pendingChanges) return;
      let appliedNodes: Nexus[] = [];
      let appliedSynapses: Synapse[] = [];

      try {
          if (pendingChanges.fullBlueprint) {
              appliedNodes = pendingChanges.fullBlueprint.nexuses;
              appliedSynapses = pendingChanges.fullBlueprint.synapses;
              onApplyStream(appliedNodes, appliedSynapses);
          } else if (pendingChanges.patch) {
              let newNodes = [...currentNexuses];
              let newSynapses = [...currentSynapses];
              const p = pendingChanges.patch;
              if(p.removeNodeIds) newNodes = newNodes.filter(n => !p.removeNodeIds.includes(n.id));
              if(p.removeConnectionIds) newSynapses = newSynapses.filter(c => !p.removeConnectionIds.includes(c.id));
              if(p.updateNodes) {
                  newNodes = newNodes.map(n => {
                      const update = p.updateNodes.find(u => u.id === n.id);
                      return update ? { ...n, ...update } as Nexus : n;
                  });
              }
              if(p.addNodes) newNodes = [...newNodes, ...p.addNodes];
              if(p.addConnections) newSynapses = [...newSynapses, ...p.addConnections];
              
              appliedNodes = newNodes;
              appliedSynapses = newSynapses;
              onApplyStream(newNodes, newSynapses);
          }

          const lastUserMsg = messages.filter(m => m.role === 'user' && !m.content.startsWith('[SYSTEM')).pop();
          if (lastUserMsg) {
              await saveArchitectMemory(lastUserMsg.content, appliedNodes, appliedSynapses);
          }

          setPendingChanges(null);
          onClose();
      } catch (e: any) {
          console.error("Apply Error:", e);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `Apply Failed: ${e.message}`, timestamp: Date.now() }]);
      }
  };

  if (!isOpen) return null;

  const limit = PLAN_LIMITS[userPlan].AI_PROMPTS;

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-[#030303]/98 backdrop-blur-3xl border-l border-white/10 z-[100] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500 font-sans">
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-nexus-accent/10 rounded-xl border border-nexus-accent/20 shadow-[0_0_20px_rgba(0,255,157,0.1)]">
                    <Brain size={24} className="text-nexus-accent"/>
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Architect Prime</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-nexus-success animate-pulse"></span>
                        <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Self-Learning Active</span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar" ref={scrollRef}>
            {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest px-1">
                        {msg.role === 'user' ? 'Input Stream' : 'Architect Intelligence'}
                    </span>
                    
                    {msg.content.includes("Free Plan Limit Reached") ? (
                        <div className="max-w-[90%] p-6 bg-gradient-to-br from-nexus-900 to-black rounded-2xl border border-nexus-accent/30 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-20"><Lock size={48} className="text-nexus-accent"/></div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-yellow-500"/> Usage Limit Reached
                                </h3>
                                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                    You've used all <b>5 free AI prompts</b>. The Architect requires more fuel to continue designing complex systems.
                                </p>
                                <button onClick={onUpgrade} className="w-full py-3 bg-nexus-accent text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg">
                                    <Crown size={14} fill="currentColor"/> Unlock Pro Power
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`max-w-[95%] p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xl border ${
                            msg.role === 'user' 
                            ? 'bg-nexus-800 text-white border-white/10 rounded-tr-none' 
                            : (msg.role === 'system' ? 'bg-red-950/20 text-red-200 border-red-900/30' : 'bg-white/[0.03] text-gray-300 border-white/5 rounded-tl-none')
                        }`}>
                            {msg.content}
                        </div>
                    )}

                    {msg.role === 'assistant' && msg.metadata?.decisionLog && (
                        <div className="ml-2 w-full max-w-[90%] space-y-2 animate-in fade-in duration-700">
                             <div className="text-[9px] font-bold text-gray-600 uppercase flex items-center gap-1.5 mb-3">
                                <Terminal size={10}/> Telemetry Trace
                            </div>
                            {msg.metadata.decisionLog.map((decision: Decision, dIdx: number) => (
                                <div key={dIdx} className="flex items-center gap-3 text-[10px] text-gray-500 font-mono bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                                    <div className="w-1 h-1 bg-nexus-wire rounded-full shadow-[0_0_5px_#ffd700]"></div>
                                    <span className="font-bold uppercase text-nexus-wire shrink-0">{decision.action}:</span>
                                    <span className="truncate opacity-70">{decision.reason}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {isLoading && (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 my-6">
                    <div className="flex items-center gap-3 text-nexus-accent text-xs font-mono uppercase tracking-[0.2em] px-4">
                        <Loader2 size={16} className="animate-spin"/>
                        {thinkingStep || "Processing..."}
                    </div>
                    <div className="h-0.5 bg-nexus-900 w-[60%] ml-4 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-accent animate-progress-indefinite"></div>
                    </div>
                </div>
            )}
        </div>

        {/* ACTIONS */}
        <div className="p-8 border-t border-white/10 bg-black/60 backdrop-blur-2xl">
            {/* USAGE METER - VISUAL ONLY, LOGIC IS SERVER SIDE */}
            <div className="mb-4 flex items-center justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                    <Activity size={10} className="text-nexus-success"/> AI Fuel
                </span>
                <span>{limit === 9999 ? 'Unlimited' : `Monthly Limit: ${limit}`}</span>
            </div>

            {pendingChanges && (
                <div className="mb-8 p-1 bg-gradient-to-br from-nexus-accent/40 via-blue-500/20 to-purple-500/40 rounded-2xl animate-in slide-in-from-bottom-4">
                    <div className="bg-[#0a0a0a] p-6 rounded-[14px] relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <div className="flex items-center gap-2.5 text-nexus-accent text-xs font-black uppercase tracking-widest">
                                <Layout size={16}/> Project Blueprint Ready
                            </div>
                            <span className="text-[10px] bg-white/5 text-gray-400 px-3 py-1 rounded-full font-mono border border-white/5">
                                Readiness: 100%
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-6 leading-relaxed relative z-10">
                            The Architect has finalized a complete project structure. Review the workflow description above before deploying to the kernel.
                        </p>
                        <div className="flex gap-3 relative z-10">
                            <button onClick={handleApply} className="flex-1 py-4 bg-nexus-accent text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,255,157,0.2)] flex items-center justify-center gap-3">
                                <CheckCircle size={16}/> Deploy Project
                            </button>
                            <button onClick={() => setPendingChanges(null)} className="px-6 py-4 bg-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-transparent hover:border-white/10">
                                Discard
                            </button>
                        </div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-nexus-accent/5 rounded-full blur-3xl"></div>
                    </div>
                </div>
            )}

            {/* NEURAL TOOLBELT */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                    onClick={() => handleAnalysis('VALIDATE')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-red-900/10 border border-red-900/30 hover:bg-red-900/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                    <ShieldCheck size={14}/> QA Check
                </button>
                <button 
                    onClick={() => handleAnalysis('EXPLAIN')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-900/10 border border-blue-900/30 hover:bg-blue-900/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                    <BookOpen size={14}/> Explain
                </button>
                <button 
                    onClick={() => handleAnalysis('OPTIMIZE')}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-nexus-accent/10 border border-nexus-accent/20 hover:bg-nexus-accent/20 text-nexus-accent rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                    <Zap size={14}/> Optimize
                </button>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you want to build..."
                    className={`w-full bg-[#080808] border rounded-2xl pl-6 pr-16 py-5 text-sm text-white focus:ring-1 outline-none transition-all placeholder:text-gray-800 border-white/10 focus:border-nexus-accent focus:ring-nexus-accent/30`}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className={`absolute right-3 top-3 bottom-3 aspect-square rounded-xl hover:scale-105 transition-all disabled:opacity-0 disabled:scale-90 flex items-center justify-center shadow-lg bg-nexus-accent text-black`}
                >
                    <ArrowRight size={22} strokeWidth={3} />
                </button>
            </form>
            
            <div className="flex justify-between items-center mt-5 px-1">
                <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    <Activity size={12} className="text-nexus-success"/> Neural Bridge Connected
                </div>
                <div className="text-[10px] text-gray-700 font-mono">
                    Session ID: {messages[0]?.id.slice(0, 8)}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AIAssistant;
