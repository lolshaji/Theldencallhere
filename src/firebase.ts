import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  browserPopupRedirectResolver,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence settings
export const auth = getAuth(app);

// Set persistence to LOCAL to help with sessionStorage issues
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Persistence setting failed:", error);
  });

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider with additional parameters
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add scopes if needed (optional)
// googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
// googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Check if sessionStorage is available
const isSessionStorageAvailable = () => {
  try {
    const testKey = '__test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Enhanced sign in function with fallback
export const signInWithGoogle = async () => {
  // Check if sessionStorage is available
  if (!isSessionStorageAvailable()) {
    console.warn("sessionStorage is not available. Trying redirect method...");
    // Fallback to redirect method
    return signInWithRedirect(auth, googleProvider);
  }

  try {
    // Try popup first with resolver
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Popup error:", error);
    
    // Handle specific error codes
    switch (error.code) {
      case 'auth/popup-blocked':
        console.log("Popup blocked, falling back to redirect...");
        return signInWithRedirect(auth, googleProvider);
        
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in popup was closed. Please try again.');
        
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your internet connection.');
        
      case 'auth/web-storage-unsupported':
        console.log("Web storage unsupported, using redirect...");
        return signInWithRedirect(auth, googleProvider);
        
      default:
        // For any other error, try redirect as last resort
        console.log("Unknown error, attempting redirect...");
        return signInWithRedirect(auth, googleProvider);
    }
  }
};

// Handle redirect result (call this when your app loads)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth, browserPopupRedirectResolver);
    if (result) {
      console.log("Redirect sign-in successful", result.user);
      return { success: true, user: result.user };
    }
    return { success: false, user: null };
  } catch (error: any) {
    console.error("Redirect result error:", error);
    
    if (error.code === 'auth/web-storage-unsupported') {
      // Handle storage unavailable error
      return { 
        success: false, 
        error: 'Browser storage is unavailable. Please check your privacy settings.' 
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error };
  }
};

// Export onAuthStateChanged
export { onAuthStateChanged };
