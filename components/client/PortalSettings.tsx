
import React from 'react';
import { Copy, Key, Globe, Eye, RefreshCw } from 'lucide-react';

export const PortalSettings: React.FC<{ projectId: string }> = ({ projectId }) => {
    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-nexus-wire"/> API Integration
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Webhook Endpoint</label>
                        <div className="flex gap-2">
                            <input readOnly value={`https://api.nexusstream.ai/v1/hooks/${projectId}`} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-nexus-wire font-mono text-xs" />
                            <button className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white"><Copy size={16}/></button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Project ID</label>
                        <div className="flex gap-2">
                            <input readOnly value={projectId} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs" />
                            <button className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white"><Copy size={16}/></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Key size={20} className="text-nexus-accent"/> Client Secrets
                </h3>
                <div className="p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg mb-4 text-xs text-yellow-500">
                    Warning: Do not share these keys with anyone. They grant access to run your workflows.
                </div>
                
                <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <input type="password" value="sk_live_51M..." readOnly className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs" />
                    </div>
                    <button className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white"><Eye size={16}/></button>
                    <button className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold"><RefreshCw size={14}/> Roll Key</button>
                </div>
            </div>
        </div>
    );
};
