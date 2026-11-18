'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { COLUMNS, STAGES, STAGE_COLOR, KINDS, addRow, getRows, getViews, onBoard, removeRow, saveViews, updateRow } from '@/lib/board';
import Dropdown, { CheckRow, RadioRow } from './Dropdown';
import GuideButton, { GUIDES } from './GuideButton';
import { Icon } from './Icons';
import useSession from './useSession';

const TOUR_KEY = 'ohj-demo-board-tour';
const typeIcon = { table: '▦', kanban: '▥', calendar: '▤' };

export default function Board() {
  const session = useSession();
  const [rows, setRows] = useState([]);
  const [views, setViews] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [q, setQ] = useState('');
  const [panel, setPanel] = useState(true);
  const [tour, setTour] = useState(-1);

  useEffect(() => {
    const sync = () => { setRows(getRows()); setViews(getViews()); };
    sync();
    try { if (localStorage.getItem(TOUR_KEY) !== '1') setTour(0); } catch {}
    return onBoard(sync);
  }, []);
  useEffect(() => {
    if (views.length && !views.find((v) => v.id === activeId)) setActiveId(views[0].id);
  }, [views, activeId]);

  const view = views.find((v) => v.id === activeId);
  const patchView = (patch) => saveViews(views.map((v) => (v.id === activeId ? { ...v, ...patch } : v)));

  const filtered = useMemo(() => {
    if (!view) return [];
    let r = rows.filter((row) => {
      for (const [k, vals] of Object.entries(view.filter || {})) {
        if (Array.isArray(vals) && vals.length && !vals.includes(row[k])) return false;
        if (typeof vals === 'string' && vals && !String(row[k] || '').includes(vals)) return false;
      }
      if (q) {
        const n = q.toLowerCase();
        if (!COLUMNS.some((c) => String(row[c.key] ?? '').toLowerCase().includes(n))) return false;
      }
      return true;
    });
    if (view.sort?.key) {
      const { key, dir } = view.sort;
      const m = dir === 'asc' ? 1 : -1;
      r = [...r].sort((a, b) => {
        const x = a[key]; const y = b[key];
        if (x == null || x === '') return 1;
        if (y == null || y === '') return -1;
        return x > y ? m : x < y ? -m : 0;
      });
    }
    return r;
  }, [rows, view, q]);

  const addView = (type) => {
    const names = { table: '새 표', kanban: '새 칸반', calendar: '새 달력' };
    const v = { id: `v${Date.now()}`, name: names[type], type, filter: {}, hidden: [], sort: null, group: type === 'kanban' ? 'stage' : null, color: type !== 'table', dense: false };
    saveViews([...views, v]);
    setActiveId(v.id);
  };

  const endTour = () => { try { localStorage.setItem(TOUR_KEY, '1'); } catch {} setTour(-1); };
  const filterCount = view ? Object.values(view.filter || {}).filter((v) => (Array.isArray(v) ? v.length : v)).length : 0;

  return (
    <div className="px-4 pb-8 pt-6 md:px-6 md:pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-2 text-[22.5px] font-bold tracking-tight text-ink-1">
            영업 현황 <span className="text-sub font-normal tracking-normal text-ink-3">관리자 — 회사 전원의 현장</span>
          </h1>
          <p className="mt-2 text-sub text-ink-3">
            {rows.length
              ? `담은 현장 ${rows.length}곳 · ${session ? `${session.name} 님` : ''}`
              : '아직 담은 곳이 없습니다. 「신축 현장」·「리모델링 현장」에서 담거나, 표 맨 아래 「+ 직접 추가」로 이름만 적어 더합니다.'}
          </p>
        </div>
        <GuideButton topic="board" />
      </div>

      <div className="mt-4 flex gap-3">
        {/* Views */}
        {panel ? (
          <div className="relative hidden w-[154px] shrink-0 md:block">
            <nav aria-label="뷰" className={`rounded-[10.625px] border bg-white p-1.5 ${tour === 0 ? 'border-2 border-brand' : 'border-line'}`}>
              <div className="flex items-center justify-between px-2 py-1 text-[12.75px] text-ink-4">
                뷰
                <button type="button" onClick={() => setPanel(false)} aria-label="뷰 목록 접기" className="flex size-6 items-center justify-center rounded hover:bg-surface">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M16 15l-3-3 3-3" /></svg>
                </button>
              </div>
              <ul className="flex flex-col gap-0.5">
                {views.map((v) => (
                  <li key={v.id}>
                    <ViewItem v={v} on={v.id === activeId} onPick={() => setActiveId(v.id)}
                      onRename={(name) => saveViews(views.map((x) => (x.id === v.id ? { ...x, name } : x)))}
                      onDelete={views.length > 1 ? () => saveViews(views.filter((x) => x.id !== v.id)) : null} />
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 border-t border-line pt-1.5">
                <p className="px-2 py-1 text-[12.75px] text-ink-4">새 뷰 만들기</p>
                {[['table', '+ 표'], ['kanban', '+ 칸반'], ['calendar', '+ 달력']].map(([t, l]) => (
                  <button key={t} type="button" onClick={() => addView(t)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sub text-ink-2 hover:bg-surface">
                    <span className="text-ink-4" aria-hidden="true">{typeIcon[t]}</span>{l}
                  </button>
                ))}
              </div>
            </nav>
            {tour >= 0 && <Tour step={tour} onNext={() => (tour < GUIDES.board.length - 1 ? setTour(tour + 1) : endTour())} onSkip={endTour} />}
          </div>
        ) : (
          <button type="button" onClick={() => setPanel(true)} aria-label="뷰 목록 펼치기" className="hidden h-9 shrink-0 items-center rounded border border-line px-2 text-sub text-ink-3 hover:bg-surface md:flex">뷰</button>
        )}

        <div className="min-w-0 flex-1">
          {view && (
            <>
              <Toolbar view={view} views={views} onPick={setActiveId} patch={patchView} q={q} setQ={setQ} filterCount={filterCount} onHelp={() => setTour(0)} />
              {view.type === 'kanban' ? (
                <Kanban rows={filtered} color={view.color} />
              ) : view.type === 'calendar' ? (
                <CalendarView rows={filtered} />
              ) : (
                <Table rows={filtered} view={view} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewItem({ v, on, onPick, onRename, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(v.name);
  if (edit) {
    return (
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => { setEdit(false); if (name.trim()) onRename(name.trim()); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setName(v.name); setEdit(false); } }}
        className="h-[32px] w-full rounded border border-brand px-2 text-sub outline-none"
        aria-label="뷰 이름"
      />
    );
  }
  return (
    <div className={`group flex items-center rounded ${on ? 'bg-brand-soft' : 'hover:bg-surface'}`}>
      <button type="button" onClick={onPick} onDoubleClick={() => setEdit(true)} aria-current={on ? 'true' : undefined} title="두 번 누르면 이름 바꾸기"
        className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sub ${on ? 'font-semibold text-brand-deep' : 'text-ink-2'}`}>
        <span className={on ? 'text-brand-deep' : 'text-ink-4'} aria-hidden="true">{typeIcon[v.type]}</span>
        <span className="truncate">{v.name}</span>
      </button>
      {onDelete && on && (
        <button type="button" onClick={() => { if (window.confirm(`'${v.name}' 뷰를 지울까요?`)) onDelete(); }} aria-label={`${v.name} 뷰 지우기`} className="mr-1 hidden size-6 items-center justify-center rounded text-ink-4 hover:bg-white hover:text-danger group-hover:flex">
          <Icon name="x" size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function Tour({ step, onNext, onSkip }) {
  const [title, body] = GUIDES.board[step];
  return (
    <div className="absolute left-[-6px] top-[calc(100%+12px)] z-30 w-[320px] rounded-[10.625px] border border-brand bg-white p-4 shadow-card" role="dialog" aria-label="쓰는 법">
      <span className="absolute -top-[7px] left-[70px] size-3 rotate-45 border-l border-t border-brand bg-white" aria-hidden="true" />
      <p className="text-[12.75px] text-ink-4">쓰는 법 {step + 1} / {GUIDES.board.length}</p>
      <p className="mt-1 text-sub font-bold text-ink-1">{title}</p>
      <p className="mt-1.5 text-sub leading-relaxed text-ink-2">{body}</p>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={onSkip} className="text-sub text-ink-3 hover:text-ink-1">건너뛰기</button>
        <button type="button" onClick={onNext} className="h-[32px] rounded-[8px] bg-brand-deep px-3.5 text-sub font-semibold text-white hover:bg-brand">
          {step < GUIDES.board.length - 1 ? '다음' : '마치기'}
        </button>
      </div>
    </div>
  );
}

function Toolbar({ view, views, onPick, patch, q, setQ, filterCount, onHelp }) {
  const tb = (on) => `flex h-[32px] items-center gap-1 rounded-[8px] px-2.5 text-sub ${on ? 'bg-brand-soft font-semibold text-brand-deep' : 'text-ink-2 hover:bg-surface'}`;
  const f = view.filter || {};
  const setFilter = (k, v) => patch({ filter: { ...f, [k]: v } });
  const toggleIn = (k, val) => {
    const cur = Array.isArray(f[k]) ? f[k] : [];
    setFilter(k, cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]);
  };
  const hidden = view.hidden || [];

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
      <Menu label={<><span aria-hidden="true">☰</span> {view.name} <span className="text-[10px]" aria-hidden="true">▾</span></>} btnClass={`${tb(true)} mr-1`} width={200}>
        {(close) => views.map((v) => (
          <RadioRow key={v.id} checked={v.id === view.id} onChange={() => { onPick(v.id); close(); }}>{typeIcon[v.type]} {v.name}</RadioRow>
        ))}
      </Menu>
      <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
      {view.type !== 'calendar' && (
        <Menu label={`숨김${hidden.length ? ` ${hidden.length}` : ''}`} btnClass={tb(hidden.length > 0)} width={220}>
          {COLUMNS.filter((c) => !c.locked).map((c) => (
            <CheckRow key={c.key} checked={!hidden.includes(c.key)} onChange={() => patch({ hidden: hidden.includes(c.key) ? hidden.filter((h) => h !== c.key) : [...hidden, c.key] })}>{c.label}</CheckRow>
          ))}
        </Menu>
      )}
      <Menu label={`필터${filterCount ? ` ${filterCount}` : ''}`} btnClass={tb(filterCount > 0)} width={260}>
        <p className="px-2 pb-1 text-[12.75px] text-ink-4">단계</p>
        <div className="grid grid-cols-2">
          {STAGES.map((s) => <CheckRow key={s} checked={(f.stage || []).includes(s)} onChange={() => toggleIn('stage', s)}>{s}</CheckRow>)}
        </div>
        <p className="px-2 pb-1 pt-2 text-[12.75px] text-ink-4">구분</p>
        <div className="grid grid-cols-2">
          {KINDS.map((s) => <CheckRow key={s} checked={(f.kind || []).includes(s)} onChange={() => toggleIn('kind', s)}>{s}</CheckRow>)}
        </div>
        <p className="px-2 pb-1 pt-2 text-[12.75px] text-ink-4">담당</p>
        <input value={f.owner || ''} onChange={(e) => setFilter('owner', e.target.value)} placeholder="이름" className="mx-2 mb-1 h-[32px] w-[calc(100%-16px)] rounded border border-line px-2 text-sub outline-none focus:border-brand" />
        {filterCount > 0 && <button type="button" onClick={() => patch({ filter: {} })} className="w-full rounded px-2 py-1.5 text-left text-[12.75px] text-brand-deep hover:bg-surface">필터 모두 지우기</button>}
      </Menu>
      {view.type === 'table' && (
        <Menu label="그룹" btnClass={tb(!!view.group)} width={180}>
          {(close) => [[null, '없음'], ['stage', '단계'], ['owner', '담당'], ['kind', '구분']].map(([k, l]) => (
            <RadioRow key={l} checked={view.group === k} onChange={() => { patch({ group: k }); close(); }}>{l}</RadioRow>
          ))}
        </Menu>
      )}
      <Menu label={`정렬${view.sort?.key ? ' 1' : ''}`} btnClass={tb(!!view.sort?.key)} width={230}>
        <div className="flex flex-col gap-2 p-1">
          <select aria-label="정렬할 칸" value={view.sort?.key || ''} onChange={(e) => patch({ sort: e.target.value ? { key: e.target.value, dir: view.sort?.dir || 'desc' } : null })} className="h-[32px] rounded border border-line bg-white px-2 text-sub">
            <option value="">정렬 안 함</option>
            {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {view.sort?.key && (
            <div className="flex gap-1">
              {[['asc', '오름차순'], ['desc', '내림차순']].map(([d, l]) => (
                <button key={d} type="button" onClick={() => patch({ sort: { ...view.sort, dir: d } })} className={`h-[30px] flex-1 rounded border text-[13px] ${view.sort.dir === d ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line text-ink-2'}`}>{l}</button>
              ))}
            </div>
          )}
        </div>
      </Menu>
      <button type="button" onClick={() => patch({ color: !view.color })} aria-pressed={!!view.color} className={tb(!!view.color)}>색</button>
      {view.type === 'table' && (
        <button type="button" onClick={() => patch({ dense: !view.dense })} aria-pressed={!!view.dense} title={view.dense ? '줄 넓게' : '줄 좁게'} aria-label="줄 높이 바꾸기" className={tb(!!view.dense)}>↕</button>
      )}
      <button type="button" onClick={onHelp} className={tb(false)}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" /></svg>
        사용법
      </button>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="찾기" aria-label="찾기" className="ml-auto h-[34px] w-full rounded border border-line px-3 text-sub outline-none placeholder:text-ink-4 focus:border-brand sm:w-[200px]" />
    </div>
  );
}

function Menu({ label, btnClass, width, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} className={btnClass}>{label}</button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 rounded-[10.625px] border border-line bg-white p-1.5 shadow-card" style={{ width }}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

function Cell({ row, col, dense }) {
  const [edit, setEdit] = useState(false);
  const v = row[col.key];
  const save = (val) => {
    setEdit(false);
    let out = val;
    if (col.type === 'number') out = val === '' ? null : Number(val);
    if (out !== v) updateRow(row.id, { [col.key]: out });
  };
  const pad = dense ? 'py-1' : 'py-2.5';
  if (edit && col.type === 'select') {
    return (
      <select autoFocus defaultValue={v || ''} onChange={(e) => save(e.target.value)} onBlur={(e) => save(e.target.value)} className="h-[30px] w-full rounded border border-brand bg-white px-1 text-sub outline-none" aria-label={col.label}>
        {col.options.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }
  if (edit) {
    return (
      <input
        autoFocus
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        defaultValue={v ?? ''}
        onBlur={(e) => save(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEdit(false); }}
        className={`h-[30px] w-full rounded border border-brand px-1.5 text-sub outline-none ${col.type === 'number' ? 'text-right' : ''}`}
        aria-label={col.label}
      />
    );
  }
  let shown = v;
  if (col.type === 'number' && v != null) shown = Number(v).toLocaleString('ko-KR');
  if (col.key === 'stage' && v) {
    shown = <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12.75px] font-semibold" style={{ background: `${STAGE_COLOR[v]}18`, color: STAGE_COLOR[v] }}>{v}</span>;
  }
  return (
    <button type="button" onClick={() => setEdit(true)} className={`block w-full truncate px-0 text-left ${pad} ${col.type === 'number' ? 'text-right tabular' : ''} ${col.key === 'title' ? 'font-semibold text-ink-1' : ''}`} title={typeof v === 'string' ? v : undefined}>
      {shown === '' || shown == null ? <span className="text-ink-4/0 hover:text-ink-4">—</span> : shown}
    </button>
  );
}

function Table({ rows, view }) {
  const cols = COLUMNS.filter((c) => !(view.hidden || []).includes(c.key));
  const [newTitle, setNewTitle] = useState(null);
  const groups = useMemo(() => {
    if (!view.group) return [[null, rows]];
    const order = view.group === 'stage' ? STAGES : view.group === 'kind' ? KINDS : [...new Set(rows.map((r) => r[view.group] || ''))];
    const m = new Map(order.map((k) => [k, []]));
    rows.forEach((r) => { const k = r[view.group] || ''; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return [...m.entries()].filter(([, list]) => list.length);
  }, [rows, view.group]);
  const sum = (key, list) => list.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const addDefaults = Object.fromEntries(Object.entries(view.filter || {}).filter(([, v]) => Array.isArray(v) && v.length === 1).map(([k, v]) => [k, v[0]]));

  return (
    <div className="overflow-x-auto rounded-[10.625px] border border-line">
      <table className="w-full border-collapse text-left" style={{ minWidth: 56 + cols.reduce((s, c) => s + c.width, 0) }}>
        <thead>
          <tr className="border-b border-line text-sub text-ink-3">
            <th className="w-[56px] px-3 py-2.5" scope="col"><span className="sr-only">번호</span></th>
            {cols.map((c) => (
              <th key={c.key} scope="col" style={{ width: c.width }} className="whitespace-nowrap border-l border-line px-3 py-2.5 font-normal">
                <span className="mr-1.5 text-ink-4" aria-hidden="true">{c.icon}</span>{c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-sub text-ink-2">맞는 현장이 없습니다. 필터를 바꿔 봅니다.</td></tr>
          )}
          {groups.map(([g, list]) => (
            <GroupRows key={String(g)} g={g} list={list} view={view} cols={cols} sum={sum} />
          ))}
          <tr className="border-t border-line bg-surface">
            <td colSpan={cols.length + 1} className="px-3 py-2">
              {newTitle != null ? (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) addRow({ title: newTitle.trim(), ...addDefaults }); setNewTitle(null); }}>
                  <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setNewTitle(null); }} placeholder="현장 이름" aria-label="새 현장 이름" className="h-[30px] w-[280px] rounded border border-brand px-2 text-sub outline-none" />
                  <button type="submit" className="h-[30px] rounded bg-brand-deep px-3 text-sub font-semibold text-white">더하기</button>
                  <button type="button" onClick={() => setNewTitle(null)} className="h-[30px] rounded px-2 text-sub text-ink-3 hover:bg-white">취소</button>
                </form>
              ) : (
                <div className="flex gap-5 text-sub">
                  <button type="button" onClick={() => setNewTitle('')} className="font-semibold text-brand-deep hover:underline">+ 직접 추가</button>
                  <Link href="/sites" className="text-ink-2 hover:underline">+ 목록에서 현장 담기</Link>
                </div>
              )}
            </td>
          </tr>
          <tr className="border-t border-line text-sub text-ink-3">
            <td className="px-3 py-2.5 tabular">{rows.length}</td>
            {cols.map((c, i) => (
              <td key={c.key} className={`border-l border-line px-3 py-2.5 ${c.sum ? 'text-right tabular text-ink-1' : ''}`}>
                {i === 0 ? `${rows.length}곳` : c.sum ? sum(c.key, rows).toLocaleString('ko-KR') : cols[i + 1]?.sum ? <span className="block text-right">합계</span> : ''}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({ g, list, view, cols, sum }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {g !== null && (
        <tr className="border-b border-line bg-surface">
          <td colSpan={cols.length + 1} className="px-3 py-1.5 text-sub">
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1.5 font-semibold text-ink-1">
              <Icon name={open ? 'chevDown' : 'chevRight'} size={14} strokeWidth={2} />
              {g || '(비어 있음)'} <span className="font-normal text-ink-4">{list.length}곳</span>
              {cols.some((c) => c.key === 'quote') && <span className="ml-2 font-normal text-ink-3 tabular">견적 {sum('quote', list).toLocaleString('ko-KR')}만 원</span>}
            </button>
          </td>
        </tr>
      )}
      {open && list.map((r, i) => (
        <tr key={r.id} className="group border-b border-line text-sub text-ink-2" style={view.color && r.stage ? { background: `${STAGE_COLOR[r.stage]}0d` } : undefined}>
          <td className="px-3 text-ink-4 tabular">
            <span className="group-hover:hidden">{i + 1}</span>
            <button type="button" onClick={() => { if (window.confirm(`'${r.title || '이름 없음'}'을(를) 지울까요?`)) removeRow(r.id); }} aria-label="줄 지우기" className="hidden text-ink-4 hover:text-danger group-hover:inline">
              <Icon name="x" size={14} strokeWidth={2} />
            </button>
          </td>
          {cols.map((c) => (
            <td key={c.key} className="max-w-0 border-l border-line px-3"><Cell row={r} col={c} dense={view.dense} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Kanban({ rows, color }) {
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((s) => {
        const list = rows.filter((r) => (r.stage || '발굴') === s);
        return (
          <section
            key={s}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); if (drag) updateRow(drag, { stage: s }); setDrag(null); setOver(null); }}
            className={`flex w-[240px] shrink-0 flex-col rounded-[10.625px] border p-2 ${over === s ? 'border-brand bg-brand-soft/50' : 'border-line bg-surface'}`}
            aria-label={`${s} ${list.length}곳`}
          >
            <h3 className="flex items-center gap-1.5 px-1 pb-2 text-sub font-semibold text-ink-1">
              <span className="size-2.5 rounded-full" style={{ background: STAGE_COLOR[s] }} />{s}
              <span className="font-normal text-ink-4">{list.length}</span>
            </h3>
            <ul className="flex min-h-[40px] flex-col gap-2">
              {list.map((r) => (
                <li
                  key={r.id}
                  draggable
                  onDragStart={() => setDrag(r.id)}
                  className="cursor-grab rounded-[8px] border border-line bg-white p-2.5 shadow-sm active:cursor-grabbing"
                  style={color ? { borderLeft: `3px solid ${STAGE_COLOR[s]}` } : undefined}
                >
                  <p className="text-sub font-semibold text-ink-1">{r.title || '이름 없음'}</p>
                  {r.memo && <p className="mt-0.5 truncate text-[12.75px] text-ink-3">{r.memo}</p>}
                  <div className="mt-1.5 flex items-center justify-between text-[12.75px] text-ink-4">
                    <span>{r.owner || '담당 없음'}</span>
                    {r.quote != null && <span className="tabular text-ink-2">{Number(r.quote).toLocaleString('ko-KR')}만</span>}
                  </div>
                  <select aria-label="단계 바꾸기" value={r.stage} onChange={(e) => updateRow(r.id, { stage: e.target.value })} className="mt-2 h-[26px] w-full rounded border border-line bg-white px-1 text-[12.75px] text-ink-2">
                    {STAGES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => { const t = window.prompt('현장 이름'); if (t && t.trim()) addRow({ title: t.trim(), stage: s }); }} className="mt-2 rounded px-1 py-1 text-left text-sub text-ink-3 hover:bg-white">+ 추가</button>
          </section>
        );
      })}
    </div>
  );
}

function CalendarView({ rows }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const start = new Date(cur); start.setDate(1 - cur.getDay());
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const by = rows.reduce((m, r) => { if (r.visit) (m[r.visit] ||= []).push(r); return m; }, {});
  const undated = rows.filter((r) => !r.visit);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button type="button" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))} aria-label="이전 달" className="flex size-8 items-center justify-center rounded hover:bg-surface"><Icon name="chevLeft" size={16} strokeWidth={2} /></button>
        <p className="text-sub font-semibold text-ink-1 tabular">{cur.getFullYear()}년 {cur.getMonth() + 1}월 · 방문일 기준</p>
        <button type="button" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))} aria-label="다음 달" className="flex size-8 items-center justify-center rounded hover:bg-surface"><Icon name="chevRight" size={16} strokeWidth={2} /></button>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-[10.625px] border border-line text-[12.75px]">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d} className="border-b border-line bg-surface py-1.5 text-center text-ink-4">{d}</div>)}
        {days.map((d) => (
          <div key={ymd(d)} className={`min-h-[84px] border-b border-r border-line p-1 [&:nth-child(7n)]:border-r-0 ${d.getMonth() === cur.getMonth() ? '' : 'opacity-40'}`}>
            <p className="text-ink-3 tabular">{d.getDate()}</p>
            {(by[ymd(d)] || []).map((r) => (
              <p key={r.id} className="mt-0.5 truncate rounded px-1 py-0.5 font-medium" style={{ background: `${STAGE_COLOR[r.stage]}1a`, color: STAGE_COLOR[r.stage] }}>{r.title}</p>
            ))}
          </div>
        ))}
      </div>
      {undated.length > 0 && <p className="mt-2 text-[12.75px] text-ink-4">방문일이 없는 현장 {undated.length}곳은 표 뷰에서 방문일을 넣으면 달력에 나옵니다.</p>}
    </div>
  );
}
