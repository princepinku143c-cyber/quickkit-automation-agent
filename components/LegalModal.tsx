
import React, { useState } from 'react';
import { X, Shield, FileText, Scale, ExternalLink, ScrollText } from 'lucide-react';
import { PolicyType } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyType;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'TERMS' }) => {
  const [activeTab, setActiveTab] = useState<PolicyType>(initialTab);

  if (!isOpen) return null;

  const policies = {
    TERMS: {
      title: "Terms of Service",
      content: `
        NexusStream is a SaaS automation platform provided "as is". 
        By using this platform, you agree that you are using digital tools to build automated workflows. 
        We do not guarantee financial returns or physical goods.
        
        1. ACCOUNT SECURITY: You are responsible for safeguarding your API keys.
        2. USAGE LIMITS: Fair use policies apply to AI generation.
        3. NO UNLAWFUL USE: Workflows must comply with local laws and target platform TOS.
      `
    },
    PRIVACY: {
      title: "Privacy Policy",
      content: `
        We value your privacy. We only collect data necessary for executing your workflows.
        
        1. DATA ENCRYPTION: Your API credentials are encrypted at rest.
        2. LOG RETENTION: Execution logs are kept for 30 days unless configured otherwise.
        3. THIRD PARTIES: We share data only with the LLM providers (e.g. Google AI) you connect.
      `
    },
    REFUND: {
      title: "Refund Policy",
      content: `
        We offer a 7-day "No Questions Asked" refund for any subscription plan.
        
        1. USAGE-BASED: Credits used for AI generation are non-refundable.
        2. CANCELLATION: You can cancel auto-renewal at any time via the dashboard.
        3. FAILED WORKFLOWS: If a system error occurs, contact support for credit reimbursement.
      `
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[85vh] bg-[#080808] border border-white/10 rounded-[40px] shadow-3xl flex flex-col overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20 text-blue-500">
                <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Compliance Center</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Legal & Policy Framework</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-white/5 bg-[#050505] p-6 space-y-2">
            {(['TERMS', 'PRIVACY', 'REFUND'] as PolicyType[]).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black' : 'text-gray-500 hover:bg-white/5'}`}
              >
                {tab === 'TERMS' ? <Scale size={14}/> : tab === 'PRIVACY' ? <Shield size={14}/> : <FileText size={14}/>}
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-black">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
               <ScrollText className="text-nexus-accent" size={20}/>
               {policies[activeTab].title}
            </h3>
            <div className="text-sm text-gray-400 leading-relaxed space-y-4 font-medium whitespace-pre-wrap opacity-80">
                {policies[activeTab].content}
            </div>
            
            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-[10px] font-black text-gray-500 uppercase mb-4">Official Disclaimer</div>
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                    NexusStream is a platform for building digital workflows. We are not financial advisors, legal experts, or physical vendors. No physical goods are shipped. 
                </p>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-[#0a0a0a] flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span>Last Updated: Sept 20, 2024</span>
            <div className="flex gap-6">
                <button className="hover:text-white flex items-center gap-1"><ExternalLink size={10}/> Global Compliance</button>
                <button onClick={onClose} className="text-nexus-accent hover:text-white transition-colors">Acknowledge</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
