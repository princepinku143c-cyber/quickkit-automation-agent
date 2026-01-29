
import React, { useState } from 'react';
import { NEXUS_DEFINITIONS } from '../constants';
import { X, Search, Zap, Brain, Split, Globe, Database, Wrench, Box } from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const PILLARS: Record<string, { label: string; icon: any; color: string; categories: string[] }> = {
    'TRIGGERS': { label: 'Input & Triggers', icon: Zap, color: 'text-nexus-wire', categories: ['Input / Trigger'] },
    'AI': { label: 'AI & Intelligence', icon: Brain, color: 'text-nexus-accent', categories: ['AI & Intelligence'] },
    'LOGIC': { label: 'Logic & Flow', icon: Split, color: 'text-purple-400', categories: ['Logic / Flow control', 'Data Processing'] },
    'CONNECT': { label: 'Connectivity', icon: Globe, color: 'text-blue-400', categories: ['HTTP / API', 'Email / Chat', 'Social Media'] },
    'DATA': { label: 'Data & Storage', icon: Database, color: 'text-green-400', categories: ['Databases', 'Files / Storage', 'Business Ops & CRM'] },
    'OPS': { label: 'DevOps & Utils', icon: Wrench, color: 'text-red-400', categories: ['Dev / Ops'] }
  };

  const getPillarForDef = (def: any) => {
      const cat = def.category;
      for (const [key, pillar] of Object.entries(PILLARS)) {
          if (pillar.categories.includes(cat)) return key;
      }
      return 'OPS';
  };

  const filteredDefs = NEXUS_DEFINITIONS.filter(def => 
      def.label.toLowerCase().includes(search.toLowerCase()) || 
      def.subtype.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[90vh] bg-[#0a0a0a] border border-nexus-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-nexus-800 bg-nexus-950 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                    <Box size={24} className="text-nexus-accent" />
                    System Capabilities Map
                </h2>
            </div>
            <div className="flex items-center gap-4">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-nexus-900 border border-nexus-800 rounded-xl px-4 py-2 text-sm text-white" />
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(PILLARS).map(([key, pillar]) => {
                    const nodes = filteredDefs.filter(def => getPillarForDef(def) === key);
                    if (nodes.length === 0) return null;
                    return (
                        <div key={key} className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-nexus-800/50">
                                <pillar.icon size={20} className={pillar.color} />
                                <h3 className="text-lg font-bold text-gray-200 uppercase">{pillar.label}</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {nodes.map(def => (
                                    <div key={def.subtype} className="bg-nexus-900/20 p-4 rounded-xl border border-nexus-800/50 flex items-center gap-3">
                                        <def.icon size={18} className={pillar.color} />
                                        <span className="text-sm font-bold text-gray-200">{def.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;
