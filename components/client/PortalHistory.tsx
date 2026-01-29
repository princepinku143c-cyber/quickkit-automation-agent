
import React from 'react';
import { Download, FileText } from 'lucide-react';
import { ExecutionLog } from '../../types';

interface PortalHistoryProps {
    logs: ExecutionLog[];
}

export const PortalHistory: React.FC<PortalHistoryProps> = ({ logs }) => {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase border-b border-slate-700">
                    <tr>
                        <th className="p-4 w-32">Status</th>
                        <th className="p-4">Time</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Output Preview</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-300">
                    {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800 transition-colors">
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${log.status === 'success' ? 'bg-green-900/20 text-green-400 border-green-900' : 'bg-red-900/20 text-red-400 border-red-900'}`}>
                                    {log.status}
                                </span>
                            </td>
                            <td className="p-4 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-4 text-xs font-mono">{log.duration}ms</td>
                            <td className="p-4 font-mono text-xs text-slate-500 truncate max-w-xs">
                                {log.outputData || log.message}
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-blue-400 hover:text-white flex items-center gap-1 ml-auto text-xs font-bold">
                                    <Download size={14}/> Report
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {logs.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">No execution history found.</div>
            )}
        </div>
    );
};
