
/**
 * ⚠️ CORE FILE – DO NOT MODIFY WITHOUT AUTHORIZATION
 * Changes here can break auth, billing, and core logic.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../services/firebase';
import { ensureUserProfile } from '../services/userService';
import { triggerGoogleLogin, triggerLogout } from '../services/authService';
import { Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  isDevMode: boolean;
  canUseLocalBypass: boolean;
  localBypassLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);

  // --- 1. SESSION LISTENER ---
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

  // --- 2. LOGIN ACTION (WRAPPED) ---
  const signInWithGoogle = async () => {
    setAuthError(null);
    
    // 🔥 Safety Check: Ensure Firebase initialized
    if (!auth) {
        setAuthError("System Error: Firebase is not configured. Please verify your environment variables.");
        return;
    }

    try {
        // Call the decoupled service
        const user = await triggerGoogleLogin();
        
        if (user) {
            // 🔥 CRITICAL: Ensure Firestore Profile Exists
            await ensureUserProfile(user);
        }
    } catch (error: any) {
        console.error("Login Context Error:", error);
        
        let errorMsg = error.message || "Unknown Authentication Error";

        // Smart Error Handling
        if (error.code === 'auth/popup-closed-by-user') {
            errorMsg = "Login cancelled by user.";
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMsg = `Domain Blocked: Add "${window.location.hostname}" to Firebase Console > Authentication > Settings`;
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = "Network Error: Check internet connection.";
        } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
            errorMsg = "Environment Security: This browser environment (e.g. Incognito or File System) blocks authentication. Please use a standard browser window.";
        } else if (error.code === 'auth/api-key-not-valid') {
            errorMsg = "Configuration Error: The Firebase API Key is invalid or expired. Please check your project settings.";
        }

        setAuthError(errorMsg);
        // Re-throw for UI alert
        throw new Error(errorMsg);
    }
  };

  // --- 3. LOGOUT ACTION ---
  const logout = async () => {
    try {
        localStorage.removeItem('nexus_active_session');
        localStorage.removeItem('nexus_user_plan');
        setUser(null);
        await triggerLogout();
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  // --- 4. BYPASS ACTION (FOR TESTING) ---
  const bypassAuth = () => {
    const mockUser = {
        uid: 'dev-bypass-user-999',
        email: 'tester@nexusstream.site',
        displayName: 'Nexus Tester',
        photoURL: 'https://picsum.photos/200'
    } as any;
    
    setUser(mockUser);
    setIsDevMode(true);
    localStorage.setItem('nexus_active_session', 'dev-bypass');
    localStorage.setItem('nexus_user_plan', 'ELITE');
    toast.success("DEV BYPASS ACTIVE: ELITE ACCESS GRANTED");
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
  
  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        signInWithGoogle, 
        logout, 
        authError, 
        isDevMode, 
        canUseLocalBypass: true, 
        localBypassLogin: bypassAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
