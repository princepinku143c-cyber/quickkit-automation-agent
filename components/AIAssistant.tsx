
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Loader2, Zap, Brain, Terminal, ShieldCheck, ArrowRight, Paperclip, AlertTriangle, CheckCircle, Activity, Layout, GitMerge, Cpu } from 'lucide-react';
import { chatWithArchitect } from '../services/geminiService';
import { Nexus, Synapse, ChatMessage } from '../types';
import { ArchitectResponse, Decision } from '../services/architect/types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStream: (nexuses: Nexus[], synapses: Synapse[]) => void;
  currentNexuses: Nexus[];
  currentSynapses: Synapse[];
  projectContext?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, onClose, onApplyStream, currentNexuses, currentSynapses, projectContext = "New Workflow"
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingChanges, setPendingChanges] = useState<ArchitectResponse | null>(null);
  const [thinkingStep, setThinkingStep] = useState<string>('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingStep]);

  useEffect(() => {
      if (isOpen && messages.length === 0) {
          setMessages([{
              id: 'init',
              role: 'assistant',
              content: `**Architect Prime Online.**\nConnected to project context: _${projectContext}_\n\nDescribe your automation goal, and I will construct the pipeline.`,
              timestamp: Date.now()
          }]);
      }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setPendingChanges(null);

    // Visual Thinking Sequence
    const steps = [
        "Parsing Intent...", 
        "Analyzing Graph Topology...", 
        "Selecting Optimal Nodes...", 
        "Mapping Data Variables...",
        "Validating Logic Integrity..."
    ];
    let stepIdx = 0;
    const interval = setInterval(() => {
        if(stepIdx < steps.length) setThinkingStep(steps[stepIdx++]);
    }, 1200);

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

      if (result.patch || result.fullBlueprint) {
          setPendingChanges(result);
      }

    } catch (err: any) {
      clearInterval(interval);
      setThinkingStep('');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: "Architect Error: " + err.message, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
      if (!pendingChanges) return;
      
      if (pendingChanges.fullBlueprint) {
          onApplyStream(pendingChanges.fullBlueprint.nexuses, pendingChanges.fullBlueprint.synapses);
      } 
      else if (pendingChanges.patch) {
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

          onApplyStream(newNodes, newSynapses);
      }
      
      setPendingChanges(null);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-[#030303]/95 backdrop-blur-2xl border-l border-white/5 z-[100] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 font-sans">
        
        {/* --- HEADER --- */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-nexus-accent/10 rounded-lg border border-nexus-accent/20 relative">
                    <Brain size={20} className="text-nexus-accent"/>
                    <div className="absolute top-0 right-0 w-2 h-2 bg-nexus-success rounded-full animate-pulse shadow-[0_0_8px_#00ff9d]"></div>
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Architect Prime</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1">
                            <Cpu size={10} className="text-nexus-wire"/> Gemini 3.0 Pro Reasoning
                        </span>
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"><X size={18}/></button>
        </div>

        {/* --- CHAT AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar" ref={scrollRef}>
            {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Role Label */}
                    <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest px-1">
                        {msg.role === 'user' ? 'User Instruction' : 'System Response'}
                    </span>

                    {/* Message Bubble */}
                    <div className={`max-w-[95%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg border relative overflow-hidden ${
                        msg.role === 'user' 
                        ? 'bg-nexus-800 text-white border-white/5 rounded-tr-sm' 
                        : 'bg-white/[0.03] text-gray-300 border-white/5 rounded-tl-sm'
                    }`}>
                        {/* Decorative Line */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${msg.role === 'user' ? 'bg-nexus-accent' : 'bg-nexus-wire'}`}></div>
                        {msg.content}
                    </div>

                    {/* Decision Logs (If Architect) */}
                    {msg.role === 'assistant' && msg.metadata?.decisionLog && msg.metadata.decisionLog.length > 0 && (
                        <div className="ml-2 mt-2 w-full max-w-[95%] animate-in slide-in-from-left-2">
                            <div className="text-[9px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                <GitMerge size={10}/> Logic Trace
                            </div>
                            <div className="space-y-1.5">
                                {msg.metadata.decisionLog.map((decision: Decision, dIdx: number) => (
                                    <div key={dIdx} className="flex items-center gap-3 text-[10px] text-gray-400 font-mono bg-black/40 px-3 py-2 rounded border border-white/5">
                                        <div className="w-1.5 h-1.5 bg-nexus-wire rounded-full"></div>
                                        <span className="font-bold uppercase text-nexus-wire">{decision.action}:</span>
                                        <span className="opacity-80 truncate flex-1">{decision.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Thinking Indicator */}
            {isLoading && (
                <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 my-4">
                    <div className="flex items-center gap-3 text-nexus-accent text-xs font-mono uppercase tracking-widest px-4">
                        <Loader2 size={14} className="animate-spin"/>
                        {thinkingStep || "Processing..."}
                    </div>
                    {/* Progress Bar Simulation */}
                    <div className="h-0.5 bg-nexus-900 w-[60%] ml-4 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-accent animate-progress-indefinite"></div>
                    </div>
                </div>
            )}
        </div>

        {/* --- ACTION AREA --- */}
        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
            {pendingChanges && (
                <div className="mb-6 p-1 bg-gradient-to-r from-nexus-accent/20 to-nexus-wire/20 rounded-xl">
                    <div className="bg-[#0a0a0a] p-4 rounded-[10px] relative overflow-hidden">
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="flex items-center gap-2 text-nexus-accent text-xs font-black uppercase tracking-wider">
                                <Layout size={14}/> Blueprint Generated
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded font-mono">
                                    +{pendingChanges.patch?.addNodes?.length || 0} Nodes
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mb-4 leading-relaxed relative z-10">
                            The architect has prepared a structural update. Review the logic trace above before applying.
                        </p>
                        <div className="flex gap-2 relative z-10">
                            <button onClick={handleApply} className="flex-1 py-3 bg-nexus-accent text-black rounded-lg text-xs font-black uppercase tracking-wider hover:bg-nexus-success transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] flex items-center justify-center gap-2">
                                <CheckCircle size={14}/> Apply Blueprint
                            </button>
                            <button onClick={() => setPendingChanges(null)} className="px-4 py-3 bg-white/5 text-gray-400 hover:text-white hover:bg-red-900/20 hover:border-red-500/30 border border-transparent rounded-lg text-xs font-bold transition-all">
                                Discard
                            </button>
                        </div>
                        {/* Background Glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-nexus-accent/10 rounded-full blur-3xl"></div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="relative group">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="E.g. 'Watch Gmail for invoices, parse with AI, and save to Airtable'"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-5 pr-14 py-4 text-sm text-white focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-white/5 text-gray-400 rounded-lg hover:bg-nexus-accent hover:text-black transition-all disabled:opacity-0 disabled:scale-90 flex items-center justify-center"
                >
                    <ArrowRight size={18} strokeWidth={2.5} />
                </button>
            </form>
            
            <div className="flex justify-between items-center mt-4 px-1">
                <div className="flex items-center gap-2 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                    <ShieldCheck size={10}/> Encrypted Context
                </div>
                <div className="text-[9px] text-gray-600 font-mono">
                    Token Budget: 4k/req
                </div>
            </div>
        </div>
    </div>
  );
};

export default AIAssistant;
