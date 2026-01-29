
import React, { useState } from 'react';
import { ArrowRight, Lock, LayoutGrid, Sparkles } from 'lucide-react';

interface PortalLoginProps {
    onLogin: () => void;
    projectTitle?: string;
}

const PortalLogin: React.FC<PortalLoginProps> = ({ onLogin, projectTitle }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Simulating Auth Check
        setTimeout(() => {
            if (code === '1234' || code.length > 0) {
                onLogin();
            } else {
                setError('Invalid Access Code');
                setLoading(false);
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 font-sans text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <LayoutGrid size={24} className="text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Client Portal</h1>
                    <p className="text-sm text-gray-500">
                        Access dashboard for <span className="text-white font-semibold">{projectTitle || 'Automation System'}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Access Code</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input 
                                type="password" 
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Enter your client pin..."
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Secure Login'} <ArrowRight size={16} />
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1.5">
                        <Sparkles size={10} className="text-blue-500"/> Powered by NexusStream
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PortalLogin;
