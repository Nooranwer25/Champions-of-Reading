import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, collection, setLogLevel as setFirestoreLogLevel } from 'firebase/firestore';
import firebaseConfigFile from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigFile.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigFile.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigFile.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigFile.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFile.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigFile.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfigFile as any).firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
setLogLevel('silent');
setFirestoreLogLevel('silent');
// Use the firestoreDatabaseId from the config if it exists
export const db = firebaseConfig.firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });
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
    const result = await signInWithPopup(auth, googleProvider);
    
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
