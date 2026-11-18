'use client';

import { Suspense } from 'react';
import SitesPage from '@/components/SitesPage';

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <SitesPage table="remodel" title="리모델링 현장" />
      </Suspense>
    </>
  );
}
