
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowRight, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface AuthPageProps {
    view: 'login' | 'signup';
    onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ view, onBack }) => {
    const { signInWithGoogle, loading, authError } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleGoogleLogin = async () => {
        if (isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            await signInWithGoogle();
        } catch (e) {
            // Error is handled by AuthContext and exposed via authError
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans text-white">
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
                        <h1 className="text-3xl font-black mb-2 tracking-tight">
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
                        <div className="bg-[#0f0f0f] rounded-[24px] p-8 space-y-6 border border-white/5">
                            
                            {/* Error Display */}
                            {authError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 text-xs">
                                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            {/* Primary Action: Google */}
                            <button 
                                onClick={handleGoogleLogin}
                                disabled={isAuthenticating || loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {isAuthenticating || loading ? (
                                    <Loader2 size={20} className="animate-spin text-black" />
                                ) : (
                                    <>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 relative z-10" alt="G" />
                                        <span className="relative z-10">Continue with Google</span>
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                                    Trusted by 10,000+ Architects
                                </p>
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
