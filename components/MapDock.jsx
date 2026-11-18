'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { initMapOpen, setMapOpen, useStore } from '@/lib/store';
import useSession from './useSession';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

// The right-hand map: a slim "지도 열기" tab when closed, a sticky map panel when open (from 1024px up).
export default function MapDock() {
  const session = useSession();
  const store = useStore();
  const pathname = usePathname() || '';
  useEffect(() => initMapOpen(), []);

  if (!session || pathname.startsWith('/auth') || pathname.startsWith('/map')) return null;

  if (!store.mapOpen) {
    return (
      <div className="hidden shrink-0 py-2 pr-2 lg:block">
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="sticky top-2 flex h-[calc(100vh-16px)] w-[48px] flex-col items-center gap-2 rounded-[10.625px] border border-line bg-white pt-4 text-brand-deep hover:bg-brand-soft"
          aria-label="지도 열기"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          <span className="text-[14px] font-semibold leading-[1.25]" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>지도 열기</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden shrink-0 lg:block" style={{ width: 'max(320px, min(42%, calc(100% - 966px)))' }} aria-label="지도">
      <div className="sticky top-0 h-screen p-2">
        <MapView onClose={() => setMapOpen(false)} className="h-full w-full" />
      </div>
    </aside>
  );
}
