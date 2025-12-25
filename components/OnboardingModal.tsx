
import React from 'react';
import { ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onOpenAI: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onOpenAI }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
       <div className="bg-nexus-900 border border-nexus-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="h-40 bg-gradient-to-br from-nexus-950 to-nexus-900 relative overflow-hidden flex flex-col items-center justify-center border-b border-nexus-800">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
             <div className="text-center z-10 relative">
                 <div className="w-12 h-12 bg-nexus-800 rounded-xl border border-nexus-700 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,255,157,0.1)]">
                    <Sparkles size={24} className="text-nexus-accent" />
                 </div>
                <h1 className="text-2xl font-display font-bold text-white mb-1">Nexus<span className="text-nexus-accent">Stream</span></h1>
                <p className="text-xs text-nexus-400 font-mono tracking-wide uppercase">AI-Native Automation</p>
             </div>
          </div>
          
          <div className="p-6">
             <h2 className="text-lg font-bold text-white mb-2 text-center">How do you want to build?</h2>
             <p className="text-center text-xs text-gray-500 mb-6 px-4">
                 NexusStream is designed to be built with AI. Describe your idea, and let the Architect handle the wiring.
             </p>

             <div className="space-y-3">
                {/* Primary Option: AI */}
                <button 
                    onClick={onOpenAI}
                    className="w-full p-4 bg-nexus-accent hover:bg-nexus-success text-nexus-950 rounded-xl transition-all flex items-center gap-4 group shadow-[0_0_15px_rgba(0,255,157,0.2)] hover:shadow-[0_0_25px_rgba(0,255,157,0.4)]"
                >
                    <div className="p-2 bg-black/10 rounded-lg">
                        <MessageSquare size={20} className="text-nexus-950" />
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-bold text-sm">Describe with AI (Recommended)</div>
                        <div className="text-xs opacity-70">"Build a crypto tracker", "Create a chatbot"...</div>
                    </div>
                    <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Secondary Option: Manual */}
                <button 
                    onClick={onClose}
                    className="w-full p-4 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 text-gray-300 rounded-xl transition-all flex items-center gap-4 group"
                >
                    <div className="p-2 bg-nexus-900 rounded-lg border border-nexus-800">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-nexus-500"></div>
                            <div className="w-2 h-2 rounded-full bg-nexus-500"></div>
                        </div>
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-bold text-sm">Build Manually</div>
                        <div className="text-xs text-gray-500">Drag & drop blocks from the sidebar.</div>
                    </div>
                </button>
             </div>

             <div className="mt-6 text-center">
                 <p className="text-[10px] text-gray-600">
                     Tip: You can always use the AI Architect later by clicking the ✨ button.
                 </p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default OnboardingModal;
