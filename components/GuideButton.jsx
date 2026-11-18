'use client';

import { useState } from 'react';

const GUIDES = {
  sites: [
    ['지역 고르기', '맨 왼쪽 지역 칸에서 시도를 누르고 시군구를 여러 곳 고를 수 있습니다. 고른 지역은 주소창에 남아 그대로 공유됩니다.'],
    ['조건 좁히기', '용도 · 건축 단계 · 착공일 · 건축면적으로 좁히고, 현장명이나 주소로 검색합니다. 준공 현장은 기본으로 빠집니다.'],
    ['정렬', '표 머리의 건축면적 · 허가 · 착공 · 준공 · 설계 · 시공 · 감리를 누르면 그 순서로 정렬됩니다. 한 번 더 누르면 반대로.'],
    ['담기', '내 현장의 「담기」를 누르면 영업 현황에 들어갑니다. 거기서 단계 · 견적 · 메모를 적어 관리합니다.'],
    ['지도', '오른쪽 「지도 열기」로 지도를 펼치면 지금 목록의 현장이 지도에 뜨고, 목록은 지도 화면 안 현장만 보여 줍니다.'],
  ],
  remodel: [
    ['리모델링 현장', '대수선 · 증축 · 용도변경 현장을 신축 현장과 같은 방법으로 찾고 담습니다.'],
  ],
  board: [
    ['뷰 목록', '저장해 둔 보기 방식입니다. 눌러서 바꾸고, 아래 「새 뷰 만들기」로 표 · 칸반 · 달력 뷰를 추가합니다. 필터 · 정렬 · 칸 순서는 뷰마다 따로 저장됩니다.'],
    ['칸 숨기기 · 필터 · 정렬', '위 도구 막대에서 숨김 · 필터 · 그룹 · 정렬 · 색을 바꿉니다. 바꾼 내용은 지금 뷰에 저장됩니다.'],
    ['칸 고치기', '표의 칸을 누르면 바로 고칠 수 있습니다. 단계 · 구분은 목록에서 고릅니다.'],
    ['현장 더하기', '표 맨 아래 「+ 직접 추가」로 이름만 적어 더하거나, 「목록에서 현장 담기」로 신축 · 리모델링 현장에서 담아 옵니다.'],
    ['합계', '맨 아래 줄에서 현장 수와 견적 · 예상 매출 합계를 봅니다.'],
  ],
};

export default function GuideButton({ topic = 'sites', className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sub text-ink-2 hover:bg-surface ${className}`}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11" />
        </svg>
        이용 가이드
      </button>
      {open && <GuideDialog steps={GUIDES[topic] || GUIDES.sites} onClose={() => setOpen(false)} />}
    </>
  );
}

export function GuideDialog({ steps, onClose }) {
  const [i, setI] = useState(0);
  const [title, body] = steps[i];
  return (
    <div className="fixed inset-0 z-[46] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-label="이용 가이드">
      <div className="w-full max-w-[400px] rounded-[10.625px] border border-brand bg-white p-5 shadow-card">
        <p className="text-[12.75px] text-ink-4">쓰는 법 {i + 1} / {steps.length}</p>
        <h2 className="mt-1 text-body font-bold text-ink-1">{title}</h2>
        <p className="mt-2 text-sub leading-relaxed text-ink-2">{body}</p>
        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sub text-ink-3 hover:text-ink-1">건너뛰기</button>
          <div className="flex gap-2">
            {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="h-[34px] rounded border border-line px-3 text-sub text-ink-2 hover:bg-surface">이전</button>}
            <button type="button" onClick={() => (i < steps.length - 1 ? setI(i + 1) : onClose())} className="h-[34px] rounded bg-brand-deep px-4 text-sub font-semibold text-white hover:bg-brand">
              {i < steps.length - 1 ? '다음' : '마치기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { GUIDES };
