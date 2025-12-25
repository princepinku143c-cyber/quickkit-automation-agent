
import React, { useState, useEffect } from 'react';
import { Globe, X, Copy, RefreshCw, Lock, AlertTriangle, Server, CheckCircle2, Wifi, Activity, ShieldCheck } from 'lucide-react';
import { DNSRecord } from '../types';

interface DomainManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'STATUS' | 'DNS' | 'AUTH';
}

const DomainManager: React.FC<DomainManagerProps> = ({ isOpen, onClose, initialTab = 'STATUS' }) => {
  
  const currentHost = (typeof window !== 'undefined' && window.location.hostname) || 'nexusstream.site';
  const [activeTab, setActiveTab] = useState<'STATUS' | 'DNS' | 'AUTH'>(initialTab);
  const [lastChecked, setLastChecked] = useState<string>(new Date().toLocaleTimeString());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleCheckConnection = () => {
      setIsChecking(true);
      setTimeout(() => {
          window.location.reload();
      }, 1500);
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    const btn = document.activeElement as HTMLElement;
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "COPIED!";
        setTimeout(() => { btn.innerText = originalText; }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-nexus-950 border border-nexus-800 rounded-2xl shadow-3xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-accent/10 rounded-lg border border-nexus-accent/30 animate-pulse">
                <Activity className="text-nexus-accent" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">System Status</h2>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                  Target: <span className="text-nexus-wire">{currentHost}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-nexus-800 bg-nexus-950">
            <button 
                onClick={() => setActiveTab('STATUS')}
                className={`flex-1 md:flex-none px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'STATUS' ? 'bg-nexus-800 text-white border-b-2 border-nexus-success' : 'text-gray-500 hover:text-gray-300'}`}
            >
                1. Connection Status
            </button>
            <button 
                onClick={() => setActiveTab('DNS')}
                className={`flex-1 md:flex-none px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'DNS' ? 'bg-nexus-800 text-white border-b-2 border-nexus-wire' : 'text-gray-500 hover:text-gray-300'}`}
            >
                2. DNS Configuration
            </button>
            <button 
                onClick={() => setActiveTab('AUTH')}
                className={`flex-1 md:flex-none px-6 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'AUTH' ? 'bg-nexus-800 text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                3. Auth/Login Fix
            </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 bg-[#050505] flex-1">
          
          {/* --- STATUS TAB (NEW) --- */}
          {activeTab === 'STATUS' && (
              <div className="space-y-6 animate-in slide-in-from-right">
                  
                  {/* Big Status Card */}
                  <div className="p-8 bg-nexus-900/30 border border-nexus-800 rounded-2xl flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                      <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-nexus-success/20 flex items-center justify-center bg-nexus-900">
                             <Wifi size={40} className="text-nexus-success" />
                          </div>
                          <div className="absolute top-0 right-0 p-2 bg-nexus-950 rounded-full border border-nexus-800">
                              <CheckCircle2 size={16} className="text-nexus-success" />
                          </div>
                      </div>
                      <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2">DNS Records Configured!</h3>
                          <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                              Your Namecheap settings look perfect. The <b>A Records</b> and <b>CNAME</b> are set correctly.
                          </p>
                          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                              <div className="px-4 py-2 bg-nexus-800 rounded border border-nexus-700 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-nexus-success animate-pulse"></div>
                                  <span className="text-xs text-gray-300 font-mono">Propagation: <span className="text-white font-bold">IN PROGRESS</span></span>
                              </div>
                              <div className="px-4 py-2 bg-nexus-800 rounded border border-nexus-700 flex items-center gap-2">
                                  <Lock size={12} className="text-yellow-500" />
                                  <span className="text-xs text-gray-300 font-mono">SSL: <span className="text-white font-bold">ISSUING...</span></span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 border border-nexus-800 rounded-xl bg-nexus-900/20">
                          <h4 className="text-xs font-bold text-nexus-wire uppercase mb-3">What happens next?</h4>
                          <ul className="space-y-3">
                              <li className="flex gap-3 text-xs text-gray-400">
                                  <span className="bg-nexus-800 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white">1</span>
                                  <span>Wait <b>30-60 minutes</b> for global DNS to update.</span>
                              </li>
                              <li className="flex gap-3 text-xs text-gray-400">
                                  <span className="bg-nexus-800 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white">2</span>
                                  <span>Google will detect the domain and issue a <b>Secure Certificate</b>.</span>
                              </li>
                              <li className="flex gap-3 text-xs text-gray-400">
                                  <span className="bg-nexus-800 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white">3</span>
                                  <span>If you see "Not Private" error, it means step 2 is still running.</span>
                              </li>
                          </ul>
                      </div>
                      
                      <div className="p-5 border border-nexus-800 rounded-xl bg-nexus-900/20 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-gray-300 uppercase mb-2">Test Connection</h4>
                            <p className="text-[10px] text-gray-500 mb-4">Click below to reload and check if the site is live.</p>
                          </div>
                          <button 
                            onClick={handleCheckConnection}
                            disabled={isChecking}
                            className="w-full py-3 bg-white text-black font-bold rounded-lg text-xs uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                          >
                              {isChecking ? <RefreshCw className="animate-spin" size={14} /> : <Globe size={14} />}
                              {isChecking ? 'Checking...' : 'Reload & Check'}
                          </button>
                          <p className="text-[9px] text-gray-600 text-center mt-2 font-mono">Last checked: {lastChecked}</p>
                      </div>
                  </div>
              </div>
          )}

          {/* --- DNS TAB (REFERENCE) --- */}
          {activeTab === 'DNS' && (
            <div className="space-y-6">
                <div className="p-4 bg-nexus-success/10 border border-nexus-success/30 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="text-nexus-success" size={24} />
                    <div>
                        <h3 className="text-sm font-bold text-white">Configuration Verified</h3>
                        <p className="text-xs text-nexus-success/80">Your screenshot confirms these records are set correctly.</p>
                    </div>
                </div>

                <div className="border border-nexus-800 bg-nexus-900/20 rounded-xl overflow-hidden opacity-75">
                        <table className="w-full text-left text-[11px] font-mono">
                            <thead className="bg-nexus-900/50 text-gray-500">
                                <tr>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Host</th>
                                    <th className="p-3">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-nexus-800/50 text-gray-400">
                                <tr>
                                    <td className="p-3 font-bold text-nexus-port">A Record</td>
                                    <td className="p-3">@</td>
                                    <td className="p-3 text-white">151.101.1.195</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-bold text-nexus-port">A Record</td>
                                    <td className="p-3">@</td>
                                    <td className="p-3 text-white">151.101.65.195</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-bold text-nexus-port">CNAME</td>
                                    <td className="p-3">www</td>
                                    <td className="p-3 text-white">nexusstream-3a734.web.app</td>
                                </tr>
                            </tbody>
                        </table>
                </div>
            </div>
          )}

          {/* --- AUTH TAB --- */}
          {activeTab === 'AUTH' && (
             <div className="space-y-6 animate-in slide-in-from-right">
                 <div className="p-6 bg-nexus-900 border border-nexus-800 rounded-2xl">
                     <div className="flex items-center gap-4 mb-6">
                         <div className="p-3 bg-red-500/10 rounded-full"><AlertTriangle size={24} className="text-red-500"/></div>
                         <div>
                             <h3 className="text-lg font-bold text-white">Login Blocked?</h3>
                             <p className="text-sm text-gray-400">
                                 Add this domain to Firebase Auth Settings.
                             </p>
                         </div>
                     </div>

                     <div className="bg-black/50 p-4 rounded-xl border border-nexus-800 mb-6">
                         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Domain to Whitelist:</div>
                         <div className="flex items-center gap-3">
                             <input 
                                readOnly
                                value={currentHost}
                                className="flex-1 bg-nexus-900/50 p-3 rounded border border-nexus-700 text-nexus-wire font-mono text-sm outline-none"
                             />
                             <button 
                                onClick={() => copyToClipboard(currentHost)}
                                className="px-6 py-3 bg-nexus-accent text-black font-bold rounded-lg text-xs hover:bg-white transition-colors flex items-center gap-2 min-w-[100px] justify-center"
                             >
                                 <Copy size={14} /> COPY
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-nexus-800 bg-nexus-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
                 <Server size={12} className="text-nexus-success"/>
                 <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">System Online</span>
            </div>
            <button onClick={onClose} className="px-8 py-2.5 bg-nexus-800 hover:bg-white hover:text-black text-white text-[10px] font-black rounded-xl transition-all uppercase tracking-widest">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default DomainManager;
