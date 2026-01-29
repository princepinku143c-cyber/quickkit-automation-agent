
import React from 'react';
import { Globe, X, CheckCircle2, ShieldCheck, AlertTriangle, Info, Server } from 'lucide-react';

interface DomainManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DomainManager: React.FC<DomainManagerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentHost = window.location.hostname;
  
  // Updated with user's actual domains
  const domainsToKeep = [
      { domain: 'localhost', type: 'Default', status: 'Required', desc: 'Local testing & development' },
      { domain: 'nexusstream.site', type: 'Custom', status: 'Active', desc: 'Production Root' },
      { domain: 'www.nexusstream.site', type: 'Custom', status: 'Active', desc: 'Production WWW' },
      { domain: 'nexusstream-3a734.web.app', type: 'Default', status: 'System', desc: 'Firebase Hosting' },
      { domain: 'nexusstream-3a734.firebaseapp.com', type: 'Default', status: 'System', desc: 'Firebase App' }
  ];

  const dynamicHostMatch = domainsToKeep.find(d => d.domain === currentHost || (d.domain.startsWith('*.') && currentHost.endsWith(d.domain.slice(2))));
  const isCurrentHostCovered = !!dynamicHostMatch || currentHost === 'localhost';

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/5 rounded-[32px] shadow-3xl flex flex-col max-h-[85vh] overflow-hidden">
        
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-nexus-accent/10 rounded-2xl border border-nexus-accent/20">
                <Globe className="text-nexus-accent" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Authorization Center</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Firebase Domain Strategy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 bg-[#050505] flex-1 custom-scrollbar">
            
            {/* Dynamic Alert for Current Host */}
            {!isCurrentHostCovered ? (
                <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-4 animate-pulse">
                    <AlertTriangle size={24} className="text-red-500 shrink-0"/>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">Unrecognized Environment</h3>
                        <p className="text-xs text-red-200/70 leading-relaxed mb-3">
                            You are running this app on <b>{currentHost}</b>, which is not in the authorized list. Google Auth will fail here. Use <b>Local Workspace</b>.
                        </p>
                        <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-red-500/20">
                            <code className="text-xs text-red-400 font-mono flex-1">{currentHost}</code>
                            <button onClick={() => navigator.clipboard.writeText(currentHost)} className="text-[10px] bg-red-500 text-black px-2 py-1 rounded font-bold uppercase hover:bg-white transition-colors">Copy</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex gap-4">
                    <CheckCircle2 size={24} className="text-green-500 shrink-0"/>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">Environment Secured</h3>
                        <p className="text-xs text-green-200/70 leading-relaxed">
                            Current domain <b>{currentHost}</b> matches the authorized configuration. Authentication should work normally.
                        </p>
                    </div>
                </div>
            )}

            <div className="border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-[#0a0a0a] text-gray-500 font-black uppercase tracking-widest">
                        <tr>
                            <th className="p-5">Domain Pattern</th>
                            <th className="p-5">Type</th>
                            <th className="p-5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                        {domainsToKeep.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-5">
                                    <div className="font-bold text-white">{item.domain}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">{item.desc}</div>
                                </td>
                                <td className="p-5">
                                    <span className="text-[9px] bg-nexus-900 border border-white/10 px-2 py-1 rounded-lg text-gray-400 font-bold uppercase">{item.type}</span>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-2 text-nexus-accent font-black text-[10px] uppercase">
                                        <ShieldCheck size={14} /> {item.status}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest">
                    <Info size={16}/> How to fix "Unauthorized Domain"
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Step 1</div>
                        <p className="text-xs text-gray-300">Go to Firebase Console → Authentication → Settings → Authorized Domains.</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Step 2</div>
                        <p className="text-xs text-gray-300">
                            Click "Add Domain" and paste: <span className="text-white font-mono bg-white/10 px-1 rounded">{currentHost}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center">
            <div className="flex items-center gap-3 text-gray-500">
                <Server size={14}/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Registry Sync: Active</span>
            </div>
            <button onClick={onClose} className="px-8 py-3 bg-white text-black font-black rounded-2xl text-[11px] uppercase hover:bg-gray-200 transition-all shadow-xl">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default DomainManager;
