
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import AIAssistant from './components/AIAssistant';
import RunModal from './components/RunModal';
import NodeRegistry from './components/NodeRegistry';
import RoadmapModal from './components/RoadmapModal';
import ProjectList from './components/ProjectList';
import NexusMascot from './components/NexusMascot';
import { Nexus, Synapse, Project, ExecutionState } from './types';
import { Play, Cloud, CheckCircle2, RotateCcw, Activity, Info, ShieldCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeToProjects, updateProject, createProject, deleteProject } from './services/projectService';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [nexuses, setNexuses] = useState<Nexus[]>([]);
  const [synapses, setSynapses] = useState<Synapse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'dirty' | 'saving'>('synced');
  const [interruptedState, setInterruptedState] = useState<ExecutionState | null>(null);

  // Persistence Engine: Check for interrupted runs on app boot
  useEffect(() => {
    const saved = localStorage.getItem('nexus_interrupted_execution');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.status === 'RUNNING') setInterruptedState(state);
      } catch (e) {}
    }
  }, []);

  const handleResume = () => {
    setIsRunModalOpen(true);
  };

  const handleDiscardResume = () => {
    localStorage.removeItem('nexus_interrupted_execution');
    setInterruptedState(null);
  };

  // Sync Projects from Cloud/LocalDB
  useEffect(() => {
    if (user) {
      const unsub = subscribeToProjects(user.uid, (data) => {
          setProjects(data);
      });
      return () => unsub();
    }
  }, [user]);

  const handleCreateNewProject = async (title: string, desc: string) => {
      const newP = await createProject({ title, description: desc });
      handleOpenProject(newP);
  };

  const handleOpenProject = (p: Project) => {
    setCurrentProject(p);
    setNexuses(p.nexuses || []);
    setSynapses(p.synapses || []);
    setCurrentView('editor');
  };

  const handleDeleteProject = async (id: string) => {
      if(window.confirm("Are you sure? This will delete the workflow forever.")) {
          await deleteProject(id);
      }
  };

  const handleSave = async () => {
    if (!currentProject) return;
    setSyncStatus('saving');
    await updateProject(currentProject.id, { nexuses, synapses });
    setSyncStatus('synced');
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative">
      
      {/* FLOATING RESUME PROTOCOL */}
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
        onAddNexus={(type, subtype) => {
            const id = `n-${Date.now()}`;
            setNexuses([...nexuses, { id, type, subtype, label: `New ${subtype}`, position: { x: 400, y: 300 }, config: {}, status: 'idle' }]);
            setSelectedId(id);
            setIsPropertiesOpen(true);
            setSyncStatus('dirty');
        }}
        onLoadBlueprint={(bp) => { 
            setNexuses(bp.nexuses); 
            setSynapses(bp.synapses); 
            setSyncStatus('dirty');
        }}
        onClear={() => { setNexuses([]); setSynapses([]); setSyncStatus('dirty'); }}
        onOpenSettings={() => {}}
        onNavigateProjects={() => setCurrentView('dashboard')}
        currentView={currentView}
        onOpenRegistry={() => setIsRegistryOpen(true)}
      />

      <div className="flex-1 flex flex-col relative h-full">
        {/* TOP BAR */}
        <div className="h-14 bg-nexus-950/90 border-b border-nexus-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-xs uppercase tracking-widest text-gray-400">
               {currentView === 'dashboard' ? 'SYS_WORKSPACE' : currentProject?.title}
            </h1>
            {currentView === 'editor' && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} className={syncStatus === 'synced' ? 'text-nexus-success' : 'text-nexus-wire'} />
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{syncStatus === 'synced' ? 'ENCRYPTED_SYNC' : 'DIRTY_STATE (CTRL+S)'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setIsRoadmapOpen(true)} className="p-2.5 text-gray-500 hover:text-nexus-accent hover:bg-white/5 rounded-xl transition-all" title="System Capabilities">
                <Info size={18} />
             </button>
             {currentView === 'editor' && (
               <>
                 <button onClick={handleSave} className="px-4 py-1.5 bg-nexus-900 border border-nexus-800 text-gray-400 rounded-lg text-[9px] font-black uppercase hover:text-white transition-all">
                    <Cloud size={14} className="inline mr-2" /> Push State
                 </button>
                 <button onClick={() => setIsRunModalOpen(true)} className="px-5 py-1.5 bg-nexus-accent text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <Play size={14} fill="currentColor" /> Start Pulse
                 </button>
               </>
             )}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {currentView === 'dashboard' ? (
            <ProjectList 
                projects={projects} 
                onCreateProject={handleCreateNewProject} 
                onOpenProject={handleOpenProject} 
                onDeleteProject={handleDeleteProject} 
            />
          ) : (
            <>
                <Canvas 
                  nexuses={nexuses} synapses={synapses} selectedId={selectedId}
                  onSelectNexus={setSelectedId}
                  onUpdateNexusPosition={(id, x, y) => {
                      setNexuses(prev => prev.map(n => n.id === id ? { ...n, position: { x, y } } : n));
                      setSyncStatus('dirty');
                  }}
                  onAddSynapse={(s, t, h) => {
                      setSynapses(prev => [...prev, { id: `syn-${Date.now()}`, sourceId: s, targetId: t, sourceHandle: h }]);
                      setSyncStatus('dirty');
                  }}
                  onDeleteSynapse={(id) => {
                      setSynapses(prev => prev.filter(s => s.id !== id));
                      setSyncStatus('dirty');
                  }}
                  onOpenProperties={() => setIsPropertiesOpen(true)}
                  onNexusUpdate={(id, up) => {
                      setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...up } : n));
                      setSyncStatus('dirty');
                  }}
                />
                
                {isPropertiesOpen && (
                    <PropertiesPanel 
                        nexus={nexuses.find(n => n.id === selectedId) || null} 
                        onClose={() => setIsPropertiesOpen(false)}
                        onUpdate={(id, up) => {
                            setNexuses(prev => prev.map(n => n.id === id ? { ...n, ...up } : n));
                            setSyncStatus('dirty');
                        }}
                        onDelete={(id) => {
                            setNexuses(prev => prev.filter(n => n.id !== id));
                            setSynapses(prev => prev.filter(s => s.sourceId !== id && s.targetId !== id));
                            setSelectedId(null);
                            setIsPropertiesOpen(false);
                            setSyncStatus('dirty');
                        }}
                    />
                )}
            </>
          )}
        </div>
      </div>

      <AIAssistant 
        isOpen={false} onClose={() => {}} 
        onApplyStream={(n, s) => { 
            setNexuses(n); 
            setSynapses(s); 
            setSyncStatus('dirty');
        }}
        currentNexuses={nexuses} currentSynapses={synapses}
      />

      <NodeRegistry isOpen={isRegistryOpen} onClose={() => setIsRegistryOpen(false)} />
      <RoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
      <RunModal 
        isOpen={isRunModalOpen} 
        onClose={() => { setIsRunModalOpen(false); setInterruptedState(null); }} 
        nexuses={nexuses} synapses={synapses} 
        resumeState={interruptedState}
      />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
