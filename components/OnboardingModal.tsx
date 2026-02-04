
import React, { useState } from 'react';
import { ArrowRight, Sparkles, MessageSquare, Check, LayoutGrid, AlertTriangle, Play } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
  onOpenAI: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onOpenAI }) => {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(s => s + 1);

  const handleActionChoice = (choice: 'AI' | 'CANVAS') => {
      // If AI, we proceed to limit notice then open AI
      if (choice === 'AI') {
          setStep(4);
      } else {
          // If Canvas, proceed to limit notice then close
          setStep(4);
      }
  };

  const handleFinalize = () => {
      // Only called at step 4
      if (step === 4) {
          // Check what the user clicked previously by checking if onOpenAI is passed
          // But actually we just close the modal and maybe trigger AI if that was the path.
          // For simplicity, we just close here, and if they chose AI in step 3, we would have stored it.
          // Let's refine logic: Step 3 branches.
      }
      onClose();
  };

  // Helper for rendering content based on step
  const renderStep = () => {
      switch(step) {
          case 1: // WELCOME
              return (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                      <div className="w-16 h-16 bg-nexus-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-nexus-accent/20">
                          <Sparkles size={32} className="text-nexus-accent animate-pulse" />
                      </div>
                      <h2 className="text-3xl font-black text-white mb-3">Welcome to NexusStream 👋</h2>
                      <p className="text-sm text-gray-400 mb-8 leading-relaxed px-4">
                          This tool helps you design automations with AI — safely and visually.
                          <br/>Think first, build faster.
                      </p>
                      <button onClick={nextStep} className="w-full py-4 bg-nexus-accent text-black font-black rounded-xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg">
                          Get Started
                      </button>
                  </div>
              );

          case 2: // CAPABILITIES CHECKLIST
              return (
                  <div className="animate-in fade-in slide-in-from-right-4">
                      <h2 className="text-2xl font-black text-white mb-6 text-center">What You Can Do</h2>
                      <div className="space-y-4 mb-8">
                          {[
                              "Design workflows visually on the canvas",
                              "Use AI to plan and validate logic",
                              "Catch errors before execution"
                          ].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                      <Check size={14} className="text-green-400" strokeWidth={3} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-200">{item}</span>
                              </div>
                          ))}
                      </div>
                      <button onClick={nextStep} className="w-full py-4 bg-nexus-900 border border-nexus-700 hover:border-nexus-accent text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all">
                          Continue
                      </button>
                  </div>
              );

          case 3: // ACTION CHOICE
              return (
                  <div className="text-center animate-in fade-in slide-in-from-right-4">
                      <h2 className="text-2xl font-black text-white mb-2">How to start?</h2>
                      <p className="text-xs text-gray-500 mb-8">Choose your preferred way to build.</p>
                      
                      <div className="space-y-3">
                          <button 
                              onClick={() => { localStorage.setItem('nexus_start_mode', 'AI'); nextStep(); }}
                              className="w-full p-5 bg-nexus-accent text-black rounded-2xl flex items-center gap-4 hover:bg-nexus-success transition-all group"
                          >
                              <div className="p-2 bg-black/10 rounded-lg"><MessageSquare size={24}/></div>
                              <div className="text-left flex-1">
                                  <div className="font-black text-sm uppercase tracking-wide">Chat with Architect</div>
                                  <div className="text-[10px] opacity-70 font-medium">Recommended for new ideas</div>
                              </div>
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                          </button>

                          <button 
                              onClick={() => { localStorage.setItem('nexus_start_mode', 'CANVAS'); nextStep(); }}
                              className="w-full p-5 bg-nexus-900 border border-nexus-800 text-white rounded-2xl flex items-center gap-4 hover:border-nexus-600 transition-all group"
                          >
                              <div className="p-2 bg-black/20 rounded-lg"><LayoutGrid size={24} className="text-gray-400"/></div>
                              <div className="text-left flex-1">
                                  <div className="font-bold text-sm uppercase tracking-wide">Empty Canvas</div>
                                  <div className="text-[10px] text-gray-500 font-medium">For manual builders</div>
                              </div>
                          </button>
                      </div>
                  </div>
              );

          case 4: // LIMIT NOTICE (HONEST)
              return (
                  <div className="text-center animate-in fade-in slide-in-from-right-4">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                          <AlertTriangle size={32} className="text-blue-400" />
                      </div>
                      <h2 className="text-xl font-black text-white mb-3">Free Plan Notice</h2>
                      <div className="bg-nexus-900/50 p-6 rounded-2xl border border-nexus-800 mb-8">
                          <p className="text-sm text-gray-300 leading-relaxed">
                              You are on the <b>Explorer Plan</b>.
                              <br/>You get <span className="text-nexus-accent font-bold">5 AI Prompts</span> to experience the power of the Architect.
                          </p>
                      </div>
                      <button 
                        onClick={() => {
                            onClose();
                            if (localStorage.getItem('nexus_start_mode') === 'AI') onOpenAI();
                        }} 
                        className="w-full py-4 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                          Got it, Let's Build
                      </button>
                  </div>
              );
          
          default: return null;
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
       <div className="w-full max-w-md bg-[#0a0a0a] border border-nexus-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-1 bg-nexus-800 w-full">
              <div className="h-full bg-nexus-accent transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
          </div>
          
          {renderStep()}

          {/* Step Indicator */}
          <div className="mt-8 flex justify-center gap-2">
              {[1,2,3,4].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${step === i ? 'bg-nexus-accent' : 'bg-nexus-800'}`}></div>
              ))}
          </div>
       </div>
    </div>
  );
};

export default OnboardingModal;
