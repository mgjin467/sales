'use client';

import { useEffect, useState } from 'react';
import AuthFrame from './AuthFrame';
import { lastLoginMethod, signInWithGoogle } from '@/lib/auth';

export function FormError({ message }) {
  return message ? <p role="alert" className="rounded bg-danger/10 px-3 py-2 text-center text-sub font-medium text-danger">{message}</p> : null;
}

function GoogleMark() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

// The only way in, as in esigntech: Google account → admin, or an employee listed in 직원명부.
// After a successful login the session updates and AuthGate shows the app underneath.
export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get('error');
    if (e) setError(e);
    setRecent(lastLoginMethod());
  }, []);

  async function login() {
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await signInWithGoogle();
      if (err) setError(err);
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    }
    setBusy(false);
  }

  return (
    <AuthFrame>
      <div className="mb-[34px] text-center">
        <h1 className="text-[25.5px] font-bold tracking-tight text-ink-1">현장노트 로그인</h1>
        <p className="mt-2 text-body text-ink-3">관리자 또는 직원 명부에 등록된 Google 계정으로 로그인하세요</p>
      </div>
      <div className="flex flex-col gap-[15px]">
        <button
          type="button"
          onClick={login}
          disabled={busy}
          className="relative flex h-[51px] w-full items-center justify-center gap-3 rounded border border-line bg-white text-[15px] font-semibold text-ink-1 shadow-sm transition-colors hover:bg-surface disabled:opacity-60"
        >
          {busy ? (
            <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          ) : (
            <GoogleMark />
          )}
          {busy ? '로그인 확인 중…' : 'Google 계정으로 로그인'}
          {recent === 'google' && !busy ? (
            <span className="pointer-events-none absolute -top-2.5 right-3 rounded-md bg-ink-1 px-2 py-1 text-xs font-semibold leading-none text-white shadow-sm">
              최근 로그인
            </span>
          ) : null}
        </button>
        <FormError message={error} />
        <p className="text-center text-[12.75px] leading-relaxed text-ink-4">
          직원 계정은 직원 명부에 Google 계정(ID)이 등록되어 있어야 로그인할 수 있습니다.
        </p>
      </div>
    </AuthFrame>
  );
}
