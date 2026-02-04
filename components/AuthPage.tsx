
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, Lock, Mail, Github, LayoutGrid, Box, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
    view: 'login' | 'signup';
    onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ view, onBack }) => {
    const { signInWithGoogle, isDevMode } = useAuth();
    const [isSimulating, setIsSimulating] = useState(false);

    // This effectively activates the sandbox/guest mode from AuthContext
    const handleGuestAccess = () => {
        setIsSimulating(true);
        // We trigger the context logic. In a real app, you might expose activateSandbox directly.
        // For now, we reuse the existing context logic or a manual trigger if exposed.
        // Since AuthContext exposes activateSandbox via internal logic triggered by failures or manual dev mode,
        // we can cast to any to access the hidden method if it was exposed, OR rely on the public method.
        // Assuming AuthContext was updated to expose `activateSandbox` in the previous step, or we simulate here.
        // Let's use a "fake" login for the soft launch visual if AuthContext doesn't have it public.
        
        // *Self-Correction*: The previous AuthContext has `activateSandbox` but it wasn't in the interface.
        // We will assume the user clicks "Continue with Google" for real auth, 
        // OR clicks "Local Workspace" which we can simulate via the provided context method if available, 
        // or trigger the same error-fallback logic.
        
        // Actually, let's just trigger Google Sign In. If it fails (restricted env), AuthContext handles fallback.
        signInWithGoogle();
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans">
            {/* Nav */}
            <div className="absolute top-6 left-6 z-20">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-nexus-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(0,255,157,0.3)]">
                            <Zap size={32} className="text-nexus-accent" fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                            {view === 'signup' ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {view === 'signup' 
                                ? 'Start designing intelligent workflows in seconds.' 
                                : 'Enter your workspace credentials.'}
                        </p>
                    </div>

                    {/* Auth Box */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-2 shadow-2xl">
                        <div className="bg-[#0f0f0f] rounded-[24px] p-6 space-y-4 border border-white/5">
                            
                            {/* Primary Action */}
                            <button 
                                onClick={signInWithGoogle}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all group relative overflow-hidden"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 relative z-10" alt="G" />
                                <span className="relative z-10">Continue with Google</span>
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-600 tracking-widest">
                                    <span className="bg-[#0f0f0f] px-3">Or</span>
                                </div>
                            </div>

                            {/* Secondary Actions (Visual Only for Soft Launch) */}
                            <div className="space-y-3">
                                <button className="w-full py-3 bg-white/5 text-gray-300 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/5">
                                    <Mail size={18} /> Continue with Email
                                </button>
                                <button className="w-full py-3 bg-white/5 text-gray-300 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/5">
                                    <Github size={18} /> Continue with GitHub
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-600 max-w-xs mx-auto leading-relaxed">
                            By continuing, you agree to NexusStream's <span className="text-gray-400 hover:text-white cursor-pointer underline">Terms of Service</span> and <span className="text-gray-400 hover:text-white cursor-pointer underline">Privacy Policy</span>.
                        </p>
                        
                        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-700 uppercase tracking-widest">
                            <ShieldCheck size={12} /> Secure Encryption
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-nexus-accent/5 to-transparent pointer-events-none"></div>
        </div>
    );
};

export default AuthPage;
