'use client';

import { Suspense } from 'react';
import { CompaniesList } from '@/components/Lists';

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <CompaniesList />
      </Suspense>
    </>
  );
}