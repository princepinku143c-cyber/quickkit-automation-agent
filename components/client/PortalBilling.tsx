
import React from 'react';
import { FileText, Download, Zap, Cpu, Database } from 'lucide-react';
import { ExecutionLog } from '../../types';

interface PortalBillingProps {
    logs: ExecutionLog[];
}

export const PortalBilling: React.FC<PortalBillingProps> = ({ logs }) => {
    
    // --- CALCULATE REAL USAGE ---
    const totalCredits = logs.reduce((acc, log) => acc + (log.usage?.creditsCost || 0), 0);
    const totalTokens = logs.reduce((acc, log) => acc + (log.usage?.tokens || 0), 0);
    const estimatedCost = (totalCredits * 0.002).toFixed(4); // e.g. $0.002 per credit

    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* PLAN CARD */}
            <div className="bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-800 p-6 rounded-xl flex justify-between items-center">
                <div>
                    <div className="text-xs font-bold text-blue-300 uppercase mb-1">Current Plan</div>
                    <h3 className="text-2xl font-bold text-white">Business Enterprise</h3>
                    <p className="text-sm text-slate-400 mt-1">Renews on Oct 12, 2024</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-white">$499</div>
                    <div className="text-xs text-slate-400">/ month + usage</div>
                </div>
            </div>

            {/* USAGE BREAKDOWN (ACCURATE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-nexus-wire text-xs font-bold uppercase">
                        <Cpu size={14} /> AI Compute
                    </div>
                    <div className="text-xl font-bold text-white">{totalTokens.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">Total Tokens Processed</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-nexus-accent text-xs font-bold uppercase">
                        <Zap size={14} /> Workflow Steps
                    </div>
                    <div className="text-xl font-bold text-white">{logs.length.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">Nodes Executed</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-blue-400 text-xs font-bold uppercase">
                        <Database size={14} /> Metered Cost
                    </div>
                    <div className="text-xl font-bold text-white">${estimatedCost}</div>
                    <div className="text-[10px] text-gray-500">Based on usage</div>
                </div>
            </div>

            {/* INVOICE HISTORY */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Invoice History</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded"><FileText size={16} className="text-slate-400"/></div>
                                <div>
                                    <div className="text-sm font-bold text-white">Invoice #INV-2024-00{i}</div>
                                    <div className="text-xs text-slate-500">Paid on Oct {10 - i}, 2024</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-white">$499.00</span>
                                <button className="p-2 hover:bg-slate-800 rounded text-blue-400"><Download size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
