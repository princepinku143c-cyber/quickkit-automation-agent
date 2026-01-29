
import React, { useState, useEffect } from 'react';
import { Project, ExecutionLog } from '../types';
import { 
    LayoutGrid, Activity, Play, FileText, CreditCard, LogOut, HelpCircle, Code, ArrowLeft, Unlock, Settings, Zap, ShieldCheck, Globe
} from 'lucide-react';
import { updateProject, getUserProjects } from '../services/projectService';
import { subscribeToLogs } from '../services/cloudStore'; 
import { PortalDashboard } from './client/PortalDashboard';
import { PortalRunner } from './client/PortalRunner';
import { PortalHistory } from './client/PortalHistory';
import { PortalBilling } from './client/PortalBilling';
import { PortalSettings } from './client/PortalSettings';

interface ClientPortalProps {
    projectId: string;
    onClose?: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ projectId, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(true); 
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'WORKFLOW' | 'RESULTS' | 'BILLING' | 'SETTINGS'>('DASHBOARD');
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<ExecutionLog[]>([]);

    useEffect(() => {
        const loadProject = async () => {
            try {
                const projects = await getUserProjects('dev-mode-user'); 
                const found = projects.find(p => p.id === projectId);
                if (found) setProject(found);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadProject();
        const unsubscribeLogs = subscribeToLogs('dev-mode-user', (newLogs) => setLogs(newLogs));
        return () => unsubscribeLogs();
    }, [projectId]);

    const handleSaveSettings = async (variables: Record<string, any>) => {
        if (!project) return;
        const updatedProject = {
            ...project,
            settings: { ...project.settings, clientVariables: variables }
        };
        setProject(updatedProject);
        await updateProject(project.id, { settings: updatedProject.settings });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
            <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Syncing Gateway</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0b10] font-sans text-slate-200 flex selection:bg-blue-500/30">
            {/* SIDEBAR */}
            <div className="w-64 border-r border-white/5 bg-[#0a0b10] flex flex-col fixed inset-y-0 z-20">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-transform hover:scale-105">
                            <Zap size={22} className="text-white" fill="currentColor"/>
                        </div>
                        <div>
                            <h1 className="font-black text-white text-lg tracking-tighter uppercase">Nexus<span className="text-slate-500">Core</span></h1>
                            <div className="flex items-center gap-1.5 text-[8px] text-green-500 font-black uppercase tracking-widest mt-0.5">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span> Production
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-5 space-y-1.5 mt-6">
                    {[
                        { id: 'DASHBOARD', icon: Activity, label: 'Control Center' },
                        { id: 'WORKFLOW', icon: Play, label: 'Execution Hub' },
                        { id: 'RESULTS', icon: FileText, label: 'Audit Stream' },
                        { id: 'BILLING', icon: CreditCard, label: 'Metered Usage' },
                        { id: 'SETTINGS', icon: Globe, label: 'Integrations' }
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)} 
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 group
                                ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'}/> 
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 border-t border-white/5 space-y-4">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase mb-1.5">
                            <ShieldCheck size={12}/> System Health 99.9%
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[99.9%]"></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-900/20 transition-all">
                        <ArrowLeft size={16}/> Back to Architect
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 ml-64 p-12 overflow-y-auto custom-scrollbar">
                <header className="flex justify-between items-start mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">Enterprise Portal • Synchronized</div>
                        <h2 className="text-4xl font-black text-white mb-3 tracking-tighter">{activeTab.replace('_', ' ')}</h2>
                        <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/5">
                             <span className="text-blue-400">ID: {projectId}</span>
                             <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                             <span>PROJECT: {project?.title}</span>
                        </div>
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {activeTab === 'DASHBOARD' && <PortalDashboard logs={logs} project={project} />}
                    {activeTab === 'WORKFLOW' && project && <PortalRunner project={project} onSaveSettings={handleSaveSettings} />}
                    {activeTab === 'RESULTS' && <PortalHistory logs={logs} />}
                    {activeTab === 'BILLING' && <PortalBilling logs={logs} />}
                    {activeTab === 'SETTINGS' && <PortalSettings projectId={projectId} />}
                </div>
            </div>
        </div>
    );
};

export default ClientPortal;
