import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBM4r-QnJMbpr_3CUmsQvkIgCbT3Zn_S7w",
  authDomain: "void-potato-7721.firebaseapp.com",
  projectId: "void-potato-7721",
  storageBucket: "void-potato-7721.firebasestorage.app",
  messagingSenderId: "1048392903208",
  appId: "1:1048392903208:web:eed8f60602c99a81d9e31d"
};

export const ALLOWED_OWNER_EMAIL = "marektowarek21372137@gmail.com";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
export default app;

