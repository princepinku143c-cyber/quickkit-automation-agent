
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Updated configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyC0c0orE9oK7JZMwswRviBB0cWdnVnwdD4",
  authDomain: "nexusstream-3a734.firebaseapp.com",
  projectId: "nexusstream-3a734",
  storageBucket: "nexusstream-3a734.firebasestorage.app",
  messagingSenderId: "639362646888",
  appId: "1:639362646888:web:5a917cd44032eb5989ccdd",
  measurementId: "G-HD73Q2TQHW"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

try {
  // Initialize Firebase
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  
  console.log("🔥 Firebase initialized successfully");

} catch (error) {
  console.error("🔥 Firebase Init Error:", error);
}

export { app, auth, db, googleProvider };
