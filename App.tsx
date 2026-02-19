
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import NexusMascot from './components/NexusMascot';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage'; 
import { SettingsModal } from './components/SettingsModal';
import { Project, UserPlan } from './types';
import { useAuth } from './context/AuthContext';
import { subscribeToProjects, updateProject, createProject, deleteProject } from './services/projectService';
import { listPromos } from './services/adminService'; 
import { subscribeToUserProfile, updateUserProfile, debugPromoteUser } from './services/userService'; 
import { canAddNode } from './services/usageGuard'; 
import { DEFAULT_NODE_SETTINGS, NEXUS_DEFINITIONS, PLAN_LIMITS, getDefaultNodeSettings } from './constants';
import { subscribeToProjects, createProject, deleteProject } from './services/projectService';
import { subscribeToUserProfile } from './services/userService'; 
import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Canvas = React.lazy(() => import('./components/Canvas'));
const PropertiesPanel = React.lazy(() => import('./components/PropertiesPanel'));
const ProjectList = React.lazy(() => import('./components/ProjectList'));
const PricingModal = React.lazy(() => import('./components/PricingModal'));

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
// --- COMPONENTS FOR SUCCESS / CANCEL ---
const PaymentSuccess = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
        <div className="w-20 h-20 bg-nexus-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 size={40} className="text-nexus-success" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Payment Successful!</h2>
        <p className="text-gray-400 text-sm mb-8">Your PRO plan is now active. Redirecting...</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-nexus-accent text-black font-bold rounded-xl text-xs uppercase">Go to Dashboard</button>
    </div>
);

const PaymentCancel = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <XCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Payment Cancelled</h2>
        <p className="text-gray-400 text-sm mb-8">You can retry anytime.</p>
        <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl text-xs uppercase hover:bg-gray-700">Return to App</button>
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
  const [appRoute, setAppRoute] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [userPlan, setUserPlan] = useState<any>({ tier: 'FREE' });
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- QUERY PARAM ROUTING ---
  const params = new URLSearchParams(window.location.search);
  const isPaymentSuccess = params.get('payment_success') === 'true';
  const isPaymentCancel = params.get('payment_cancel') === 'true';

  useEffect(() => {
      if (user) {
          setAppRoute('app');
          const unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
              if (profile) {
                  setFullPlan(profile);
                  setUserPlan(profile.tier || profile.plan?.tier || 'FREE');

                  if (!profile.onboardingDone) {
                      setIsOnboardingOpen(true);
                  }
              }
          });
          listPromos(); 

          return () => unsubscribeProfile();
      } else {
          setFullPlan(null);
          setUserPlan('FREE');
          if (appRoute === 'app') setAppRoute('landing');
          subscribeToUserProfile(user.uid, (profile) => {
              if (profile) setUserPlan(profile);
          });
          subscribeToProjects(user.uid, setProjects);
      } else {
          setAppRoute('landing');
      }
  }, [user]);

  if (isPaymentSuccess) return <PaymentSuccess />;
  if (isPaymentCancel) return <PaymentCancel />;

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
  // If this is the payment success popup, show a minimal "Success" screen instead of the full app
  if (new URLSearchParams(window.location.search).get('payment_success') === 'true') {
      return (
          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-nexus-success/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <PartyPopper size={32} className="text-nexus-success" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Payment Successful</h2>
              <p className="text-gray-500 text-sm mt-2">Closing secure window...</p>
          </div>
      );
  }

  if (!user && appRoute === 'landing') {
      return (
        <>
            <LandingPage onNavigate={handleNavigate} onDemo={() => setIsDemoOpen(true)} />
            <Suspense fallback={null}>
                <VideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
            </Suspense>
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
      setPricingReason(undefined);
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
      try {
          // NOTE: Client-side check for immediate feedback
          if (projects.length >= PLAN_LIMITS[userPlan].PROJECTS) {
              setPricingReason(`Project Limit Reached (${PLAN_LIMITS[userPlan].PROJECTS}). Upgrade to save more.`);
              setIsPricingModalOpen(true);
              return;
          }
          
          const newP = await createProject({ title, description: desc });
          handleOpenProject(newP);
      } catch (e: any) {
          // 🔥 SERVER-SIDE GUARD CATCH
          if (e.message === 'PROJECT_LIMIT_REACHED') {
              setPricingReason(`Cloud Storage Full (${PLAN_LIMITS[userPlan].PROJECTS} Projects). Upgrade to save more.`);
              setIsPricingModalOpen(true);
          } else {
              console.error("Project Creation Failed", e);
              alert("Failed to create project. Please try again.");
          }
      }
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
      if (fullPlan && !canAddNode(fullPlan, nexuses.length)) {
          setPricingReason(`Node Limit Reached (${PLAN_LIMITS[userPlan].MAX_NODES}). Upgrade for complex flows.`);
          setIsPricingModalOpen(true);
          return;
      }

      const definition = NEXUS_DEFINITIONS.find(d => d.subtype === subtype);
      const nodeLabel = definition?.label || `New ${subtype}`;
      const defaultConfig = deepClone(definition?.defaultConfig || {});

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
              id, type, subtype, label: nodeLabel,
              position: { x: safeX, y: safeY }, config: defaultConfig, settings: getDefaultNodeSettings(subtype), status: 'idle' 
          };
          return [...prev, newNode];
      });
      setSelectedId(id);
      setIsPropertiesOpen(true);
  }, [nexuses.length, fullPlan, userPlan]);

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
  if (!user && appRoute === 'landing') return <LandingPage onNavigate={(mode) => { setAuthMode(mode); setAppRoute('auth'); }} />;
  if (!user && appRoute === 'auth') return <AuthPage view={authMode} onBack={() => setAppRoute('landing')} />;

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' } }} />
      
      <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-black"><Loader2 className="animate-spin text-white"/></div>}>
          <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onUpgrade={() => setIsPricingModalOpen(true)} userPlan={userPlan} />
      </Suspense>

      <NexusMascot />
      
      <Sidebar 
        isOpen={true} 
        onClose={() => {}} 
        onAddNexus={() => {}} 
        onLoadBlueprint={() => {}} 
        onClear={() => {}} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        onNavigateProjects={() => setCurrentView('dashboard')} 
        currentView={currentView}
        userPlan={userPlan}
        onOpenAI={() => {}}
      />

      <div className="flex-1 flex flex-col relative h-full">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin"/></div>}>
            {currentView === 'dashboard' ? (
                <ProjectList 
                    projects={projects}
                    onCreateProject={(t, d) => createProject({ title: t, description: d })}
                    onOpenProject={() => setCurrentView('editor')}
                    onDeleteProject={deleteProject}
                    userPlan={userPlan.tier}
                    onUpgrade={() => setIsPricingModalOpen(true)}
                />
            ) : (
                <Canvas nexuses={[]} synapses={[]} selectedId={null} onSelectNexus={() => {}} onUpdateNexusPosition={() => {}} onAddSynapse={() => {}} onDeleteSynapse={() => {}} onOpenProperties={() => {}} onNexusUpdate={() => {}} />
            )}
        </Suspense>
      </div>
    </div>
  );
};

export default AppContent;
