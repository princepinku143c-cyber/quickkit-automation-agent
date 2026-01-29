
import React, { useState, useEffect } from 'react';
import { ExecutionLog } from '../types';
import { Activity, X, Server, Database, ShieldCheck, User, Cloud, GitBranch, Cpu, Lock } from 'lucide-react';

// --- NATIVE SVG CHART (Stable Replacement) ---
const SimpleLineChart = ({ data, color = "#00ff9d" }: { data: any[], color?: string }) => {
    if (!data || data.length === 0) return null;
    
    const maxVal = Math.max(...data.map(d => d.duration || 0)) * 1.2 || 100;
    const width = 100; // viewBox width
    
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = 100 - ((d.duration || 0) / maxVal) * 100;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `M 0,100 ${points.split(' ').map(p => 'L ' + p).join(' ')} L 100,100 Z`;
    const strokePath = `M ${points.split(' ').map((p, i) => (i === 0 ? 'M ' : 'L ') + p).join(' ')}`;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id="lineChartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={fillPath} fill="url(#lineChartGradient)" />
                    <path d={strokePath} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>
        </div>
    );
};

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose, logs: initialLogs }) => {
  const [activeTab, setActiveTab] = useState<'EXECUTIONS' | 'INFRA' | 'ARCHITECTURE'>('EXECUTIONS');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<ExecutionLog[]>(initialLogs);

  // --- LIVE LOG SYNC ---
  useEffect(() => {
      if (!isOpen) return;
      const syncLogs = () => {
          try {
              setLiveLogs(initialLogs); 
          } catch(e) {}
      };
      const interval = setInterval(syncLogs, 2000);
      return () => clearInterval(interval);
  }, [isOpen, initialLogs]);

  if (!isOpen) return null;

  const chartData = liveLogs.map((log, i) => ({
    name: i.toString(),
    duration: log.duration,
    status: log.status === 'success' ? 1 : 0
  })).slice(-20);

  const successRate = liveLogs.length > 0 
    ? Math.round((liveLogs.filter(l => l.status === 'success').length / liveLogs.length) * 100) 
    : 100;

  const selectedLog = liveLogs.find(l => l.id === selectedLogId);

  // --- ARCHITECTURE VISUALIZATION COMPONENT ---
  const ArchitectureDiagram = () => (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[#050505] text-white overflow-y-auto">
          
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Cpu className="text-nexus-accent"/> System Architecture v2.0
          </h3>

          <div className="relative w-full max-w-4xl flex flex-col gap-8">
              
              {/* Layer 1: Inputs */}
              <div className="flex justify-center gap-8">
                  <div className="bg-nexus-900 border border-nexus-700 p-4 rounded-xl flex flex-col items-center w-32 shadow-lg">
                      <User className="text-blue-400 mb-2"/>
                      <span className="text-[10px] font-bold uppercase">User</span>
                  </div>
                  <div className="bg-nexus-900 border border-nexus-700 p-4 rounded-xl flex flex-col items-center w-32 shadow-lg">
                      <Cloud className="text-nexus-wire mb-2"/>
                      <span className="text-[10px] font-bold uppercase">Webhook</span>
                  </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center"><div className="h-8 w-0.5 bg-nexus-700"></div></div>

              {/* Layer 2: API Gateway */}
              <div className="bg-nexus-950 border-2 border-nexus-800 rounded-2xl p-6 relative">
                  <div className="absolute -top-3 left-6 bg-nexus-950 px-2 text-xs font-bold text-gray-500 uppercase tracking-widest border border-nexus-800 rounded">API Gateway</div>
                  <div className="flex justify-around items-center gap-4">
                      <div className="flex items-center gap-2 text-xs text-gray-300 bg-nexus-900 px-3 py-2 rounded border border-nexus-800">
                          <Lock size={14} className="text-green-400"/> HMAC Verify
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300 bg-nexus-900 px-3 py-2 rounded border border-nexus-800">
                          <Activity size={14} className="text-yellow-400"/> Rate Limiter
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300 bg-nexus-900 px-3 py-2 rounded border border-nexus-800">
                          <ShieldCheck size={14} className="text-blue-400"/> Idempotency
                      </div>
                  </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center"><div className="h-8 w-0.5 bg-nexus-700"></div></div>

              {/* Layer 3: Orchestrator */}
              <div className="bg-nexus-900/50 border-2 border-nexus-accent/30 rounded-2xl p-8 relative shadow-[0_0_30px_rgba(0,255,157,0.05)]">
                  <div className="absolute -top-3 left-6 bg-nexus-950 px-2 text-xs font-bold text-nexus-accent uppercase tracking-widest border border-nexus-accent/30 rounded">Workflow Engine (Core)</div>
                  
                  <div className="flex gap-8">
                      {/* Left: Logic */}
                      <div className="flex-1 space-y-4">
                          <div className="bg-black border border-nexus-700 p-3 rounded flex items-center justify-between">
                              <span className="text-xs font-mono">DAG Scheduler</span>
                              <GitBranch size={14} className="text-purple-400"/>
                          </div>
                          <div className="bg-black border border-nexus-700 p-3 rounded flex items-center justify-between">
                              <span className="text-xs font-mono">Policy Layer (Retry)</span>
                              <ShieldCheck size={14} className="text-orange-400"/>
                          </div>
                      </div>

                      {/* Right: State */}
                      <div className="flex flex-col justify-center gap-4">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse"></div>
                              <div className="h-0.5 w-16 bg-nexus-700"></div>
                              <div className="bg-nexus-950 border border-red-900/50 p-3 rounded-lg flex flex-col items-center w-24">
                                  <Database size={16} className="text-red-500 mb-1"/>
                                  <span className="text-[9px] font-bold text-red-400">Redis (Hot)</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div className="h-0.5 w-16 bg-nexus-700"></div>
                              <div className="bg-nexus-950 border border-blue-900/50 p-3 rounded-lg flex flex-col items-center w-24">
                                  <Server size={16} className="text-blue-500 mb-1"/>
                                  <span className="text-[9px] font-bold text-blue-400">Postgres (Cold)</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Layer 4: Workers */}
              <div className="flex justify-center gap-4 mt-2">
                  {[1, 2, 3].map(i => (
                      <div key={i} className="flex flex-col items-center">
                          <div className="h-6 w-0.5 bg-nexus-700"></div>
                          <div className="bg-nexus-800 border border-nexus-600 px-4 py-2 rounded text-[10px] font-mono text-gray-300">
                              Worker Node {i}
                          </div>
                      </div>
                  ))}
              </div>

          </div>
      </div>
  );

  const infraStats = [
      { name: 'Worker-01', cpu: 45, mem: 62, status: 'Active' },
      { name: 'Worker-02', cpu: 12, mem: 34, status: 'Idle' },
      { name: 'Queue (Redis)', depth: 142, latency: 24, status: 'Healthy' }
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="bg-nexus-900 border border-nexus-700 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-950">
          <div className="flex items-center gap-3">
            <Activity className="text-nexus-accent" />
            <h2 className="text-lg font-mono font-bold text-gray-100 uppercase tracking-widest">
              System Monitor
            </h2>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex bg-nexus-900 rounded-lg p-1 border border-nexus-800">
                  <button onClick={() => setActiveTab('EXECUTIONS')} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${activeTab === 'EXECUTIONS' ? 'bg-nexus-800 text-white' : 'text-gray-500'}`}>Executions</button>
                  <button onClick={() => setActiveTab('INFRA')} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${activeTab === 'INFRA' ? 'bg-nexus-800 text-white' : 'text-gray-500'}`}>Infrastructure</button>
                  <button onClick={() => setActiveTab('ARCHITECTURE')} className={`px-3 py-1 text-[10px] font-bold rounded uppercase ${activeTab === 'ARCHITECTURE' ? 'bg-nexus-800 text-white border border-nexus-accent/30 text-nexus-accent' : 'text-gray-500'}`}>Architecture</button>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-nexus-800 rounded text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* TAB: EXECUTIONS */}
          {activeTab === 'EXECUTIONS' && (
              <div className={`flex-1 flex flex-col overflow-y-auto p-6 bg-[#050505] border-r border-nexus-700 ${selectedLog ? 'hidden md:flex md:w-1/2' : 'w-full'}`}>
                <div className="grid grid-cols-3 gap-4 mb-6">
                   <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700">
                      <div className="text-[10px] text-gray-500 uppercase">Total Executions</div>
                      <div className="text-2xl font-mono text-white">{liveLogs.length}</div>
                   </div>
                   <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700">
                      <div className="text-[10px] text-gray-500 uppercase">Success Rate</div>
                      <div className={`text-2xl font-mono ${successRate > 90 ? 'text-nexus-success' : 'text-red-500'}`}>{successRate}%</div>
                   </div>
                   <div className="bg-nexus-800/50 p-3 rounded border border-nexus-700">
                      <div className="text-[10px] text-gray-500 uppercase">Avg Latency</div>
                      <div className="text-2xl font-mono text-blue-400">240ms</div>
                   </div>
                </div>

                <div className="w-full bg-nexus-800/20 rounded border border-nexus-700/50 mb-6 p-4 h-[250px]">
                   <SimpleLineChart data={chartData} />
                </div>

                <div className="flex-1 bg-nexus-800/30 rounded border border-nexus-700 overflow-hidden flex flex-col">
                  <div className="p-2 bg-nexus-900 border-b border-nexus-700 text-[10px] font-mono text-gray-500 uppercase flex justify-between">
                      <span>Stream History</span>
                      <span className="text-nexus-accent animate-pulse">● Live</span>
                  </div>
                  <div className="overflow-y-auto flex-1">
                     <table className="w-full text-left text-[11px] font-mono">
                        <tbody className="divide-y divide-nexus-700/50 text-gray-400">
                           {liveLogs.slice().reverse().map(log => (
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
          )}

          {/* TAB: INFRASTRUCTURE */}
          {activeTab === 'INFRA' && (
              <div className="flex-1 p-8 bg-[#050505] overflow-y-auto">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Server size={20} className="text-blue-400"/> Backend Health</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {infraStats.map((stat, i) => (
                          <div key={i} className="bg-nexus-900 border border-nexus-800 p-6 rounded-xl relative overflow-hidden group">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="text-sm font-bold text-gray-300">{stat.name}</div>
                                  <div className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${stat.status === 'Active' || stat.status === 'Healthy' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>{stat.status}</div>
                              </div>
                              
                              {stat.cpu !== undefined ? (
                                  <div className="space-y-4">
                                      <div>
                                          <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>CPU Usage</span><span>{stat.cpu}%</span></div>
                                          <div className="w-full h-1.5 bg-nexus-950 rounded-full overflow-hidden">
                                              <div className="h-full bg-blue-500" style={{width: `${stat.cpu}%`}}/>
                                          </div>
                                      </div>
                                      <div>
                                          <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Memory</span><span>{stat.mem}%</span></div>
                                          <div className="w-full h-1.5 bg-nexus-950 rounded-full overflow-hidden">
                                              <div className="h-full bg-purple-500" style={{width: `${stat.mem}%`}}/>
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      <div>
                                          <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Queue Depth</span><span>{stat.depth} jobs</span></div>
                                          <div className="w-full h-1.5 bg-nexus-950 rounded-full overflow-hidden">
                                              <div className="h-full bg-yellow-500" style={{width: '60%'}}/>
                                          </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                          <span className="text-[10px] text-gray-500">Latency</span>
                                          <span className="text-sm font-mono text-white">{stat.latency}ms</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: ARCHITECTURE DIAGRAM */}
          {activeTab === 'ARCHITECTURE' && <ArchitectureDiagram />}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
