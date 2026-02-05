
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import AIAssistant from './components/AIAssistant';
import RunModal from './components/RunModal';
import NodeRegistry from './components/NodeRegistry';
import RoadmapModal from './components/RoadmapModal';
import ProjectList from './components/ProjectList';
import NexusMascot from './components/NexusMascot';
import CredentialManager from './components/CredentialManager';
import PricingModal from './components/PricingModal';
import OnboardingModal from './components/OnboardingModal'; 
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage'; 
import VideoModal from './components/VideoModal';
import { SettingsModal } from './components/SettingsModal';
import { Nexus, Synapse, Project, ExecutionState, NexusType, NexusSubtype, PlanTier, UserPlan } from './types';
import { Play, Cloud, ShieldCheck, Info, Activity, AlertCircle, CheckCircle2, Save, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { subscribeToProjects, updateProject, createProject, deleteProject } from './services/projectService';
import { listPromos } from './services/adminService'; 
import { getUserProfile, updateUserProfile } from './services/userService'; 
import { canAddNode } from './services/usageGuard'; // 🔥 NEW
import { DEFAULT_NODE_SETTINGS, PLAN_LIMITS } from './constants';

// --- DATA SANITIZATION UTILITIES ---
const sanitizeNodes = (nodes: any[]): Nexus[] => {
    if (!Array.isArray(nodes)) return [];
    
    const seenIds = new Set<string>();
    const timestamp = Date.now();

    return nodes.map((n, i) => {
        let id = n.id;
        if (!id || seenIds.has(id)) {
            id = `gen_node_${timestamp}_${i}_${Math.random().toString(36).substr(2, 5)}`;
        }
        seenIds.add(id);

        let posX = Number.isFinite(n.position?.x) ? n.position.x : 0;
        let posY = Number.isFinite(n.position?.y) ? n.position.y : 0;

        return {
            id: id,
            type: n.type || NexusType.ACTION,
            subtype: n.subtype || NexusSubtype.NO_OP,
            label: n.label || 'Untitled Node',
            position: { x: posX, y: posY },
            config: n.config || {},
            settings: n.settings || DEFAULT_NODE_SETTINGS,
            status: 'idle' as const
        };
    }).filter(n => n);
};

const sanitizeSynapses = (synapses: any[], validNodeIds: Set<string>): Synapse[] => {
    if (!Array.isArray(synapses)) return [];
    const seenConnections = new Set<string>();

    return synapses.filter(s => {
        if (!s.sourceId || !s.targetId) return false;
        if (!validNodeIds.has(s.sourceId) || !validNodeIds.has(s.targetId)) return false;
        const key = `${s.sourceId}-${s.targetId}`;
        if (seenConnections.has(key)) return false;
        seenConnections.add(key);
        return true;
    }).map((s, i) => ({
        id: s.id || `syn-${Date.now()}-${i}`,
        sourceId: s.sourceId,
        targetId: s.targetId,
        sourceHandle: s.sourceHandle || 'default'
    }));
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // ROUTING STATE: 'landing' | 'auth' | 'app'
  const [appRoute, setAppRoute] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // CORE STATE
  const [nexuses, setNexuses] = useState<Nexus[]>([]);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [userPlan, setUserPlan] = useState<PlanTier>('FREE');
  const [fullPlan, setFullPlan] = useState<UserPlan | null>(null); 
  
  // UI TOGGLES
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isCredentialManagerOpen, setIsCredentialManagerOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  
  // DEMO STATE
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const [syncStatus, setSyncStatus] = useState<'synced' | 'dirty' | 'saving'>('synced');
  const [interruptedState, setInterruptedState] = useState<ExecutionState | null>(null);
  const lastSaveRef = useRef<number>(0);

  // --- 1. AUTH & ROUTING SYNC ---
  useEffect(() => {
      if (user) {
          setAppRoute('app');
          // Fetch Real Profile from Firestore
          getUserProfile(user.uid).then((profile) => {
              if (profile) {
                  setFullPlan(profile);
                  setUserPlan(profile.tier);
                  
                  // Handle Onboarding based on DB flag
                  if (!profile.onboardingDone) {
                      setIsOnboardingOpen(true);
                  }
              }
          });
          listPromos(); 
      } else {
          if (appRoute === 'app') setAppRoute('landing');
      }
  }, [user]);

  const handleNavigate = (route: 'signup' | 'login') => {
      setAuthMode(route);
      setAppRoute('auth');
  };

  const handleBackToLanding = () => {
      setAppRoute('landing');
  };

  const completeOnboarding = async () => {
      if (user) {
          await updateUserProfile(user.uid, { onboardingDone: true });
          // Update local state to prevent flicker
          if (fullPlan) setFullPlan({ ...fullPlan, onboardingDone: true });
      }
      setIsOnboardingOpen(false);
  };

  // Rehydrate Plan from LocalStorage on mount (fallback until DB loads)
  useEffect(() => {
    const storedPlan = localStorage.getItem('nexus_user_plan');
    if (storedPlan && !fullPlan) {
        setUserPlan(storedPlan as PlanTier);
    }

    const saved = localStorage.getItem('nexus_interrupted_execution');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.status === 'RUNNING') setInterruptedState(state);
      } catch (e) {}
    }
  }, []); // Run once

  // --- RENDER GATES ---
  if (!user && appRoute === 'landing') {
      return (
        <>
            <LandingPage onNavigate={handleNavigate} onDemo={() => setIsDemoOpen(true)} />
            <VideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
        </>
      );
  }

  if (!user && appRoute === 'auth') {
      return <AuthPage view={authMode} onBack={handleBackToLanding} />;
  }

  // APP LOGIC BELOW (Only rendered if user is logged in)

  const handleUpgrade = (newPlan: any) => {
      // Optimistic Update
      setUserPlan(newPlan.tier);
      setFullPlan(newPlan); 
      // In real app, `paymentWorker` webhook updates DB, we just update local state here
      localStorage.setItem('nexus_user_plan', newPlan.tier);
      setIsPricingModalOpen(false);
  };

  // --- AUTO-SAVE ---
  useEffect(() => {
    if (!currentProject || currentView !== 'editor') return;
    if (syncStatus === 'saving') return;

    const timeoutId = setTimeout(() => {
        const draftKey = `nexus_draft_${currentProject.id}`;
        const draftData = {
            id: currentProject.id,
            nexuses,
            synapses,
            timestamp: Date.now()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        if (syncStatus === 'synced') setSyncStatus('dirty');
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [nexuses, synapses, currentProject, currentView, syncStatus]);

  useEffect(() => {
      const lastProjectId = localStorage.getItem('nexus_last_project_id');
      const lastView = localStorage.getItem('nexus_last_view');
      
      if (lastProjectId && projects.length > 0) {
          if (currentProject?.id === lastProjectId) return; 
          const found = projects.find(p => p.id === lastProjectId);
          if (found) {
              handleOpenProject(found);
              if (lastView === 'editor') setCurrentView('editor');
          }
      }
  }, [projects, currentProject]); 

  const handleResume = () => { setIsRunModalOpen(true); };
  const handleDiscardResume = () => { localStorage.removeItem('nexus_interrupted_execution'); setInterruptedState(null); };

  useEffect(() => {
    if (user) {
      const unsub = subscribeToProjects(user.uid, (data) => setProjects(data));
      return () => unsub();
    }
  }, [user]);

  const handleCreateNewProject = async (title: string, desc: string) => {
      // NOTE: Project limits are checked inside ProjectList.tsx already, 
      // but double check here for safety? Not strictly needed as button is hidden.
      if (projects.length >= PLAN_LIMITS[userPlan].PROJECTS) {
          setIsPricingModalOpen(true);
          return;
      }
      const newP = await createProject({ title, description: desc });
      handleOpenProject(newP);
  };

  const handleOpenProject = (p: Project) => {
    const draftKey = `nexus_draft_${p.id}`;
    const draftRaw = localStorage.getItem(draftKey);
    let nodesToLoad = p.nexuses || [];
    let edgesToLoad = p.synapses || [];
    let isDraftNewer = false;

    if (draftRaw) {
        try {
            const draft = JSON.parse(draftRaw);
            const cloudTime = p.updatedAt || 0;
            if (draft.timestamp > cloudTime) {
                nodesToLoad = draft.nexuses;
                edgesToLoad = draft.synapses;
                isDraftNewer = true;
            }
        } catch (e) {}
    }

    const cleanNodes = sanitizeNodes(nodesToLoad);
    const nodeIds = new Set(cleanNodes.map(n => n.id));
    const cleanSynapses = sanitizeSynapses(edgesToLoad, nodeIds);
    
    setCurrentProject(p);
    setNexuses(cleanNodes);
    setSynapses(cleanSynapses);
    setSyncStatus(isDraftNewer ? 'dirty' : 'synced');
    setCurrentView('editor');
    localStorage.setItem('nexus_last_project_id', p.id);
    localStorage.setItem('nexus_last_view', 'editor');
  };

  const handleDeleteProject = async (id: string) => {
      if(window.confirm("Are you sure? This will delete the workflow forever.")) {
          await deleteProject(id);
          localStorage.removeItem(`nexus_draft_${id}`);
      }
  };

  const handleNavigateDashboard = () => {
      setCurrentView('dashboard');
      localStorage.setItem('nexus_last_view', 'dashboard');
  };

  const handleNexusPositionUpdate = useCallback((id: string, x: number, y: number) => {
      setNexuses(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n));
  }, []);

  const handleNexusUpdate = useCallback((id: string, up: Partial<Nexus>) => {
      setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...up } : n));
  }, []);

  const handleAddSynapse = useCallback((s: string, t: string, h?: string) => {
      setSynapses(prev => {
          if(prev.some(syn => syn.sourceId === s && syn.targetId === t)) return prev;
          return [...prev, { id: `syn-${Date.now()}`, sourceId: s, targetId: t, sourceHandle: h }];
      });
  }, []);

  const handleDeleteSynapse = useCallback((id: string) => {
      setSynapses(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleDeleteNexus = useCallback((id: string) => {
      if (!window.confirm("Delete this node?")) return;
      setNexuses(prev => prev.filter(n => n.id !== id));
      setSynapses(prev => prev.filter(s => s.sourceId !== id && s.targetId !== id));
      setSelectedId(null);
      setIsPropertiesOpen(false);
  }, []);

  const handleAddNexus = useCallback((type: NexusType, subtype: NexusSubtype, dropPosition?: { x: number, y: number }) => {
      // 🔥 USAGE GUARD: CHECK NODE LIMIT
      if (fullPlan && !canAddNode(fullPlan, nexuses.length)) {
          alert(`Plan limit reached! Maximum ${PLAN_LIMITS[userPlan].MAX_NODES} nodes per workflow on ${userPlan} plan.`);
          setIsPricingModalOpen(true);
          return;
      }

      const id = `n-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      setNexuses(prev => {
          let safeX = 100;
          let safeY = 300 + (prev.length % 5 * 20);
          if (dropPosition) { safeX = dropPosition.x; safeY = dropPosition.y; }
          else {
              const max = Math.max(...prev.map(n => n.position?.x || 0));
              if (Number.isFinite(max)) safeX = max + 300;
          }
          const newNode: Nexus = { 
              id, type, subtype, label: `New ${subtype}`, 
              position: { x: safeX, y: safeY }, config: {}, settings: DEFAULT_NODE_SETTINGS, status: 'idle' 
          };
          return [...prev, newNode];
      });
      setSelectedId(id);
      setIsPropertiesOpen(true);
  }, [nexuses.length, fullPlan, userPlan, selectedId]);

  const handleApplyStream = (newNexuses: Nexus[], newSynapses: Synapse[]) => {
      const cleanNodes = sanitizeNodes(newNexuses).map((n, i) => {
          if (!n.position || (n.position.x === 0 && n.position.y === 0)) {
              return { ...n, position: { x: 300 + (i * 350), y: 300 } };
          }
          return n;
      });
      setNexuses(cleanNodes);
      setSynapses(sanitizeSynapses(newSynapses, new Set(cleanNodes.map(n => n.id))));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onUpgrade={handleUpgrade} />
      
      {/* ONBOARDING MODAL */}
      {isOnboardingOpen && (
          <OnboardingModal onClose={completeOnboarding} onOpenAI={() => setIsAIAssistantOpen(true)} />
      )}

      {/* SETTINGS MODAL */}
      <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          onUpgrade={() => setIsPricingModalOpen(true)}
          userPlan={fullPlan || { tier: 'FREE', autoRenew: true, credits: 5, aiUsed: 0, monthlyLimit: 5, uid: user?.uid || '', email: user?.email || '', region: 'GLOBAL', role: 'USER', status: 'active', expiresAt: 0, updatedAt: Date.now() }}
      />

      {interruptedState && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] w-full max-w-md animate-in slide-in-from-bottom-4">
          <div className="bg-[#0f172a] border border-blue-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(37,99,235,0.2)] flex items-center justify-between gap-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl"><Activity size={20} className="text-blue-400 animate-pulse" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none mb-1">State Recovery Available</p>
                <p className="text-[9px] text-slate-500 font-mono">Job ID: {interruptedState.runId.slice(-8)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDiscardResume} className="px-3 py-2 text-[9px] font-black text-slate-500 hover:text-white uppercase transition-colors">Discard</button>
              <button onClick={handleResume} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-500 transition-all">Resume Flow</button>
            </div>
          </div>
        </div>
      )}

      <NexusMascot />
      
      <Sidebar 
        isOpen={true} 
        onClose={() => {}} 
        onAddNexus={handleAddNexus}
        onLoadBlueprint={(bp) => handleApplyStream(bp.nexuses, bp.synapses)}
        onClear={() => { setNexuses([]); setSynapses([]); }}
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onNavigateProjects={handleNavigateDashboard}
        currentView={currentView}
        onOpenCredentials={() => setIsCredentialManagerOpen(true)}
        onOpenRegistry={() => setIsRegistryOpen(true)}
        onOpenAI={() => setIsAIAssistantOpen(true)}
      />

      <div className="flex-1 flex flex-col relative h-full">
        <div className="h-14 bg-nexus-950/90 border-b border-nexus-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xs uppercase tracking-widest text-gray-400">
               {currentView === 'dashboard' ? 'SYS_WORKSPACE' : currentProject?.title}
            </h1>
            {currentView === 'editor' && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${syncStatus === 'synced' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'}`}>
                  {syncStatus === 'synced' ? <CheckCircle2 size={12}/> : <Activity size={12} className="animate-spin"/>}
                  <span className="text-[10px] font-black uppercase">{syncStatus === 'synced' ? 'Synced' : 'Saving...'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
             {/* Plan Badge in Header */}
             <div className="text-[9px] font-black uppercase bg-nexus-900 border border-nexus-800 px-2 py-1 rounded text-nexus-accent">
                 {userPlan} PLAN
             </div>
          </div>
        </div>

        {currentView === 'dashboard' ? (
            <ProjectList 
                projects={projects}
                onCreateProject={handleCreateNewProject}
                onOpenProject={handleOpenProject}
                onDeleteProject={handleDeleteProject}
                userPlan={userPlan}
                onUpgrade={() => setIsPricingModalOpen(true)}
            />
        ) : (
            <div className="flex-1 relative overflow-hidden">
                <Canvas 
                    nexuses={nexuses}
                    synapses={synapses}
                    selectedId={selectedId}
                    onSelectNexus={(id) => { setSelectedId(id); if(id) setIsPropertiesOpen(true); }}
                    onUpdateNexusPosition={handleNexusPositionUpdate}
                    onAddSynapse={handleAddSynapse}
                    onDeleteSynapse={handleDeleteSynapse}
                    onOpenProperties={(id) => { setSelectedId(id); setIsPropertiesOpen(true); }}
                    onNexusUpdate={handleNexusUpdate}
                    onNodeAction={(action, id) => {
                        if (action === 'DELETE') handleDeleteNexus(id);
                    }}
                    onAddNexus={handleAddNexus}
                />
                
                {isPropertiesOpen && (
                    <PropertiesPanel 
                        nexus={nexuses.find(n => n.id === selectedId) || null}
                        onClose={() => { setIsPropertiesOpen(false); setSelectedId(null); }}
                        onUpdate={handleNexusUpdate}
                        onDelete={handleDeleteNexus}
                        credentials={[]} 
                        onTest={() => setIsRunModalOpen(true)} 
                    />
                )}
            </div>
        )}

        {/* --- GLOBAL MODALS --- */}
        <RunModal 
            isOpen={isRunModalOpen}
            onClose={() => setIsRunModalOpen(false)}
            nexuses={nexuses}
            synapses={synapses}
            resumeState={interruptedState}
        />
        
        <NodeRegistry isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
        <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
        <CredentialManager isOpen={isCredentialManagerOpen} onClose={() => setIsCredentialManagerOpen(false)} onUpdate={() => {}} />
        <AIAssistant 
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
            onApplyStream={handleApplyStream}
            currentNexuses={nexuses}
            currentSynapses={synapses}
            projectContext={currentProject?.description}
            userPlan={userPlan}
            onUpgrade={() => setIsPricingModalOpen(true)}
        />

      </div>
    </div>
  );
};

export default AppContent;
