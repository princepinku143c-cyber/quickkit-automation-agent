
import React, { useEffect } from 'react';
import { Zap, Layout, Brain, Shield, AlertTriangle, MessageSquare, Check, ArrowRight, PlayCircle, Lock } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: 'signup' | 'login') => void;
  onDemo?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onDemo }) => {
  
  // DYNAMIC SCROLL UNLOCK: Critical for Landing Page to scroll while App is locked
  useEffect(() => {
      document.body.style.overflowY = 'auto'; // Unlock scroll
      return () => {
          document.body.style.overflowY = 'hidden'; // Re-lock when entering app
      };
  }, []);

  const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDocsClick = () => {
      alert("HOW NEXUSSTREAM WORKS:\n\n1. Sign in with Google.\n2. Describe your workflow to the AI Architect.\n3. Verify the logic on the Visual Canvas.\n4. Test run securely before deployment.\n\nFull documentation is currently being written.");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-nexus-accent/30 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-nexus-accent/10 rounded-xl flex items-center justify-center border border-nexus-accent/20">
              <Zap size={24} className="text-nexus-accent" fill="currentColor" />
            </div>
            <span className="text-xl font-black tracking-tight">Nexus<span className="text-nexus-accent">Stream</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={handleDocsClick} className="hover:text-white transition-colors">How it Works</button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-bold text-gray-300 hover:text-white transition-colors hidden sm:block">Login</button>
            <button onClick={() => onNavigate('signup')} className="px-6 py-2.5 bg-nexus-accent text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-nexus-success transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:scale-105">
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-nexus-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-nexus-accent mb-8 animate-in fade-in slide-in-from-bottom-4">
            <SparkleIcon /> AI-First Automation Designer
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-500">
            Design Automations <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-accent to-blue-500">Smarter with AI</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
            Plan, validate, and improve workflow logic visually — <span className="text-white font-semibold">before you build or run anything.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <button onClick={() => onNavigate('signup')} className="w-full sm:w-auto px-8 py-4 bg-nexus-accent text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_10px_40px_rgba(0,255,157,0.2)] flex items-center justify-center gap-2">
              Start Free <ArrowRight size={16}/>
            </button>
            <button onClick={onDemo} className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-bold rounded-2xl text-sm border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <PlayCircle size={18}/> View Demo
            </button>
          </div>

          <div className="mt-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <Shield size={12}/> No Credit Card Required • Instant Access
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 max-w-6xl mx-auto relative z-10 group cursor-pointer" onClick={() => onNavigate('signup')}>
            <div className="absolute inset-0 bg-nexus-accent/20 blur-3xl -z-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-2 shadow-2xl overflow-hidden">
                <div className="bg-[#050505] rounded-[24px] border border-white/5 aspect-[16/9] relative flex items-center justify-center overflow-hidden">
                    {/* Abstract UI Representation */}
                    <div className="absolute inset-0 grid-pattern opacity-30"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-nexus-accent/20 rounded-xl bg-nexus-900/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <Brain size={48} className="text-nexus-accent mx-auto animate-pulse" />
                            <div className="text-sm font-mono text-nexus-accent">AI Architect: "Analyzing Logic..."</div>
                        </div>
                    </div>
                    {/* Floating Nodes */}
                    <div className="absolute top-20 left-20 p-4 bg-nexus-900 border border-white/10 rounded-xl flex items-center gap-3 shadow-xl animate-float">
                        <MessageSquare size={20} className="text-blue-400"/>
                        <div className="w-20 h-2 bg-white/10 rounded"></div>
                    </div>
                    <div className="absolute bottom-20 right-20 p-4 bg-nexus-900 border border-white/10 rounded-xl flex items-center gap-3 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                        <Layout size={20} className="text-purple-400"/>
                        <div className="w-24 h-2 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* FEATURES / CLARITY SECTION */}
      <section id="features" className="py-24 border-t border-white/5 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black mb-4">Think Before You Automate</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">Most tools force you to build and run immediately. We help you design the logic first, so you don't waste time fixing broken flows later.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: Layout, title: "Visual Canvas", desc: "Design automation logic visually. Drag, drop, and connect ideas without code." },
                    { icon: Brain, title: "AI Architect", desc: "Chat with an AI that understands automation. It suggests, validates, and builds for you." },
                    { icon: AlertTriangle, title: "Safe Design", desc: "Get warnings for broken logic before you deploy. No accidental infinite loops." }
                ].map((card, i) => (
                    <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.04] transition-all group">
                        <div className="w-14 h-14 bg-nexus-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5">
                            <card.icon size={28} className="text-nexus-accent" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* AI AGENT SECTION */}
      <section className="py-24 bg-[#050505] relative">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                  <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">
                      Core Differentiator
                  </div>
                  <h2 className="text-4xl font-black mb-6">Your AI Automation Agent</h2>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                      Chat with an intelligent agent that plans your workflow. It validates your logic, suggests missing steps, and explains complex paths in simple English.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                      {["Design from plain language", "Validate flow structure", "Never runs silently"].map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-nexus-accent/10 flex items-center justify-center">
                                  <Check size={12} className="text-nexus-accent" strokeWidth={3} />
                              </div>
                              <span className="text-sm font-bold text-gray-300">{item}</span>
                          </div>
                      ))}
                  </div>

                  <div className="p-4 bg-nexus-900/50 border border-nexus-800 rounded-xl flex items-start gap-4">
                      <Lock size={20} className="text-nexus-wire mt-1 shrink-0"/>
                      <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Honest Note</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">The AI agent designs and explains workflows. It does not execute automations directly.</p>
                      </div>
                  </div>
              </div>
              
              <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                  <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl">
                      {/* Fake Chat UI */}
                      <div className="space-y-4">
                          <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-nexus-800"></div>
                              <div className="bg-nexus-900 p-3 rounded-2xl rounded-tl-none text-xs text-gray-300 border border-white/5">
                                  Build a lead scraper that saves to Sheets.
                              </div>
                          </div>
                          <div className="flex gap-4 flex-row-reverse">
                              <div className="w-8 h-8 rounded-full bg-nexus-accent/20 flex items-center justify-center"><Brain size={14} className="text-nexus-accent"/></div>
                              <div className="bg-nexus-accent/10 p-4 rounded-2xl rounded-tr-none text-xs text-white border border-nexus-accent/20">
                                  <p className="mb-2 font-bold text-nexus-accent">I've designed that for you.</p>
                                  <p>1. Webhook Trigger</p>
                                  <p>2. AI Scraper Node</p>
                                  <p>3. Google Sheets (Append)</p>
                                  <div className="mt-3 flex gap-2">
                                      <span className="px-2 py-1 bg-black/40 rounded text-[9px] border border-nexus-accent/30">Valid Logic</span>
                                      <span className="px-2 py-1 bg-black/40 rounded text-[9px] border border-nexus-accent/30">Safe</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 border-t border-white/5 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-black mb-4">Simple, Honest Pricing</h2>
              <p className="text-gray-400 mb-16">Start for free. Upgrade when you need power.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {/* Free */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col hover:bg-white/[0.04] transition-colors">
                      <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-2">Free</h3>
                      <div className="text-4xl font-black text-white mb-6">$0</div>
                      <ul className="space-y-4 text-left text-sm text-gray-400 mb-8 flex-1">
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> 1 Workflow Project</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> 5 AI Prompts (Lifetime)</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> Visual Canvas</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> Local Drafts</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all uppercase tracking-wider text-xs">Start Free</button>
                  </div>

                  {/* Pro */}
                  <div className="p-8 rounded-3xl bg-nexus-accent/5 border border-nexus-accent/30 flex flex-col relative overflow-hidden transform md:-translate-y-4 shadow-2xl">
                      <div className="absolute top-0 inset-x-0 h-1 bg-nexus-accent"></div>
                      <div className="absolute top-4 right-4 bg-nexus-accent text-black text-[9px] font-black px-2 py-1 rounded uppercase">Popular</div>
                      <h3 className="text-lg font-bold text-nexus-accent uppercase tracking-widest mb-2">Pro</h3>
                      <div className="text-4xl font-black text-white mb-6">$49<span className="text-sm text-gray-500 font-medium">/mo</span></div>
                      <ul className="space-y-4 text-left text-sm text-gray-300 mb-8 flex-1">
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> Unlimited Workflows</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> 200 AI Prompts / mo</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> Cloud Save & History</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-accent"/> Channel Design Mode</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl bg-nexus-accent text-black font-black hover:bg-nexus-success transition-all shadow-lg text-xs uppercase tracking-wider">Get Pro</button>
                  </div>

                  {/* Business */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col hover:bg-white/[0.04] transition-colors">
                      <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-2">Business</h3>
                      <div className="text-4xl font-black text-white mb-6">$99<span className="text-sm text-gray-500 font-medium">/mo</span></div>
                      <ul className="space-y-4 text-left text-sm text-gray-400 mb-8 flex-1">
                          <li className="flex gap-3"><Check size={16} className="text-nexus-wire"/> Everything in Pro</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-wire"/> Team Collaboration</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-wire"/> 500+ AI Prompts</li>
                          <li className="flex gap-3"><Check size={16} className="text-nexus-wire"/> Audit Logs</li>
                      </ul>
                      <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all text-xs uppercase tracking-wider">Contact Sales</button>
                  </div>
              </div>
          </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-nexus-900 to-black border border-white/10 rounded-[40px] p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-black mb-6 text-white">Start Designing Smarter Today</h2>
                  <p className="text-gray-400 mb-10 text-lg">No credit card. No execution risk. Just better thinking.</p>
                  <button onClick={() => onNavigate('signup')} className="px-10 py-5 bg-nexus-accent text-black font-black rounded-2xl text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                      Start Free Now
                  </button>
              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center text-xs text-gray-600">
          <div className="flex justify-center gap-8 mb-8 font-bold uppercase tracking-widest">
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <button onClick={handleDocsClick} className="hover:text-white transition-colors">How it Works</button>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p>© 2026 NexusStream. Design workflows with clarity.</p>
      </footer>

    </div>
  );
};

const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
    <path d="M12 2L14.39 9.61L22 12L14.39 14.39L12 22L9.61 14.39L2 12L9.61 9.61L12 2Z" />
  </svg>
);

export default LandingPage;
