
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Loader2, CheckCircle, XCircle, ChevronRight, Zap, Sparkles, AlertCircle, LayoutGrid, Split, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import Markdown from 'react-markdown';
import { Nexus, Synapse, ChatMessage, PlanTier } from '../types';
import { processArchitectRequest, analyzeWorkflow } from '../services/architect';
import { checkAndConsumeCredit } from '../services/usageGuard';
import { useAuth } from '../context/AuthContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStream: (nexuses: Nexus[], synapses: Synapse[]) => void;
  currentNexuses: Nexus[];
  currentSynapses: Synapse[];
  projectContext?: string;
  userPlan?: PlanTier;
  onUpgrade?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  onApplyStream,
  currentNexuses,
  currentSynapses,
  projectContext,
  userPlan,
  onUpgrade
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  
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
              content: `**Architect Brain Online.**\n\nI am here to design your automation logic. Describe your goal, and I will plan the workflow, identify risks, and map data flows.\n\n*I do not execute workflows or access external APIs.*`,
              timestamp: Date.now()
          }]);
      }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // --- 🔥 REAL USAGE GUARD (CREDIT CONSUMPTION) ---
    if (user) {
        const hasCredit = await checkAndConsumeCredit(user.uid, 1); // Cost = 1 credit
        if (!hasCredit) {
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'system', 
                content: `🔒 **Credit Limit Reached.**\n\nYou’ve used all your AI credits.\nTop up your balance or upgrade to Pro to continue.`, 
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
        "Analyzing Requirements...", 
        "Architecting Logic Flow...", 
        "Designing Safety Guards...", 
        "Mapping Data Variables...",
        "Finalizing Blueprint..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
        setThinkingStep(steps[stepIdx % steps.length]);
        stepIdx++;
    }, 1500);

    try {
      const result = await processArchitectRequest(input, currentNexuses, currentSynapses, projectContext);
      
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
      // Analysis consumes quota
      if (user) {
          const hasCredit = await checkAndConsumeCredit(user.uid, 1);
          if (!hasCredit) {
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `🔒 Insufficient Credits.`, timestamp: Date.now() }]);
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
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `Analysis Error: ${e.message}`, timestamp: Date.now() }]);
      } finally {
          setThinkingStep('');
          setIsLoading(false);
      }
  };

  const applyChanges = () => {
      if (!pendingChanges) return;
      
      if (pendingChanges.fullBlueprint) {
          onApplyStream(pendingChanges.fullBlueprint.nexuses, pendingChanges.fullBlueprint.synapses);
      } else if (pendingChanges.patch) {
          // Apply patch logic
          const updatedNexuses = [...currentNexuses];
          const updatedSynapses = [...currentSynapses];

          if (pendingChanges.patch.nexuses) {
              pendingChanges.patch.nexuses.forEach((pn: any) => {
                  const idx = updatedNexuses.findIndex(n => n.id === pn.id);
                  if (idx !== -1) updatedNexuses[idx] = { ...updatedNexuses[idx], ...pn };
                  else updatedNexuses.push(pn);
              });
          }

          if (pendingChanges.patch.synapses) {
              pendingChanges.patch.synapses.forEach((ps: any) => {
                  if (!updatedSynapses.some(s => s.id === ps.id)) updatedSynapses.push(ps);
              });
          }
          onApplyStream(updatedNexuses, updatedSynapses);
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `✅ Blueprint applied to workspace.`, timestamp: Date.now() }]);
      setPendingChanges(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#050505] border-l border-white/10 z-[200] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-nexus-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-nexus-accent/10 rounded-xl flex items-center justify-center border border-nexus-accent/20">
                    <Brain className="text-nexus-accent" size={20} />
                </div>
                <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Architect AI</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">Logic Design Protocol</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
            </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                            ? 'bg-nexus-accent text-black font-medium' 
                            : msg.role === 'system'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs'
                                : 'bg-white/5 border border-white/10 text-gray-300'
                    }`}>
                        <div className="markdown-body prose prose-invert prose-sm max-w-none">
                            <Markdown>{msg.content}</Markdown>
                        </div>
                        {msg.metadata?.risks && msg.metadata.risks.length > 0 && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <p className="text-[10px] font-black text-yellow-500 uppercase mb-2 flex items-center gap-2">
                                    <AlertCircle size={12} /> Risk Assessment
                                </p>
                                <ul className="space-y-1">
                                    {msg.metadata.risks.map((r: string, i: number) => (
                                        <li key={i} className="text-[11px] text-yellow-200/70">• {r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {thinkingStep && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-nexus-accent" />
                        <span className="text-xs font-bold text-nexus-accent uppercase tracking-widest">{thinkingStep}</span>
                    </div>
                </div>
            )}

            {pendingChanges && (
                <div className="p-6 bg-nexus-accent/5 border border-nexus-accent/20 rounded-3xl animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-nexus-accent/20 rounded-lg text-nexus-accent">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Blueprint Ready</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Ready for workspace deployment</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={applyChanges}
                            className="flex-1 py-3 bg-nexus-accent text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg"
                        >
                            Deploy Blueprint
                        </button>
                        <button 
                            onClick={() => setPendingChanges(null)}
                            className="px-4 py-3 bg-white/5 text-gray-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:text-white transition-all"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Quick Actions */}
        {!isLoading && messages.length > 1 && (
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/40">
                <button onClick={() => handleAnalysis('VALIDATE')} className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest">QA Check</button>
                <button onClick={() => handleAnalysis('OPTIMIZE')} className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest">Optimize</button>
                <button onClick={() => handleAnalysis('EXPLAIN')} className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-400 hover:text-white hover:border-white/20 transition-all uppercase tracking-widest">Explain Flow</button>
            </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-white/10 bg-nexus-950/50">
            <form onSubmit={handleSubmit} className="relative">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your logic goal..."
                    disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-nexus-accent/50 transition-all"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-nexus-accent text-black rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                </button>
            </form>
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                    <ShieldCheck size={12} /> Architect Mode
                </div>
                {userPlan === 'FREE' && (
                    <button onClick={onUpgrade} className="text-[9px] font-black text-nexus-accent uppercase tracking-widest hover:underline decoration-nexus-accent/30 underline-offset-4">
                        Upgrade for Unlimited AI
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default AIAssistant;
