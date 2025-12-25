
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, X, Bot, User, Trash2, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface ChatTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  isProcessing: boolean;
}

const ChatTestPanel: React.FC<ChatTestPanelProps> = ({ 
  isOpen, onClose, messages, onSendMessage, onClearChat, isProcessing 
}) => {
  const [input, setInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isMaximized]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className={`
        fixed bg-nexus-900 border-l border-nexus-700 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out
        ${isMaximized ? 'inset-0 w-full' : 'inset-y-0 right-0 w-96 animate-in slide-in-from-right'}
    `}>
      
      {/* Header */}
      <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-950">
        <div className="flex items-center gap-3 text-white">
          <div className="w-2 h-2 rounded-full bg-nexus-success animate-pulse shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
          <div>
              <span className="font-display font-bold block leading-none">
                  {isMaximized ? 'Personal Agent Interface' : 'Test Chat'}
              </span>
              {isMaximized && <span className="text-[10px] text-gray-500 font-mono">Live Session</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="p-2 text-gray-500 hover:text-nexus-accent rounded hover:bg-nexus-800 transition-colors" 
            title={isMaximized ? "Minimize" : "Maximize (Personal App Mode)"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClearChat} className="p-2 text-gray-500 hover:text-white rounded hover:bg-nexus-800" title="Clear History">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded hover:bg-nexus-800">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505] ${isMaximized ? 'px-[20%] pt-10' : ''}`}>
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs mt-10 p-4 border border-dashed border-nexus-800 rounded max-w-xs mx-auto">
            <Bot className="mx-auto mb-2 opacity-50" size={32} />
            <p className="font-bold text-gray-400">Ready to chat.</p>
            <p>Type a message below to interact with your workflow.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-nexus-800 flex items-center justify-center flex-shrink-0 border border-nexus-700 shadow-lg mt-1">
                <Bot size={18} className="text-nexus-accent" />
              </div>
            )}
            
            <div className={`
              max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-nexus-700 text-white rounded-tr-sm' 
                : 'bg-nexus-900 border border-nexus-800 text-gray-200 rounded-tl-sm'}
            `}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-nexus-800 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-lg bg-nexus-800 flex items-center justify-center border border-nexus-700">
                <RefreshCw size={14} className="text-nexus-accent animate-spin" />
              </div>
              <div className="bg-nexus-900 border border-nexus-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-nexus-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-nexus-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-nexus-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-nexus-800 bg-nexus-900 ${isMaximized ? 'px-[20%] pb-8' : ''}`}>
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isMaximized ? "Ask your personal agent..." : "Type a message..."}
            className="flex-1 bg-nexus-950 border border-nexus-700 rounded-xl px-4 py-3.5 text-sm text-white focus:border-nexus-accent focus:outline-none focus:ring-1 focus:ring-nexus-accent/50 transition-all shadow-inner"
            autoFocus={isMaximized}
          />
          <button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="p-3.5 bg-nexus-accent text-nexus-950 rounded-xl hover:bg-nexus-success transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-[0_0_10px_rgba(0,255,157,0.2)]"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatTestPanel;
