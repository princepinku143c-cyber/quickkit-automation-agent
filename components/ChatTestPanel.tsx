
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, NexusSubtype } from '../types';
import { NEXUS_DEFINITIONS } from '../constants';
import { Send, X, Bot, User, Trash2, RefreshCw, Maximize2, Minimize2, MessageCircle, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2, Clock, Terminal, Activity, Copy, Database } from 'lucide-react';
import JsonTree from './JsonTree';

interface ChatTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isProcessing: boolean;
}

// Helper: Auto-Expanding Textarea
const AutoResizeTextarea = ({ value, onChange, onSubmit, disabled }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message or command..."
            rows={1}
            className="flex-1 bg-nexus-900 border border-nexus-800 rounded-xl px-4 py-3 text-sm text-white focus:border-nexus-accent focus:outline-none focus:ring-1 focus:ring-nexus-accent/50 transition-all placeholder-gray-600 resize-none max-h-32 custom-scrollbar"
        />
    );
};

// Helper: Execution Step (The n8n-style Node Card)
const ExecutionStep: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Metadata contains: nodeLabel, nodeType, output, duration, status
    const meta = msg.metadata || {};
    const isError = meta.status === 'error';
    
    // Find Icon based on subtype (with fallback)
    const def = NEXUS_DEFINITIONS.find(d => d.subtype === meta.nodeType) || NEXUS_DEFINITIONS[0];
    const Icon = def.icon;

    return (
        <div className="pl-4 relative group animate-in slide-in-from-left-2 duration-300">
            {/* Timeline Line */}
            <div className={`absolute left-[7px] top-6 bottom-[-8px] w-px ${isError ? 'bg-red-500/50' : 'bg-nexus-wire/20'}`}></div>
            
            <div className="flex items-start gap-3 mb-3">
                {/* Status Dot/Icon */}
                <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isError ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-nexus-900 border border-nexus-success shadow-[0_0_10px_rgba(0,255,157,0.2)]'}`}>
                    {isError ? <X size={10} className="text-black font-bold"/> : <div className="w-1.5 h-1.5 bg-nexus-success rounded-full"/>}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header Card */}
                    <div 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`
                            rounded-lg border px-3 py-2 cursor-pointer transition-all hover:bg-nexus-900
                            ${isError 
                                ? 'bg-red-950/20 border-red-500/30' 
                                : 'bg-nexus-900/50 border-nexus-800 hover:border-nexus-700'}
                        `}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Icon size={14} className={isError ? "text-red-400" : "text-nexus-wire"} />
                                <span className={`text-xs font-bold truncate ${isError ? 'text-red-300' : 'text-gray-300'}`}>
                                    {meta.nodeLabel || 'Processing...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-600 font-mono hidden sm:inline">{meta.duration !== undefined ? `${meta.duration}ms` : ''}</span>
                                {isExpanded ? <ChevronDown size={12} className="text-gray-600"/> : <ChevronRight size={12} className="text-gray-600"/>}
                            </div>
                        </div>

                        {/* Error Message Preview */}
                        {isError && (
                            <div className="mt-2 text-[10px] text-red-400 bg-black/30 p-1.5 rounded font-mono break-all border border-red-500/20">
                                {msg.content}
                            </div>
                        )}
                    </div>

                    {/* Expandable JSON Viewer */}
                    {isExpanded && meta.output && (
                        <div className="mt-2 ml-1 animate-in slide-in-from-top-1">
                            <div className="bg-[#080808] border border-nexus-800 rounded-lg overflow-hidden">
                                <div className="px-3 py-1 bg-nexus-900 border-b border-nexus-800 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                        <Database size={10}/> Output Data
                                    </span>
                                </div>
                                <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    <JsonTree data={meta.output} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatTestPanel: React.FC<ChatTestPanelProps> = ({ 
  isOpen, onClose, messages, onSendMessage, onClearChat, isProcessing 
}) => {
  const [input, setInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isMaximized]);

  const renderMessageGroups = () => {
      const groups: React.ReactNode[] = [];
      let currentThoughts: ChatMessage[] = [];

      // Process messages to group sequential thoughts
      messages.forEach((msg, idx) => {
          if (msg.role === 'thought') {
              currentThoughts.push(msg);
          } else if (msg.role === 'system') {
              // Flush pending thoughts
              if (currentThoughts.length > 0) {
                  groups.push(
                      <div key={`trace-${idx}`} className="mb-6 ml-2 pl-2 border-l-2 border-nexus-wire/10">
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1 pl-4">
                              <Activity size={10} className="text-nexus-wire" /> Workflow Trace
                          </div>
                          {currentThoughts.map(t => <ExecutionStep key={t.id} msg={t} />)}
                      </div>
                  );
                  currentThoughts = [];
              }
              // System Message
              groups.push(
                  <div key={msg.id} className="flex justify-center my-4">
                      <div className="bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {msg.content}
                      </div>
                  </div>
              );
          } else {
              // Flush execution steps before showing User/AI message
              if (currentThoughts.length > 0) {
                  groups.push(
                      <div key={`trace-${idx}`} className="mb-6 ml-2 pl-2 border-l-2 border-nexus-wire/10">
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1 pl-4">
                              <Activity size={10} className="text-nexus-wire" /> Workflow Trace
                          </div>
                          {currentThoughts.map(t => <ExecutionStep key={t.id} msg={t} />)}
                      </div>
                  );
                  currentThoughts = [];
              }

              const isUser = msg.role === 'user';
              
              groups.push(
                  <div key={msg.id} className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-nexus-900 border border-nexus-800 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-md">
                              <Bot size={16} className="text-nexus-accent"/>
                          </div>
                      )}
                      
                      <div className={`
                        max-w-[85%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-lg
                        ${isUser 
                            ? 'bg-nexus-accent text-nexus-950 rounded-tr-sm font-medium border border-nexus-success/50' 
                            : 'bg-nexus-900/50 text-gray-200 rounded-tl-sm border border-nexus-800'}
                      `}>
                          {/* Markdown-ish formatting */}
                          {msg.content.split('```').map((part, i) => 
                              i % 2 === 1 ? (
                                  <pre key={i} className="my-3 p-3 bg-black/50 rounded-lg text-xs font-mono overflow-x-auto text-nexus-wire border border-nexus-800 shadow-inner">
                                      {part.trim()}
                                  </pre>
                              ) : (
                                  <span key={i} className="whitespace-pre-wrap">{part}</span>
                              )
                          )}
                          
                          <div className={`text-[9px] mt-2 opacity-50 text-right font-mono flex items-center justify-end gap-1 ${isUser ? 'text-nexus-900' : 'text-gray-500'}`}>
                              <Clock size={8}/>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                      </div>

                      {isUser && (
                          <div className="w-8 h-8 rounded-full bg-nexus-900 border border-nexus-800 flex items-center justify-center ml-3 shrink-0 mt-1">
                              <User size={16} className="text-gray-400"/>
                          </div>
                      )}
                  </div>
              );
          }
      });

      // Flush remaining thoughts (e.g., if strictly processing)
      if (currentThoughts.length > 0) {
          groups.push(
              <div key="trace-final" className="mb-6 ml-2 pl-2 border-l-2 border-nexus-wire/10">
                  <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1 pl-4">
                      <Activity size={10} className="animate-pulse text-nexus-accent"/> Processing...
                  </div>
                  {currentThoughts.map(t => <ExecutionStep key={t.id} msg={t} />)}
              </div>
          );
      }

      return groups;
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className={`
        fixed bg-[#050505] border-l border-nexus-800 shadow-2xl z-[60] flex flex-col transition-all duration-300 ease-in-out font-sans
        ${isMaximized ? 'inset-0 w-full' : 'inset-y-0 right-0 w-[500px] animate-in slide-in-from-right'}
    `}>
      
      {/* Header */}
      <div className="p-4 border-b border-nexus-800 flex justify-between items-center bg-[#050505]">
        <div className="flex items-center gap-3 text-white">
          <div className="relative">
             <div className="w-10 h-10 rounded-xl bg-nexus-900 border border-nexus-800 flex items-center justify-center shadow-inner">
                <Terminal size={20} className="text-nexus-accent" />
             </div>
             {isProcessing && (
                <div className="absolute -bottom-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-nexus-success"></span>
                    </span>
                </div>
             )}
          </div>
          <div>
              <span className="font-bold block text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Live Debugger</span>
              <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 uppercase tracking-widest">
                  {isProcessing ? '● System Active' : '● Ready for Input'}
              </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-nexus-900 p-1 rounded-lg border border-nexus-800">
          <button 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="p-2 text-gray-500 hover:text-white rounded hover:bg-nexus-800 transition-colors" 
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClearChat} className="p-2 text-gray-500 hover:text-red-500 rounded hover:bg-nexus-800 transition-colors" title="Reset Session">
            <RefreshCw size={14} />
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded hover:bg-nexus-800 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 relative bg-[#050505]">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,20,20,0.8),_transparent)] pointer-events-none" />
        
        <div className="relative z-10">
            {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-600 space-y-6 opacity-60">
                <div className="w-24 h-24 bg-nexus-900 rounded-3xl flex items-center justify-center border border-nexus-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <MessageCircle size={40} className="text-gray-600" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Interactive Session</p>
                    <p className="text-xs mt-2 max-w-[240px] mx-auto leading-relaxed text-gray-600">
                        Type a message to trigger the <b>Chat Trigger</b> node. 
                        <br/>You will see the live execution path here.
                    </p>
                </div>
            </div>
            )}

            {renderMessageGroups()}

            {isProcessing && messages[messages.length - 1]?.role !== 'thought' && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 mt-4 ml-14">
                <div className="flex gap-2 items-center text-gray-500 bg-nexus-900 px-3 py-2 rounded-lg border border-nexus-800">
                    <Loader2 size={14} className="animate-spin text-nexus-accent"/>
                    <span className="text-xs font-mono">Thinking...</span>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-nexus-800 bg-[#050505] relative z-20">
        <form className="flex gap-3 items-end">
          <AutoResizeTextarea 
             value={input}
             onChange={(e: any) => setInput(e.target.value)}
             onSubmit={handleSubmit}
             disabled={isProcessing}
          />
          <button 
            onClick={handleSubmit}
            disabled={isProcessing || !input.trim()}
            className="p-3.5 bg-nexus-accent text-nexus-950 rounded-xl hover:bg-nexus-success hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,157,0.2)] mb-[1px]"
          >
            <Send size={18} fill="currentColor" className="ml-0.5" />
          </button>
        </form>
        <div className="text-[9px] text-gray-600 text-center mt-3 flex justify-between px-2 font-mono uppercase tracking-widest opacity-60">
            <span>Shift + Enter for new line</span>
            <span>Markdown + JSON supported</span>
        </div>
      </div>
    </div>
  );
};

export default ChatTestPanel;
