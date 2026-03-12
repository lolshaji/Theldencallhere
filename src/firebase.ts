import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCiKprlXISe-8wY-w21vr65eAHi3-6Q8E",
  authDomain: "chating-d73b1.firebaseapp.com",
  databaseURL: "https://chating-d73b1-default-rtdb.firebaseio.com",
  projectId: "chating-d73b1",
  storageBucket: "chating-d73b1.firebasestorage.app",
  messagingSenderId: "1088235036807",
  appId: "1:1088235036807:web:f2e472281c237f6f6b1822",
  measurementId: "G-MT50YDZ0SS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
export { onAuthStateChanged };
