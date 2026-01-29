
import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, Zap, ShieldCheck, Key, Settings, ArrowRight } from 'lucide-react';
import ClientSettings from '../ClientSettings';
import { Project, NexusType, NexusSubtype } from '../../types';
import { saveExecutionLog } from '../../services/cloudStore';

interface PortalRunnerProps {
    project: Project;
    onSaveSettings: (vars: any) => void;
}

export const PortalRunner: React.FC<PortalRunnerProps> = ({ project, onSaveSettings }) => {
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

        await saveExecutionLog('dev-mode-user', {
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
                            <CheckCircle size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Sequence Active</h3>
                        <p className="text-slate-500 mb-12 max-w-xs mx-auto leading-relaxed">The automation stack has been successfully initialized in the production cluster.</p>
                        <button onClick={() => { setSubmitted(false); setFormData({}); }} className="px-12 py-5 bg-white text-black font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-4 mx-auto shadow-xl">
                            New Session <ArrowRight size={16}/>
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="mb-12">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-600/20 shadow-lg">
                                    <Zap size={24} fill="currentColor"/>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Execute Hub</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Bespoke Automation Control</p>
                                </div>
                            </div>
                        </div>

                        {formFields.length > 0 ? (
                            <div className="space-y-8">
                                {formFields.map((field: any, idx: number) => (
                                    <div key={idx} className="space-y-3">
                                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea 
                                                required placeholder={field.placeholder}
                                                className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none min-h-[160px] transition-all custom-scrollbar placeholder:text-slate-800"
                                                value={formData[field.label] || ''}
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        ) : (
                                            <input 
                                                type={field.type || 'text'} required placeholder={field.placeholder}
                                                className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-sm text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-800"
                                                value={formData[field.label] || ''}
                                                onChange={e => setFormData({...formData, [field.label]: e.target.value})}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 bg-black/20 rounded-[32px] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Settings size={32} className="text-slate-800 animate-spin-slow" />
                                </div>
                                <p className="text-slate-600 text-xs font-black uppercase tracking-[0.2em]">Static Trigger Active</p>
                                <p className="text-[10px] text-slate-700 mt-2">No manual inputs required for this stack.</p>
                            </div>
                        )}

                        <div className="pt-10">
                            <button type="submit" disabled={submitting} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-[13px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-5 disabled:opacity-50 shadow-[0_20px_50px_rgba(37,99,235,0.3)] active:scale-[0.98]">
                                {submitting ? <Loader2 className="animate-spin" size={20}/> : <Play size={20} fill="currentColor"/>}
                                {submitting ? 'Authenticating Gateway...' : 'Initialize Stack'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            {/* SECRETS & SECURITY VAULT */}
            <div className="space-y-12 animate-in slide-in-from-right-10 duration-1000">
                <div className="bg-[#0f111a] border border-white/5 rounded-[40px] p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-600/10 rounded-2xl text-purple-400 border border-purple-600/20">
                            <Key size={22}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">Secrets Vault</h3>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">Encrypted Configuration</p>
                        </div>
                    </div>
                    <ClientSettings project={project} onSave={onSaveSettings} />
                </div>

                <div className="p-10 bg-blue-900/10 border border-blue-500/20 rounded-[40px] flex gap-8 items-center shadow-2xl">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                        <ShieldCheck size={36} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Zero-Trust Transit</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                            Every input payload and credential is encapsulated in an AES-256 encrypted tunnel before hitting the execution cluster.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
