
/**
 * ⚠️ CORE FILE – DO NOT MODIFY WITHOUT AUTHORIZATION
 * Changes here can break auth, billing, and core logic.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

/* =====================================================
   NEXUSSTREAM – FINAL STABLE FIREBASE CONFIG
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

// ---------- ENV HELPER ----------
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return process.env[key];
      if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
      if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
  }
  // @ts-ignore
  try { return import.meta?.env?.[`VITE_${key}`] || import.meta?.env?.[key]; } catch { return undefined; }
};

// ---------- FINAL CONFIG RESOLUTION ----------
let firebaseConfig: any = null;

// 1️⃣ Try localStorage override
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) firebaseConfig = JSON.parse(stored);
} catch {}

// 2️⃣ Try ENV variables
if (!firebaseConfig) {
  const envConfig = {
    apiKey: getEnv('FIREBASE_API_KEY'),
    authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('FIREBASE_APP_ID'),
    measurementId: getEnv('FIREBASE_MEASUREMENT_ID'),
  };
  if (envConfig.apiKey) firebaseConfig = envConfig;
}

// 3️⃣ FINAL FALLBACK (🔥 CORRECTED CONFIGURATION 🔥)
if (!firebaseConfig) {
  firebaseConfig = {
    apiKey: "AIzaSyC0c0orE9oK7JZMwswRviBB0cWdnVnwdd4",
    authDomain: "nexusstream-3a734.firebaseapp.com",
    projectId: "nexusstream-3a734",
    // FIXED: Using appspot.com to prevent Auth/CORS conflicts
    // Previously: firebasestorage.app (Incorrect for Web SDK)
    storageBucket: "nexusstream-3a734.appspot.com",
    messagingSenderId: "639362646888",
    appId: "1:639362646888:web:5a917cd44032eb5989ccdd",
    measurementId: "G-HD73Q2TQHW",
  };
}

// ---------- FIREBASE INIT ----------
let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let googleProvider: firebase.auth.GoogleAuthProvider;

try {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app(); // Use existing instance
    }

    // @ts-ignore
    if (typeof app !== 'undefined') {
        auth = firebase.auth();
        db = firebase.firestore();

        // 🔁 Offline persistence (safe wrap)
        // Note: Multiple tabs open can cause persistence errors, we catch and ignore them safely
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

export { app, auth, db, googleProvider };
