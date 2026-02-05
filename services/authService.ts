
import { auth, googleProvider } from './firebase';

/**
 * Raw Service Call to Firebase
 * Decouples logic from React Context
 */
export const triggerGoogleLogin = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  // Explicitly force popup for better reliability in some browsers
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  
  const result = await auth.signInWithPopup(googleProvider);
  return result.user;
};

export const triggerLogout = async () => {
  if (auth) await auth.signOut();
};
