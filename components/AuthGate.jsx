'use client';

import { usePathname } from 'next/navigation';
import LoginForm from './LoginForm';
import useSession from './useSession';

// Documents linked from the login screen's footer stay readable without logging in.
const PUBLIC = ['/terms', '/privacy', '/refund'];

// The whole app sits behind the login, like esigntech: no session → login screen first;
// after login the app shows exactly as before.
export default function AuthGate({ children }) {
  const session = useSession();
  const pathname = usePathname() || '/';
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isPublic) return children;
  if (session === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white" role="status" aria-label="로그인 확인 중">
        <span className="size-8 animate-spin rounded-full border-[3px] border-brand-deep border-t-transparent" />
      </div>
    );
  }
  if (!session) return <LoginForm />;
  return children;
}
