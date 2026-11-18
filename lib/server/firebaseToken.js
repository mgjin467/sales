// Verifies a Firebase Auth ID token (from the Google sign-in popup) on the server, without firebase-admin.
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { FIREBASE_CONFIG } from '../firebaseConfig';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export async function verifyFirebaseIdToken(idToken) {
  const projectId = FIREBASE_CONFIG.projectId;
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  if (!payload.sub) throw new Error('잘못된 토큰입니다.');
  return payload; // email, email_verified, name, picture, ...
}
