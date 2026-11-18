'use client';

import { useEffect } from 'react';
import { openCoach } from '@/components/CoachPanel';
import { PageHeader } from '@/components/ui';

function Body() {
  useEffect(() => { openCoach(true); }, []);
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader title="AI 영업비서" sub="지역 · 용도 · 착공 시기로 현장을 물어보고, 영업 현황을 요약해 받습니다." />
      <div className="px-4 md:px-8">
        <button type="button" onClick={() => openCoach(true)} className="h-[42px] rounded-[10px] bg-brand-deep px-5 text-sub font-semibold text-white hover:bg-brand">AI 영업비서 열기</button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Body />
    </>
  );
}
