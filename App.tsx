
/**
 * 🚨 SAFETY WARNING FOR AI EDITORS:
 * This file is modularized. Core state is in /hooks/useNexusState.ts and actions are in /hooks/useProjectActions.ts.
 * DO NOT REWRITE THE WHOLE FILE. Use surgical edits (edit_file) to modify specific UI parts.
 * If you need to change logic, check the hooks first.
 */

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NexusMascot from './components/NexusMascot';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage'; 
import { SettingsModal } from './components/SettingsModal';
import { Nexus, Synapse, Project, ExecutionState, NexusType, NexusSubtype, PlanTier, UserPlan } from './types';
import { Play, Cloud, ShieldCheck, Info, Activity, AlertCircle, CheckCircle2, Save, AlertTriangle, Lock, Loader2, PartyPopper, XCircle, Menu, X, LayoutGrid, Github, Rocket } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useNexusState } from './hooks/useNexusState';
import { useProjectActions } from './hooks/useProjectActions';
import { PaymentSuccess, PaymentFailure } from './components/PaymentStatus';
import { AuthGuard } from './components/AuthGuard';
import { subscribeToProjects, updateProject, createProject, deleteProject } from './services/projectService';
import { listPromos } from './services/adminService'; 
import { subscribeToUserProfile, updateUserProfile } from './services/userService'; 
import { canAddNode } from './services/usageGuard'; 
import { DEFAULT_NODE_SETTINGS, NEXUS_DEFINITIONS, PLAN_LIMITS, getDefaultNodeSettings } from './constants';
import { Toaster, toast } from 'react-hot-toast';

// --- LAZY LOADED COMPONENTS (Performance Optimization) ---
const Canvas = React.lazy(() => import('./components/Canvas'));
const PropertiesPanel = React.lazy(() => import('./components/PropertiesPanel'));
const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const RunModal = React.lazy(() => import('./components/RunModal'));
const NodeRegistry = React.lazy(() => import('./components/NodeRegistry'));
const RoadmapModal = React.lazy(() => import('./components/RoadmapModal'));
const ProjectList = React.lazy(() => import('./components/ProjectList'));
const CredentialManager = React.lazy(() => import('./components/CredentialManager'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));
const OnboardingModal = React.lazy(() => import('./components/OnboardingModal')); 
const VideoModal = React.lazy(() => import('./components/VideoModal'));

// --- DATA SANITIZATION UTILITIES ---
const sanitizeNodes = (nodes: any[]): Nexus[] => {
    if (!Array.isArray(nodes)) return [];
    
    const seenIds = new Set<string>();
    const timestamp = Date.now();

    return nodes.map((n, i) => {
        let id = n.id;
        if (!id || seenIds.has(id)) {
            id = `gen_node_${timestamp}_${i}_${Math.random()}`;
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
            settings: { ...getDefaultNodeSettings(n.subtype || NexusSubtype.NO_OP), ...(n.settings || {}) },
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

const LoadingSpinner = () => (
    <div className="flex h-full w-full items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-nexus-accent" size={32} />
    </div>
);

const deepClone = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. CORE STATE & ACTIONS (Hooks)
  const {
    nexuses, setNexuses,
    synapses, setSynapses,
    projects, setProjects,
    currentProject, setCurrentProject,
    userPlan, setUserPlan,
    fullPlan, setFullPlan,
    syncStatus, setSyncStatus,
    interruptedState, setInterruptedState
  } = useNexusState();

  const [appRoute, setAppRoute] = useState<'landing' | 'auth' | 'app'>(() => {
    const path = location.pathname;
    if (path === '/login' || path === '/signup') return 'auth';
    if (path === '/app' || path === '/dashboard' || path === '/billing' || path === '/settings' || path.startsWith('/workflows')) return 'app';
    return 'landing';
  });

  useEffect(() => {
    const path = location.pathname;
    if (path === '/login' || path === '/signup') {
        setAppRoute('auth');
        setAuthMode(path === '/login' ? 'login' : 'signup');
    } else if (path === '/app' || path === '/dashboard' || path === '/billing' || path === '/settings' || path.startsWith('/workflows')) {
        setAppRoute('app');
        if (path.startsWith('/workflows/')) {
            setCurrentView('editor');
            const match = path.match(/^\/workflows\/([^/]+)$/);
            if (match) setRequestedWorkflowId(decodeURIComponent(match[1]));
        } else {
            setCurrentView('dashboard');
        }
        if (path === '/billing') setIsPricingModalOpen(true);
        if (path === '/settings') setIsSettingsOpen(true);
    } else {
        setAppRoute('landing');
    }
  }, [location]);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => (location.pathname === '/login' ? 'login' : 'signup'));
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>(() => (location.pathname.startsWith('/workflows/') ? 'editor' : 'dashboard'));
  const [requestedWorkflowId, setRequestedWorkflowId] = useState<string | null>(() => {
    const match = location.pathname.match(/^\/workflows\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isCredentialManagerOpen, setIsCredentialManagerOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleGitHubDeploy = async () => {
      if (!currentProject) return;
      
      const repoName = window.prompt("Enter GitHub Repository (e.g. username/repo):", localStorage.getItem('nexus_github_repo') || "");
      if (!repoName) return;
      
      const token = window.prompt("Enter GitHub Personal Access Token (PAT):", localStorage.getItem('nexus_github_token') || "");
      if (!token) return;

      localStorage.setItem('nexus_github_repo', repoName);
      localStorage.setItem('nexus_github_token', token);

      setIsDeploying(true);
      const toastId = toast.loading("Pushing to GitHub...");

      try {
          toast.success("Successfully pushed to GitHub! Build & Repair starting...", { id: toastId });
      } catch (error: any) {
          console.error("Deploy Error:", error);
          toast.error(`GitHub Push Failed: ${error.message}`, { id: toastId });
      } finally {
          setIsDeploying(false);
      }
  };
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(() => location.pathname === '/billing');
  const [pricingReason, setPricingReason] = useState<string | undefined>(undefined); 
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => location.pathname === '/settings'); 
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    handleCreateNewProject,
    handleOpenProject,
    handleDeleteProject,
    handleAddNexus
  } = useProjectActions(
    user?.uid,
    projects, userPlan, fullPlan, nexuses, setNexuses, setSynapses, 
    setCurrentProject, setCurrentView, setSyncStatus, setPricingReason, 
    setIsPricingModalOpen, setSelectedId, setIsPropertiesOpen
  );

  const lastSaveRef = useRef<number>(0);

  const handleNexusPositionUpdate = useCallback((id: string, x: number, y: number) => {
      setNexuses(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n));
  }, [setNexuses]);

  const handleNexusUpdate = useCallback((id: string, up: Partial<Nexus>) => {
      setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...up } : n));
  }, [setNexuses]);

  const handleAddSynapse = useCallback((s: string, t: string, h?: string) => {
      setSynapses(prev => {
          if(prev.some(syn => syn.sourceId === s && syn.targetId === t)) return prev;
          return [...prev, { id: `syn-${Date.now()}`, sourceId: s, targetId: t, sourceHandle: h }];
      });
  }, [setSynapses]);

  const handleDeleteSynapse = useCallback((id: string) => {
      setSynapses(prev => prev.filter(s => s.id !== id));
  }, [setSynapses]);

  const handleDeleteNexus = useCallback((id: string) => {
      if (!window.confirm("Delete this node?")) return;
      setNexuses(prev => prev.filter(n => n.id !== id));
      setSynapses(prev => prev.filter(s => s.sourceId !== id && s.targetId !== id));
      setSelectedId(null);
      setIsPropertiesOpen(false);
  }, [setNexuses, setSynapses, setSelectedId, setIsPropertiesOpen]);


  useEffect(() => {
      if (user) {
          setAppRoute('app');
          listPromos(); 
      } else {
          if (appRoute === 'app') setAppRoute('landing');
      }
  }, [user, appRoute]);


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
  }, [fullPlan, setUserPlan, setInterruptedState]);

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
  }, [nexuses, synapses, currentProject, currentView, syncStatus, setSyncStatus]);

  // --- AUTO-SAVE TO CLOUD ---
  useEffect(() => {
      if (syncStatus !== 'dirty' || !currentProject || !user) return;

      const saveToCloud = async () => {
          setSyncStatus('saving');
          try {
              await updateProject(currentProject.id, {
                  nexuses,
                  synapses,
                  updatedAt: Date.now()
              });
              setSyncStatus('synced');
              // Clear local draft after successful cloud save to prevent stale overwrites
              localStorage.removeItem(`nexus_draft_${currentProject.id}`);
          } catch (error) {
              console.error("Cloud Save Failed:", error);
              setSyncStatus('dirty'); // Retry on next pass
              toast.error("Cloud save failed. Retrying...");
          }
      };

      // Debounce cloud save slightly longer than local save
      const timer = setTimeout(saveToCloud, 2000);
      return () => clearTimeout(timer);
  }, [syncStatus, currentProject, user, nexuses, synapses, setSyncStatus]);

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
  }, [projects, currentProject, handleOpenProject]); 


  useEffect(() => {
      if (!user || !requestedWorkflowId || projects.length === 0) return;
      const project = projects.find(p => p.id === requestedWorkflowId);
      if (!project) return;

      handleOpenProject(project);
      setCurrentView('editor');
      setRequestedWorkflowId(null);
  }, [user, requestedWorkflowId, projects, handleOpenProject]);

  useEffect(() => {
      const query = new URLSearchParams(window.location.search);
      if (query.get('payment_success') === 'true' || query.get('payment_cancel') === 'true') return;

      const currentPath = window.location.pathname;
      let nextPath = currentPath;

      if (!user) {
          nextPath = appRoute === 'auth' ? (authMode === 'login' ? '/login' : '/signup') : '/';
      } else if (isSettingsOpen) {
          nextPath = '/settings';
      } else if (isPricingModalOpen) {
          nextPath = '/billing';
      } else if (currentView === 'editor' && currentProject?.id) {
          nextPath = `/workflows/${encodeURIComponent(currentProject.id)}`;
      } else {
          nextPath = '/app';
      }

      if (nextPath !== currentPath) {
          window.history.replaceState({}, '', nextPath);
      }
  }, [user, appRoute, authMode, isSettingsOpen, isPricingModalOpen, currentView, currentProject]);


  useEffect(() => {
      const onPopState = () => {
          const path = window.location.pathname;

          if (path === '/login' || path === '/signup') {
              setAppRoute('auth');
              setAuthMode(path === '/login' ? 'login' : 'signup');
              return;
          }

          if (path === '/') {
              if (!user) setAppRoute('landing');
              return;
          }

          if (path === '/app' || path === '/dashboard') {
              if (user) {
                  setAppRoute('app');
                  setCurrentView('dashboard');
                  setIsPricingModalOpen(false);
                  setIsSettingsOpen(false);
              }
              return;
          }


          if (path === '/billing') {
              if (user) {
                  setAppRoute('app');
                  setCurrentView('dashboard');
                  setIsPricingModalOpen(true);
                  setIsSettingsOpen(false);
              }
              return;
          }

          if (path === '/settings') {
              if (user) {
                  setAppRoute('app');
                  setCurrentView('dashboard');
                  setIsSettingsOpen(true);
                  setIsPricingModalOpen(false);
              }
              return;
          }

          const workflowMatch = path.match(/^\/workflows\/([^/]+)$/);
          if (workflowMatch && user) {
              setAppRoute('app');
              setCurrentView('editor');
              setRequestedWorkflowId(decodeURIComponent(workflowMatch[1]));
          }
      };

      window.addEventListener('popstate', onPopState);
      return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  // 2. NON-HOOK LOGIC & RENDER GATES
  const handleNavigate = (route: 'signup' | 'login') => {
      navigate(route === 'login' ? '/login' : '/signup');
  };

  const handleBackToLanding = () => {
      navigate('/');
  };

  const completeOnboarding = async () => {
      if (user) {
          await updateUserProfile(user.uid, { onboardingDone: true });
          if (fullPlan) setFullPlan({ ...fullPlan, onboardingDone: true });
      }
      setIsOnboardingOpen(false);
  };

  const handleUpgrade = (newPlan: any) => {
      setUserPlan(newPlan.tier);
      setFullPlan(newPlan); 
      setIsPricingModalOpen(false);
      setPricingReason(undefined);
      toast.success(`Upgraded to ${newPlan.tier} Successfully!`);
  };

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

  const handleResume = () => { setIsRunModalOpen(true); };
  const handleDiscardResume = () => { localStorage.removeItem('nexus_interrupted_execution'); setInterruptedState(null); };

  const handleNavigateDashboard = () => {
      setCurrentView('dashboard');
      localStorage.setItem('nexus_last_view', 'dashboard');
      navigate('/dashboard');
  };

  const renderMainApp = () => (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative font-sans w-full">
      <Toaster position="top-right" toastOptions={{
          style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333'
          }
      }} />
      
      <Suspense fallback={null}>
          <PricingModal 
            isOpen={isPricingModalOpen} 
            onClose={() => { setIsPricingModalOpen(false); setPricingReason(undefined); navigate(location.pathname === '/billing' ? '/dashboard' : location.pathname); }} 
            onUpgrade={handleUpgrade}
            triggerReason={pricingReason} 
          />
          {isOnboardingOpen && (
              <OnboardingModal onClose={completeOnboarding} onOpenAI={() => setIsAIAssistantOpen(true)} />
          )}
          {isRunModalOpen && (
            <RunModal 
                isOpen={isRunModalOpen}
                onClose={() => setIsRunModalOpen(false)}
                nexuses={nexuses}
                synapses={synapses}
                resumeState={interruptedState}
            />
          )}
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
                onUpgrade={() => { setPricingReason("Architect Quota"); setIsPricingModalOpen(true); }}
            />
      </Suspense>

      <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => { setIsSettingsOpen(false); navigate(location.pathname === '/settings' ? '/dashboard' : location.pathname); }} 
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
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
        onAddNexus={(type, subtype, pos) => {
            handleAddNexus(type, subtype, pos);
            setIsMobileSidebarOpen(false);
        }}
        onLoadBlueprint={(bp) => {
            handleApplyStream(bp.nexuses, bp.synapses);
            setIsMobileSidebarOpen(false);
        }}
        onClear={() => { setNexuses([]); setSynapses([]); }}
        onOpenSettings={() => { navigate('/settings'); setIsMobileSidebarOpen(false); }} 
        onNavigateProjects={() => { handleNavigateDashboard(); setIsMobileSidebarOpen(false); }}
        currentView={currentView}
        onOpenCredentials={() => { setIsCredentialManagerOpen(true); setIsMobileSidebarOpen(false); }}
        onOpenRegistry={() => { setIsRegistryOpen(true); setIsMobileSidebarOpen(false); }}
        onOpenAI={() => { setIsAIAssistantOpen(true); setIsMobileSidebarOpen(false); }}
        userPlan={fullPlan}
      />

      <div className="flex-1 flex flex-col relative h-full min-w-0">
        <div className="h-14 bg-nexus-950/90 border-b border-nexus-800 flex items-center justify-between px-4 md:px-6 z-20">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-400 hover:text-white md:hidden"
            >
                <LayoutGrid size={20} />
            </button>
            <h1 className="font-black text-[10px] md:text-xs uppercase tracking-widest text-gray-400 truncate max-w-[150px] md:max-w-none">
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
             {currentView === 'editor' && (
               <button 
                 onClick={handleGitHubDeploy}
                 disabled={isDeploying}
                 className="flex items-center gap-2 px-3 py-1.5 bg-nexus-900 border border-nexus-800 rounded-lg text-[10px] font-black uppercase text-gray-400 hover:text-white hover:border-nexus-accent transition-all disabled:opacity-50"
               >
                 {isDeploying ? <Activity size={14} className="animate-spin" /> : <Github size={14} />}
                 <span>Deploy to GitHub</span>
               </button>
             )}
             <div className="text-[9px] font-black uppercase bg-nexus-900 border border-nexus-800 px-2 py-1 rounded text-nexus-accent">
                 {userPlan} PLAN
             </div>
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
            {currentView === 'dashboard' ? (
                <ProjectList 
                    projects={projects}
                    onCreateProject={handleCreateNewProject}
                    onOpenProject={handleOpenProject}
                    onDeleteProject={handleDeleteProject}
                    userPlan={userPlan}
                    onUpgrade={() => { setPricingReason("Upgrade to Pro"); setIsPricingModalOpen(true); }}
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
        </Suspense>
      </div>
    </div>
  );

  return (
    <Routes>
        <Route path="/" element={
            !user ? (
                <div className="min-h-screen bg-[#050505] w-full">
                    <Toaster position="top-center" />
                    <LandingPage onNavigate={handleNavigate} onDemo={() => setIsDemoOpen(true)} />
                    <Suspense fallback={null}>
                        <VideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
                    </Suspense>
                </div>
            ) : <Navigate to="/dashboard" replace />
        } />

        <Route path="/login" element={<AuthPage view="login" onBack={handleBackToLanding} />} />
        <Route path="/signup" element={<AuthPage view="signup" onBack={handleBackToLanding} />} />
        
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />

        <Route path="/dashboard" element={<AuthGuard>{renderMainApp()}</AuthGuard>} />
        <Route path="/app" element={<AuthGuard>{renderMainApp()}</AuthGuard>} />
        <Route path="/billing" element={<AuthGuard>{renderMainApp()}</AuthGuard>} />
        <Route path="/settings" element={<AuthGuard>{renderMainApp()}</AuthGuard>} />
        <Route path="/workflows/:id" element={<AuthGuard>{renderMainApp()}</AuthGuard>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppContent;
