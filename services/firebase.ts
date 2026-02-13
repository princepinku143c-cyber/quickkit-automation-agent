
/**
 * ⚠️ CORE FILE – DO NOT MODIFY WITHOUT AUTHORIZATION
 * Changes here can break auth, billing, and core logic.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions'; // 🔥 Added Functions

/* =====================================================
   NEXUSSTREAM – SECURE FIREBASE CONFIGURATION
   ===================================================== */

// 🔐 Storage key for optional runtime override
const STORAGE_KEY = 'nexus_firebase_config';

// ---------- OPTIONAL: Runtime Config Override ----------
export const updateFirebaseConfig = (configStr: string) => {
  try {
    const parsed = JSON.parse(configStr);
    if (!parsed.apiKey) throw new Error("apiKey missing");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    window.location.reload();
  } catch (e: any) {
    throw new Error("Invalid Firebase Config JSON: " + e.message);
  }
};

export const resetFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};

// ---------- ENV HELPER (STRICT VITE SUPPORT) ----------
const getEnv = (key: string) => {
  // 1. Try standard Vite Environment Variable
  // @ts-ignore
  if (import.meta?.env?.[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
  }
  
  // 2. Fallback check for common patterns or process.env (if polyfilled)
  if (typeof process !== 'undefined' && process.env) {
      return process.env[`VITE_${key}`] || 
             process.env[`REACT_APP_${key}`] || 
             process.env[key];
  }
  return undefined;
};

// ---------- FINAL CONFIG RESOLUTION ----------
let firebaseConfig: any = null;

// 1️⃣ Try localStorage override (Developer Tooling)
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) firebaseConfig = JSON.parse(stored);
} catch {}

// 2️⃣ Try ENV variables (Production Standard)
if (!firebaseConfig) {
  const apiKey = getEnv('FIREBASE_API_KEY');
  
  if (apiKey) {
      firebaseConfig = {
        apiKey: apiKey,
        authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
        projectId: getEnv('FIREBASE_PROJECT_ID'),
        storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
        appId: getEnv('FIREBASE_APP_ID'),
        measurementId: getEnv('FIREBASE_MEASUREMENT_ID'),
      };
  }
}

// ❌ NO HARDCODED FALLBACKS. FAIL FAST IF CONFIG MISSING.

// ---------- FIREBASE INIT ----------
let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let functions: firebase.functions.Functions; // 🔥 Added Type
let googleProvider: firebase.auth.GoogleAuthProvider;

if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        if (!firebase.apps.length) {
          app = firebase.initializeApp(firebaseConfig);
        } else {
          app = firebase.app();
        }

        // @ts-ignore
        if (typeof app !== 'undefined') {
            auth = firebase.auth();
            db = firebase.firestore();
            functions = app.functions(); // 🔥 Init Functions

            // 🔁 Offline persistence (safe wrap)
            db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                 console.warn("Persistence failed (likely multiple tabs):", err.code);
            });

            // 🔑 Google Provider Setup
            googleProvider = new firebase.auth.GoogleAuthProvider();
            googleProvider.setCustomParameters({ prompt: 'select_account' });
        }
    } catch (error) {
        console.error("🔥 Firebase Critical Init Error:", error);
    }
} else {
    console.warn("⚠️ Firebase Config Missing. Environment variables not loaded.");
}

export { app, auth, db, functions, googleProvider };
