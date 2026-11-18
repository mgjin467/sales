'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icons';
import { PageHeader } from './ui';
import { savedIds } from '@/lib/api';

const KEY = 'ohj-demo-events';
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function readEvents() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export default function Calendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [siteEvents, setSiteEvents] = useState([]);
  const [selected, setSelected] = useState(ymd(today));
  const [form, setForm] = useState({ title: '', time: '10:00', kind: '방문' });

  useEffect(() => {
    setEvents(readEvents());
    const ids = savedIds();
    if (ids.size === 0) return;
    Promise.all(['sites', 'remodel'].map((t) => fetch(`/data/${t}.json`).then((r) => r.json())))
      .then(([a, b]) => {
        const rows = [...a, ...b].filter((r) => ids.has(r.id));
        setSiteEvents(rows.map((r) => ({ id: `site-${r.id}`, date: r.startDate, title: `${r.title} 착공`, kind: '착공', href: `/sites?sgg=${r.sgg}&open=${r.id}` })));
      })
      .catch(() => {});
  }, []);

  const save = (list) => {
    setEvents(list);
    localStorage.setItem(KEY, JSON.stringify(list));
  };

  const all = [...events, ...siteEvents];
  const byDay = all.reduce((m, e) => { (m[e.date] ||= []).push(e); return m; }, {});

  const first = new Date(cursor);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });

  const move = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  const add = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    save([...events, { id: `e${Date.now()}`, date: selected, time: form.time, title: form.title.trim(), kind: form.kind }]);
    setForm({ ...form, title: '' });
  };

  const tone = { 방문: 'bg-brand-soft text-brand-deep', 미팅: 'bg-info-soft text-info', 착공: 'bg-ok-soft text-ok', 기타: 'bg-surface text-ink-2' };
  const dayList = (byDay[selected] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader
        title="일정"
        sub="현장 방문과 미팅, 담아 둔 현장의 착공일을 한곳에서"
        right={
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => move(-1)} aria-label="이전 달" className="flex size-9 items-center justify-center rounded text-ink-3 hover:bg-surface"><Icon name="chevLeft" size={18} strokeWidth={2} /></button>
            <p className="min-w-[110px] text-center text-body font-semibold text-ink-1 tabular">{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</p>
            <button type="button" onClick={() => move(1)} aria-label="다음 달" className="flex size-9 items-center justify-center rounded text-ink-3 hover:bg-surface"><Icon name="chevRight" size={18} strokeWidth={2} /></button>
            <button type="button" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(ymd(today)); }} className="ml-1 h-9 rounded border border-line px-3 text-sub text-ink-2 hover:bg-surface">오늘</button>
          </div>
        }
      />
      <div className="grid gap-4 px-4 md:px-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-[10.625px] border border-line">
          <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-[12.75px] text-ink-4">
            {DOW.map((d, i) => <div key={d} className={`py-2 ${i === 0 ? 'text-danger' : ''}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = ymd(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = key === ymd(today);
              const list = byDay[key] || [];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelected(key)}
                  aria-pressed={selected === key}
                  aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일, 일정 ${list.length}개`}
                  className={`flex min-h-[64px] flex-col items-stretch gap-1 border-b border-r border-line p-1.5 text-left md:min-h-[96px] [&:nth-child(7n)]:border-r-0 ${selected === key ? 'bg-brand-soft/60' : 'hover:bg-surface'} ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span className={`inline-flex size-6 items-center justify-center self-start rounded-full text-[12.75px] tabular ${isToday ? 'bg-brand-deep font-semibold text-white' : d.getDay() === 0 ? 'text-danger' : 'text-ink-2'}`}>{d.getDate()}</span>
                  {list.slice(0, 2).map((e) => (
                    <span key={e.id} className={`hidden truncate rounded px-1.5 py-0.5 text-[11px] font-medium md:block ${tone[e.kind] || tone.기타}`}>{e.title}</span>
                  ))}
                  {list.length > 0 && <span className="text-[11px] text-ink-4 md:hidden">● {list.length}</span>}
                  {list.length > 2 && <span className="hidden text-[11px] text-ink-4 md:block">+{list.length - 2}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <section className="flex flex-col gap-3 rounded-[10.625px] border border-line p-4">
          <h2 className="text-body font-semibold text-ink-1">{selected.replaceAll('-', '.')} 일정</h2>
          {dayList.length === 0 ? (
            <p className="text-sub text-ink-4">일정이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dayList.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sub">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${tone[e.kind] || tone.기타}`}>{e.kind}</span>
                  {e.time && <span className="shrink-0 text-ink-4 tabular">{e.time}</span>}
                  {e.href ? <Link href={e.href} className="min-w-0 flex-1 truncate text-ink-1 hover:underline">{e.title}</Link> : <span className="min-w-0 flex-1 truncate text-ink-1">{e.title}</span>}
                  {!e.href && (
                    <button type="button" onClick={() => save(events.filter((x) => x.id !== e.id))} aria-label="일정 삭제" className="flex size-7 items-center justify-center rounded text-ink-4 hover:bg-surface hover:text-danger">
                      <Icon name="x" size={14} strokeWidth={2} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={add} className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
            <label htmlFor="ev-title" className="text-sub font-medium text-ink-1">일정 추가</label>
            <input id="ev-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 진천 현장 방문" className="h-[38px] rounded border border-line px-3 text-sub outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
            <div className="flex gap-2">
              <input type="time" aria-label="시간" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-[38px] flex-1 rounded border border-line px-3 text-sub outline-none focus:border-brand" />
              <select aria-label="종류" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="h-[38px] flex-1 rounded border border-line bg-white px-2 text-sub outline-none focus:border-brand">
                {['방문', '미팅', '기타'].map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <button type="submit" className="flex h-[40px] items-center justify-center gap-1 rounded bg-brand-deep text-sub font-semibold text-white hover:bg-brand">
              <Icon name="plus" size={16} strokeWidth={2} />추가
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
