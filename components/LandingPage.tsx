
import React from 'react';
import { Zap, Check, ArrowRight, Shield, Globe, Cpu, Play, Layout, Box } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (mode: 'login' | 'signup') => void;
  onDemo?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onDemo }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-nexus-accent/30 overflow-x-hidden relative">
        
        {/* BACKGROUND AMBIENCE */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-nexus-accent/5 rounded-full blur-[150px] opacity-40"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] opacity-40"></div>
            <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] opacity-30"></div>
        </div>

        {/* NAVIGATION */}
        <nav className="fixed top-0 w-full z-50 bg-[#050505]/70 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-10 h-10 bg-nexus-900/50 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-nexus-accent/50 transition-colors shadow-lg shadow-black/50">
                        <Zap className="text-nexus-accent" size={20} fill="currentColor" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-nexus-accent transition-colors">NexusStream</span>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={() => onNavigate('login')} className="hidden md:block px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign In</button>
                    <button onClick={() => onNavigate('signup')} className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-black uppercase tracking-wide hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>

        {/* HERO SECTION */}
        <section className="pt-48 pb-32 px-6 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-900/80 border border-nexus-accent/20 text-nexus-accent text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexus-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-nexus-accent"></span>
                    </span>
                    AI-Native Workflow Engine v2.0
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700">
                    Automate with <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-2xl">
                        Total Intelligence.
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 font-medium">
                    The first visual automation platform powered by <span className="text-white">Gemini 3.0</span>. 
                    Design, simulate, and deploy complex workflows without writing a single line of code.
                </p>
                
                <div className="flex flex-col md:flex-row gap-5 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    <button onClick={() => onNavigate('signup')} className="px-10 py-5 bg-nexus-accent text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-nexus-success hover:scale-105 transition-all shadow-[0_0_50px_rgba(0,255,157,0.4)] flex items-center justify-center gap-3 group">
                        Start Building Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    {onDemo && (
                        <button onClick={onDemo} className="px-10 py-5 bg-white/5 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-3 backdrop-blur-md">
                            <Play size={18} fill="currentColor" /> Watch Demo
                        </button>
                    )}
                </div>
            </div>
        </section>

        {/* UI PREVIEW MOCKUP */}
        <section className="px-4 pb-32 relative z-10">
            <div className="max-w-6xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-nexus-accent via-blue-500 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-[#0a0a0a] rounded-[1.8rem] border border-white/10 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="text-center p-8">
                        <div className="w-16 h-16 bg-nexus-900 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <Layout size={32} className="text-nexus-accent" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Visual Canvas</h3>
                        <p className="text-gray-500 text-sm">Drag, drop, and connect intelligent blocks.</p>
                    </div>
                    {/* Simulated Interface Lines */}
                    <div className="absolute top-0 left-0 w-full h-12 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
            </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-32 px-6 bg-[#080808]/50 border-t border-white/5 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Core Architecture</h2>
                    <p className="text-gray-400">Engineered for speed, reliability, and scale.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Cpu,
                            color: "text-nexus-accent",
                            title: "Neural Architecture",
                            desc: "Built on a distributed Node.js kernel optimized for AI latency. Sub-100ms cold starts for instant execution."
                        },
                        {
                            icon: Globe,
                            color: "text-blue-500",
                            title: "Global Edge Network",
                            desc: "Workflows execute on the edge, closest to your data sources. Reduced latency for real-time operations."
                        },
                        {
                            icon: Shield,
                            color: "text-purple-500",
                            title: "Enterprise Security",
                            desc: "SOC2 compliant infrastructure with automated audit logging, encrypted secrets, and role-based access."
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-10 rounded-[32px] bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-all group hover:-translate-y-1 duration-300">
                            <div className="w-14 h-14 bg-nexus-900/50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/5">
                                <feature.icon size={28} className={feature.color} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* PRICING SECTION */}
        <section className="py-32 px-6 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Simple Pricing</h2>
                    <p className="text-gray-400">Transparent costs. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {/* Free */}
                    <div className="p-8 rounded-[32px] bg-[#0c0c0c] border border-white/5 flex flex-col hover:border-white/10 transition-colors h-full">
                        <div className="mb-8">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Explorer</h3>
                            <div className="text-4xl font-black text-white">$0<span className="text-sm text-gray-500 font-medium">/mo</span></div>
                        </div>
                        <ul className="space-y-4 text-left text-sm text-gray-400 mb-12 flex-1">
                            <li className="flex gap-3 items-center"><Check size={16} className="text-white"/> 5 AI Prompts / mo</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-white"/> 100 Runs / mo</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-white"/> Community Support</li>
                            <li className="flex gap-3 items-center text-gray-600"><Box size={16}/> Basic Nodes Only</li>
                        </ul>
                        <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white hover:text-black transition-all text-xs uppercase tracking-wider border border-white/10">Start Free</button>
                    </div>

                    {/* Pro */}
                    <div className="p-8 rounded-[32px] bg-[#0c0c0c] border border-nexus-accent/30 flex flex-col relative overflow-hidden group shadow-[0_0_50px_-10px_rgba(0,255,157,0.15)] transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-nexus-accent text-black text-[10px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">Most Popular</div>
                        <div className="mb-8">
                            <h3 className="text-xs font-black text-nexus-accent uppercase tracking-widest mb-2">Pro Architect</h3>
                            <div className="text-5xl font-black text-white">$49<span className="text-sm text-gray-500 font-medium">/mo</span></div>
                        </div>
                        <ul className="space-y-4 text-left text-sm text-gray-300 mb-12 flex-1">
                            <li className="flex gap-3 items-center"><Check size={16} className="text-nexus-accent"/> 5,000 Credits / mo</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-nexus-accent"/> Unlimited Workflows</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-nexus-accent"/> Priority Support</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-nexus-accent"/> No-Code Builder Access</li>
                        </ul>
                        <button onClick={() => onNavigate('signup')} className="w-full py-5 rounded-xl bg-nexus-accent text-black font-black hover:bg-white transition-all text-xs uppercase tracking-widest shadow-lg">Get Pro Access</button>
                    </div>

                    {/* Business */}
                    <div className="p-8 rounded-[32px] bg-[#0c0c0c] border border-white/5 flex flex-col hover:border-purple-500/30 transition-colors h-full">
                        <div className="mb-8">
                            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Business</h3>
                            <div className="text-4xl font-black text-white">$99<span className="text-sm text-gray-500 font-medium">/mo</span></div>
                        </div>
                        <ul className="space-y-4 text-left text-sm text-gray-400 mb-12 flex-1">
                            <li className="flex gap-3 items-center"><Check size={16} className="text-purple-400"/> Everything in Pro</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-purple-400"/> Team Collaboration</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-purple-400"/> 20,000+ AI Credits</li>
                            <li className="flex gap-3 items-center"><Check size={16} className="text-purple-400"/> Audit Logs & SSO</li>
                        </ul>
                        <button onClick={() => onNavigate('signup')} className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold transition-all text-xs uppercase tracking-wider">Contact Sales</button>
                    </div>
                </div>
            </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 px-6 border-t border-white/5 bg-[#050505]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                    <Zap className="text-nexus-accent" size={16} fill="currentColor" />
                    <span className="font-bold text-white tracking-tight">NexusStream</span>
                </div>
                <p className="text-gray-600 text-xs font-medium">&copy; 2024 NexusStream Inc. All rights reserved.</p>
                <div className="flex gap-6 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Status</a>
                </div>
            </div>
        </footer>
    </div>
  );
};

export default LandingPage;
