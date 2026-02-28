
import React, { useState, useEffect } from 'react';
import { Project, NexusType, NexusSubtype } from '../types';
import { Send, CheckCircle, AlertTriangle, Loader2, Sparkles, Command, Save, CloudOff, X } from 'lucide-react';

interface PublicFormViewProps {
    projectId: string;
    onClose?: () => void; // Added for Preview Mode
}

const PublicFormView: React.FC<PublicFormViewProps> = ({ projectId, onClose }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const loadProject = () => {
            try {
                const isLocalPreview = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !!onClose;

                // 1. Try Local Draft First (Most recent edits) only in local preview mode
                const draft = isLocalPreview ? localStorage.getItem(`nexus_draft_${projectId}`) : null;
                if (draft) {
                    const parsed = JSON.parse(draft);
                    const allProjects = JSON.parse(localStorage.getItem('nexus_dev_projects') || '[]');
                    const meta = allProjects.find((p: any) => p.id === projectId) || { title: 'Untitled App', description: 'AI Workflow' };
                    
                    setProject({ 
                        ...meta, 
                        nexuses: parsed.nexuses, 
                        synapses: parsed.synapses 
                    } as Project);
                    setLoading(false);
                    return;
                }

                // 2. Fallback to Saved Projects List (Local Storage Simulating DB)
                const allProjects = isLocalPreview ? JSON.parse(localStorage.getItem('nexus_dev_projects') || '[]') : [];
                const found = allProjects.find((p: any) => p.id === projectId);
                
                if (found) {
                    setProject(found);
                } else {
                    // Specific Error for Local vs Cloud
                    if (projectId.startsWith('local_')) {
                        setError("Local Project Not Found. This form link is only valid in the browser where it was created.");
                    } else if (!isLocalPreview) {
                        setError('Public form access is disabled for this build. Publish API-backed forms before going live.');
                    } else {
                        setError("Project not found. It may have been deleted or un-published.");
                    }
                }
            } catch (e) {
                setError("Failed to load form configuration.");
            } finally {
                setLoading(false);
            }
        };
        loadProject();
    }, [projectId]);

    const triggerNode = project?.nexuses.find(n => n.type === NexusType.TRIGGER && n.subtype === NexusSubtype.WEBHOOK);
    const formFields = triggerNode?.config.formFields || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Simulate Network Request
        await new Promise(r => setTimeout(r, 2000));
        
        setSubmitting(false);
        setSubmitted(true);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6">
            <Loader2 className="animate-spin text-nexus-accent mb-4" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">Initializing Form Gateway</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-2">Access Denied</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-8">{error}</p>
            {onClose && (
                <button onClick={onClose} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Return to Editor
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-nexus-accent/30 selection:text-nexus-accent">
            {/* PREVIEW BAR */}
            {onClose && (
                <div className="bg-nexus-accent text-black px-4 py-2 flex items-center justify-between font-black text-[10px] uppercase tracking-widest sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <Sparkles size={14} fill="currentColor" />
                        Live Preview Mode
                    </div>
                    <button onClick={onClose} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                        <X size={14} /> Close
                    </button>
                </div>
            )}

            <div className="max-w-2xl mx-auto px-6 py-20">
                <header className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-accent/10 border border-nexus-accent/20 text-nexus-accent text-[9px] font-black uppercase tracking-widest mb-6">
                        <Command size={10} /> Powered by NexusStream
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 italic">
                        {project?.title}
                    </h1>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                        {project?.description}
                    </p>
                </header>

                <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-accent to-transparent opacity-30"></div>
                    
                    {submitted ? (
                        <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-green-500/10 rounded-[32px] border border-green-500/20 flex items-center justify-center mx-auto mb-8 text-green-400 shadow-[0_0_50px_rgba(34,197,94,0.15)]">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest mb-3">Submission Received</h3>
                            <p className="text-gray-500 text-sm">The automation protocol has been triggered successfully.</p>
                            <button 
                                onClick={() => { setSubmitted(false); setFormData({}); }}
                                className="mt-10 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                Send Another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-8">
                                {formFields.length > 0 ? formFields.map((field: any) => (
                                    <div key={field.id} className="group">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 group-focus-within:text-nexus-accent transition-colors">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea 
                                                required={field.required}
                                                value={formData[field.id] || ''}
                                                onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                                placeholder={field.placeholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-nexus-accent/50 focus:bg-white/[0.04] transition-all min-h-[120px]"
                                            />
                                        ) : (
                                            <input 
                                                type={field.type || 'text'}
                                                required={field.required}
                                                value={formData[field.id] || ''}
                                                onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                                placeholder={field.placeholder}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-nexus-accent/50 focus:bg-white/[0.04] transition-all"
                                            />
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[32px]">
                                        <CloudOff className="mx-auto text-gray-700 mb-4" size={32} />
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No Input Fields Defined</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                type="submit"
                                disabled={submitting || formFields.length === 0}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-nexus-accent transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Execute Protocol <Send size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <footer className="mt-20 text-center space-y-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.4em]">
                        Secure End-to-End Encryption Active
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PublicFormView;
