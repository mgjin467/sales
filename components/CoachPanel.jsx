'use client';

import { useEffect, useRef, useState } from 'react';
import { loadAll } from '@/lib/api';
import { getRows } from '@/lib/board';
import { ALL_SGG } from '@/lib/regions';
import { setState, useStore } from '@/lib/store';
import { Icon } from './Icons';
import useSession from './useSession';

const KEY = 'oh_coach_open';
const SUGGEST = ['진천군 이번 달 착공 현장 알려줘', '청주시 공장 현장 몇 곳이야?', '내 영업 현황 요약해줘', '착공 예정 현장 추천해줘'];

export function openCoach(open = true) {
  try { if (open) sessionStorage.setItem(KEY, '1'); else sessionStorage.removeItem(KEY); } catch {}
  setState({ coachOpen: open });
}

// A rule-based stand-in for the original's AI assistant: it answers from the sample data in this browser.
async function answer(text) {
  const t = text.replace(/\s+/g, ' ');
  const [sites, remodel] = await Promise.all([loadAll('sites'), loadAll('remodel')]);
  const all = [...sites, ...remodel];
  const region = ALL_SGG.find((g) => t.includes(g.name) || t.includes(g.name.replace(/[시군구]$/, '')));
  const uses = ['공장', '창고', '단독주택', '공동주택', '근린생활', '판매', '업무'];
  const use = uses.find((u) => t.includes(u));

  if (/영업|현황|담은|견적/.test(t) && !region) {
    const rows = getRows();
    if (!rows.length) return '아직 담은 현장이 없습니다. 「신축 현장」에서 「담기」를 누르면 영업 현황에 들어갑니다.';
    const by = rows.reduce((m, r) => ({ ...m, [r.stage]: (m[r.stage] || 0) + 1 }), {});
    const quote = rows.reduce((s, r) => s + (Number(r.quote) || 0), 0);
    return `담은 현장은 ${rows.length}곳입니다. 단계별로 ${Object.entries(by).map(([k, v]) => `${k} ${v}곳`).join(', ')}이고, 견적 합계는 ${quote.toLocaleString('ko-KR')}만 원입니다.`;
  }

  let rows = all.filter((r) => r.stage !== '준공');
  if (region) rows = rows.filter((r) => r.sgg === region.code);
  if (use) rows = rows.filter((r) => r.use.includes(use));
  const planned = /예정|추천|곧|앞으로/.test(t);
  const month = /이번 ?달|최근/.test(t);
  if (planned) rows = rows.filter((r) => !r.startDate).sort((a, b) => (a.permitDate < b.permitDate ? 1 : -1));
  else if (month || /착공/.test(t)) rows = rows.filter((r) => r.startDate).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  const where = region ? `${region.sidoShort} ${region.name}` : '전국';
  if (!rows.length) return `${where}에서 조건에 맞는 현장을 찾지 못했습니다. 지역이나 용도를 바꿔 물어봐 주세요.`;
  const top = rows.slice(0, 3).map((r, i) => `${i + 1}. ${r.title} (${r.use}, 건축면적 ${Number(r.buildArea).toLocaleString('ko-KR')}m², ${r.startDate ? `착공 ${r.startDate}` : `허가 ${r.permitDate}`})`).join('\n');
  return `${where}${use ? ` ${use}` : ''} ${planned ? '착공 예정' : month || /착공/.test(t) ? '최근 착공' : ''} 현장은 ${rows.length}곳입니다.\n${top}\n\n「신축 현장」에서 지역을 고르면 전체 목록을 볼 수 있어요.`;
}

export default function CoachPanel() {
  const store = useStore();
  const session = useSession();
  const [msgs, setMsgs] = useState([{ from: 'bot', text: '안녕하세요. 현장 찾기와 영업 정리를 도와 드리는 AI 영업비서입니다. 지역 · 용도 · 착공 시기를 넣어 물어보세요. (예시 답변이며 실제 AI가 아닙니다)' }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === '1') setState({ coachOpen: true }); } catch {}
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, store.coachOpen]);

  if (!session || !store.coachOpen) return null;

  async function send(q) {
    const v = (q ?? text).trim();
    if (!v || busy) return;
    setText('');
    setMsgs((m) => [...m, { from: 'me', text: v }]);
    setBusy(true);
    const a = await answer(v).catch(() => '지금은 답하지 못했습니다. 잠시 후 다시 물어봐 주세요.');
    setMsgs((m) => [...m, { from: 'bot', text: a }]);
    setBusy(false);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[47] flex w-full max-w-[400px] flex-col border-l border-line bg-white shadow-card" role="dialog" aria-label="AI 영업비서">
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-line px-4">
        <h2 className="flex items-center gap-2 text-body font-bold text-ink-1"><Icon name="chat" size={18} />AI 영업비서</h2>
        <button type="button" onClick={() => openCoach(false)} aria-label="AI 영업비서 닫기" className="flex size-9 items-center justify-center rounded text-ink-4 hover:bg-surface hover:text-ink-1">
          <Icon name="x" size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {msgs.map((m, i) => (
          <p key={i} className={`w-fit max-w-[88%] whitespace-pre-line rounded-[12px] px-3 py-2 text-sub ${m.from === 'me' ? 'ml-auto bg-brand-deep text-white' : 'bg-surface text-ink-1'}`}>{m.text}</p>
        ))}
        {busy && <p className="w-fit rounded-[12px] bg-surface px-3 py-2 text-sub text-ink-3">찾는 중…</p>}
        <div ref={end} />
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {SUGGEST.map((s) => (
          <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line px-2.5 py-1 text-[12.75px] text-ink-2 hover:bg-surface">{s}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3 pb-[calc(12px+var(--safe-bottom))]">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="무엇이든 물어보세요" aria-label="질문" className="h-[42px] min-w-0 flex-1 rounded border border-line px-3 text-sub outline-none focus:border-brand focus:ring-2 focus:ring-brand/30" />
        <button type="submit" disabled={busy} className="h-[42px] rounded bg-brand-deep px-4 text-sub font-semibold text-white hover:bg-brand disabled:opacity-60">보내기</button>
      </form>
    </div>
  );
}
