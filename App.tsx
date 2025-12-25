
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import AIAssistant from './components/AIAssistant';
import DomainManager from './components/DomainManager';
import ProjectList from './components/ProjectList'; 
import { Nexus, Synapse, NexusType, NexusSubtype, UserPlan, Project, ProjectStatus } from './types';
import { Play, Activity, Sparkles, Menu, Crown, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import { runAgentWithTools } from './services/geminiService';
import { AuthProvider, useAuth } from './context/AuthContext';
import PricingModal from './components/PricingModal';
import { checkAndSyncSubscription } from './services/cloudStore';
import { createProject, subscribeToProjects, updateProject, deleteProject, getUserProjects } from './services/projectService';

const AppContent: React.FC = () => {
  const { user, authError, clearAuthError } = useAuth();
  
  // View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Editor State
  const [nexuses, setNexuses] = useState<Nexus[]>([]);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isDomainManagerOpen, setIsDomainManagerOpen] = useState(false);
  
  // Save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<number>(Date.now());

  // Plan State
  const [plan, setPlan] = useState<UserPlan>({
    uid: '', email: '', tier: 'FREE', region: 'IN', status: 'active', expiresAt: 0, updatedAt: Date.now(), autoRenew: false
  });

  // Auto-Save Refs
  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // --- ERROR MONITORING ---
  useEffect(() => {
    if (authError === 'unauthorized-domain') {
        setIsDomainManagerOpen(true);
        // We do not clear the error immediately to allow the modal to pick up the "AUTH" tab state
    }
  }, [authError]);

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    let unsubscribeProjects: () => void = () => {};

    if (user) {
      console.log("👤 User authenticated:", user.uid);
      
      // 1. Sync Plan
      checkAndSyncSubscription(user.uid).then(setPlan).catch(console.error);

      // 2. Subscribe to Projects (Real-time)
      unsubscribeProjects = subscribeToProjects(user.uid, (updatedProjects) => {
          console.log("App received projects:", updatedProjects.length);
          setProjects(updatedProjects);
      });
    } else {
        setProjects([]);
    }

    return () => {
        unsubscribeProjects();
    };
  }, [user]);

  // --- PROJECT MANAGEMENT HANDLERS ---

  const handleManualRefresh = async () => {
      if (!user) return;
      console.log("Manually refreshing projects...");
      const fetched = await getUserProjects(user.uid);
      setProjects(fetched);
  };

  const handleCreateProject = async (title: string, desc: string) => {
      if (!user) return alert("Please sign in to create projects.");
      
      try {
          const newProject = await createProject({ 
            title: title, 
            description: desc 
          });
          
          handleOpenProject(newProject);
          
      } catch (e: any) { 
          console.error("❌ CREATE PROJECT FAILED:", e);
          
          if (e.message.includes("Permission Denied") || e.message.includes("permission-denied")) {
             alert("⛔ PERMISSION DENIED\n\nFirebase Rules are blocking the write operation. Please check the browser console for details.");
          } else {
             alert(`ERROR: ${e.message}`);
          }
      }
  };

  const handleOpenProject = (project: Project) => {
      setCurrentProject(project);
      setNexuses(project.nexuses || []);
      setSynapses(project.synapses || []);
      setLastSavedTime(project.lastSavedAt || Date.now());
      setCurrentView('editor');
      isFirstLoad.current = true;
      setSaveStatus('saved');
  };

  const handleDeleteProject = async (id: string) => {
      if (confirm("Are you sure? This cannot be undone.")) {
          try {
              await deleteProject(id);
              if (currentProject?.id === id) {
                  setCurrentView('dashboard');
                  setCurrentProject(null);
              }
          } catch (e: any) {
              alert("Failed to delete project: " + e.message);
          }
      }
  };

  const handleMarkCompleted = async () => {
    if (!currentProject) return;
    
    // Explicit Confirmation
    const confirmComplete = window.confirm("Mark this project as COMPLETED?\n\nYou can still edit it later, but the status will change.");
    if (confirmComplete) {
        const updated = { ...currentProject, status: 'COMPLETED' as ProjectStatus };
        setCurrentProject(updated);
        await updateProject(currentProject.id, { status: 'COMPLETED' });
        alert("Project marked as Completed!");
    }
  };

  // --- AUTO-SAVE LOGIC (DEBOUNCED) ---
  useEffect(() => {
      if (!currentProject || currentView !== 'editor') return;

      if (isFirstLoad.current) {
          isFirstLoad.current = false;
          return;
      }

      setSaveStatus('dirty');

      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

      autoSaveTimeout.current = setTimeout(async () => {
          setSaveStatus('saving');
          try {
              await updateProject(currentProject.id, { nexuses, synapses });
              setSaveStatus('saved');
              setLastSavedTime(Date.now());
              
              setCurrentProject(prev => prev ? { ...prev, nexuses, synapses } : null);
          } catch (e) {
              console.error("Auto-save failed", e);
              setSaveStatus('dirty');
          }
      }, 3000);

      return () => {
          if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      };
  }, [nexuses, synapses]);

  // Relative Time Helper for Editor Header
  const getTimeSinceSave = () => {
      const seconds = Math.floor((Date.now() - lastSavedTime) / 1000);
      if (seconds < 5) return 'Just now';
      if (seconds < 60) return `${seconds}s ago`;
      return `${Math.floor(seconds / 60)}m ago`;
  };

  // --- EXECUTION LOGIC ---
  const executeStream = async () => {
    if (isRunning) return;
    setIsRunning(true);
    const apiKey = process.env.API_KEY || ""; 
    let flowData: Record<string, any> = {}; 
    try {
        const triggers = nexuses.filter(n => n.type === NexusType.TRIGGER);
        for (const trigger of triggers) {
            setNexuses(prev => prev.map(n => n.id === trigger.id ? { ...n, status: 'running' } : n));
            const triggerResult = { source: trigger.subtype, timestamp: Date.now(), data: "Triggered" };
            flowData[trigger.id] = triggerResult;
            setNexuses(prev => prev.map(n => n.id === trigger.id ? { ...n, status: 'success', lastOutput: triggerResult } : n));
            
            let queue = synapses.filter(s => s.sourceId === trigger.id).map(s => s.targetId);
            let visited = new Set<string>();
            
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (visited.has(currentId)) continue;
                visited.add(currentId);
                const node = nexuses.find(n => n.id === currentId);
                if (!node) continue;
                
                setNexuses(prev => prev.map(n => n.id === node.id ? { ...n, status: 'running' } : n));
                let output: any = null;
                
                try {
                    if (node.subtype === NexusSubtype.SUBSCRIPTION_CHECK) {
                        output = { isPro: plan.tier !== 'FREE', expiresAt: plan.expiresAt };
                        if (plan.tier === 'FREE') throw new Error("Upgrade to PRO required");
                    } else if (node.subtype === NexusSubtype.AGENT) {
                        const res = await runAgentWithTools(node.config, node.config.prompt || "", apiKey, Object.values(flowData));
                        output = { text: res.text };
                    } else {
                        output = { status: 'ok', time: Date.now() };
                    }

                    flowData[node.id] = output;
                    setNexuses(prev => prev.map(n => n.id === node.id ? { ...n, status: 'success', lastOutput: output } : n));
                    queue.push(...synapses.filter(s => s.sourceId === node.id).map(s => s.targetId));
                } catch (err: any) {
                    setNexuses(prev => prev.map(n => n.id === node.id ? { ...n, status: 'error', lastOutput: err.message } : n));
                    break;
                }
            }
        }
    } finally {
        setIsRunning(false);
    }
  };

  return (
    <div className={`flex h-screen bg-[#050505] text-white font-sans overflow-hidden`}>
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} onUpgrade={(p) => setPlan(p)} />
      
      <DomainManager 
        isOpen={isDomainManagerOpen} 
        onClose={() => { setIsDomainManagerOpen(false); clearAuthError(); }} 
        initialTab={authError === 'unauthorized-domain' ? 'AUTH' : 'DNS'}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onAddNexus={(t, st) => {
            const newId = `n-${Date.now()}`;
            setNexuses([...nexuses, { id: newId, type: t, subtype: st, label: `New ${st}`, position: { x: 400, y: 300 }, config: {}, status: 'idle' }]);
            setSelectedId(newId);
            setIsPropertiesPanelOpen(true);
        }} 
        onLoadBlueprint={(bp) => { setNexuses(bp.nexuses); setSynapses(bp.synapses); }} 
        onClear={() => { setNexuses([]); setSynapses([]); }} 
        onOpenSettings={() => {}} 
        onNavigateProjects={() => { setCurrentView('dashboard'); setCurrentProject(null); }}
        currentView={currentView}
        currentStream={{ nexuses, synapses }}
      />
      
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        
        {/* HEADER */}
        <header className="h-14 border-b border-nexus-800 bg-nexus-900/90 flex items-center justify-between px-4 z-30 shrink-0">
           <div className="flex items-center gap-4">
               <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400"><Menu size={20}/></button>
               
               {currentView === 'editor' && currentProject ? (
                 <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('dashboard')} className="p-1 hover:bg-nexus-800 rounded text-gray-500 hover:text-white">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="flex flex-col">
                        <input 
                            value={currentProject.title}
                            onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProject(p => p ? {...p, title: val} : null);
                            }}
                            onBlur={() => updateProject(currentProject.id, { title: currentProject.title })}
                            className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-nexus-700 w-32 sm:w-64"
                        />
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] text-gray-500 uppercase flex items-center gap-1 min-w-[100px]">
                                {saveStatus === 'saving' ? (
                                    <><Activity size={8} className="animate-spin text-yellow-500"/> Saving...</>
                                ) : saveStatus === 'saved' ? (
                                    <><CheckCircle size={8} className="text-nexus-success"/> Saved {getTimeSinceSave()}</>
                                ) : (
                                    <span className="text-gray-500">Unsaved changes</span>
                                )}
                             </span>
                        </div>
                    </div>
                 </div>
               ) : (
                 <h1 className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                    <span className="text-nexus-accent">Nexus</span>Stream
                    {plan.tier !== 'FREE' && (
                     <div className="group relative ml-2">
                        <div className="bg-nexus-accent/10 border border-nexus-accent/30 px-2 py-0.5 rounded flex items-center gap-1 cursor-help">
                            <Crown size={10} className="text-nexus-accent"/>
                            <span className="text-[8px] font-black text-nexus-accent uppercase">{plan.tier}</span>
                        </div>
                     </div>
                   )}
                 </h1>
               )}
           </div>

           <div className="flex items-center gap-3">
              {currentView === 'editor' && (
                <>
                  <button 
                    onClick={() => setIsAIAssistantOpen(true)}
                    className="p-2 bg-nexus-800 hover:bg-nexus-700 rounded-lg transition-all flex items-center gap-2 border border-nexus-700 group shadow-[0_0_15px_rgba(0,255,157,0.1)]"
                  >
                      <Sparkles size={16} className="text-nexus-accent group-hover:rotate-12 transition-transform"/>
                      <span className="text-[10px] font-black uppercase hidden sm:inline tracking-widest">Architect</span>
                  </button>

                  <div className="h-6 w-px bg-nexus-800 mx-1" />
                  
                  {currentProject?.status === 'COMPLETED' ? (
                      <div className="px-3 py-1.5 bg-nexus-success/20 text-nexus-success border border-nexus-success/50 rounded-lg text-xs font-bold flex items-center gap-2">
                         <CheckCircle size={14}/> Completed
                      </div>
                  ) : (
                      <button onClick={handleMarkCompleted} className="px-3 py-1.5 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-2">
                         <CheckCircle size={14} /> Mark Done
                      </button>
                  )}

                  <button onClick={executeStream} disabled={isRunning} className="bg-nexus-accent text-black px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-105 disabled:opacity-50 shadow-[0_0_15px_rgba(0,255,157,0.4)]">
                    {isRunning ? <Activity size={14} className="animate-spin" /> : <Play size={14} fill="black"/>} 
                    RUN
                  </button>
                </>
              )}
           </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden">
            {currentView === 'dashboard' ? (
                <ProjectList 
                    projects={projects} 
                    onCreateProject={handleCreateProject}
                    onOpenProject={handleOpenProject}
                    onDeleteProject={handleDeleteProject}
                    onRefresh={handleManualRefresh}
                />
            ) : (
                <>
                    <Canvas 
                        nexuses={nexuses} synapses={synapses} selectedId={selectedId} 
                        onSelectNexus={setSelectedId} 
                        onUpdateNexusPosition={(id, x, y) => setNexuses(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n))} 
                        onAddSynapse={(s, t, h) => setSynapses([...synapses, { id: `syn-${Date.now()}`, sourceId: s, targetId: t, sourceHandle: h }])} 
                        onDeleteSynapse={(id) => setSynapses(prev => prev.filter(s => s.id !== id))} 
                        onOpenProperties={(id) => { setSelectedId(id); setIsPropertiesPanelOpen(true); }} 
                    />
                    
                    {isPropertiesPanelOpen && selectedId && (
                        <PropertiesPanel 
                            nexus={nexuses.find(n => n.id === selectedId) || null} 
                            onClose={() => setIsPropertiesPanelOpen(false)} 
                            onUpdate={(id, up) => setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...up } : n))} 
                            onDelete={(id) => { setNexuses(prev => prev.filter(n => n.id !== id)); setSynapses(prev => prev.filter(s => s.sourceId !== id && s.targetId !== id)); setIsPropertiesPanelOpen(false); }} 
                        />
                    )}

                    <AIAssistant 
                        isOpen={isAIAssistantOpen} 
                        onClose={() => setIsAIAssistantOpen(false)} 
                        onApplyStream={(n, s) => { setNexuses(n); setSynapses(s); }} 
                        onOpenSettings={() => {}} 
                        currentNexuses={nexuses} 
                        currentSynapses={synapses} 
                    />
                </>
            )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => <AuthProvider><AppContent /></AuthProvider>;
export default App;
