
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Wand2, Loader2, Play, Settings, Bot, User, Mic, MicOff, Trash2, Globe } from 'lucide-react';
import { chatWithArchitect } from '../services/geminiService';
import { Nexus, Synapse, ChatMessage } from '../types';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStream: (nexuses: Nexus[], synapses: Synapse[]) => void;
  onOpenSettings: () => void;
  currentNexuses: Nexus[];
  currentSynapses: Synapse[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, onClose, onApplyStream, onOpenSettings, currentNexuses, currentSynapses 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: 'intro', role: 'assistant', content: "Namaste! I am the Architect. Bol kar ya likh kar workflows banayein.\n• Try: 'Ek crypto tracker banao jo live search kare.'", timestamp: Date.now() }
  ]);
  const [pendingBlueprint, setPendingBlueprint] = useState<{ nexuses: Nexus[], synapses: Synapse[] } | null>(null);
  const [lastUrls, setLastUrls] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // API Key is handled by process.env.API_KEY in the services
    const apiKey = ""; 

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Fixed: Passing currentNexuses and currentSynapses as expected by updated chatWithArchitect signature
      const { text, blueprint, groundingUrls } = await chatWithArchitect(userMsg.content, messages, apiKey, currentNexuses, currentSynapses);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: text, timestamp: Date.now() }]);
      if (blueprint) setPendingBlueprint(blueprint);
      if (groundingUrls) setLastUrls(groundingUrls);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: "Error: " + err.message, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-0 bottom-0 w-[400px] z-40 bg-nexus-900 border-l border-nexus-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 bg-nexus-950 border-b border-nexus-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wand2 className="text-nexus-accent" size={18} />
            <h2 className="font-bold text-sm text-white">Architect</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-xl text-xs max-w-[85%] ${msg.role === 'user' ? 'bg-nexus-700 text-white' : 'bg-nexus-900 border border-nexus-800 text-gray-300'}`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {lastUrls.length > 0 && (
                <div className="p-2 bg-nexus-800/50 rounded border border-nexus-700 mt-2">
                    <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Globe size={10}/> Sources:</p>
                    <div className="flex flex-wrap gap-1">
                        {lastUrls.map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noreferrer" className="text-[9px] text-nexus-accent hover:underline truncate max-w-[100px]">{u}</a>
                        ))}
                    </div>
                </div>
            )}
            {isLoading && <Loader2 className="animate-spin text-nexus-accent" size={14} />}
            <div ref={messagesEndRef} />
        </div>

        {pendingBlueprint && (
            <div className="p-3 bg-nexus-950 border-t border-nexus-800 animate-in slide-in-from-bottom">
                <button onClick={() => { onApplyStream(pendingBlueprint.nexuses, pendingBlueprint.synapses); setPendingBlueprint(null); }} className="w-full py-2 bg-nexus-accent text-black font-bold rounded-lg text-xs">Apply Blueprint</button>
            </div>
        )}

        <div className="p-3 bg-nexus-950 border-t border-nexus-800">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <button type="button" onClick={toggleVoice} className={`p-2 rounded-lg border transition-colors ${isListening ? 'bg-red-500 border-red-400 text-white' : 'bg-nexus-800 border-nexus-700 text-gray-400'}`}>
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask Architect..."}
                    className="flex-1 bg-nexus-900 border border-nexus-700 rounded-lg p-3 text-xs text-white"
                />
                <button type="submit" className="p-2 bg-nexus-accent text-black rounded-lg"><Send size={16}/></button>
            </form>
        </div>
    </div>
  );
};

export default AIAssistant;
