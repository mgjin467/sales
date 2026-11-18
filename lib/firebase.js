'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth';
import { FIREBASE_CONFIG } from './firebaseConfig';

function auth() {
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  return getAuth(app);
}

// Google popup sign-in (same as esigntech's loginWithGoogle) → Firebase ID token for the server to check.
export async function googleIdToken() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth(), provider);
  return result.user.getIdToken();
}

export async function firebaseSignOut() {
  await signOut(auth());
}
