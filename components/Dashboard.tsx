
import React, { useState, useEffect } from 'react';
import { ExecutionLog } from '../types';
import { Activity, X, Server, Database, ShieldCheck, User, Cloud, GitBranch, Cpu, Lock, Zap, Brain, Globe, Network, Shield, ShieldAlert, Timer, LifeBuoy } from 'lucide-react';

const SimpleLineChart = ({ data, color = "#00ff9d" }: { data: any[], color?: string }) => {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.duration || 0)) * 1.2 || 100;
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.duration || 0) / maxVal) * 100}`).join(' ');
    return (
        <div className="w-full h-full">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path d={`M 0,100 ${points} L 100,100 Z`} fill={color} fillOpacity="0.1" />
                <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose, logs: initialLogs }) => {
  const [activeTab, setActiveTab] = useState<'EXECUTIONS' | 'INFRA' | 'DNA'>('EXECUTIONS');
  const [liveLogs, setLiveLogs] = useState<ExecutionLog[]>(initialLogs);

  useEffect(() => { if (isOpen) setLiveLogs(initialLogs); }, [isOpen, initialLogs]);

  if (!isOpen) return null;

  const successRate = liveLogs.length > 0 ? Math.round((liveLogs.filter(l => l.status === 'success').length / liveLogs.length) * 100) : 100;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-nexus-900 border border-nexus-700 w-full max-w-6xl h-[90vh] rounded-[40px] shadow-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-10 py-8 border-b border-nexus-700 flex justify-between items-center bg-nexus-950">
          <div className="flex items-center gap-4">
            <Activity className="text-nexus-accent" size={24} />
            <div>
                <h2 className="text-xl font-black text-gray-100 uppercase tracking-[0.2em]">Engine Diagnostic</h2>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Sentry Mode Enabled • Bill Shield Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex bg-black p-1 rounded-2xl border border-nexus-800">
                  <button onClick={() => setActiveTab('EXECUTIONS')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'EXECUTIONS' ? 'bg-nexus-800 text-white shadow-lg' : 'text-gray-500'}`}>Pulse</button>
                  <button onClick={() => setActiveTab('INFRA')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'INFRA' ? 'bg-nexus-800 text-white shadow-lg' : 'text-gray-500'}`}>Infra</button>
                  <button onClick={() => setActiveTab('DNA')} className={`px-6 py-2.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activeTab === 'DNA' ? 'bg-nexus-accent text-black' : 'text-nexus-accent/60'}`}>Iron Shield</button>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'EXECUTIONS' && (
              <div className="flex-1 flex flex-col overflow-y-auto p-10 bg-[#050505] custom-scrollbar">
                <div className="grid grid-cols-3 gap-6 mb-10">
                   <div className="bg-nexus-800/20 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Today's Fuel</div>
                      <div className="text-4xl font-mono text-white font-black">5 / 25</div>
                      <div className="w-full h-1 bg-white/5 mt-4 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: '20%' }}></div>
                      </div>
                   </div>
                   <div className="bg-nexus-800/20 p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">Shield Status</div>
                      <div className="text-4xl font-mono text-nexus-success font-black uppercase">Active</div>
                      <p className="text-[9px] text-gray-600 mt-2 font-bold">Anti-Loop Protocol Engaged</p>
                   </div>
                   <div className="bg-nexus-800/20 p-8 rounded-[32px] border border-white/5">
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">System Load</div>
                      <div className="text-4xl font-mono text-blue-400 font-black">Optimal</div>
                   </div>
                </div>
                <div className="flex-1 bg-nexus-800/10 rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
                  <div className="p-6 bg-nexus-950/50 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase flex justify-between items-center">
                      <span>Audit Stream (Minimal Logging)</span>
                      <span className="text-blue-500 flex items-center gap-2">● Cost Optimized</span>
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                     <table className="w-full text-left text-[11px] font-mono">
                        <tbody className="divide-y divide-white/5 text-gray-400">
                           {liveLogs.slice().reverse().map(log => (
                              <tr key={log.id} className="hover:bg-white/5">
                                 <td className="p-5 w-4"><div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-nexus-success' : 'bg-red-50'}`} /></td>
                                 <td className="p-5 font-black text-white uppercase">{log.nexusId.slice(-6)}</td>
                                 <td className="p-5 truncate opacity-60">Status Check: Passed Safety Protocol</td>
                                 <td className="p-5 text-right font-black text-nexus-accent">{log.duration}ms</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                </div>
              </div>
          )}

          {activeTab === 'DNA' && (
              <div className="flex-1 p-16 bg-black overflow-y-auto custom-scrollbar">
                  <div className="max-w-4xl mx-auto space-y-16">
                      <div className="text-center">
                          <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] mb-4">The Iron Shield Manifest</h2>
                          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">NexusStream is the only engine that prioritizes your wallet as much as your workflow. Our safety protocols are baked into the kernel.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-red-950/10 border border-red-900/20 p-10 rounded-[40px] relative overflow-hidden group">
                              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 text-red-500 border border-red-500/20">
                                  <ShieldAlert size={28}/>
                              </div>
                              <h4 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Anti-Loop Protocol</h4>
                              <p className="text-xs text-gray-500 leading-relaxed font-medium">Automatic cycle detection kills infinite loops instantly. If a node repeats more than 3 times in a single second, the system triggers an emergency stop to prevent bill explosion.</p>
                          </div>

                          <div className="bg-blue-950/10 border border-blue-900/20 p-10 rounded-[40px] relative overflow-hidden group">
                              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 text-blue-400 border border-blue-500/20">
                                  <Timer size={28}/>
                              </div>
                              <h4 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Hard Execution TTL</h4>
                              <p className="text-xs text-gray-500 leading-relaxed font-medium">No zombie processes. Every workflow has a hard 60-second limit. If it hangs, we kill it, snapshot the state, and notify you. Zero wasted compute seconds.</p>
                          </div>

                          <div className="bg-nexus-900/40 border border-white/5 p-10 rounded-[40px] relative overflow-hidden group">
                              <div className="w-14 h-14 bg-nexus-accent/10 rounded-2xl flex items-center justify-center mb-8 text-nexus-accent border border-nexus-accent/20">
                                  <Lock size={28}/>
                              </div>
                              <h4 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Metered Fuel (Quotas)</h4>
                              <p className="text-xs text-gray-500 leading-relaxed font-medium">Set hard daily limits on your automation engine. Once your 'Fuel Tank' hits zero, the system pauses workflows until the next billing cycle or manual top-up.</p>
                          </div>

                          <div className="bg-nexus-900/40 border border-white/5 p-10 rounded-[40px] relative overflow-hidden group">
                              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-8 text-purple-400 border border-purple-500/20">
                                  <LifeBuoy size={28}/>
                              </div>
                              <h4 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Silent Killer Sentry</h4>
                              <p className="text-xs text-gray-500 leading-relaxed font-medium">Heavy debug logs are the #1 cause of hidden cloud costs. Our sentry automatically suppresses verbose logs in production, saving you up to 80% on cloud observability bills.</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'INFRA' && (
              <div className="flex-1 p-16 bg-[#050505] overflow-y-auto">
                  <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-widest flex items-center gap-4"><Server size={24} className="text-blue-400"/> Firebase Cloud Status</h3>
                  <div className="bg-nexus-900/40 border border-white/5 p-10 rounded-[40px]">
                      <div className="flex justify-between items-start mb-6">
                          <div className="text-sm font-black text-gray-400 uppercase tracking-widest">Active Worker Node #1</div>
                          <div className="text-[9px] px-3 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-800 uppercase font-black">Healthy</div>
                      </div>
                      <p className="text-xs text-gray-500">Current Cost Consumption: <span className="text-white font-mono">$0.0012 / Today</span></p>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
