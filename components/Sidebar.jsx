'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, PanelIcon } from './Icons';
import Logo from './Logo';
import { NAV, isActive } from '@/lib/nav';
import { signOut } from '@/lib/auth';
import { setMapOpen, useStore } from '@/lib/store';
import { openCoach } from './CoachPanel';
import useSession from './useSession';

const PROMO_KEY = 'ohj:app-promo-dismissed';

function AppPromo() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState(false);
  useEffect(() => {
    try { setShow(localStorage.getItem(PROMO_KEY) !== '1'); } catch {}
  }, []);
  if (!show) return null;
  return (
    <div className="relative rounded-[10.625px] border border-[color-mix(in_srgb,#c2410c_25%,transparent)] bg-[color-mix(in_srgb,#c2410c_4%,white)] p-3">
      <button
        type="button"
        aria-label="앱 안내 닫기"
        onClick={() => { try { localStorage.setItem(PROMO_KEY, '1'); } catch {} setShow(false); }}
        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded text-ink-4 hover:bg-white hover:text-ink-1"
      >
        <Icon name="x" size={14} strokeWidth={2} />
      </button>
      <p className="flex items-center gap-1.5 pr-5 text-sub font-bold text-ink-1">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
        현장노트 앱 출시
      </p>
      <p className="mt-1 text-[13px] leading-snug text-ink-3">내 주변 현장을 찾고, 비서 알림도 바로 받아 보세요.</p>
      <button type="button" onClick={() => setMsg(true)} className="mt-2 h-[30px] w-full rounded-[8px] border border-line bg-white text-[13px] font-semibold text-brand-deep hover:bg-brand-soft">
        앱 설치
      </button>
      {msg && <p role="status" className="mt-1.5 text-[12px] text-ink-4">예시 화면이라 앱 스토어로 연결되지 않습니다.</p>}
    </div>
  );
}

function AccountChip({ session }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[52px] w-full items-center gap-2.5 rounded-[10px] border border-line bg-white px-2.5 text-left hover:bg-surface"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand-deep">
          {(session.name || '?').slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sub font-semibold text-ink-1">{session.name}</span>
          <span className="block text-[12px] text-ink-4">{session.role === 'MANAGER' ? '관리자' : '직원'}</span>
        </span>
        <Icon name="chevDown" size={16} strokeWidth={2} className={`shrink-0 text-ink-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-40 rounded-[10.625px] border border-line bg-white p-1.5 shadow-card">
          <p className="truncate px-2.5 py-1.5 text-[12.75px] text-ink-4">{session.email}</p>
          <Link role="menuitem" href="/menu" onClick={() => setOpen(false)} className="block rounded px-2.5 py-2 text-sub text-ink-2 hover:bg-surface">전체 메뉴</Link>
          <Link role="menuitem" href="/calendar" onClick={() => setOpen(false)} className="block rounded px-2.5 py-2 text-sub text-ink-2 hover:bg-surface">내 일정</Link>
          <button role="menuitem" type="button" onClick={signOut} className="block w-full rounded px-2.5 py-2 text-left text-sub text-danger hover:bg-danger-soft">로그아웃</button>
        </div>
      )}
    </div>
  );
}

const W_KEY = 'ohj.nav.w';
const RAIL_KEY = 'ohj.nav.rail';
const CLOSED_KEY = 'ohj.nav.closed';
const W_DEFAULT = 240;
const W_MIN = 200;
const W_MAX = 360;
const DEFAULT_OPEN = '현장 영업';

const linkCls =
  'flex items-center gap-[8.5px] rounded-[10.625px] px-[12.75px] py-[8.5px] text-[14.875px] font-medium leading-[21.25px]';

function defaultClosed() {
  return new Set(NAV.map((g) => g.title).filter((t) => t && t !== DEFAULT_OPEN));
}

function readClosed() {
  try {
    const raw = localStorage.getItem(CLOSED_KEY);
    return raw === null ? defaultClosed() : new Set(JSON.parse(raw));
  } catch {
    return defaultClosed();
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const session = useSession();
  const store = useStore();
  const [width, setWidth] = useState(W_DEFAULT);
  const [rail, setRail] = useState(false);
  const [closed, setClosed] = useState(defaultClosed);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);

  useEffect(() => {
    try {
      const w = Number(localStorage.getItem(W_KEY));
      if (w >= W_MIN && w <= W_MAX) setWidth(w);
      if (localStorage.getItem(RAIL_KEY) === '1') setRail(true);
    } catch {}
    setClosed(readClosed());
  }, []);

  useEffect(() => {
    try {
      if (rail) localStorage.setItem(RAIL_KEY, '1');
      else localStorage.removeItem(RAIL_KEY);
    } catch {}
  }, [rail]);

  // Ctrl + \ (or Cmd + \) folds and unfolds the menu.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setRail((r) => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const saveClosed = (next) => {
    setClosed(next);
    try { localStorage.setItem(CLOSED_KEY, JSON.stringify([...next])); } catch {}
  };

  const toggleGroup = (title) => {
    const next = new Set(closed);
    if (next.has(title)) next.delete(title); else next.add(title);
    saveClosed(next);
  };

  const openFromRail = (title) => {
    const next = new Set(closed);
    next.delete(title);
    saveClosed(next);
    setRail(false);
  };

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, w: width };
    setDragging(true);
    const move = (ev) => {
      const s = startRef.current;
      if (!s) return;
      const w = Math.min(W_MAX, Math.max(W_MIN, Math.round(s.w + ev.clientX - s.x)));
      setWidth(w);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setWidth((w) => {
        try { localStorage.setItem(W_KEY, String(w)); } catch {}
        return w;
      });
      startRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [width]);

  const resetWidth = () => {
    setWidth(W_DEFAULT);
    try { localStorage.removeItem(W_KEY); } catch {}
  };

  const onResizeKey = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const w = Math.min(W_MAX, Math.max(W_MIN, width + (e.key === 'ArrowRight' ? 10 : -10)));
      setWidth(w);
      try { localStorage.setItem(W_KEY, String(w)); } catch {}
    }
  };

  return (
    <aside className="hidden shrink-0 border-r border-line print:hidden md:block" style={{ width: rail ? 64 : width }}>
      <div className="sticky top-0 flex h-screen flex-col">
        {!rail && (
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label="왼쪽 메뉴 너비 조절"
            aria-valuenow={width}
            aria-valuemin={W_MIN}
            aria-valuemax={W_MAX}
            title="끌어서 너비 조절 · 두 번 누르면 처음 너비"
            onPointerDown={onPointerDown}
            onDoubleClick={resetWidth}
            onKeyDown={onResizeKey}
            className="group/resize absolute right-0 top-0 z-30 flex h-full w-2 translate-x-1/2 cursor-col-resize justify-center"
          >
            <span className={`h-full w-[3px] rounded-full transition-colors ${dragging ? 'bg-brand/60' : 'bg-transparent group-hover/resize:bg-brand/60'}`} />
          </div>
        )}

        {rail ? (
          <div className="flex shrink-0 flex-col items-center gap-1 pb-1 pt-3">
            <Link href="/" aria-label="첫 화면" title="홈" className="flex h-9 w-9 items-center justify-center rounded hover:bg-surface">
              <Logo small />
            </Link>
            <FoldButton narrow onClick={() => setRail(false)} />
          </div>
        ) : (
          <div className="flex h-[64px] shrink-0 items-center pl-5 pr-3">
            <Link href="/" aria-label="첫 화면" className="flex min-w-0 flex-1 items-center">
              <Logo />
            </Link>
            <FoldButton onClick={() => setRail(true)} />
          </div>
        )}

        {rail ? (
          <nav aria-label="주 메뉴" className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto py-2">
            {NAV.map((g) =>
              !g.title ? (
                g.items.map((it) => {
                  const on = isActive(it.href, pathname);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={it.label}
                      aria-label={it.label}
                      aria-current={on ? 'page' : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-[10.625px] ${on ? 'bg-brand-soft text-brand-deep' : 'text-ink-2 hover:bg-surface hover:text-ink-1'}`}
                    >
                      <Icon name={it.icon} size={20} />
                    </Link>
                  );
                })
              ) : (
                <button
                  key={g.title}
                  type="button"
                  title={g.title}
                  aria-label={`${g.title} 펼치기`}
                  onClick={() => openFromRail(g.title)}
                  className={`flex h-10 w-10 items-center justify-center rounded-[10.625px] ${g.items.some((it) => isActive(it.href, pathname)) ? 'bg-brand-soft' : 'hover:bg-surface'}`}
                >
                  <Icon name={g.icon} size={20} stroke={g.color} />
                </button>
              ),
            )}
          </nav>
        ) : (
          <nav aria-label="주 메뉴" className="flex min-h-0 flex-1 flex-col gap-[4.25px] overflow-y-auto px-3 py-2">
            {NAV.map((g) => {
              if (!g.title) {
                return (
                  <ul key="top" className="flex flex-col gap-[4.25px]">
                    {g.items.map((it) => {
                      const on = isActive(it.href, pathname);
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            aria-current={on ? 'page' : undefined}
                            className={`${linkCls} ${on ? 'bg-brand-soft text-brand-deep' : 'text-ink-2 hover:bg-surface hover:text-ink-1'}`}
                          >
                            <Icon name={it.icon} />
                            {it.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                );
              }
              const open = !closed.has(g.title);
              const id = `nav-g:${g.key}`;
              return (
                <div key={g.title} className="flex flex-col">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() => toggleGroup(g.title)}
                    className={`${linkCls} w-full text-left text-ink-2 hover:bg-surface hover:text-ink-1`}
                  >
                    <Icon name={g.icon} stroke={g.color} />
                    <span className="min-w-0 flex-1 truncate">{g.title}</span>
                    <Icon name={open ? 'chevDown' : 'chevRight'} size={15} strokeWidth={2} className="shrink-0 text-ink-4" />
                  </button>
                  {open && (
                    <ul id={id} className="relative mt-[4.25px] flex flex-col gap-[2.125px] pl-[17px]">
                      <span className="absolute bottom-[4.25px] left-[18px] top-[4.25px] w-px bg-line" aria-hidden="true" />
                      {g.items.map((it) => {
                        const on = isActive(it.href, pathname);
                        return (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              aria-current={on ? 'page' : undefined}
                              className={`${linkCls} !pl-[38.25px] ${on ? 'bg-brand-soft text-brand-deep' : 'text-ink-2 hover:bg-surface hover:text-ink-1'}`}
                            >
                              {it.label}
                              {it.badge && (
                                <span className="ml-auto rounded-full bg-brand-deep px-2 py-px text-[11px] font-semibold leading-[16px] text-white">{it.badge}</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {rail ? (
          <div className="flex shrink-0 flex-col items-center gap-2 pb-4 pt-2">
            {session && (
              <button type="button" onClick={() => openCoach(!store.coachOpen)} title="AI 영업비서" aria-label="AI 영업비서 열기" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-deep text-white hover:bg-brand">
                <Icon name="chat" size={18} strokeWidth={2} />
              </button>
            )}
            <button type="button" onClick={() => setMapOpen(!store.mapOpen)} title={store.mapOpen ? '지도 닫기' : '지도 보기'} aria-label={store.mapOpen ? '지도 닫기' : '지도 보기'} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-deep text-brand-deep hover:bg-brand-soft">
              <Icon name="pin" size={18} />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-2 px-3 pb-4 pt-2">
            {session && <AppPromo />}
            {session && (
              <button type="button" onClick={() => openCoach(!store.coachOpen)} aria-expanded={store.coachOpen} className="flex h-[42px] items-center justify-center gap-2 rounded-[10px] bg-brand-deep text-sub font-semibold text-white hover:bg-brand">
                <Icon name="chat" size={18} strokeWidth={2} />
                AI 영업비서 {store.coachOpen ? '닫기' : '열기'}
              </button>
            )}
            {session ? (
              <button
                type="button"
                onClick={() => setMapOpen(!store.mapOpen)}
                className="hidden h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-brand-deep bg-white text-sub font-semibold text-brand-deep hover:bg-brand-soft lg:flex"
              >
                <Icon name="pin" size={18} />
                {store.mapOpen ? '지도 닫기' : '지도 보기'}
              </button>
            ) : null}
            <Link
              href={session ? '/map' : '/sites'}
              className={`h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border border-brand-deep bg-white text-sub font-semibold text-brand-deep hover:bg-brand-soft ${session ? 'flex lg:hidden' : 'flex'}`}
            >
              <Icon name="pin" size={18} />
              지도 보기
            </Link>
            {session ? (
              <AccountChip session={session} />
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/auth/signup"
                  className="flex h-[42px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[color-mix(in_srgb,#c2410c_30%,transparent)] bg-[color-mix(in_srgb,#c2410c_4%,transparent)] text-sub font-semibold text-ink-1 hover:bg-[color-mix(in_srgb,#c2410c_10%,transparent)]"
                >
                  <span className="text-brand">
                    <Icon name="sparkle" size={16} strokeWidth={2} />
                  </span>
                  회원 가입하기
                </Link>
                <Link href="/auth/login" className="flex h-[42px] shrink-0 items-center justify-center rounded-[10px] px-3 text-sub text-ink-3 hover:bg-surface hover:text-ink-1">
                  로그인
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function FoldButton({ narrow = false, onClick }) {
  const label = narrow ? '메뉴 펼치기' : '메뉴 접기';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={!narrow}
      title={`${label} (Ctrl + \\)`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-ink-4 hover:bg-surface hover:text-ink-1"
    >
      <PanelIcon open={!narrow} />
    </button>
  );
}
