// Firebase web config (public values, same project as esigntech). Override with NEXT_PUBLIC_FIREBASE_* env vars.
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyARRet3dGS9gxZ3ge3kjaVQLNCm2wFgkBw',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0312895786.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'gen-lang-client-0312895786',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:335467426855:web:e16008be6fd127b36dca02',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0312895786.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '335467426855',
};
