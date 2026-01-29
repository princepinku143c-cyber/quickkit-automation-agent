
import React, { useState, useEffect, useRef } from 'react';
import { BLUEPRINTS } from '../data/blueprints'; 
import { NexusSubtype, NexusType, Blueprint, Nexus, Synapse } from '../types';
import { Layers, ArrowRight, Zap, Building2, Globe, Brain, Split, GitMerge, HardDrive, Database, Terminal, MessageCircle, LayoutGrid, User, Key, LogIn, LogOut, Loader2, Crown, ShieldCheck, Search, X, Box, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBlueprints } from '../services/cloudStore';
import PricingModal from './PricingModal';
import MarketplaceModal from './MarketplaceModal'; 
import NodeLibrary from './sidebar/NodeLibrary'; 

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNexus: (type: NexusType, subtype: NexusSubtype) => void;
  onLoadBlueprint: (bp: Blueprint) => void;
  onClear: () => void; 
  onOpenSettings: () => void;
  onNavigateProjects: () => void;
  onOpenCredentials?: () => void; 
  onOpenRegistry?: () => void;
  currentView: 'dashboard' | 'editor'; 
  currentStream?: { nexuses: Nexus[], synapses: Synapse[] };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onAddNexus, onLoadBlueprint, onClear, onOpenSettings, onNavigateProjects, onOpenCredentials, onOpenRegistry, currentView, currentStream }) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'blueprints'>('blocks');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 

  const { user, signInWithGoogle, logout } = useAuth();

  const handleLogin = async () => {
      if (isSigningIn) return;
      setIsSigningIn(true);
      try { await signInWithGoogle(); } 
      catch (error) { console.error("Login trigger failed", error); } 
      finally { setIsSigningIn(false); }
  };

  const groupedBlueprints = BLUEPRINTS.reduce((acc, bp) => {
      const cat = bp.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(bp);
      return acc;
  }, {} as Record<string, Blueprint[]>);

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'Simple Start': return <Zap size={14} className="text-green-400"/>; 
          case 'Input / Trigger': return <Zap size={14} className="text-nexus-wire"/>;
          case 'Logic / Flow control': return <Split size={14} className="text-pink-400"/>;
          case 'AI & Intelligence': return <Brain size={14} className="text-nexus-accent"/>;
          default: return <LayoutGrid size={14} className="text-gray-400"/>;
      }
  };

  return (
    <>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <MarketplaceModal isOpen={isMarketplaceOpen} onClose={() => setIsMarketplaceOpen(false)} />

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-30 md:hidden" onClick={onClose} />
      )}

      <div className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-nexus-900 border-r border-nexus-800 flex flex-col h-full shadow-xl transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex
      `}>
        {/* Header */}
        <div className="p-4 border-b border-nexus-800 flex justify-between items-center bg-nexus-950">
            <h1 className="font-display font-bold text-xl text-white tracking-wide">
                <span className="text-nexus-accent">Nexus</span>Stream
            </h1>
            <button onClick={() => setIsPricingOpen(true)} className="p-1.5 bg-nexus-accent/10 border border-nexus-accent/30 rounded-lg group animate-pulse">
                <Crown size={16} className="text-nexus-accent group-hover:scale-110 transition-transform" />
            </button>
        </div>

        {/* Global Navigation */}
        <div className="p-3 border-b border-nexus-800 grid grid-cols-2 gap-1">
            <button 
                onClick={onNavigateProjects}
                className={`p-2 rounded-lg text-[9px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all ${currentView === 'dashboard' ? 'bg-nexus-accent text-black' : 'bg-nexus-800 text-gray-400 hover:text-white'}`}
            >
                <LayoutGrid size={14} /> Projects
            </button>
            <button 
                 disabled={currentView === 'dashboard'} 
                 className={`p-2 rounded-lg text-[9px] font-bold uppercase flex flex-col items-center justify-center gap-1 transition-all ${currentView === 'editor' ? 'bg-nexus-wire text-black' : 'bg-nexus-950 text-gray-600 cursor-not-allowed'}`}
            >
                <Layers size={14} /> Editor
            </button>
        </div>

        {/* Credentials & Marketplace Row */}
        <div className="px-3 py-2 border-b border-nexus-800 grid grid-cols-3 gap-2">
             <button 
                onClick={onOpenCredentials}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-nexus-900 hover:bg-nexus-800 text-[8px] font-black text-gray-400 hover:text-white transition-colors uppercase"
             >
                 <Key size={12}/> Secrets
             </button>
             <button 
                onClick={() => setIsMarketplaceOpen(true)}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-nexus-900 hover:bg-nexus-800 text-[8px] font-black text-nexus-accent border border-nexus-800 hover:border-nexus-accent transition-colors uppercase"
             >
                 <Box size={12}/> Market
             </button>
             <button 
                onClick={onOpenRegistry}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-nexus-900 hover:bg-nexus-800 text-[8px] font-black text-blue-400 hover:text-white transition-colors uppercase"
             >
                 <Cpu size={12}/> Kernel
             </button>
        </div>

        {/* Editor Content */}
        {currentView === 'editor' ? (
        <>
            <div className="flex border-b border-nexus-800 mt-2">
                <button onClick={() => setActiveTab('blocks')} className={`flex-1 p-3 text-[10px] font-bold flex items-center justify-center gap-1 ${activeTab === 'blocks' ? 'bg-nexus-800 text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>BLOCKS</button>
                <button onClick={() => setActiveTab('blueprints')} className={`flex-1 p-3 text-[10px] font-bold flex items-center justify-center gap-1 ${activeTab === 'blueprints' ? 'bg-nexus-800 text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>TEMPLATES</button>
            </div>

            {activeTab === 'blocks' && (
                <NodeLibrary 
                    onAddNexus={onAddNexus} 
                    onUpgradeClick={() => setIsPricingOpen(true)} 
                    isDevMode={false} 
                />
            )}
                
            {activeTab === 'blueprints' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full bg-nexus-900 border border-nexus-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-nexus-accent outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        {groupedBlueprints['Simple Start'] && (
                            <div key="Simple Start">
                                <h3 className="text-[10px] font-bold text-nexus-success uppercase tracking-widest mb-2 flex items-center gap-2 px-2">
                                    <Zap size={14} /> Quick Starters
                                </h3>
                                <div className="space-y-2">
                                    {groupedBlueprints['Simple Start'].map(bp => (
                                        <div key={bp.id} className="p-3 rounded-xl bg-nexus-success/10 border border-nexus-success/30 group hover:border-nexus-success/50 transition-all cursor-pointer" onClick={() => onLoadBlueprint(bp)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-xs text-white">{bp.name}</h4>
                                                <ArrowRight size={12} className="text-nexus-success"/>
                                            </div>
                                            <p className="text-[10px] text-gray-400 line-clamp-2">{bp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Object.entries(groupedBlueprints).map(([category, blueprints]) => {
                            if (category === 'Simple Start') return null; 
                            const visibleBps = blueprints.filter(bp => bp.name.toLowerCase().includes(searchTerm.toLowerCase()));
                            if (visibleBps.length === 0) return null;

                            return (
                                <div key={category}>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-2">
                                        {getCategoryIcon(category)} {category}
                                    </h3>
                                    <div className="space-y-2">
                                        {visibleBps.map(bp => (
                                            <div key={bp.id} className="p-3 rounded-xl bg-nexus-800/30 border border-nexus-800 group hover:border-nexus-500 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-xs text-white leading-tight">{bp.name}</h4>
                                                    <span className="text-[9px] bg-nexus-900 text-gray-500 px-1.5 py-0.5 rounded border border-nexus-800">{bp.nexuses.length} Nodes</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mb-3 line-clamp-2 leading-relaxed">{bp.description}</p>
                                                <button onClick={() => onLoadBlueprint(bp)} className="w-full py-1.5 bg-nexus-900 group-hover:bg-nexus-accent group-hover:text-black border border-nexus-700 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1">
                                                    Deploy <ArrowRight size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
        ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-nexus-800 rounded-full flex items-center justify-center">
                    <LayoutGrid size={32} className="text-nexus-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-300">Project Dashboard</h3>
                    <p className="text-xs text-gray-500 mt-2">Manage your automation workflows here.</p>
                </div>
             </div>
        )}

        {/* User Profile / Status */}
        <div className="p-4 border-t border-nexus-800 bg-nexus-950">
             {user ? (
                 <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-3">
                         {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full border border-nexus-700" alt=""/> : <div className="w-8 h-8 rounded-full bg-nexus-800 flex items-center justify-center"><User size={14}/></div>}
                         <div className="flex-1 overflow-hidden">
                             <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                                 {user.displayName}
                             </div>
                             <div className="text-[9px] text-gray-500 truncate">{user.email}</div>
                         </div>
                         
                         <button onClick={logout} className="p-1.5 hover:bg-red-900/30 text-gray-500 hover:text-red-500 rounded"><LogOut size={14}/></button>
                     </div>
                     <div className="flex justify-between items-center bg-nexus-900/50 p-2 rounded-lg border border-nexus-800">
                         <span className="text-[9px] font-mono text-gray-500 uppercase">Current Plan</span>
                         <span className="text-[9px] bg-green-900/30 text-green-400 border border-green-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                             <ShieldCheck size={10}/> Free Tier
                         </span>
                     </div>
                 </div>
             ) : (
                 <div className="space-y-2">
                     <button 
                        onClick={handleLogin} 
                        disabled={isSigningIn}
                        className="w-full py-3 bg-nexus-accent text-black rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-nexus-success transition-all shadow-lg"
                    >
                         {isSigningIn ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14}/>} 
                         {isSigningIn ? "Connecting..." : "Sign In with Google"}
                     </button>
                 </div>
             )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
