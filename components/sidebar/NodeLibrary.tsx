
import React, { useState } from 'react';
import { NEXUS_DEFINITIONS } from '../../constants';
import { NexusType, NexusSubtype } from '../../types';
import { Search, ChevronDown, ChevronRight, Lock, Unlock, Zap, Split, Globe, GitMerge, HardDrive, Database, Building2, Terminal, MessageCircle, Brain, LayoutGrid, X, AlertTriangle } from 'lucide-react';

interface NodeLibraryProps {
    onAddNexus: (type: NexusType, subtype: NexusSubtype) => void;
    onUpgradeClick: () => void;
    isDevMode: boolean;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onAddNexus, onUpgradeClick, isDevMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const getCategoryIcon = (cat: string) => {
        switch(cat) {
            case 'Input / Trigger': return <Zap size={14} className="text-nexus-wire"/>;
            case 'Logic / Flow control': return <Split size={14} className="text-pink-400"/>;
            case 'AI & Intelligence': return <Brain size={14} className="text-nexus-accent"/>;
            default: return <LayoutGrid size={14} className="text-gray-400"/>;
        }
    };

    const CATEGORY_ORDER = ['AI & Intelligence', 'Input / Trigger', 'Logic / Flow control'];

    const filteredDefinitions = NEXUS_DEFINITIONS.filter(def => 
        def.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        def.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedNodes = filteredDefinitions.reduce((acc, def) => {
        const cat = def.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(def);
        return acc;
    }, {} as Record<string, typeof NEXUS_DEFINITIONS>);

    const sortedCategories = Object.keys(groupedNodes).sort((a, b) => {
        const idxA = CATEGORY_ORDER.indexOf(a);
        const idxB = CATEGORY_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    const handleDragStart = (e: React.DragEvent, type: NexusType, subtype: NexusSubtype) => {
        e.dataTransfer.setData('nexus/type', type);
        e.dataTransfer.setData('nexus/subtype', subtype);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* AI Call to Action */}
            {!searchTerm && (
                <div className="m-3 p-4 bg-nexus-accent/5 border border-nexus-accent/20 rounded-xl text-center">
                    <div className="text-[10px] font-black text-nexus-accent uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                        <Brain size={12}/> AI-Native Mode
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                        Manual blocks are minimized. Use the <b>Architect</b> (✨) for best results.
                    </p>
                </div>
            )}

            {/* SEARCH BAR */}
            <div className="p-3 border-b border-nexus-800 bg-nexus-950 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search manual blocks..."
                        className="w-full bg-nexus-900 border border-nexus-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-nexus-accent outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {sortedCategories.map(cat => {
                    const nodes = groupedNodes[cat];
                    const isExpanded = expandedCategories[cat] || searchTerm.length > 0;

                    return (
                        <div key={cat} className="rounded-xl overflow-hidden border border-transparent hover:border-nexus-800 transition-colors">
                            <button 
                                onClick={() => toggleCategory(cat)}
                                className={`w-full flex items-center justify-between p-3 text-left transition-colors ${isExpanded ? 'bg-nexus-900 text-white' : 'text-gray-400 hover:bg-nexus-900/50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {getCategoryIcon(cat)}
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{cat}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-black/20 px-1.5 rounded">{nodes.length}</span>
                                    {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="bg-black/20 p-2 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                    {nodes.map(def => (
                                        <div
                                            key={def.subtype}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, def.type, def.subtype)}
                                            onClick={(e) => { e.preventDefault(); onAddNexus(def.type, def.subtype); }}
                                            className="w-full flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-nexus-800 hover:border-nexus-700 transition-all text-left cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
                                                <div className="p-1.5 bg-nexus-900 rounded-md text-nexus-accent">
                                                    <def.icon size={14} />
                                                </div>
                                                <div className="truncate">
                                                    <div className="text-xs font-bold text-gray-300">{def.label}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NodeLibrary;
