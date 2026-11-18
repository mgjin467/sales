'use client';

import { useEffect, useState } from 'react';

// "인기 개발 지역" ranking and "한눈에 보는 착공" line chart (sample statistics).
export default function StatsCards() {
  const [s, setS] = useState(null);
  useEffect(() => {
    fetch('/data/stats.json').then((r) => r.json()).then(setS).catch(() => {});
  }, []);

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>
      <section className="rounded-[10.625px] border border-line bg-white px-4 pb-3 pt-4">
        <h2 className="text-[16px] font-bold text-ink-1">인기 개발 지역</h2>
        <p className="mt-0.5 text-[12.75px] text-ink-3">{s ? s.ranking.title : ' '}</p>
        <ol className="mt-2 divide-y divide-line">
          {(s ? s.ranking.rows : Array.from({ length: 6 }, () => null)).map((r, i) => (
            <li key={i} className="flex h-[42px] items-center gap-3 text-sub">
              <span className="w-4 text-center text-ink-4 tabular">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-ink-1">
                {r ? <>{r.region} <span className="text-ink-3 tabular">{r.count}건</span></> : <span className="inline-block h-3 w-28 rounded bg-surface" />}
              </span>
              {r && <Move v={r.move} />}
            </li>
          ))}
        </ol>
      </section>

      <section className="min-w-0 rounded-[10.625px] border border-line bg-white px-4 pb-3 pt-4">
        <h2 className="text-[16px] font-bold text-ink-1">한눈에 보는 착공</h2>
        <p className="mt-0.5 text-[12.75px] text-ink-3">출처: 예시 통계 (실제 수치 아님) / 단위: 동</p>
        {s && (
          <>
            <p className="mt-3 text-[12.75px] text-ink-3">{s.starts.label}</p>
            <p className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap text-[25.5px] font-bold text-ink-1 tabular">{s.starts.value.toLocaleString('ko-KR')}{s.starts.unit}</span>
              <span className={`whitespace-nowrap rounded-full border px-1.5 py-px text-[12px] font-semibold ${s.starts.yoy < 0 ? 'border-danger text-danger' : 'border-ok text-ok'}`}>
                전년 동월 대비 {s.starts.yoy > 0 ? '+' : ''}{s.starts.yoy}%
              </span>
            </p>
            <Chart d={s.starts} />
          </>
        )}
      </section>
    </div>
  );
}

function Move({ v }) {
  if (!v) return <span className="w-8 text-right text-ink-4">–</span>;
  return (
    <span className={`w-10 text-right text-[13px] font-semibold tabular ${v > 0 ? 'text-danger' : 'text-ink-1'}`}>
      {v > 0 ? '▲' : '▼'}{Math.abs(v)}
    </span>
  );
}

function Chart({ d }) {
  const [hover, setHover] = useState(null);
  const W = 600;
  const H = 210;
  const L = 52;
  const R = 12;
  const T = 12;
  const B = 34;
  const max = 15000;
  const x = (i) => L + 16 + ((W - L - R - 32) / 11) * i;
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = d.thisYear.length - 1;

  return (
    <div className="relative mt-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="월별 건축착공 추이">
        {[0, 7500, 15000].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e5e5e5" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#737373">{v.toLocaleString('ko-KR')}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={y(d.lastYearAvg)} y2={y(d.lastYearAvg)} stroke="#525252" strokeDasharray="5 4" strokeWidth="1.2" />
        <path d={line(d.lastYear)} fill="none" stroke="#8a8a8a" strokeWidth="2" />
        <path d={line(d.thisYear)} fill="none" stroke="#c2410c" strokeWidth="2.2" />
        <circle cx={x(last)} cy={y(d.thisYear[last])} r="4.5" fill="#c2410c" />
        {Array.from({ length: 12 }, (_, i) => (
          <g key={i}>
            <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="12" fontWeight={i + 1 === d.month ? 700 : 400} fill={i + 1 === d.month ? '#171717' : '#737373'}>{i + 1}월</text>
            <rect x={x(i) - 20} y={T} width="40" height={H - T - B} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          </g>
        ))}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#d4d4d4" />}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-2 rounded border border-line bg-white px-2.5 py-1.5 text-[12px] shadow-card" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <p className="font-semibold text-ink-1">{hover + 1}월</p>
          {d.thisYear[hover] != null && <p className="text-brand tabular">2026년 {d.thisYear[hover].toLocaleString('ko-KR')}동</p>}
          <p className="text-ink-3 tabular">2025년 {d.lastYear[hover].toLocaleString('ko-KR')}동</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 whitespace-nowrap text-[12.75px] text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-brand" />2026년</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[#8a8a8a]" />2025년</span>
        <span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-ink-3" />2025년 평균</span>
      </div>
    </div>
  );
}
