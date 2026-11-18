'use client';

import { Suspense } from 'react';
import { DesignersList } from '@/components/Lists';

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <DesignersList />
      </Suspense>
    </>
  );
}