'use client';

import { useEffect, useState } from 'react';
import { getSession, onSession, restoreSession } from '@/lib/auth';

// undefined = not known yet, null = logged out.
export default function useSession() {
  const [s, setS] = useState(undefined);
  useEffect(() => {
    const off = onSession(setS);
    const now = getSession();
    if (now !== undefined) setS(now);
    else restoreSession().then(setS);
    return off;
  }, []);
  return s;
}
