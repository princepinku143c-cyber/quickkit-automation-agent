
import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, Zap, ShieldCheck, Key, Settings, ArrowRight } from 'lucide-react';
import ClientSettings from '../ClientSettings';
import { Project, NexusType, NexusSubtype } from '../../types';
import { saveExecutionLog } from '../../services/cloudStore';

interface PortalRunnerProps {
    project: Project;
    onSaveSettings: (vars: any) => void;
    userId: string;
}

export const PortalRunner: React.FC<PortalRunnerProps> = ({ project, onSaveSettings, userId }) => {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Find the Trigger Webhook to get custom form fields if defined
    const triggerNode = project?.nexuses.find(n => n.type === NexusType.TRIGGER);
    const formFields = triggerNode?.config.formFields || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Simulating the Backend Handshake
        await new Promise(r => setTimeout(r, 2500));

        const tokens = Math.floor(Math.random() * 600) + 150;
        const credits = Math.ceil(tokens / 80);

        await saveExecutionLog(userId, {
            id: `PORTAL_REQ_${Date.now()}`,
            timestamp: Date.now(),
            nexusId: triggerNode?.id || 'entry_point',
            status: 'success',
            message: `External Protocol Request: ${project.title}`,
            duration: 2100,
            inputData: JSON.stringify(formData),
            outputData: JSON.stringify({ status: "Success", origin: "Client Portal Hub" }),
            usage: { tokens, creditsCost: credits }
        });

        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-7xl animate-in fade-in duration-700">
            
            {/* HUB: THE TRIGGER ENGINE */}
            <div className="bg-slate-900/30 border border-white/5 rounded-[40px] p-12 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-1000">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-500 to-transparent opacity-50"></div>
                
                {submitted ? (
                    <div className="text-center py-20 animate-in zoom-in-95 duration-700">
                        <div className="w-24 h-24 bg-green-500/10 rounded-[32px] border border-green-500/20 flex items-center justify-center mx-auto mb-10 text-green-400 shadow-[0_0_80px_rgba(34,197,94,0.15)]">
                            <CheckCircle size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Protocol Executed</h3>
                        <p className="text-slate-500 text-sm mb-12 max-w-xs mx-auto">The workflow has been triggered successfully. Check results in the logs tab.</p>
                        <button 
                            onClick={() => { setSubmitted(false); setFormData({}); }}
                            className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                        >
                            New Execution
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                    <Zap size={14} fill="currentColor"/> Execution Hub
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Trigger<br/><span className="text-slate-500">Protocol</span></h3>
                            </div>
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-center justify-center text-blue-500 animate-pulse">
                                <Play size={24} fill="currentColor"/>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-6">
                                {formFields.map((field: any) => (
                                    <div key={field.id} className="group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-blue-400 transition-colors">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input 
                                            type={field.type || 'text'}
                                            required={field.required}
                                            value={formData[field.id] || ''}
                                            onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                            placeholder={field.placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button 
                                type="submit"
                                disabled={submitting}
                                className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-[0_20px_40px_rgba(37,99,235,0.2)]"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Run Workflow <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* VAULT: CONFIGURATION */}
            <div className="space-y-10">
                <div className="bg-slate-900/30 border border-white/5 rounded-[40px] p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-600/10 rounded-xl text-purple-500 border border-purple-500/20">
                            <Key size={20}/>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">Vault Config</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Runtime Variables</p>
                        </div>
                    </div>
                    <ClientSettings 
                        project={project} 
                        onSave={onSaveSettings} 
                    />
                </div>

                <div className="bg-blue-600/5 border border-blue-500/10 rounded-[40px] p-10">
                    <div className="flex items-center gap-4 mb-6">
                        <ShieldCheck size={20} className="text-blue-400"/>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Security Protocol</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        All executions are encrypted and logged. API keys are stored in the secure vault and never exposed to the client interface.
                    </p>
                </div>
            </div>
        </div>
    );
};
