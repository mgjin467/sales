'use client';

import { Icon } from './Icons';

export function PageHeader({ title, sub, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4 pt-6 md:px-8 md:pt-8">
      <div className="min-w-0">
        <h1 className="text-[22.5px] font-bold tracking-tight text-ink-1">{title}</h1>
        {sub ? <p className="mt-1 text-sub text-ink-3">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[38px] w-full appearance-none rounded border border-line bg-white pl-3 pr-8 text-sub text-ink-1 outline-none hover:border-ink-4/40 focus:border-brand focus:ring-2 focus:ring-brand/30"
      >
        {children}
      </select>
      <Icon name="chevDown" size={15} strokeWidth={2} className="pointer-events-none absolute right-2.5 text-ink-4" />
    </label>
  );
}

export function Chip({ on, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-[34px] whitespace-nowrap rounded-full border px-3.5 text-sub font-medium transition-colors ${
        on ? 'border-brand-deep bg-brand-soft text-brand-deep' : 'border-line bg-white text-ink-2 hover:bg-surface'
      }`}
    >
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-[38px] w-full rounded border border-line bg-white pl-9 pr-3 text-sub text-ink-1 outline-none placeholder:text-ink-4 focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
    </div>
  );
}

const STAGE_TONE = {
  허가: 'bg-info-soft text-info',
  착공: 'bg-brand-soft text-brand-deep',
  사용승인: 'bg-ok-soft text-ok',
  준공: 'bg-ok-soft text-ok',
};
export function StageBadge({ stage }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-full px-2 text-[12px] font-semibold ${STAGE_TONE[stage] || 'bg-surface text-ink-3'}`}>
      {stage}
    </span>
  );
}

export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  const lo = Math.max(1, page - 2);
  const hi = Math.min(pages, lo + 4);
  for (let i = Math.max(1, hi - 4); i <= hi; i++) nums.push(i);
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded px-2 text-sub tabular';
  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1 py-6">
      <button type="button" className={`${btn} text-ink-3 hover:bg-surface disabled:opacity-40`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="이전 페이지">
        <Icon name="chevLeft" size={16} strokeWidth={2} />
      </button>
      {nums[0] > 1 && (
        <>
          <button type="button" className={`${btn} text-ink-2 hover:bg-surface`} onClick={() => onPage(1)}>1</button>
          {nums[0] > 2 && <span className="px-1 text-ink-4">…</span>}
        </>
      )}
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onPage(n)}
          className={`${btn} ${n === page ? 'bg-ink-1 font-semibold text-white' : 'text-ink-2 hover:bg-surface'}`}
        >
          {n}
        </button>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          {nums[nums.length - 1] < pages - 1 && <span className="px-1 text-ink-4">…</span>}
          <button type="button" className={`${btn} text-ink-2 hover:bg-surface`} onClick={() => onPage(pages)}>{pages}</button>
        </>
      )}
      <button type="button" className={`${btn} text-ink-3 hover:bg-surface disabled:opacity-40`} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="다음 페이지">
        <Icon name="chevRight" size={16} strokeWidth={2} />
      </button>
    </nav>
  );
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[45] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[520px] flex-col bg-white shadow-card">
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="min-w-0 truncate text-[17px] font-bold text-ink-1">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex size-9 items-center justify-center rounded text-ink-4 hover:bg-surface hover:text-ink-1">
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="flex gap-3 border-b border-line py-2.5 text-sub last:border-0">
      <dt className="w-[96px] shrink-0 text-ink-4">{label}</dt>
      <dd className="min-w-0 flex-1 text-ink-1">{children ?? '—'}</dd>
    </div>
  );
}

export const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString('ko-KR'));
export const fmtDate = (d) => (d ? d.replaceAll('-', '.') : '—');
export const fmtWon = (n) => {
  if (n == null) return '—';
  const eok = n / 100000000;
  return eok >= 1 ? `${eok.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억 원` : `${fmtNum(n)}원`;
};
