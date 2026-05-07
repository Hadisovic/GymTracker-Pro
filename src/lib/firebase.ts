import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Replace these with your Firebase project config from the Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCfbasxPZn17wMY_uKU2kkAJtVLM6qHL6U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hadigymtracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hadigymtracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hadigymtracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "816555252970",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:816555252970:web:62071edeaa356c5975cb93"
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
  }
}

export { auth, db, googleProvider };

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) throw new Error("Firebase not configured. Add your keys to .env");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) throw new Error("Firebase not configured");
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out Error:", error);
    throw error;
  }
};
