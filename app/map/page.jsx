'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function Page() {
  return (
    <>
      <div className="p-2 md:p-4">
        <MapView className="h-[calc(100dvh-var(--tab-h)-28px)] w-full md:h-[calc(100vh-32px)]" />
      </div>
    </>
  );
}
