
import React, { useState } from 'react';
import { NEXUS_DEFINITIONS } from '../../constants';
import { NexusType, NexusSubtype } from '../../types';
import { Search, ChevronDown, ChevronRight, Lock, Unlock, Zap, Split, Globe, GitMerge, HardDrive, Database, Building2, Terminal, MessageCircle, Brain, LayoutGrid, X } from 'lucide-react';

interface NodeLibraryProps {
    onAddNexus: (type: NexusType, subtype: NexusSubtype) => void;
    onUpgradeClick: () => void;
    isDevMode: boolean;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onAddNexus, onUpgradeClick, isDevMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Input / Trigger': true, 
        'AI & Intelligence': true 
    });

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const getCategoryIcon = (cat: string) => {
        switch(cat) {
            case 'Input / Trigger': return <Zap size={14} className="text-nexus-wire"/>;
            case 'Logic / Flow control': return <Split size={14} className="text-pink-400"/>;
            case 'HTTP / API': return <Globe size={14} className="text-blue-400"/>;
            case 'Data Processing': return <GitMerge size={14} className="text-purple-400"/>;
            case 'Files / Storage': return <HardDrive size={14} className="text-orange-400"/>;
            case 'Databases': return <Database size={14} className="text-green-400"/>;
            case 'Business Ops & CRM': return <Building2 size={14} className="text-cyan-400"/>;
            case 'Dev / Ops': return <Terminal size={14} className="text-red-400"/>;
            case 'Email / Chat': return <MessageCircle size={14} className="text-indigo-400"/>;
            case 'AI & Intelligence': return <Brain size={14} className="text-nexus-accent"/>;
            default: return <LayoutGrid size={14} className="text-gray-400"/>;
        }
    };

    const CATEGORY_ORDER = [
        'Input / Trigger', 'Logic / Flow control', 'AI & Intelligence', 'HTTP / API', 
        'Data Processing', 'Business Ops & CRM', 'Dev / Ops', 'Files / Storage', 
        'Databases', 'Email / Chat', 
    ];

    const filteredDefinitions = NEXUS_DEFINITIONS.filter(def => 
        def.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        def.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.subtype.toLowerCase().includes(searchTerm.toLowerCase())
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

    const isLocked = (def: any) => def.isPremium && !isDevMode;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* SEARCH BAR */}
            <div className="p-3 border-b border-nexus-800 bg-nexus-950 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search nodes..."
                        className="w-full bg-nexus-900 border border-nexus-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-nexus-accent outline-none"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                            <X size={12}/>
                        </button>
                    )}
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
                                    {nodes.map(def => {
                                        const locked = isLocked(def);
                                        return (
                                            <button
                                                key={def.subtype}
                                                onClick={() => locked ? onUpgradeClick() : onAddNexus(def.type, def.subtype)}
                                                className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left group relative ${locked ? 'bg-nexus-950/30 border-nexus-800/30 opacity-60' : 'bg-transparent hover:bg-nexus-800 border-transparent hover:border-nexus-700'}`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`p-1.5 rounded-md ${locked ? 'bg-nexus-950 text-gray-600' : 'bg-nexus-900 text-nexus-accent'}`}>
                                                        <def.icon size={14} />
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{def.label}</div>
                                                    </div>
                                                </div>
                                                {def.isPremium && (
                                                    <div className="ml-2">
                                                        {locked ? (
                                                            <Lock size={10} className="text-nexus-wire flex-shrink-0" />
                                                        ) : (
                                                            <Unlock size={10} className="text-nexus-success flex-shrink-0" />
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {sortedCategories.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Search size={24} className="mx-auto mb-2 opacity-50"/>
                        <p className="text-xs">No nodes match "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodeLibrary;
