'use client';

// Login like esigntech: Google sign-in (Firebase) → the server lets in an admin (ADMIN_EMAILS)
// or an active employee whose gmail/ID is in the BigQuery 직원명부 table, and sets a signed session cookie.
// Session shape used by the pages: { email, name, role: 'MANAGER' | 'EMPLOYEE', picture, exp }.
const LAST = 'ohj:last-login';
const listeners = new Set();
let current; // undefined = not checked yet, null = logged out
let restoring = null;
let expiryTimer = null;

function set(s) {
  current = s;
  clearTimeout(expiryTimer);
  if (s && s.exp) {
    // Same as esigntech: when the session runs out, the login screen comes back.
    const ms = s.exp - Date.now();
    expiryTimer = setTimeout(() => set(null), Math.max(0, Math.min(ms, 2 ** 31 - 1)));
  }
  listeners.forEach((fn) => fn(s));
}

export function restoreSession() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!restoring) {
    restoring = fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { session: null }))
      .then((d) => d.session || null)
      .catch(() => null)
      .then((s) => {
        set(s);
        return s;
      });
  }
  return restoring;
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  if (current === undefined) restoreSession();
  return current;
}

export function onSession(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isAdmin(s = current) {
  return !!s && s.role === 'MANAGER';
}

export function lastLoginMethod() {
  try { return localStorage.getItem(LAST); } catch { return null; }
}

export async function signInWithGoogle() {
  const { googleIdToken, firebaseSignOut } = await import('./firebase');
  let idToken;
  try {
    idToken = await googleIdToken();
  } catch (e) {
    const code = e?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return { error: null, cancelled: true };
    if (code === 'auth/popup-blocked') return { error: '팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.' };
    if (code === 'auth/unauthorized-domain') return { error: '이 도메인이 Firebase 승인된 도메인에 등록되지 않았습니다. 관리자에게 문의하세요.' };
    return { error: e?.message || '로그인 중 오류가 발생했습니다.' };
  }
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ idToken }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.session) return { error: d.error || '로그인 중 오류가 발생했습니다.' };
    try { localStorage.setItem(LAST, 'google'); } catch {}
    set(d.session);
    return { error: null };
  } finally {
    // The app keeps its own session cookie; the Firebase sign-in is only used to prove the Google account.
    firebaseSignOut().catch(() => {});
  }
}

export async function signOut({ confirm = true } = {}) {
  if (confirm && typeof window !== 'undefined' && !window.confirm('로그아웃 하시겠습니까?')) return;
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {}
  set(null);
  window.location.assign('/');
}

// Only same-site paths are allowed as the place to return to after logging in.
export function safeNext(v) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
}
