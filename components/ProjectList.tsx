
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Search, Plus, Trash2, Layout, Clock, Edit2, CheckCircle, FileText, RefreshCw } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (title: string, desc: string) => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onRefresh?: () => void; // New Prop
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onCreateProject, onOpenProject, onDeleteProject, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | ProjectStatus>('ALL');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter Logic
  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'ALL' || p.status === activeTab;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle, newDesc);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleManualRefresh = () => {
    if (onRefresh) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Relative Time Helper
  const formatTimeAgo = (timestamp: number) => {
    const diff = (Date.now() - timestamp) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'DRAFT': return <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-[9px] font-bold border border-gray-700 uppercase">DRAFT</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[9px] font-bold border border-blue-800 uppercase">IN PROGRESS</span>;
      case 'COMPLETED': return <span className="px-2 py-0.5 rounded bg-nexus-success/10 text-nexus-success text-[9px] font-bold border border-nexus-success/30 uppercase flex items-center gap-1"><CheckCircle size={8}/> DONE</span>;
    }
  };

  return (
    <div className="flex-1 h-full bg-[#050505] overflow-y-auto p-6 md:p-10 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-2">
            <Layout className="text-nexus-accent" /> My Projects
            <span className="text-xs bg-nexus-800 text-gray-400 px-2 py-1 rounded-full font-mono">{projects.length}</span>
          </h1>
          <p className="text-gray-400 text-sm">Manage your automation workflows and drafts.</p>
        </div>
        <div className="flex gap-3">
             {onRefresh && (
                 <button 
                    onClick={handleManualRefresh}
                    className="p-3 bg-nexus-900 border border-nexus-800 rounded-xl hover:bg-nexus-800 text-gray-400 hover:text-white transition-all"
                    title="Force Refresh List"
                 >
                     <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                 </button>
             )}
            <button 
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-nexus-accent text-black font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
            >
              <Plus size={18} /> New Project
            </button>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-nexus-900 border border-nexus-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-4">Start New Draft</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lead Generation Bot"
                  className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white focus:border-nexus-accent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description..."
                  className="w-full bg-nexus-950 border border-nexus-800 rounded-lg p-3 text-white h-20 resize-none focus:border-nexus-accent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-nexus-800 text-gray-400 rounded-lg font-bold hover:text-white">Cancel</button>
                <button type="submit" disabled={!newTitle.trim()} className="flex-1 py-3 bg-nexus-accent text-black rounded-lg font-bold disabled:opacity-50">Create Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-nexus-900 p-1 rounded-xl border border-nexus-800 self-start">
          {(['ALL', 'DRAFT', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-nexus-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-nexus-900 border border-nexus-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-nexus-700 outline-none"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map(project => (
          <div 
            key={project.id} 
            onClick={() => onOpenProject(project)}
            className="group relative bg-nexus-900/50 hover:bg-nexus-900 border border-nexus-800 hover:border-nexus-700 rounded-2xl p-5 cursor-pointer transition-all hover:translate-y-[-4px] flex flex-col h-[200px]"
          >
            <div className="flex justify-between items-start mb-3">
              {getStatusBadge(project.status)}
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                className="text-nexus-800 group-hover:text-red-500 transition-colors p-1"
                title="Delete Project"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <h3 className="font-bold text-white text-lg mb-1 truncate" title={project.title}>{project.title}</h3>
            <p className="text-gray-500 text-xs line-clamp-2 h-8 mb-4">
              {project.description || "No description provided."}
            </p>

            <div className="mt-auto pt-3 border-t border-nexus-800 flex items-center justify-between text-[10px] text-gray-600">
               <div className="flex items-center gap-1.5" title={`Created: ${new Date(project.createdAt).toLocaleDateString()}`}>
                 <Clock size={12} />
                 {project.status === 'COMPLETED' ? 'Completed' : 'Updated'} {formatTimeAgo(project.updatedAt)}
               </div>
               <button className="flex items-center gap-1 text-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                 Edit <Edit2 size={10} />
               </button>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-nexus-800 rounded-2xl bg-nexus-900/20">
            <div className="w-16 h-16 bg-nexus-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-600" />
            </div>
            <h3 className="text-gray-300 font-bold mb-1">No projects found</h3>
            <p className="text-gray-600 text-sm">Create a new draft to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
