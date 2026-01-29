
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import AIAssistant from './components/AIAssistant';
import DomainManager from './components/DomainManager';
import ProjectList from './components/ProjectList'; 
import RecaptchaModal from './components/RecaptchaModal';
import RunModal from './components/RunModal';
import ChatTestPanel from './components/ChatTestPanel'; 
import CredentialManager from './components/CredentialManager';
import Spotlight from './components/Spotlight';
import ClientPortal from './components/ClientPortal'; 
import NodeRegistry from './components/NodeRegistry';
import NexusMascot from './components/NexusMascot';
import ErrorBoundary from './components/ErrorBoundary';
import { Nexus, Synapse, NexusType, NexusSubtype, UserPlan, Project, ProjectStatus, Credential, ChatMessage, Blueprint } from './types';
import { Play, Activity, Sparkles, Menu, Crown, Save, ArrowLeft, Cloud, CloudOff, AlertCircle, HardDrive, MessageSquare, RefreshCw, Radio, ExternalLink, ShieldCheck, DownloadCloud, CheckCircle2, Cpu, Maximize, Minimize, RotateCcw, MonitorSmartphone } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import PricingModal from './components/PricingModal';
import { checkAndSyncSubscription, listenToTriggerQueue, updateTriggerStatus } from './services/cloudStore';
import { createProject, subscribeToProjects, updateProject, deleteProject, getUserProjects } from './services/projectService';
import { WorkflowOrchestrator } from './services/executionEngine';

const SESSION_KEY = 'nexus_active_session';
const generateId = (prefix: string = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

const sanitizeNodes = (nodes: any[]): Nexus[] => {
    if (!Array.isArray(nodes)) return [];
    return nodes.map(n => ({
        ...n,
        id: n.id || generateId('n'), 
        type: (n.type || NexusType.ACTION).toUpperCase() as NexusType,
        subtype: (n.subtype || NexusSubtype.HTTP_REQUEST).toUpperCase() as NexusSubtype, 
        label: n.label || 'Untitled Node', 
        position: n.position || { x: 100, y: 100 }, 
        config: n.config || {}, 
        status: 'idle' 
    }));
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeViewMode, setActiveViewMode] = useState<'ADMIN' | 'PORTAL'>('ADMIN');
  const [portalProjectId, setPortalProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [nexuses, setNexuses] = useState<Nexus[]>([]);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [spotlightState, setSpotlightState] = useState<{ isOpen: boolean; x: number; y: number; sourceId?: string; sourceHandle?: string }>({ isOpen: false, x: 0, y: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isDomainManagerOpen, setIsDomainManagerOpen] = useState(false);
  const [isCredentialManagerOpen, setIsCredentialManagerOpen] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'dirty' | 'saving' | 'error'>('synced');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Fixed: Hard Reset Function
  const handleAppReload = () => {
    // Clear session so it doesn't auto-restore a buggy state
    localStorage.removeItem(SESSION_KEY);
    
    // Force reload based on environment
    if (window.location.search.includes('source=pwa')) {
        window.location.href = '/?source=pwa';
    } else {
        window.location.reload();
    }
  };

  // Logic to determine mascot state
  const runningNode = nexuses.find(n => n.status === 'running');
  const isAnyNodeRunning = !!runningNode || isRunModalOpen;
  
  let mascotMessage = "";
  if (runningNode) {
      mascotMessage = `EXECUTING: ${runningNode.label}`;
  } else if (isRunModalOpen) {
      mascotMessage = "INITIALIZING RUNTIME...";
  }

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const recoverSession = async () => {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession && user) {
            const { projectId, view } = JSON.parse(savedSession);
            if (view === 'editor' && projectId) {
                const allProjects = await getUserProjects(user.uid);
                const project = allProjects.find(p => p.id === projectId);
                if (project) {
                    const draft = localStorage.getItem(`nexus_local_draft_${projectId}`);
                    if (draft) {
                        const parsed = JSON.parse(draft);
                        handleOpenProject({ ...project, nexuses: parsed.nexuses, synapses: parsed.synapses });
                    } else {
                        handleOpenProject(project);
                    }
                }
            }
        }
    };
    if (user) recoverSession();
  }, [user]);

  useEffect(() => {
    if (user) {
      checkAndSyncSubscription(user.uid);
      const unsubscribeProjects = subscribeToProjects(user.uid, (updatedProjects) => {
          setProjects(updatedProjects);
      });
      return () => unsubscribeProjects();
    }
  }, [user]);

  useEffect(() => {
    if (currentProject && currentView === 'editor') {
        setSyncStatus('dirty');
        const timer = setTimeout(() => {
            // Save draft
            localStorage.setItem(`nexus_local_draft_${currentProject.id}`, JSON.stringify({ nexuses, synapses }));
            
            // Save active session pointer so reload brings us back here (unless explicitly cleared by refresh button)
            localStorage.setItem(SESSION_KEY, JSON.stringify({ projectId: currentProject.id, view: 'editor' }));
        }, 1000); 
        return () => clearTimeout(timer);
    }
  }, [nexuses, synapses, currentProject, currentView]);

  const saveToCloud = async () => {
      if (!currentProject) return;
      setSyncStatus('saving');
      try {
          await updateProject(currentProject.id, { nexuses, synapses });
          setSyncStatus('synced');
          setCurrentProject(prev => prev ? { ...prev, nexuses, synapses } : null);
      } catch (e) { setSyncStatus('error'); }
  };

  const handleCreateProject = async (title: string, desc: string) => { 
      if (!user) return; 
      try { 
          const newProject = await createProject({ title, description: desc }); 
          handleOpenProject(newProject); 
      } catch (e: any) { alert(e.message); } 
  };
  
  const handleOpenProject = (project: Project) => {
      setCurrentProject(project);
      setNexuses(sanitizeNodes(project.nexuses));
      setSynapses(Array.isArray(project.synapses) ? project.synapses : []);
      setCurrentView('editor');
      setTimeout(() => setSyncStatus('synced'), 100);
  };

  const handleBackToDashboard = async () => {
      if (syncStatus === 'dirty') {
          if (!confirm("You have unsaved changes. Sync to Cloud before leaving?")) {
              localStorage.removeItem(SESSION_KEY);
              setCurrentView('dashboard');
              setCurrentProject(null);
              return;
          }
          await saveToCloud();
      }
      localStorage.removeItem(SESSION_KEY);
      setCurrentView('dashboard');
      setCurrentProject(null);
  };

  const handleInternalPortalLaunch = (projectId: string) => {
      setPortalProjectId(projectId);
      setActiveViewMode('PORTAL');
  };

  const handleExitPortal = () => {
      setActiveViewMode('ADMIN');
      setPortalProjectId(null);
  };

  const handleTestNode = async (nodeId: string) => {
      const node = nexuses.find(n => n.id === nodeId);
      if (!node) return;
      setNexuses(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'running' } : n));
      try {
          const orchestrator = new WorkflowOrchestrator(nexuses, synapses, (msg, type) => {
              console.log(`[Node Test] ${msg}`);
          }, `TEST-${Date.now()}`, user?.uid || 'guest', currentProject?.id);
          const result = await orchestrator.runSingleNode(node, {});
          setNexuses(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'success', lastOutput: result } : n));
      } catch (e: any) {
          setNexuses(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'error', lastOutput: { error: e.message } } : n));
      }
  };

  if (activeViewMode === 'PORTAL' && portalProjectId) {
      return <ClientPortal projectId={portalProjectId} onClose={handleExitPortal} />;
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      <NexusMascot 
        isRunning={isAnyNodeRunning} 
        statusMessage={mascotMessage} 
        nodeCount={nexuses.length} 
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAddNexus={(type, subtype) => {
            const newId = generateId('n');
            setNexuses([...nexuses, { id: newId, type, subtype, label: `New ${subtype.replace('_', ' ')}`, position: { x: 400, y: 300 }, config: {}, status: 'idle' }]);
            setSelectedId(newId);
            setIsPropertiesPanelOpen(true);
        }}
        onLoadBlueprint={(bp) => {
            setNexuses(sanitizeNodes(bp.nexuses));
            setSynapses(bp.synapses);
        }}
        onClear={() => { setNexuses([]); setSynapses([]); }}
        onOpenSettings={() => {}}
        onNavigateProjects={handleBackToDashboard}
        onOpenCredentials={() => setIsCredentialManagerOpen(true)}
        currentView={currentView}
        onOpenRegistry={() => setIsRegistryOpen(true)}
      />
      
      <div className="flex-1 flex flex-col relative h-full">
        {/* GLOBAL UTILITY HEADER */}
        <div className="h-14 bg-nexus-950/80 backdrop-blur-md border-b border-nexus-800 flex items-center justify-between px-4 z-20 shrink-0">
            <div className="flex items-center gap-4">
                {currentView === 'editor' && (
                  <button onClick={handleBackToDashboard} className="p-2 hover:bg-nexus-800 rounded-lg text-gray-400 transition-colors">
                    <ArrowLeft size={18}/>
                  </button>
                )}
                <div className="flex flex-col">
                    <h1 className="font-bold text-xs truncate max-w-[200px]">
                      {currentView === 'dashboard' ? 'Project Dashboard' : currentProject?.title}
                    </h1>
                    {currentView === 'editor' && (
                      <div className="flex items-center gap-1.5">
                           {syncStatus === 'synced' ? (
                               <CheckCircle2 size={10} className="text-nexus-success"/>
                           ) : syncStatus === 'saving' ? (
                               <RefreshCw size={10} className="text-blue-400 animate-spin"/>
                           ) : (
                               <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                           )}
                           <span className={`text-[8px] font-black uppercase tracking-widest ${syncStatus === 'synced' ? 'text-nexus-success' : 'text-gray-500'}`}>
                               {syncStatus === 'saving' ? 'Publishing...' : syncStatus === 'synced' ? 'Live Cloud' : 'Local Draft'}
                           </span>
                      </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* TOOLBAR CONTROLS - REFINED AS REQUESTED */}
                <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 mr-3 shadow-inner">
                   <button 
                     onClick={() => currentProject && handleInternalPortalLaunch(currentProject.id)}
                     className={`p-2.5 rounded-xl transition-all ${currentProject ? 'text-gray-400 hover:text-blue-400 hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                     title="Preview Portal"
                     disabled={!currentProject}
                   >
                     <MonitorSmartphone size={18} />
                   </button>
                   <button 
                     onClick={handleAppReload}
                     className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                     title="System Refresh (Clear Session)"
                   >
                     <RotateCcw size={18} />
                   </button>
                   <button 
                     onClick={toggleFullscreen}
                     className="p-2.5 text-gray-400 hover:text-nexus-accent hover:bg-white/10 rounded-xl transition-all"
                     title="Immersive Mode"
                   >
                     {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                   </button>
                </div>

                {currentView === 'editor' && (
                  <>
                    <button 
                        onClick={saveToCloud}
                        disabled={syncStatus === 'synced' || syncStatus === 'saving'}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all border
                            ${syncStatus === 'dirty' 
                                ? 'bg-nexus-accent text-black border-nexus-accent shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:scale-105' 
                                : 'bg-nexus-900 text-gray-600 border-nexus-800 cursor-default opacity-50'}`}
                    >
                        <Cloud size={14} /> {syncStatus === 'saving' ? 'Saving' : 'Save'}
                    </button>
                    
                    <button onClick={() => setIsRunModalOpen(true)} className="px-4 py-1.5 bg-nexus-accent text-black rounded-lg text-xs font-bold hover:bg-nexus-success flex items-center gap-2 transition-all">
                        <Play size={14} fill="currentColor" /> Run
                    </button>
                    <button onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)} className="p-2 rounded-lg border bg-nexus-900 border-nexus-700 text-nexus-accent hover:bg-nexus-800">
                      <Sparkles size={16} />
                    </button>
                  </>
                )}
            </div>
        </div>

        {currentView === 'dashboard' ? (
            <ProjectList 
                projects={projects}
                onCreateProject={handleCreateProject}
                onOpenProject={handleOpenProject}
                onDeleteProject={async (id) => await deleteProject(id)}
                onRefresh={() => {}}
                onInternalLaunch={handleInternalPortalLaunch}
            />
        ) : (
            <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
                <Canvas 
                    nexuses={nexuses} 
                    synapses={synapses} 
                    selectedId={selectedId}
                    onSelectNexus={(id) => { setSelectedId(id); if(id) setIsPropertiesPanelOpen(true); }}
                    onUpdateNexusPosition={(id, x, y) => setNexuses(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n))}
                    onAddSynapse={(s, t, h) => setSynapses(prev => [...prev, { id: generateId('syn'), sourceId: s, targetId: t, sourceHandle: h }])}
                    onDeleteSynapse={(id) => setSynapses(prev => prev.filter(s => s.id !== id))}
                    onOpenProperties={(id) => { setSelectedId(id); setIsPropertiesPanelOpen(true); }}
                    onNexusUpdate={(id, updates) => setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))}
                    onCanvasDrop={(d) => setSpotlightState({ isOpen: true, x: d.x, y: d.y, sourceId: d.sourceId, sourceHandle: d.sourceHandle })}
                />
            </div>
        )}
      </div>

      {isPropertiesPanelOpen && selectedId && (
        <PropertiesPanel 
            nexus={nexuses.find(n => n.id === selectedId) || null} 
            onClose={() => { setIsPropertiesPanelOpen(false); setSelectedId(null); }}
            onUpdate={(id, updates) => setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))}
            onDelete={(id) => { setNexuses(prev => prev.filter(n => n.id !== id)); setSynapses(prev => prev.filter(s => s.sourceId !== id && s.targetId !== id)); setIsPropertiesPanelOpen(false); }}
            credentials={credentials}
            onTest={handleTestNode}
            projectId={currentProject?.id}
        />
      )}

      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)}
        onApplyStream={(newNexuses, newSynapses) => {
            setNexuses(sanitizeNodes(newNexuses));
            setSynapses(newSynapses);
        }}
        currentNexuses={nexuses}
        currentSynapses={synapses}
      />

      <NodeRegistry isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
      <DomainManager isOpen={isDomainManagerOpen} onClose={() => setIsDomainManagerOpen(false)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <RunModal isOpen={isRunModalOpen} onClose={() => setIsRunModalOpen(false)} nexuses={nexuses} synapses={synapses} />
      <Spotlight isOpen={spotlightState.isOpen} position={{ x: spotlightState.x, y: spotlightState.y }} onClose={() => setSpotlightState({ ...spotlightState, isOpen: false })} onSelect={(type, subtype) => {
          const newId = generateId('n');
          setNexuses(prev => [...prev, { id: newId, type, subtype, label: `New ${subtype.replace('_', ' ')}`, position: { x: spotlightState.x, y: spotlightState.y }, config: {}, status: 'idle' }]);
          if (spotlightState.sourceId) {
              setSynapses(prev => [...prev, { id: generateId('syn'), sourceId: spotlightState.sourceId!, targetId: newId, sourceHandle: spotlightState.sourceHandle }]);
          }
      }} />
      <CredentialManager isOpen={isCredentialManagerOpen} onClose={() => setIsCredentialManagerOpen(false)} onUpdate={() => {
          const stored = localStorage.getItem('nexus_credentials');
          if (stored) setCredentials(JSON.parse(stored));
      }} />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  </AuthProvider>
);

export default App;
