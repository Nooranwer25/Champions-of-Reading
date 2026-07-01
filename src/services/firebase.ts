import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, collection, setLogLevel as setFirestoreLogLevel } from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: "AIzaSyCANFO6qzld40OwtHZhHNRxIPkx9dkzjWw",
  authDomain: "gen-lang-client-0369459839.firebaseapp.com",
  projectId: "gen-lang-client-0369459839",
  storageBucket: "gen-lang-client-0369459839.firebasestorage.app",
  messagingSenderId: "483208860270",
  appId: "1:483208860270:web:e4b16839b67a9acd7d0c7f"
};

const app = initializeApp(firebaseConfig);
setLogLevel('silent');
setFirestoreLogLevel('silent');
// Use the firestoreDatabaseId from the config if it exists
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Workspace Scopes - removed for seamless login
// We can request these later if needed, but for now they block user adoption.
// googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
// googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
// googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
// googleProvider.addScope('https://www.googleapis.com/auth/calendar');
// googleProvider.addScope('https://www.googleapis.com/auth/tasks');
// googleProvider.addScope('https://www.googleapis.com/auth/forms.body');
// googleProvider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
// googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
// googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
// googleProvider.addScope('https://www.googleapis.com/auth/keep');

// Cache the access token in memory
let cachedAccessToken: string | null = null;

export const signInWithGoogle = async () => {
  try {
    const { browserPopupRedirectResolver } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    
    // Save access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    if (error?.code === 'auth/internal-error' || error?.message?.includes('internal-error')) {
      throw new Error('Google Sign-In failed due to environment restrictions. Please open the application in a new tab (click the arrow icon in the top right) to sign in.');
    }
    throw error;
  }
};

export const getAccessToken = () => {
  return cachedAccessToken;
};

export const signInAsGuest = async () => {
  const { signInAnonymously } = await import('firebase/auth');
  const result = await signInAnonymously(auth);
  return result.user;
};

export const signInWithTestAccount = async (email: string, pass: string) => {
  try {
    // Try to sign in first
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    // If user not found, try to create it automatically for testing
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
       try {
         const result = await createUserWithEmailAndPassword(auth, email, pass);
         return result.user;
       } catch (createError) {
         throw createError;
       }
    }
    throw error;
  }
};



// Error handler utility
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path: string | null = null): void {
  // Silent fail
}
