
import React, { useState, useEffect, useRef } from 'react';
import { NEXUS_DEFINITIONS, BLUEPRINTS } from '../constants';
import { NexusSubtype, NexusType, Blueprint, Nexus, Synapse } from '../types';
import { Layers, FileJson, ArrowRight, Flame, Globe, Brain, TrendingUp, Building2, Save, Trash, History, X, Download, Upload, LogIn, LogOut, User, Settings, Cloud, CloudRain, Loader2, Crown, Lock, Activity, LayoutGrid, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveBlueprintToCloud, getUserBlueprints, deleteBlueprintFromCloud } from '../services/cloudStore';
import PricingModal from './PricingModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNexus: (type: NexusType, subtype: NexusSubtype) => void;
  onLoadBlueprint: (bp: Blueprint) => void;
  onClear: () => void; 
  onOpenSettings: () => void;
  onNavigateProjects: () => void;
  currentView: 'dashboard' | 'editor';
  currentStream?: { nexuses: Nexus[], synapses: Synapse[] };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onAddNexus, onLoadBlueprint, onClear, onOpenSettings, onNavigateProjects, currentView, currentStream }) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'blueprints' | 'history'>('blocks');
  const [savedStreams, setSavedStreams] = useState<Blueprint[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signInWithGoogle, logout } = useAuth();

  useEffect(() => {
    const loadSaves = async () => {
        if (activeTab === 'history') {
            if (user) {
                const cloudSaves = await getUserBlueprints(user.uid);
                setSavedStreams(cloudSaves);
            } else {
                const loaded = JSON.parse(localStorage.getItem('nexus_saved_streams') || '[]');
                setSavedStreams(loaded);
            }
        }
    };
    loadSaves();
  }, [activeTab, user]);

  return (
    <>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <input type="file" ref={fileInputRef} className="hidden" />

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
        <div className="p-3 border-b border-nexus-800 grid grid-cols-2 gap-2">
            <button 
                onClick={onNavigateProjects}
                className={`p-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all ${currentView === 'dashboard' ? 'bg-nexus-accent text-black' : 'bg-nexus-800 text-gray-400 hover:text-white'}`}
            >
                <LayoutGrid size={14} /> Projects
            </button>
            <button 
                 disabled={currentView === 'dashboard'} // Can't go to editor without selecting project (handled by parent usually)
                 className={`p-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all ${currentView === 'editor' ? 'bg-nexus-wire text-black' : 'bg-nexus-950 text-gray-600 cursor-not-allowed'}`}
            >
                <Layers size={14} /> Editor
            </button>
        </div>

        {/* Editor Content (Only if in Editor Mode) */}
        {currentView === 'editor' ? (
        <>
            {/* Tabs */}
            <div className="flex border-b border-nexus-800 mt-2">
                <button onClick={() => setActiveTab('blocks')} className={`flex-1 p-3 text-[10px] font-bold flex items-center justify-center gap-1 ${activeTab === 'blocks' ? 'bg-nexus-800 text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>BLOCKS</button>
                <button onClick={() => setActiveTab('blueprints')} className={`flex-1 p-3 text-[10px] font-bold flex items-center justify-center gap-1 ${activeTab === 'blueprints' ? 'bg-nexus-800 text-nexus-accent border-b-2 border-nexus-accent' : 'text-gray-500'}`}>TEMPLATES</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {activeTab === 'blocks' && (
                    <div className="space-y-4">
                        {['TRIGGER', 'ACTION', 'LOGIC'].map(type => (
                            <div key={type}>
                                <h3 className="text-[10px] font-bold text-nexus-500 uppercase tracking-widest mb-2 px-1">{type}s</h3>
                                <div className="space-y-1.5">
                                    {NEXUS_DEFINITIONS.filter(d => d.type === type).map(def => (
                                        <button
                                            key={def.subtype}
                                            onClick={() => def.isPremium ? setIsPricingOpen(true) : onAddNexus(def.type, def.subtype)}
                                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left group relative ${def.isPremium ? 'bg-nexus-950/50 border-nexus-800/50 opacity-60 grayscale' : 'bg-nexus-800/50 hover:bg-nexus-700/50 border-transparent hover:border-nexus-accent/30'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-1.5 rounded bg-nexus-900 ${def.isPremium ? 'text-gray-600' : 'text-nexus-accent'}`}>
                                                    <def.icon size={16} />
                                                </div>
                                                <div className="truncate">
                                                    <div className="text-xs font-bold text-gray-200">{def.label}</div>
                                                    <div className="text-[9px] text-gray-500 truncate">{def.description}</div>
                                                </div>
                                            </div>
                                            {def.isPremium && <Lock size={12} className="text-nexus-wire flex-shrink-0 ml-2" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {activeTab === 'blueprints' && (
                    <div className="space-y-4">
                        {BLUEPRINTS.map(bp => (
                            <div key={bp.id} className="p-4 rounded-xl bg-nexus-800/50 border border-nexus-700">
                                 <h4 className="font-bold text-xs text-white mb-1">{bp.name}</h4>
                                 <p className="text-[10px] text-gray-500 mb-3">{bp.description}</p>
                                 <button onClick={() => onLoadBlueprint(bp)} className="w-full py-2 bg-nexus-900 hover:bg-nexus-accent hover:text-black border border-nexus-700 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1">
                                    Load Template <ArrowRight size={10} />
                                 </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
        ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-nexus-800 rounded-full flex items-center justify-center">
                    <LayoutGrid size={32} className="text-nexus-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-300">Project Dashboard</h3>
                    <p className="text-xs text-gray-500 mt-2">Select or create a project to open the editor tools.</p>
                </div>
             </div>
        )}

        {/* User Profile / Status */}
        <div className="p-4 border-t border-nexus-800 bg-nexus-950">
             {user ? (
                 <div className="flex items-center gap-3">
                     {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full border border-nexus-700" alt=""/> : <div className="w-8 h-8 rounded-full bg-nexus-800 flex items-center justify-center"><User size={14}/></div>}
                     <div className="flex-1 overflow-hidden">
                         <div className="text-xs font-bold text-white truncate">{user.displayName}</div>
                         <div className="text-[9px] text-gray-500 truncate">{user.email}</div>
                     </div>
                     <button onClick={logout} className="p-1.5 hover:bg-red-900/30 text-gray-500 hover:text-red-500 rounded"><LogOut size={14}/></button>
                 </div>
             ) : (
                 <button onClick={signInWithGoogle} className="w-full py-2 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2">
                     <LogIn size={14}/> Sign In
                 </button>
             )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
