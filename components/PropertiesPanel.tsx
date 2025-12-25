
import React, { useState } from 'react';
import { Nexus, NexusSubtype, NexusType } from '../types';
import { X, Trash2, Brain, FileText, CheckCircle, Key, Plus, Network, Globe, Clock, Split, Database, Search, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface PropertiesPanelProps {
  nexus: Nexus | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Nexus>) => void;
  onDelete: (id: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nexus, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'tools' | 'outputs'>('config');

  if (!nexus) return null;

  const handleChange = (key: string, value: any) => {
    onUpdate(nexus.id, { config: { ...nexus.config, [key]: value } });
  };

  const toggleTool = (toolId: string) => {
      const current = nexus.config.enabledTools || [];
      const updated = current.includes(toolId) ? current.filter(t => t !== toolId) : [...current, toolId];
      handleChange('enabledTools', updated);
  };

  const isSheets = nexus.subtype === NexusSubtype.SHEETS_READ || nexus.subtype === NexusSubtype.SHEETS_WRITE;
  const isAgent = nexus.subtype === NexusSubtype.AGENT;

  return (
    <div className="w-full md:w-80 bg-nexus-900 border-l border-nexus-800 flex flex-col h-full z-20 shadow-xl absolute right-0 top-0 bottom-0 animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-nexus-800 flex items-center justify-between bg-nexus-950">
        <h2 className="font-display font-semibold text-white flex items-center gap-2 truncate">
           {isAgent && <Brain size={16} className="text-nexus-accent" />}
           {isSheets && <Database size={16} className="text-nexus-wire" />}
           {nexus.label}
        </h2>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X size={20} /></button>
      </div>

      <div className="flex border-b border-nexus-800 bg-nexus-950">
          <button onClick={() => setActiveTab('config')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${activeTab === 'config' ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>Config</button>
          {isAgent && <button onClick={() => setActiveTab('tools')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${activeTab === 'tools' ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>Tools (AI)</button>}
          <button onClick={() => setActiveTab('outputs')} className={`flex-1 py-3 text-[10px] font-bold uppercase ${activeTab === 'outputs' ? 'text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>Ports</button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto pb-20 space-y-5">
        {activeTab === 'config' && (
            <>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">Label</label>
                    <input type="text" value={nexus.label} onChange={(e) => onUpdate(nexus.id, { label: e.target.value })} className="w-full bg-nexus-800 border border-nexus-700 rounded p-3 text-sm text-white" />
                </div>

                {isSheets && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-nexus-wire mb-1 uppercase">Spreadsheet ID</label>
                            <input type="text" value={nexus.config.sheetId || ''} onChange={(e) => handleChange('sheetId', e.target.value)} placeholder="1A2B3C..." className="w-full bg-nexus-800 border border-nexus-700 rounded p-3 text-xs text-white font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Range</label>
                            <input type="text" value={nexus.config.range || ''} onChange={(e) => handleChange('range', e.target.value)} placeholder="Sheet1!A1:B10" className="w-full bg-nexus-800 border border-nexus-700 rounded p-3 text-xs text-white font-mono" />
                        </div>
                    </>
                )}

                {isAgent && (
                    <div>
                        <label className="block text-xs font-bold text-nexus-accent mb-1 uppercase">System Instructions</label>
                        <textarea value={nexus.config.systemMessage || ''} onChange={(e) => handleChange('systemMessage', e.target.value)} className="w-full h-32 bg-nexus-800 border border-nexus-700 rounded p-3 text-xs text-white" />
                    </div>
                )}
            </>
        )}

        {activeTab === 'tools' && isAgent && (
            <div className="space-y-3">
                <p className="text-[10px] text-gray-500 mb-4">Select tools this agent can use autonomously:</p>
                {[
                    { id: 'web_search', label: 'Google Search Grounding', icon: Search },
                    { id: 'sheets_read', label: 'Google Sheets Reader', icon: ArrowDownToLine },
                    { id: 'sheets_write', label: 'Google Sheets Writer', icon: ArrowUpFromLine },
                ].map(tool => (
                    <button 
                        key={tool.id} 
                        onClick={() => toggleTool(tool.id)}
                        className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${nexus.config.enabledTools?.includes(tool.id) ? 'bg-nexus-accent/10 border-nexus-accent text-nexus-accent' : 'bg-nexus-800 border-nexus-700 text-gray-400'}`}
                    >
                        <tool.icon size={16} />
                        <span className="text-xs font-bold">{tool.label}</span>
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="p-4 border-t border-nexus-800 bg-nexus-950">
        <button onClick={() => onDelete(nexus.id)} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-950/30 border border-red-900/50 rounded-xl transition-all font-bold text-xs uppercase">
          <Trash2 size={14} /> Delete Block
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
