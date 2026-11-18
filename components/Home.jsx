'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';
import { PageHeader, StageBadge, fmtDate, fmtNum } from './ui';
import { query, savedIds } from '@/lib/api';
import useSession from './useSession';

export default function Home() {
  const session = useSession();
  const [recent, setRecent] = useState(null);
  const [counts, setCounts] = useState({ sites: 0, starting: 0, saved: 0 });

  useEffect(() => {
    query('sites', { sort: 'permitDate.desc', pageSize: 6 }).then((r) => setRecent(r.rows));
    query('sites', { filters: { stage: '허가' }, pageSize: 1 }).then((r) => setCounts((c) => ({ ...c, starting: r.count })));
    query('sites', { pageSize: 1 }).then((r) => setCounts((c) => ({ ...c, sites: r.count })));
    setCounts((c) => ({ ...c, saved: savedIds().size }));
  }, []);

  const cards = [
    { label: '전국 신축 현장', value: counts.sites, href: '/sites', unit: '곳' },
    { label: '착공 예정 (허가 단계)', value: counts.starting, href: '/sites?stage=허가', unit: '곳' },
    { label: '내가 담은 현장', value: counts.saved, href: '/calendar', unit: '곳' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader title={session ? `${session.name} 님, 안녕하세요` : '홈'} sub="이번 주에 방문할 현장을 한눈에 확인하세요" />
      <div className="grid gap-3 px-4 sm:grid-cols-3 md:px-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-[10.625px] border border-line bg-white px-5 py-4 shadow-card hover:border-brand/40">
            <p className="text-sub text-ink-3">{c.label}</p>
            <p className="mt-1 text-[25.5px] font-bold text-ink-1 tabular">{fmtNum(c.value)}<span className="ml-1 text-body font-medium text-ink-3">{c.unit}</span></p>
          </Link>
        ))}
      </div>
      <section className="mt-6 px-4 md:px-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-body font-semibold text-ink-1">최근 허가 난 현장</h2>
          <Link href="/sites" className="flex items-center gap-0.5 text-sub text-ink-3 hover:text-brand-deep">전체 보기<Icon name="chevRight" size={14} strokeWidth={2} /></Link>
        </div>
        <ul className="divide-y divide-line rounded-[10.625px] border border-line">
          {(recent || []).map((r) => (
            <li key={r.id}>
              <Link href={`/sites?sgg=${r.sgg}&open=${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium text-ink-1">{r.title}</p>
                  <p className="truncate text-[12.75px] text-ink-4">{r.region} · {r.use} · {fmtNum(r.grossArea)}㎡ · 허가 {fmtDate(r.permitDate)}</p>
                </div>
                <StageBadge stage={r.stage} />
              </Link>
            </li>
          ))}
          {!recent && <li className="px-4 py-8 text-center text-sub text-ink-4">불러오는 중…</li>}
        </ul>
      </section>
    </div>
  );
}
