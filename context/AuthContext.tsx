
/**
 * ⚠️ CORE FILE – DO NOT MODIFY WITHOUT AUTHORIZATION
 * Changes here can break auth, billing, and core logic.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth, googleProvider } from '../services/firebase';
import { ensureUserProfile } from '../services/userService';
import { Zap } from 'lucide-react';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [envRestricted, setEnvRestricted] = useState(false); 

  useEffect(() => {
      if (typeof window !== 'undefined') {
          const protocol = window.location.protocol;
          if (protocol === 'file:' || protocol.includes('extension')) {
              setEnvRestricted(true);
              setAuthError("Environment Restricted: Google Auth requires http/https. Using Sandbox.");
          }
      }
  }, []);

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
        const result = await auth.signInWithPopup(googleProvider);
        if (result.user) {
            // 🔥 CRITICAL: Ensure Firestore Profile Exists immediately after login
            await ensureUserProfile(result.user);
        }
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
        // Clear sensitive local caches
        localStorage.removeItem('nexus_user_plan');
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

  // NOTE: We don't block render if !user here, because App.tsx handles the routing logic
  // to show LandingPage if not logged in.
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, authError, isDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};
