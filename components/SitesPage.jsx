'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { query } from '@/lib/api';
import { onBoard, savedSiteIds, toggleSite } from '@/lib/board';
import { SIDO, findSgg, regionLabel } from '@/lib/regions';
import { setState, useStore } from '@/lib/store';
import Dropdown, { CheckRow, RadioRow } from './Dropdown';
import StatsCards from './StatsCards';
import GuideButton from './GuideButton';
import { Icon } from './Icons';
import { Drawer, Field, Pagination, StageBadge, fmtDate, fmtNum } from './ui';

const PAGE = 20;
const USES = ['단독주택', '공동주택', '제1종근린생활시설', '제2종근린생활시설', '공장', '창고시설', '판매시설', '업무시설', '노유자시설', '자원순환관련시설', '동물및식물관련시설'];
const STAGES = ['허가', '착공', '준공'];
const STARTS = [
  { v: '', label: '전체' },
  { v: 'planned', label: '착공 전 (허가만)' },
  { v: '1m', label: '최근 1개월 착공', days: 31 },
  { v: '3m', label: '최근 3개월 착공', days: 92 },
  { v: '6m', label: '최근 6개월 착공', days: 183 },
  { v: '1y', label: '최근 1년 착공', days: 366 },
];
const AREAS = [
  { v: '', label: '전체' },
  { v: '0-100', label: '100㎡ 미만', lo: 0, hi: 100 },
  { v: '100-330', label: '100 ~ 330㎡', lo: 100, hi: 330 },
  { v: '330-1000', label: '330 ~ 1,000㎡', lo: 330, hi: 1000 },
  { v: '1000-3300', label: '1,000 ~ 3,300㎡', lo: 1000, hi: 3300 },
  { v: '3300-', label: '3,300㎡ 이상', lo: 3300, hi: Infinity },
];
const TODAY = new Date();
const daysAgo = (iso) => (TODAY - new Date(iso)) / 86400000;
const list = (v) => (v ? v.split(',').filter(Boolean) : []);

export default function SitesPage({ table = 'sites', title = '신축 현장' }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const store = useStore();

  const sggs = list(sp.get('sgg'));
  const uses = list(sp.get('use'));
  const stages = list(sp.get('stage'));
  const start = sp.get('start') || '';
  const area = sp.get('area') || '';
  const q = sp.get('q') || '';
  const sort = sp.get('sort') || 'startDate.asc';
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const openId = sp.get('open') || '';

  const [text, setText] = useState(q);
  const [matched, setMatched] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(() => new Set());
  const [follow, setFollow] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const req = useRef(0);

  useEffect(() => setText(q), [q]);
  useEffect(() => {
    setSaved(savedSiteIds());
    return onBoard(() => setSaved(savedSiteIds()));
  }, []);

  function setParams(patch, resetPage = true) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      const val = Array.isArray(v) ? v.join(',') : v;
      if (val === '' || val == null) next.delete(k);
      else next.set(k, String(val));
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    if (next.get('page') === '1') next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  const key = [table, sggs.join(), uses.join(), stages.join(), start, area, q, sort].join('|');
  useEffect(() => {
    const id = ++req.current;
    const startOpt = STARTS.find((s) => s.v === start);
    const areaOpt = AREAS.find((a) => a.v === area);
    const where = (r) => {
      if (uses.length && !uses.includes(r.use)) return false;
      if (stages.length ? !stages.includes(r.stage) : r.stage === '준공') return false;
      if (startOpt?.v === 'planned' && r.startDate) return false;
      if (startOpt?.days && (!r.startDate || daysAgo(r.startDate) > startOpt.days)) return false;
      if (areaOpt?.v && !(r.buildArea >= areaOpt.lo && r.buildArea < areaOpt.hi)) return false;
      return true;
    };
    setError(null);
    query(table, { sggs, q, where, sort, page: 1, pageSize: 1e6, searchFields: ['title', 'address', 'designer', 'company', 'supervisor', 'owner'] })
      .then((res) => { if (id === req.current) setMatched(res.rows); })
      .catch((e) => { if (id === req.current) setError(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // The map shows what the list matches.
  useEffect(() => {
    setState({ mapSites: matched });
  }, [matched]);
  useEffect(() => () => setState({ mapSites: null, inView: null }), []);

  const inView = store.mapOpen && follow && store.inView ? store.inView : null;
  const shown = useMemo(() => (matched ? (inView ? matched.filter((r) => inView.has(r.id)) : matched) : []), [matched, inView]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const p = Math.min(page, pages);
  const rows = shown.slice((p - 1) * PAGE, p * PAGE);
  const detail = openId ? (matched || []).find((r) => r.id === openId) : null;

  const onSave = (site) => setSaved(new Set(toggleSite(site)));
  const anyFilter = sggs.length || uses.length || stages.length || start || area || q;

  const sortBy = (k) => {
    const [ck, cd] = sort.split('.');
    const next = ck === k ? `${k}.${cd === 'asc' ? 'desc' : 'asc'}` : `${k}.${k === 'startDate' || k === 'completeDate' ? 'asc' : 'desc'}`;
    setParams({ sort: next === 'startDate.asc' ? '' : next });
  };

  return (
    <div className="mx-auto w-full max-w-[1420px] px-4 pb-6 pt-6 md:px-8 md:pt-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22.5px] font-bold tracking-tight text-ink-1">{title}</h1>
          <p className="mt-1 text-sub text-ink-3">업데이트: 2026.11.18</p>
        </div>
        <GuideButton topic={table === 'sites' ? 'sites' : 'remodel'} />
      </div>

      <StatsCards />

      {/* Filters */}
      <form
        className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:[&>div]:w-[160px] sm:[&>div]:flex-none"
        onSubmit={(e) => { e.preventDefault(); setParams({ q: text.trim() }); }}
      >
        <RegionFilter value={sggs} onChange={(v) => setParams({ sgg: v })} />
        <Dropdown label={uses.length ? (uses.length === 1 ? uses[0] : `${uses[0]} 외 ${uses.length - 1}`) : '용도'} active={uses.length > 0} width={240}>
          <div className="max-h-[300px] overflow-y-auto">
            {USES.map((u) => (
              <CheckRow key={u} checked={uses.includes(u)} onChange={() => setParams({ use: uses.includes(u) ? uses.filter((x) => x !== u) : [...uses, u] })}>{u}</CheckRow>
            ))}
          </div>
          {uses.length > 0 && <button type="button" onClick={() => setParams({ use: '' })} className="mt-1 w-full rounded px-2 py-1.5 text-left text-[12.75px] text-brand-deep hover:bg-surface">선택 초기화</button>}
        </Dropdown>
        <Dropdown label={stages.length ? stages.join('·') : '건축 단계'} active={stages.length > 0} width={200}>
          {STAGES.map((s) => (
            <CheckRow key={s} checked={stages.includes(s)} onChange={() => setParams({ stage: stages.includes(s) ? stages.filter((x) => x !== s) : [...stages, s] })}>{s}</CheckRow>
          ))}
          <p className="px-2 pt-1 text-[12px] text-ink-4">아무것도 고르지 않으면 준공 현장은 빼고 보여 줍니다.</p>
        </Dropdown>
        <Dropdown label={start ? STARTS.find((s) => s.v === start)?.label : '착공일'} active={!!start} width={210}>
          {(close) => STARTS.map((s) => (
            <RadioRow key={s.v} checked={start === s.v} onChange={() => { setParams({ start: s.v }); close(); }}>{s.label}</RadioRow>
          ))}
        </Dropdown>
        <Dropdown label={area ? AREAS.find((a) => a.v === area)?.label : '건축면적'} active={!!area} width={200}>
          {(close) => AREAS.map((a) => (
            <RadioRow key={a.v} checked={area === a.v} onChange={() => { setParams({ area: a.v }); close(); }}>{a.label}</RadioRow>
          ))}
        </Dropdown>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="현장명 · 주소 검색"
          aria-label="현장명 · 주소 검색"
          className="h-[34px] min-w-0 rounded border border-line bg-white px-3 text-[14.875px] text-ink-1 outline-none placeholder:text-ink-4 focus:border-brand focus:ring-2 focus:ring-brand/30 sm:min-w-[200px] sm:flex-1"
        />
        <button type="submit" className="h-[34px] rounded border border-brand-deep bg-white px-4 text-[14.875px] font-semibold text-brand-deep hover:bg-brand-soft">검색</button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sub text-ink-3" aria-live="polite">
          <span>
            <strong className="font-semibold text-ink-1 tabular">{matched ? fmtNum(shown.length) : '…'}</strong>곳
            {!stages.length && ' · 준공 현장 제외'}
            {inView && ' · 지도 화면 안'}
          </span>
          {anyFilter ? (
            <button type="button" onClick={() => { setText(''); setParams({ sgg: '', use: '', stage: '', start: '', area: '', q: '' }); }} className="font-medium text-brand-deep hover:underline">
              전체 선택 초기화
            </button>
          ) : null}
          {store.mapOpen && (
            <button type="button" onClick={() => setFollow((f) => !f)} aria-pressed={follow} className={`rounded-full border px-2 py-0.5 text-[12.75px] ${follow ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line text-ink-3'}`}>
              지도 화면 안 현장만
            </button>
          )}
        </p>
        <button type="button" onClick={() => setAlertOpen(true)} className="flex h-[34px] items-center gap-1.5 rounded border border-line bg-white px-3 text-sub text-ink-2 hover:bg-surface">
          조건 알림
        </button>
      </div>

      {error ? (
        <div role="alert" className="mt-3 rounded border border-danger/30 bg-danger-soft px-4 py-6 text-center text-sub text-danger">{error}</div>
      ) : (
        <>
          <div className="mt-3 hidden overflow-x-auto rounded-[10.625px] border border-line md:block">
            <table className="w-full min-w-[1250px] table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface text-sub text-ink-2">
                  <Th w={270}>현장 · 주소</Th>
                  <Th w={112}>용도</Th>
                  <Th w={112} align="right" k="buildArea" sort={sort} onSort={sortBy}>건축면적</Th>
                  <Th w={60} align="center">층수</Th>
                  <Th w={106} k="permitDate" sort={sort} onSort={sortBy}>허가</Th>
                  <Th w={106} k="startDate" sort={sort} onSort={sortBy}>착공</Th>
                  <Th w={118} k="completeDate" sort={sort} onSort={sortBy}>준공</Th>
                  <Th w={110} k="designer" sort={sort} onSort={sortBy}>설계</Th>
                  <Th w={110} k="company" sort={sort} onSort={sortBy}>시공</Th>
                  <Th w={110} k="supervisor" sort={sort} onSort={sortBy}>감리</Th>
                  <Th w={86} align="center" sticky>내 현장</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => { setParams({ open: r.id }, false); setState({ focus: r }); }}
                    className="cursor-pointer border-b border-line text-[14.875px] text-ink-2 last:border-0 hover:bg-[#fffaf5]"
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink-1">{r.title}</p>
                      <p className="mt-0.5 text-sub text-ink-3">{r.address}</p>
                    </td>
                    <td className="px-3 py-3">{r.use}</td>
                    <td className="px-3 py-3 text-right tabular">{fmtNum(r.buildArea)}m²</td>
                    <td className="px-3 py-3 text-center tabular">{r.floors ? `${r.floors}층` : '—'}</td>
                    <td className="px-3 py-3 tabular">{r.permitDate}</td>
                    <td className="px-3 py-3 tabular">{r.startDate || '—'}</td>
                    <td className="px-3 py-3">
                      <span className="tabular">{r.completeDate}</span>
                      {r.completePlanned && (
                        <span className="mt-1 block w-fit rounded-full border border-brand px-1.5 py-px text-[12px] font-semibold text-brand-deep">준공 예정일</span>
                      )}
                    </td>
                    <td className="truncate px-3 py-3" title={r.designer || ''}>{r.designer || '—'}</td>
                    <td className="truncate px-3 py-3" title={r.company || ''}>{r.company || '—'}</td>
                    <td className="truncate px-3 py-3" title={r.supervisor || ''}>{r.supervisor || '—'}</td>
                    <td className="sticky right-0 border-l border-line bg-white px-3 py-3 text-center shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]">
                      <SaveBtn on={saved.has(r.id)} onClick={(e) => { e.stopPropagation(); onSave(r); }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {matched && rows.length === 0 && <Empty />}
            {!matched && <Loading />}
          </div>

          <ul className="mt-3 flex flex-col gap-2 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start gap-3 rounded-[10.625px] border border-line bg-white px-4 py-3">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setParams({ open: r.id }, false)}>
                  <p className="truncate text-body font-semibold text-ink-1">{r.title}</p>
                  <p className="truncate text-[12.75px] text-ink-3">{r.address}</p>
                  <p className="mt-1 flex flex-wrap gap-x-2 text-[12.75px] text-ink-3">
                    <span>{r.use}</span><span className="tabular">{fmtNum(r.buildArea)}m²</span><span className="tabular">허가 {r.permitDate}</span>
                    <span className="tabular">착공 {r.startDate || '—'}</span>
                  </p>
                </button>
                <SaveBtn on={saved.has(r.id)} onClick={() => onSave(r)} />
              </li>
            ))}
            {matched && rows.length === 0 && <li><Empty /></li>}
          </ul>
        </>
      )}

      <Pagination page={p} pages={pages} onPage={(n) => { setParams({ page: n }, false); window.scrollTo({ top: 0 }); }} />

      <Drawer open={!!detail} onClose={() => setParams({ open: '' }, false)} title={detail ? detail.title : ''}>
        {detail && <SiteDetail r={detail} saved={saved.has(detail.id)} onSave={() => onSave(detail)} />}
      </Drawer>
      {alertOpen && <AlertDialog onClose={() => setAlertOpen(false)} label={`${regionLabel(sggs)} · ${uses.length ? uses.join(', ') : '모든 용도'}${stages.length ? ` · ${stages.join(', ')}` : ''}`} params={sp.toString()} />}
    </div>
  );
}

function Th({ children, w, align, k, sort, onSort, sticky }) {
  const [sk, sd] = (sort || '').split('.');
  const on = k && sk === k;
  return (
    <th scope="col" style={w ? { width: w } : undefined} className={`whitespace-nowrap px-3 py-3 font-medium ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''} ${sticky ? 'sticky right-0 border-l border-line bg-surface shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)]' : ''}`}>
      {k ? (
        <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 ${on ? 'font-semibold text-brand-deep' : 'hover:text-ink-1'}`} aria-label={`${children} 순으로 정렬`}>
          {children}
          <span className="text-[11px]" aria-hidden="true">{on ? (sd === 'asc' ? '▲' : '▼') : '⇕'}</span>
        </button>
      ) : children}
    </th>
  );
}

function SaveBtn({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-[34px] whitespace-nowrap rounded border px-3 text-sub font-semibold ${on ? 'border-brand-deep bg-brand-deep text-white' : 'border-brand-deep bg-white text-brand-deep hover:bg-brand-soft'}`}
    >
      {on ? '담음' : '담기'}
    </button>
  );
}

function RegionFilter({ value, onChange }) {
  const [sido, setSido] = useState(() => (value[0] ? value[0].slice(0, 2) : '43'));
  const cur = SIDO.find((s) => s.code === sido) || SIDO[0];
  const toggle = (code) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  return (
    <Dropdown label={value.length ? regionLabel(value) : '지역 전체'} active={value.length > 0} width={360}>
      <div className="flex gap-2">
        <ul className="w-[120px] shrink-0 border-r border-line pr-2">
          {SIDO.map((s) => {
            const n = value.filter((c) => c.startsWith(s.code)).length;
            return (
              <li key={s.code}>
                <button type="button" onClick={() => setSido(s.code)} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sub ${s.code === sido ? 'bg-brand-soft font-semibold text-brand-deep' : 'text-ink-2 hover:bg-surface'}`}>
                  {s.short}
                  {n > 0 && <span className="rounded-full bg-brand-deep px-1.5 text-[11px] text-white">{n}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="max-h-[280px] min-w-0 flex-1 overflow-y-auto">
          <CheckRow checked={cur.sgg.every((g) => value.includes(g.code))} onChange={() => {
            const all = cur.sgg.every((g) => value.includes(g.code));
            onChange(all ? value.filter((c) => !c.startsWith(cur.code)) : [...new Set([...value, ...cur.sgg.map((g) => g.code)])]);
          }}>
            {cur.short} 전체
          </CheckRow>
          {cur.sgg.map((g) => (
            <CheckRow key={g.code} checked={value.includes(g.code)} onChange={() => toggle(g.code)}>{g.name}</CheckRow>
          ))}
        </div>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
          {value.map((c) => (
            <button key={c} type="button" onClick={() => toggle(c)} className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[12.75px] text-ink-2 hover:bg-surface-hover">
              {findSgg(c)?.name || c} <Icon name="x" size={12} strokeWidth={2} />
            </button>
          ))}
          <button type="button" onClick={() => onChange([])} className="ml-auto text-[12.75px] text-brand-deep hover:underline">선택 초기화</button>
        </div>
      )}
    </Dropdown>
  );
}

export function SiteDetail({ r, saved, onSave }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <StageBadge stage={r.stage} />
        <span className="text-sub text-ink-3">{r.region}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          className={`flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-[10px] text-sub font-semibold ${saved ? 'border border-brand-deep bg-brand-soft text-brand-deep' : 'bg-brand-deep text-white hover:bg-brand'}`}
        >
          {saved ? '영업 현황에 담김 ✓' : '영업 현황에 담기'}
        </button>
        <button type="button" onClick={() => { setState({ focus: r }); import('@/lib/store').then((m) => m.setMapOpen(true)); }} className="flex h-[42px] items-center gap-1.5 rounded-[10px] border border-line px-3 text-sub text-ink-2 hover:bg-surface">
          <Icon name="pin" size={16} />지도에서 보기
        </button>
      </div>
      <dl>
        <Field label="주소">{r.address}</Field>
        <Field label="공사 구분">{r.work}</Field>
        <Field label="주용도">{r.use}</Field>
        <Field label="구조">{r.structure}</Field>
        <Field label="규모">{r.floors ? `지상 ${r.floors}층` : '층수 미상'}{r.basement ? ` · 지하 ${r.basement}층` : ''}{r.households ? ` · ${r.households}세대` : ''}</Field>
        <Field label="대지면적"><span className="tabular">{fmtNum(r.siteArea)}㎡</span></Field>
        <Field label="건축면적"><span className="tabular">{fmtNum(r.buildArea)}㎡</span></Field>
        <Field label="연면적"><span className="tabular">{fmtNum(r.grossArea)}㎡</span></Field>
        <Field label="허가일"><span className="tabular">{fmtDate(r.permitDate)}</span></Field>
        <Field label="착공일"><span className="tabular">{r.startDate ? fmtDate(r.startDate) : '착공 전'}</span></Field>
        <Field label={r.completePlanned ? '준공 예정일' : '준공일'}><span className="tabular">{fmtDate(r.completeDate)}</span></Field>
        <Field label="건축주">{r.owner}</Field>
        <Field label="설계">{r.designer ? <Link className="text-brand-deep hover:underline" href={`/designers?sgg=${r.sgg}&open=${r.designerId}`}>{r.designer}</Link> : '—'}</Field>
        <Field label="시공">{r.company ? <Link className="text-brand-deep hover:underline" href={`/companies?sgg=${r.sgg}&open=${r.companyId}`}>{r.company}</Link> : '미정'}</Field>
        <Field label="감리">{r.supervisor || '—'}</Field>
      </dl>
      <p className="rounded bg-surface px-3 py-2 text-[12.75px] text-ink-4">예시 데이터입니다. 실제 인허가 정보가 아닙니다.</p>
    </div>
  );
}

function AlertDialog({ onClose, label, params }) {
  const [channel, setChannel] = useState('app');
  const [done, setDone] = useState(false);
  const save = () => {
    try {
      const all = JSON.parse(localStorage.getItem('ohj-demo-alerts') || '[]');
      all.push({ id: Date.now(), label, params, channel });
      localStorage.setItem('ohj-demo-alerts', JSON.stringify(all));
    } catch {}
    setDone(true);
  };
  return (
    <div className="fixed inset-0 z-[46] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-label="조건 알림">
      <div className="w-full max-w-[420px] rounded-[10.625px] bg-white p-5 shadow-card">
        <h2 className="text-[17px] font-bold text-ink-1">조건 알림</h2>
        {done ? (
          <>
            <p className="mt-3 text-sub text-ink-2">이 조건에 맞는 새 현장이 올라오면 알려 드릴게요. (예시 화면이라 실제 알림은 가지 않습니다)</p>
            <button type="button" onClick={onClose} className="mt-5 h-[42px] w-full rounded bg-brand-deep text-sub font-semibold text-white hover:bg-brand">확인</button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sub text-ink-3">지금 고른 조건에 새 현장이 생기면 알려 드립니다.</p>
            <p className="mt-3 rounded bg-surface px-3 py-2 text-sub text-ink-1">{label}</p>
            <fieldset className="mt-4">
              <legend className="mb-1.5 text-sub font-medium text-ink-1">받을 곳</legend>
              {[['app', '앱 알림'], ['sms', '문자'], ['mail', '이메일']].map(([v, l]) => (
                <label key={v} className="mr-4 inline-flex items-center gap-1.5 text-sub text-ink-2">
                  <input type="radio" name="ch" checked={channel === v} onChange={() => setChannel(v)} className="accent-[#9a3412]" />{l}
                </label>
              ))}
            </fieldset>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onClose} className="h-[42px] flex-1 rounded border border-line text-sub text-ink-2 hover:bg-surface">취소</button>
              <button type="button" onClick={save} className="h-[42px] flex-1 rounded bg-brand-deep text-sub font-semibold text-white hover:bg-brand">알림 받기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <p className="text-body font-medium text-ink-1">맞는 현장이 없습니다</p>
      <p className="text-sub text-ink-3">필터를 바꿔 봅니다.</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-14 text-sub text-ink-3">
      <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
      불러오는 중…
    </div>
  );
}
