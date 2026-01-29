
import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth, googleProvider } from '../services/firebase';
import { Zap, ArrowRight, RefreshCw, Info, ShieldCheck, Box, AlertTriangle, MonitorX, CloudOff } from 'lucide-react';

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const getAnonymousId = () => {
    let id = localStorage.getItem('nexus_anon_id');
    if (!id) {
        id = `anon_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('nexus_anon_id', id);
    }
    return id;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [envRestricted, setEnvRestricted] = useState(false); 

  useEffect(() => {
      // Proactive check for restricted protocols (file:// or extensions)
      if (typeof window !== 'undefined') {
          const protocol = window.location.protocol;
          if (protocol === 'file:' || protocol.includes('extension')) {
              setEnvRestricted(true);
              setAuthError("Environment Restricted: Google Auth requires http/https. Using Sandbox.");
          }
      }
  }, []);

  const activateSandbox = () => {
      setLoading(true);
      setTimeout(() => {
          setIsDevMode(true);
          setEnvRestricted(false); // Clear restriction flag so UI renders
          const anonId = getAnonymousId();
          const mockUser: any = {
              uid: anonId,
              email: 'sandbox@nexus.local',
              displayName: 'Local Architect',
              photoURL: null,
              isAnonymous: true
          };
          setUser(mockUser);
          setLoading(false);
      }, 600);
  };

  useEffect(() => {
    if (!auth) { 
        setLoading(false); 
        return; 
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
        setAuthError("Firebase Core not initialized. Check configuration.");
        return;
    }
    setAuthError(null);
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (error: any) {
        console.error("Login Error:", error);
        
        if (error.code === 'auth/operation-not-supported-in-this-environment' || error.message?.includes('protocol')) {
            setEnvRestricted(true);
            setAuthError("Environment Error: Google Auth unavailable on this domain/protocol. Use Local Workspace.");
        } else if (error.code === 'auth/popup-closed-by-user') {
            setAuthError("Sign-in cancelled by user.");
        } else if (error.code === 'auth/unauthorized-domain') {
            setAuthError(`Domain Not Authorized: Add "${window.location.hostname}" to Firebase Console > Auth > Settings.`);
        } else if (error.code === 'auth/network-request-failed') {
            setAuthError("Network Error: Check internet or firewall.");
        } else {
            setAuthError(error.message || "Unknown Authentication Error");
        }
    }
  };

  const logout = async () => {
    try {
        localStorage.removeItem('nexus_active_session');
        setUser(null);
        setIsDevMode(false);
        if (auth) await auth.signOut();
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-sans">
              <div className="relative">
                  <div className="w-16 h-16 border-2 border-nexus-accent/20 border-t-nexus-accent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={20} className="text-nexus-accent animate-pulse" fill="currentColor"/>
                  </div>
              </div>
              <div className="mt-6 text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold animate-pulse">Initializing Core</div>
          </div>
      );
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 font-sans text-white relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,255,157,0.05),_transparent_60%)]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-accent to-transparent opacity-20"></div>

              <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
                  
                  {/* Logo Header */}
                  <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-24 h-24 bg-[#0a0a0a] border border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_60px_-10px_rgba(0,255,157,0.15)] group relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-nexus-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <Zap size={48} className="text-nexus-accent relative z-10 transition-transform group-hover:scale-110 duration-500" fill="currentColor" />
                      </div>
                      <h1 className="text-4xl font-black mb-3 tracking-tighter text-white">Nexus<span className="text-nexus-accent">Stream</span></h1>
                      <div className="flex items-center gap-3 text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">System Operational</span>
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                          <span className="text-[10px] font-mono text-gray-600">v2.5.1</span>
                      </div>
                  </div>

                  {/* Auth Container */}
                  <div className="space-y-4 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-[32px] shadow-2xl">
                      
                      {authError && (
                          <div className="mx-2 mt-2 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-200 animate-in slide-in-from-top-2">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
                              <div className="text-xs leading-relaxed font-medium">
                                  {authError}
                                  {authError.includes('Domain') && (
                                      <div className="mt-2 text-[10px] text-red-400 bg-black/40 p-2 rounded border border-red-500/10">
                                          Current Domain: <span className="font-mono text-white">{window.location.hostname}</span>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      <div className="p-4 space-y-4">
                          {/* Google Button */}
                          <button 
                            onClick={signInWithGoogle}
                            className={`w-full h-[64px] bg-white hover:bg-gray-200 text-black rounded-2xl transition-all flex items-center justify-center gap-4 font-bold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-[0.98] group relative overflow-hidden ${envRestricted ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            disabled={envRestricted}
                          >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6 relative z-10" alt="G" />
                            <span className="relative z-10 tracking-wide">Continue with Google</span>
                          </button>

                          <div className="relative py-2">
                              <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t border-white/5"></div>
                              </div>
                              <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-600 tracking-widest">
                                  <span className="bg-[#0a0a0a] px-4">Or Access Locally</span>
                              </div>
                          </div>

                          {/* Sandbox Button */}
                          <button 
                              onClick={activateSandbox}
                              className="w-full p-1 border rounded-2xl transition-all group flex items-center relative overflow-hidden bg-[#121212] hover:bg-[#1a1a1a] border-white/5 hover:border-nexus-accent/30"
                          >
                              <div className="w-14 h-14 bg-nexus-accent/5 rounded-xl flex items-center justify-center border border-nexus-accent/10 text-nexus-accent group-hover:bg-nexus-accent group-hover:text-black transition-all relative z-10">
                                  <Box size={20} />
                              </div>
                              <div className="text-left px-4 flex-1 relative z-10">
                                  <div className="font-bold text-xs text-gray-200 group-hover:text-white mb-0.5">
                                      Open Local Workspace
                                  </div>
                                  <div className="text-[10px] text-gray-600 font-medium tracking-wide">Offline Mode • No Sync</div>
                              </div>
                              <div className="pr-4 text-gray-700 group-hover:text-nexus-accent transition-colors relative z-10">
                                  <ArrowRight size={18} />
                              </div>
                          </button>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 flex justify-center gap-8 opacity-30 hover:opacity-60 transition-opacity">
                      <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-gray-400 hover:text-white">
                          <ShieldCheck size={12}/> Secure Gateway
                      </button>
                      <button onClick={() => window.location.reload()} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-gray-400 hover:text-white">
                          <RefreshCw size={12}/> Refresh
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, authError, isDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};
