
import React, { useState, Suspense } from 'react';
import { 
  LayoutGrid, 
  Zap, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Rocket, 
  Layers, 
  CreditCard, 
  ShieldCheck, 
  Globe, 
  HelpCircle,
  Brain,
  Split,
  FileCode,
  Database,
  Workflow,
  ArrowRight,
  Crown
} from 'lucide-react';
import { Blueprint, NexusType, NexusSubtype, UserPlan, Nexus, Synapse } from '../types';
import { BLUEPRINTS } from '../data/blueprints';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../services/adminService';
import { PLAN_LIMITS } from '../constants';

const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const MarketplaceModal = React.lazy(() => import('./MarketplaceModal'));
const ReferralModal = React.lazy(() => import('./ReferralModal'));
const PricingModal = React.lazy(() => import('./PricingModal'));

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNexus: (type: NexusType, subtype: NexusSubtype, pos?: {x: number, y: number}) => void;
  onLoadBlueprint: (bp: Blueprint) => void;
  onClear: () => void; 
  onOpenSettings: () => void;
  onNavigateProjects: () => void;
  onOpenCredentials?: () => void; 
  onOpenRegistry?: () => void;
  onOpenAI?: () => void; 
  currentView: 'dashboard' | 'editor'; 
  currentStream?: { nexuses: Nexus[], synapses: Synapse[] };
  userPlan?: UserPlan | null; 
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onAddNexus, onLoadBlueprint, onClear, onOpenSettings, onNavigateProjects, onOpenCredentials, onOpenRegistry, onOpenAI, currentView, currentStream, userPlan }) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'blueprints'>('blocks');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
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

  // 🔥 REAL ROLE CHECK
  const canAccessAdmin = isAdmin(userPlan || null);

  // 🔥 CALCULATE USAGE STATS FOR WIDGET
  const currentTier = userPlan?.tier || 'FREE';
  const limits = PLAN_LIMITS[currentTier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const runsUsed = userPlan?.usage?.runs || 0;
  const runsTotal = limits.RUNS;
  const usagePercent = Math.min((runsUsed / runsTotal) * 100, 100);
  const expiryDate = userPlan?.expiresAt ? new Date(userPlan.expiresAt).toLocaleDateString() : 'Never';

  return (
    <>
      <Suspense fallback={null}>
        <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      </Suspense>
      <MarketplaceModal isOpen={isMarketplaceOpen} onClose={() => setIsMarketplaceOpen(false)} />
      <ReferralModal isOpen={isReferralOpen} onClose={() => setIsReferralOpen(false)} />
      
      {/* Pass userPlan to Dashboard for internal checks */}
      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} currentUser={userPlan} />

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-30 md:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed md:relative z-40 h-full bg-[#050505] border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out
        ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-80 md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-nexus-950/50">
          <div className="flex items-center gap-3">
            <button 
                onClick={onClose}
                className="p-2 -ml-2 text-gray-500 hover:text-white md:hidden"
            >
                <ChevronLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-nexus-accent/10 rounded-xl flex items-center justify-center border border-nexus-accent/20 shadow-[0_0_20px_rgba(0,255,157,0.1)]">
              <Zap className="text-nexus-accent" size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-black text-white text-sm tracking-widest uppercase leading-none">NexusCore</h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-wider">v2.4.0 Stable</p>
            </div>
          </div>
          <button onClick={onNavigateProjects} className="p-2 text-gray-500 hover:text-white transition-colors">
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* User Profile Area */}
        <div className="p-6 border-b border-white/5">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-nexus-accent/10 border border-nexus-accent/20 flex items-center justify-center overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="P" className="w-full h-full object-cover" /> : <Layers size={20} className="text-nexus-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate uppercase tracking-wider">{user.displayName || 'Architect'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${currentTier === 'FREE' ? 'bg-gray-500' : 'bg-nexus-accent'}`}></span>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{currentTier} ACCESS</p>
                  </div>
                </div>
                <button onClick={onOpenSettings} className="p-2 text-gray-600 hover:text-white transition-colors">
                  <Settings size={16} />
                </button>
              </div>

              {/* Usage Widget */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Monthly Quota</span>
                  <span className="text-[9px] font-black text-nexus-accent uppercase">{runsUsed} / {runsTotal}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-nexus-accent transition-all duration-1000" 
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                {currentTier === 'FREE' && (
                  <button 
                    onClick={() => setIsPricingOpen(true)}
                    className="w-full mt-3 py-2 bg-nexus-accent/10 hover:bg-nexus-accent text-nexus-accent hover:text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-nexus-accent/20"
                  >
                    Upgrade for Unlimited
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-nexus-accent transition-all shadow-lg"
            >
              {isSigningIn ? <Rocket className="animate-bounce" size={16} /> : <Globe size={16} />}
              Initialize Session
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-black/40 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'blocks' ? 'bg-white/5 text-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Components
          </button>
          <button 
            onClick={() => setActiveTab('blueprints')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'blueprints' ? 'bg-white/5 text-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Blueprints
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
            <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-nexus-accent transition-colors" />
                <input 
                    type="text"
                    placeholder="SEARCH PROTOCOLS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold text-white placeholder:text-gray-700 focus:outline-none focus:border-nexus-accent/30 transition-all uppercase tracking-widest"
                />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
          {activeTab === 'blocks' ? (
            <div className="space-y-8">
              {/* Architect AI Entry */}
              <div 
                onClick={onOpenAI}
                className="group cursor-pointer p-5 bg-gradient-to-br from-nexus-accent/20 to-transparent border border-nexus-accent/30 rounded-3xl hover:border-nexus-accent transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Brain size={60} />
                </div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-nexus-accent text-black rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)]">
                        <Sparkles size={16} />
                    </div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Architect AI</h3>
                </div>
                <p className="text-[10px] text-nexus-accent/70 font-bold leading-relaxed">Describe your logic goal and let AI build the workflow for you.</p>
                <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Launch Protocol <ArrowRight size={12} />
                </div>
              </div>

              {/* Standard Components */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <Layers size={14} className="text-gray-600" />
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Core Modules</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <BlockItem icon={<Zap size={14}/>} label="Trigger" onClick={() => onAddNexus(NexusType.TRIGGER, NexusSubtype.WEBHOOK)} />
                    <BlockItem icon={<Brain size={14}/>} label="AI Agent" onClick={() => onAddNexus(NexusType.ACTION, NexusSubtype.AI_AGENT)} />
                    <BlockItem icon={<Split size={14}/>} label="Router" onClick={() => onAddNexus(NexusType.LOGIC, NexusSubtype.ROUTER)} />
                    <BlockItem icon={<Database size={14}/>} label="Storage" onClick={() => onAddNexus(NexusType.ACTION, NexusSubtype.DB_OPERATION)} />
                    <BlockItem icon={<FileCode size={14}/>} label="Script" onClick={() => onAddNexus(NexusType.ACTION, NexusSubtype.CUSTOM_JS)} />
                    <BlockItem icon={<Workflow size={14}/>} label="Loop" onClick={() => onAddNexus(NexusType.LOGIC, NexusSubtype.LOOP)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedBlueprints).map(([category, blueprints]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    {getCategoryIcon(category)}
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{category}</h4>
                  </div>
                  <div className="space-y-3">
                    {blueprints.map(bp => (
                      <div 
                        key={bp.id}
                        onClick={() => onLoadBlueprint(bp)}
                        className="group cursor-pointer p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                            <h5 className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-nexus-accent transition-colors">{bp.title}</h5>
                            {bp.isPremium && <Crown size={12} className="text-yellow-500" />}
                        </div>
                        <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{bp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-black/40 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onOpenRegistry}
                className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
                Registry
            </button>
            <button 
                onClick={onOpenCredentials}
                className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
                Vault
            </button>
          </div>
          
          <button 
            onClick={onClear}
            className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20"
          >
            Purge Workspace
          </button>

          {canAccessAdmin && (
            <button 
                onClick={() => setIsAdminOpen(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
                <ShieldCheck size={14} /> System Admin
            </button>
          )}
        </div>
      </div>
    </>
  );
};

const BlockItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <div 
        onClick={onClick}
        className="cursor-pointer p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-nexus-wire hover:bg-white/[0.04] transition-all group"
    >
        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center mb-3 text-gray-500 group-hover:text-nexus-wire group-hover:bg-nexus-wire/10 transition-all">
            {icon}
        </div>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
    </div>
);

export default Sidebar;
