import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/server/firebaseToken';
import { adminEmails, findEmployee, isSameUser } from '@/lib/server/employees';
import { SESSION_COOKIE, cookieOptions, createSessionToken, readSessionToken } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fail = (error, status = 403) => NextResponse.json({ error }, { status });

// Google (Firebase) ID token → admin or employee-directory check → signed session cookie.
export async function POST(req) {
  let idToken;
  try {
    ({ idToken } = await req.json());
  } catch {
    return fail('잘못된 요청입니다.', 400);
  }
  if (!idToken) return fail('잘못된 요청입니다.', 400);

  let claims;
  try {
    claims = await verifyFirebaseIdToken(idToken);
  } catch (e) {
    console.error('ID token verify failed', e);
    return fail('Google 로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.', 401);
  }

  const email = claims.email;
  if (!email || claims.email_verified === false) return fail('이메일 정보를 가져올 수 없습니다.', 401);

  const isAdmin = adminEmails().some((a) => isSameUser(a, email));

  let employee = null;
  try {
    employee = await findEmployee(email);
  } catch (e) {
    console.error('Employee directory check failed', e);
    if (!isAdmin) return fail('직원 명부를 확인하는 중 오류가 발생했습니다.', 500);
  }

  if (!isAdmin && !employee) return fail('직원 명부에 등록된 계정이 아닙니다.');

  const user = {
    email,
    name: employee?.full_name || claims.name || email.split('@')[0],
    role: isAdmin ? 'MANAGER' : 'EMPLOYEE',
    picture: claims.picture || null,
  };
  const token = await createSessionToken(user);
  const session = await readSessionToken(token);
  const res = NextResponse.json({
    session: {
      ...session,
      department: employee?.department || null,
      jobTitle: employee?.job_title || null,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions());
  return res;
}
