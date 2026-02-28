
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, PlanTier } from '../types';
import { Search, Plus, Trash2, Layout, Clock, PlayCircle, ShieldAlert, WifiOff, Lock, Activity, Calendar, Zap, CreditCard } from 'lucide-react';
import { checkDbConnection } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { PLAN_LIMITS } from '../constants';

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (title: string, desc: string) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onRefresh?: () => void;
  onInternalLaunch?: (projectId: string) => void; 
  userPlan?: PlanTier;
  onUpgrade?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onCreateProject, onOpenProject, onDeleteProject, onRefresh, onInternalLaunch, userPlan = 'FREE', onUpgrade }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | ProjectStatus>('ALL');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'LOCKED' | 'OFFLINE'>('CONNECTED');

  useEffect(() => {
      checkDbConnection().then(res => setDbStatus(res ? 'CONNECTED' : 'OFFLINE'));
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'ALL' || p.status === activeTab;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle, newDesc);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-500 text-[9px] font-black border border-gray-700">DRAFT</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[9px] font-black border border-blue-800">ACTIVE</span>;
      case 'COMPLETED': return <span className="px-2 py-0.5 rounded bg-nexus-success/10 text-nexus-success text-[9px] font-black border border-nexus-success/30 flex items-center gap-1">DONE</span>;
    }
  };

  // LIMITS & STATS
  const currentLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const projectLimit = currentLimits.PROJECTS;
  const isLimitReached = projects.length >= projectLimit;
  
  // Safe Usage Data
  const runsUsed = (user as any)?.usage?.runs || 0;
  const planExpiry = (user as any)?.expiresAt ? new Date((user as any).expiresAt).toLocaleDateString() : null;

  return (
    <div className="flex-1 h-full bg-[#050505] overflow-y-auto p-6 md:p-10 font-sans">
      
      {/* 🧱 3️⃣ CLEAN DASHBOARD STATUS WIDGET */}
      <div className="bg-gray-100 p-4 md:p-6 rounded-2xl mb-10 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 self-start md:self-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                  <CreditCard size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Current Plan</p>
                  <div className="text-xl md:text-2xl font-black text-gray-900 uppercase">{userPlan}</div>
              </div>
          </div>

          <div className="flex-1 w-full md:w-auto md:px-8 md:border-l border-gray-300">
              <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-600 mb-1">
                  <span>Runs (AI Executions)</span>
                  <span>{runsUsed} / {currentLimits.RUNS}</span>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-gray-300 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min((runsUsed / currentLimits.RUNS) * 100, 100)}%` }}></div>
              </div>

              {/* PROJECT STORAGE METER */}
              <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-600 mb-1">
                  <span>Saved Workflows</span>
                  <span>{projects.length} / {userPlan === 'FREE' ? projectLimit : '∞'}</span>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div className={`h-full ${isLimitReached && userPlan === 'FREE' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${userPlan === 'FREE' ? Math.min((projects.length / projectLimit) * 100, 100) : 100}%` }}></div>
              </div>

              {planExpiry && (
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-2 font-mono">
                      Valid Till: {planExpiry}
                  </p>
              )}
          </div>

          {userPlan === 'FREE' && (
              <button 
                onClick={onUpgrade}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs md:text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                  Upgrade Now
              </button>
          )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Layout className="text-nexus-accent" /> Workspaces
            <span className="text-xs bg-nexus-800 text-gray-500 px-2 py-1 rounded-lg font-mono">{projects.length} / {userPlan === 'FREE' ? projectLimit : '∞'}</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">Manage and deploy your automated workflows.</p>
        </div>
        <div className="flex gap-3">
             {/* Show DB Status only if locked/offline */}
             {dbStatus !== 'CONNECTED' && !user?.isAnonymous && (
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${dbStatus === 'LOCKED' ? 'bg-red-900/20 border-red-800 text-red-500' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                     {dbStatus === 'LOCKED' ? <ShieldAlert size={14}/> : <WifiOff size={14}/>}
                     <span className="text-[9px] font-black uppercase">{dbStatus === 'LOCKED' ? 'Rules Restricted' : 'Offline'}</span>
                 </div>
             )}

             {isLimitReached ? (
                 <button 
                    onClick={onUpgrade}
                    className="p-3 bg-nexus-900 text-gray-500 border border-nexus-800 rounded-xl hover:bg-nexus-800 hover:text-white transition-all flex items-center gap-2 shadow-lg group"
                    title="Limit Reached"
                 >
                    <Lock size={18} className="group-hover:text-nexus-accent" />
                    <span className="text-[10px] font-black uppercase hidden md:inline">Upgrade Plan</span>
                 </button>
             ) : (
                 <button 
                  onClick={() => setIsCreating(true)}
                  className="p-3 bg-nexus-900 text-nexus-accent border border-nexus-800 rounded-xl hover:bg-nexus-800 transition-all flex items-center gap-2 shadow-lg"
                  title="Create New Workspace"
                >
                  <Plus size={18} />
                </button>
             )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-white/5 w-full max-w-md rounded-[32px] p-8 shadow-3xl">
            <h2 className="text-2xl font-black text-white mb-6">Create Workspace</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Title</label>
                <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Content Automation" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white focus:border-nexus-accent outline-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Purpose</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this do?" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white h-24 resize-none focus:border-nexus-accent outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 bg-nexus-900 text-gray-400 rounded-2xl font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={!newTitle.trim()} className="flex-1 py-4 bg-nexus-accent text-black rounded-2xl font-black disabled:opacity-50 shadow-lg">Start Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-nexus-900 p-1 rounded-xl border border-white/5 self-start">
          {(['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workspaces..." className="w-full bg-nexus-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-nexus-accent outline-none font-medium" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} onClick={() => onOpenProject(project)} className="group bg-[#0a0a0a] border border-white/5 hover:border-nexus-accent/30 rounded-[24px] p-6 cursor-pointer transition-all hover:-translate-y-1 flex flex-col h-[240px] shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              {getStatusBadge(project.status)}
              <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="text-gray-700 hover:text-red-500 p-1 transition-colors"><Trash2 size={14} /></button>
            </div>
            <h3 className="font-bold text-white text-lg mb-2 truncate group-hover:text-nexus-accent transition-colors relative z-10">{project.title}</h3>
            <p className="text-gray-500 text-xs line-clamp-3 mb-4 leading-relaxed relative z-10">{project.description || "System workflow operational."}</p>
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                 <Clock size={12} /> {new Date(project.updatedAt).toLocaleDateString()}
               </div>
               <div className="p-2 bg-nexus-900 rounded-lg group-hover:bg-nexus-accent group-hover:text-black transition-all">
                  <PlayCircle size={16} />
               </div>
            </div>
            {/* Subtle card glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-nexus-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
        
        {/* Helper Card for Free Plan Limit Context */}
        {userPlan === 'FREE' && projects.length === 0 && (
            <div className="bg-nexus-900/20 border-2 border-dashed border-nexus-800 rounded-[24px] p-6 flex flex-col items-center justify-center text-center opacity-60">
                <p className="text-xs text-gray-500 mb-2">Free Plan Limit: {projectLimit} Projects</p>
                <div className="text-[10px] text-gray-600">Create your first automation to get started.</div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
