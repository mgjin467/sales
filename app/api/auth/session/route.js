import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSessionToken } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await readSessionToken(cookies().get(SESSION_COOKIE)?.value);
  return NextResponse.json({ session }, { headers: { 'Cache-Control': 'no-store' } });
}
