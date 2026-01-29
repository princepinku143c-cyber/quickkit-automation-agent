
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
                // 1. Try Local Draft First (Most recent edits)
                const draft = localStorage.getItem(`nexus_draft_${projectId}`);
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
                const allProjects = JSON.parse(localStorage.getItem('nexus_dev_projects') || '[]');
                const found = allProjects.find((p: any) => p.id === projectId);
                
                if (found) {
                    setProject(found);
                } else {
                    // Specific Error for Local vs Cloud
                    if (projectId.startsWith('local_')) {
                        setError("Local Project Not Found. This form link is only valid in the browser where it was created.");
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
        <div className="min-h-screen bg-white flex items-center justify-center relative">
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X size={20} className="text-gray-600"/>
                </button>
            )}
            <Loader2 className="animate-spin text-nexus-900" size={32} />
        </div>
    );

    if (error || !triggerNode) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X size={20} className="text-gray-600"/>
                </button>
            )}
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-red-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h1>
                <p className="text-gray-500 text-sm mb-6">{error || "This workflow does not have a public form trigger configured."}</p>
                {onClose ? (
                    <button onClick={onClose} className="px-6 py-3 bg-nexus-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">
                        Close Preview
                    </button>
                ) : (
                    <a href="/" className="px-6 py-3 bg-nexus-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">
                        Back to NexusStream
                    </a>
                )}
            </div>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500 relative">
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white border shadow-sm">
                    <X size={20} className="text-gray-600"/>
                </button>
            )}
            <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md text-center border border-green-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
                    <CheckCircle className="text-green-500" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Received!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Your input has been captured. The automated workflow <b>{project?.title}</b> is now processing your request.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-400 mb-6 font-mono text-left">
                    <div className="mb-1 font-bold text-gray-500 uppercase tracking-wide">Data Payload:</div>
                    {Object.entries(formData).map(([k,v]) => (
                        <div key={k} className="flex gap-2">
                            <span className="text-gray-500">{k}:</span>
                            <span className="text-gray-700 truncate">{v}</span>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { setSubmitted(false); setFormData({}); }} className="text-sm text-green-600 font-bold hover:underline">
                        Submit another response
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
                            Close Preview
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-nexus-accent/30 overflow-y-auto">
            {/* Top Bar Branding */}
            <div className="h-2 bg-nexus-900 w-full fixed top-0 left-0 z-50"></div>
            
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="fixed top-4 right-4 z-50 p-2.5 bg-black text-white rounded-full hover:bg-gray-800 shadow-lg border border-gray-700 transition-all hover:scale-110"
                    title="Close Preview"
                >
                    <X size={20} />
                </button>
            )}
            
            {/* Warning for Local Projects */}
            {projectId.startsWith('local_') && (
                <div className="fixed top-2 w-full flex justify-center z-40 pointer-events-none">
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-b-xl shadow-lg flex items-center gap-2 text-xs font-medium pointer-events-auto">
                        <CloudOff size={14} />
                        <span>Preview Mode: This form is running locally.</span>
                    </div>
                </div>
            )}
            
            <div className="max-w-xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.005]">
                    
                    {/* Header */}
                    <div className="px-8 py-10 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50 relative">
                        <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
                            <Command size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-nexus-900 rounded-lg shadow-lg">
                                <Sparkles size={20} className="text-nexus-accent" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Automation Form</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 mb-3 tracking-tight leading-tight">{project?.title}</h1>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-sm">{project?.description || "Please fill out the details below to trigger the automation."}</p>
                    </div>

                    {/* Form Body */}
                    <div className="p-8 bg-white">
                        {formFields.length > 0 ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {formFields.map((field: any, idx: number) => (
                                    <div key={idx} className="space-y-1.5 group">
                                        <label className="block text-sm font-semibold text-slate-700 flex items-center justify-between">
                                            {field.label}
                                            {field.type !== 'textarea' && <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Required</span>}
                                        </label>
                                        
                                        {field.type === 'textarea' ? (
                                            <textarea 
                                                required
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-nexus-900 focus:bg-white outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400 min-h-[120px] resize-y shadow-sm"
                                                value={formData[field.label] || ''}
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        ) : (
                                            <input 
                                                type={field.type || 'text'}
                                                required
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-nexus-900 focus:bg-white outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400 shadow-sm"
                                                value={formData[field.label] || ''}
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="pt-6">
                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="w-full py-4 bg-nexus-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {submitting ? <Loader2 size={18} className="animate-spin text-nexus-accent"/> : <Send size={18} className="text-nexus-accent" />}
                                        {submitting ? 'Processing Workflow...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Sparkles size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-sm font-medium text-slate-600 mb-1">Ready to Launch</p>
                                <p className="text-xs mb-6">No specific inputs required.</p>
                                <button onClick={handleSubmit} className="px-8 py-3 bg-nexus-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                                    Execute Workflow
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                            <div className="w-2 h-2 bg-nexus-accent rounded-full"></div>
                            Powered by NexusStream
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicFormView;
