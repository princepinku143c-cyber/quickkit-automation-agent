import React from 'react';
import { Send, MessageSquare, HelpCircle, FileQuestion, CheckCircle } from 'lucide-react';

export const PortalSupport: React.FC = () => {
    return (
        <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <HelpCircle size={20} className="text-blue-400"/> Create Support Ticket
                </h3>
                <p className="text-sm text-slate-400 mb-6">Facing issues with the workflow? Let our engineers know.</p>
                
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                            <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none" placeholder="e.g. Workflow failed on step 2"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High (Critical)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                        <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none h-32 resize-none" placeholder="Describe the issue..."/>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 flex items-center gap-2">
                            <Send size={16} /> Submit Ticket
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-900 border-b border-slate-700 font-bold text-white text-sm">Recent Tickets</div>
                <div className="divide-y divide-slate-700">
                    <div className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><CheckCircle size={16}/></div>
                            <div>
                                <div className="text-sm font-bold text-white">API Rate Limit Issue</div>
                                <div className="text-xs text-slate-500">Ticket #9822 • Resolved</div>
                            </div>
                        </div>
                        <button className="text-xs text-blue-400 hover:text-white">View</button>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><FileQuestion size={16}/></div>
                            <div>
                                <div className="text-sm font-bold text-white">Webhook not triggering</div>
                                <div className="text-xs text-slate-500">Ticket #9941 • In Progress</div>
                            </div>
                        </div>
                        <button className="text-xs text-blue-400 hover:text-white">View</button>
                    </div>
                </div>
            </div>
        </div>
    );
};