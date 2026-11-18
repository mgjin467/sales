import { NextResponse } from 'next/server';
import { SESSION_COOKIE, readSessionToken } from '@/lib/server/session';

// The data files are only served to a logged-in admin or employee.
export async function middleware(req) {
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  return NextResponse.next();
}

export const config = {
  matcher: ['/data/:path*'],
};
