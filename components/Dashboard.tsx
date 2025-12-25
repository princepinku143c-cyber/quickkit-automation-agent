
import React, { useState } from 'react';
import { ExecutionLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, X, Terminal, Inspect, Bug, Crown, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose, logs }) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  if (!isOpen) return null;

  const chartData = logs.map((log, i) => ({
    name: i.toString(),
    duration: log.duration,
    status: log.status === 'success' ? 1 : 0
  })).slice(-20);

  const successRate = logs.length > 0 
    ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) 
    : 100;

  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="bg-nexus-900 border border-nexus-700 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-950">
          <div className="flex items-center gap-3">
            <Activity className="text-nexus-accent" />
            <h2 className="text-lg font-mono font-bold text-gray-100 uppercase tracking-widest">
              Execution Monitor
            </h2>
          </div>
          <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-nexus-800 rounded-lg border border-nexus-700">
                  <ShieldCheck size={14} className="text-nexus-accent" />
                  <span className="text-[10px] font-bold text-gray-300">Free Tier: 128 / 2,000 runs</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-nexus-800 rounded text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (same as before but with cleaner styling) */}
          <div className={`flex-1 flex flex-col overflow-y-auto p-6 bg-[#050505] border-r border-nexus-700 ${selectedLog ? 'hidden md:flex md:w-1/2' : 'w-full'}`}>
            <div className="grid grid-cols-3 gap-4 mb-6">
               <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700">
                  <div className="text-[10px] text-gray-500 uppercase">Total Executions</div>
                  <div className="text-2xl font-mono text-white">{logs.length}</div>
               </div>
               <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700">
                  <div className="text-[10px] text-gray-500 uppercase">System Health</div>
                  <div className={`text-2xl font-mono ${successRate > 90 ? 'text-nexus-success' : 'text-red-500'}`}>{successRate}%</div>
               </div>
               <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700 relative overflow-hidden group">
                  <div className="text-[10px] text-gray-500 uppercase">Quota Remaining</div>
                  <div className="text-2xl font-mono text-nexus-port">1,872</div>
                  <Crown size={24} className="absolute -bottom-2 -right-2 text-nexus-wire opacity-10 group-hover:rotate-12 transition-transform" />
               </div>
            </div>

            {/* Performance Chart */}
            <div className="w-full bg-nexus-800/20 rounded border border-nexus-700/50 mb-6 p-4 h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                      <XAxis hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#050505', border: '1px solid #262626' }} />
                      <Area type="monotone" dataKey="duration" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.1} />
                    </AreaChart>
               </ResponsiveContainer>
            </div>

            {/* Log List */}
            <div className="flex-1 bg-nexus-800/30 rounded border border-nexus-700 overflow-hidden flex flex-col">
              <div className="p-2 bg-nexus-900 border-b border-nexus-700 text-[10px] font-mono text-gray-500 uppercase flex justify-between">
                  <span>Stream History</span>
                  <span className="text-nexus-accent">Real-time</span>
              </div>
              <div className="overflow-y-auto flex-1">
                 <table className="w-full text-left text-[11px] font-mono">
                    <tbody className="divide-y divide-nexus-700/50 text-gray-400">
                       {logs.slice().reverse().map(log => (
                          <tr key={log.id} onClick={() => setSelectedLogId(log.id)} className="hover:bg-nexus-800/50 cursor-pointer">
                             <td className="p-3 w-4"><div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-nexus-success' : 'bg-red-500'}`} /></td>
                             <td className="p-3 font-bold text-white uppercase">{log.nexusId.slice(-4)}</td>
                             <td className="p-3 truncate">{log.message}</td>
                             <td className="p-3 text-right">{log.duration}ms</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
          
          {selectedLog && (
            <div className="w-full md:w-1/2 bg-nexus-950 border-l border-nexus-700 p-6 flex flex-col overflow-y-auto animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Execution Trace</h3>
                    <button onClick={() => setSelectedLogId(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-nexus-900 rounded border border-nexus-800">
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Input Body</div>
                        <pre className="text-nexus-port overflow-x-auto text-[10px]">{JSON.stringify(selectedLog.inputData || {}, null, 2)}</pre>
                    </div>
                    <div className="p-4 bg-nexus-900 rounded border border-nexus-800">
                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Output Response</div>
                        <pre className="text-nexus-accent overflow-x-auto text-[10px]">{JSON.stringify(selectedLog.outputData || {}, null, 2)}</pre>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
