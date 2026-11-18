'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { query, savedIds, toggleSaved, PAGE_SIZE } from '@/lib/api';
import { SIDO, findSgg, sidoOf } from '@/lib/regions';
import { Icon } from './Icons';
import { Chip, Drawer, PageHeader, Pagination, SearchBox, Select, fmtNum } from './ui';

/*
  A list screen driven entirely by the address bar, like the original's /sites?sgg=4375&page=2:
  sgg (시군구), sido (시도), q (search), stage/use/... (chips & selects), sort, page and open (detail).
  Changing a filter goes back to page 1; the rows are fetched again for every change.
*/
export default function DataList({ table, title, sub, unit = '건', columns, chips, selects = [], sorts, searchFields, searchPlaceholder, cardTitle, cardMeta, detail, saveable = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const sgg = sp.get('sgg') || '';
  const sido = sgg ? sgg.slice(0, 2) : sp.get('sido') || '';
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const q = sp.get('q') || '';
  const sort = sp.get('sort') || sorts[0].value;
  const openId = sp.get('open') || '';
  const chipValue = chips ? sp.get(chips.key) || '' : '';
  const selectValues = Object.fromEntries(selects.map((s) => [s.key, sp.get(s.key) || '']));

  const [state, setState] = useState({ loading: true, error: null, rows: [], count: 0, pages: 1, page: 1 });
  const [text, setText] = useState(q);
  const [saved, setSaved] = useState(() => new Set());
  const [detailRow, setDetailRow] = useState(null);
  const reqId = useRef(0);

  useEffect(() => setSaved(savedIds()), []);
  useEffect(() => setText(q), [q]);

  function setParams(patch, { resetPage = true } = {}) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    if (next.get('page') === '1') next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  // Debounced search typing → ?q=
  useEffect(() => {
    if (text === q) return undefined;
    const t = setTimeout(() => setParams({ q: text.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const filters = useMemo(() => {
    const f = { ...selectValues };
    if (chips) f[chips.field || chips.key] = chipValue;
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipValue, JSON.stringify(selectValues)]);

  useEffect(() => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    query(table, { sgg, sido, q, filters, sort, page, searchFields })
      .then((res) => {
        if (id !== reqId.current) return;
        setState({ loading: false, error: null, ...res });
        if (res.page !== page) setParams({ page: res.page }, { resetPage: false });
      })
      .catch((e) => {
        if (id === reqId.current) setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, sgg, sido, q, filters, sort, page]);

  // Detail panel follows ?open=
  useEffect(() => {
    if (!openId) { setDetailRow(null); return; }
    const inPage = state.rows.find((r) => r.id === openId);
    if (inPage) { setDetailRow(inPage); return; }
    import('@/lib/api').then(({ getOne }) => getOne(table, openId)).then((r) => setDetailRow(r));
  }, [openId, state.rows, table]);

  const sidoObj = SIDO.find((s) => s.code === sido) || null;
  const regionLabel = sgg ? (() => { const g = findSgg(sgg); const s = sidoOf(sgg); return g ? `${s?.short} ${g.name}` : `지역 ${sgg}`; })() : sidoObj ? sidoObj.name : '전국';

  const onSave = async (id) => setSaved(new Set(await toggleSaved(table, id)));

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <PageHeader
        title={title}
        sub={sub}
        right={
          <p className="text-sub text-ink-3" aria-live="polite">
            {regionLabel} · <strong className="font-semibold text-ink-1 tabular">{fmtNum(state.count)}</strong>
            {unit}
          </p>
        }
      />

      <div className="flex flex-col gap-3 px-4 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Select label="시도" value={sido} onChange={(v) => setParams({ sido: v, sgg: '' })} className="w-[132px]">
            <option value="">전국</option>
            {SIDO.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </Select>
          <Select label="시군구" value={sgg} onChange={(v) => setParams({ sgg: v, sido: v ? '' : sido })} className="w-[124px]">
            <option value="">{sidoObj ? '전체' : '시군구'}</option>
            {(sidoObj ? sidoObj.sgg : []).map((g) => (
              <option key={g.code} value={g.code}>{g.name}</option>
            ))}
          </Select>
          {selects.map((s) => (
            <Select key={s.key} label={s.label} value={selectValues[s.key]} onChange={(v) => setParams({ [s.key]: v })} className="w-[150px]">
              <option value="">{s.label} 전체</option>
              {s.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </Select>
          ))}
          <Select label="정렬" value={sort} onChange={(v) => setParams({ sort: v === sorts[0].value ? '' : v })} className="w-[140px]">
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          <SearchBox value={text} onChange={setText} placeholder={searchPlaceholder} />
        </div>
        {chips && (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            <Chip on={!chipValue} onClick={() => setParams({ [chips.key]: '' })}>전체</Chip>
            {chips.options.map((o) => (
              <Chip key={o} on={chipValue === o} onClick={() => setParams({ [chips.key]: chipValue === o ? '' : o })}>{o}</Chip>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 px-4 md:px-8">
        {state.error ? (
          <div role="alert" className="rounded border border-danger/30 bg-danger-soft px-4 py-6 text-center text-sub text-danger">
            {state.error}
            <button type="button" onClick={() => router.refresh()} className="ml-2 font-semibold underline">다시 시도</button>
          </div>
        ) : (
          <>
            {/* Table from 768px up */}
            <div className={`hidden overflow-x-auto rounded-[10.625px] border border-line md:block ${state.loading ? 'opacity-60' : ''}`}>
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface text-[12.75px] text-ink-4">
                    {columns.map((c) => (
                      <th key={c.key} scope="col" className={`whitespace-nowrap px-3 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : ''}`} style={c.width ? { width: c.width } : undefined}>
                        {c.label}
                      </th>
                    ))}
                    {saveable && <th scope="col" className="w-[52px] px-3 py-2.5"><span className="sr-only">담기</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((r, i) => (
                    <tr
                      key={r.id}
                      onClick={() => setParams({ open: r.id }, { resetPage: false })}
                      className={`cursor-pointer border-b border-line text-sub last:border-0 hover:bg-[#fff7ed] ${i % 2 ? 'bg-row-alt' : 'bg-white'}`}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={`px-3 py-3 align-middle text-ink-2 ${c.align === 'right' ? 'text-right tabular' : ''}`}>
                          {c.render ? c.render(r) : r[c.key] ?? '—'}
                        </td>
                      ))}
                      {saveable && (
                        <td className="px-3 py-3 text-right">
                          <SaveButton on={saved.has(r.id)} onClick={(e) => { e.stopPropagation(); onSave(r.id); }} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!state.loading && state.rows.length === 0 && <Empty />}
              {state.loading && state.rows.length === 0 && <Loading />}
            </div>

            {/* Cards on phones */}
            <ul className={`flex flex-col gap-2 md:hidden ${state.loading ? 'opacity-60' : ''}`}>
              {state.rows.map((r) => (
                <li key={r.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setParams({ open: r.id }, { resetPage: false })}
                    onKeyDown={(e) => { if (e.key === 'Enter') setParams({ open: r.id }, { resetPage: false }); }}
                    className="flex w-full items-start gap-3 rounded-[10.625px] border border-line bg-white px-4 py-3 text-left active:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold text-ink-1">{cardTitle(r)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.75px] text-ink-3">{cardMeta(r)}</div>
                    </div>
                    {saveable && <SaveButton on={saved.has(r.id)} onClick={(e) => { e.stopPropagation(); onSave(r.id); }} />}
                  </div>
                </li>
              ))}
              {!state.loading && state.rows.length === 0 && <li><Empty /></li>}
              {state.loading && state.rows.length === 0 && <li><Loading /></li>}
            </ul>
          </>
        )}

        <Pagination page={state.page} pages={state.pages} onPage={(p) => { setParams({ page: p }, { resetPage: false }); window.scrollTo({ top: 0 }); }} />
        {state.count > 0 && (
          <p className="-mt-3 pb-4 text-center text-[12.75px] text-ink-4 tabular">
            {fmtNum((state.page - 1) * PAGE_SIZE + 1)}–{fmtNum(Math.min(state.page * PAGE_SIZE, state.count))} / {fmtNum(state.count)}
          </p>
        )}
      </div>

      <Drawer open={!!openId && !!detailRow} onClose={() => setParams({ open: '' }, { resetPage: false })} title={detailRow ? cardTitle(detailRow) : ''}>
        {detailRow ? detail(detailRow, { saved: saved.has(detailRow.id), onSave: () => onSave(detailRow.id) }) : null}
      </Drawer>
    </div>
  );
}

function SaveButton({ on, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? '영업 현황에서 빼기' : '영업 현황에 담기'}
      title={on ? '영업 현황에서 빼기' : '영업 현황에 담기'}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded hover:bg-surface ${on ? 'text-brand' : 'text-ink-4'}`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    </button>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <Icon name="search" size={28} className="text-ink-4" />
      <p className="text-body font-medium text-ink-1">조건에 맞는 결과가 없습니다</p>
      <p className="text-sub text-ink-3">지역이나 검색어를 바꿔 보세요.</p>
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
