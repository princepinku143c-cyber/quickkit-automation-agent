
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize and Monitor Auth State
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      alert("Firebase Config is missing in 'services/firebase.ts'.");
      return;
    }

    setAuthError(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Failed Details:", error);
      
      const errorCode = error.code || 'unknown';
      const errorMessage = error.message || 'Unknown error occurred';

      // 1. Check for Unauthorized Domain Error (Common in IDX/Localhost)
      if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
          setAuthError('unauthorized-domain');
          // We no longer alert here; App.tsx will detect this state and open DomainManager
      } else if (errorCode === 'auth/popup-closed-by-user') {
          console.log("User closed login popup.");
      } else {
          // General Error
          alert(`Login Error:\n${errorMessage}\n\n(Code: ${errorCode})`);
      }
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, authError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};
