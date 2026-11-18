'use client';

import { Suspense } from 'react';
import SitesPage from '@/components/SitesPage';

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <SitesPage table="sites" title="신축 현장" />
      </Suspense>
    </>
  );
}
