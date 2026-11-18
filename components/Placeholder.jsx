'use client';

import Link from 'next/link';
import { PageHeader } from './ui';

const PUBLIC = new Set(['terms', 'privacy', 'refund']);

function Body({ title, isPublic }) {
  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader title={title} sub={isPublic ? '예시 문서입니다.' : '이 화면은 아직 다시 만들지 않았습니다.'} />
      <div className="px-4 md:px-8">
        <div className="rounded-[10.625px] border border-dashed border-line px-6 py-14 text-center">
          <p className="text-body font-medium text-ink-1">{isPublic ? `${title} 내용이 들어갈 자리입니다.` : `${title} 화면은 준비 중입니다.`}</p>
          <p className="mt-1 text-sub text-ink-3">신축 현장 목록에서 현장을 찾아 담아 보세요.</p>
          <Link href="/sites" className="mt-5 inline-flex h-[42px] items-center rounded-[10px] bg-brand-deep px-5 text-sub font-semibold text-white hover:bg-brand">
            신축 현장 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Placeholder({ path, title }) {
  return <Body title={title} isPublic={PUBLIC.has(path)} />;
}
