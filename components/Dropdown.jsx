'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';

// A filter button that opens a panel under it. Closes on outside click or Escape.
export default function Dropdown({ label, active = false, children, width = 260, className = '', align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[34px] w-full items-center justify-between gap-2 rounded border px-3 text-[14.875px] transition-colors ${
          active || open ? 'border-brand bg-brand-soft/40 font-medium text-brand-deep' : 'border-line bg-white text-ink-2 hover:border-ink-4/40'
        }`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <Icon name="chevDown" size={16} strokeWidth={2} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${active ? 'text-brand-deep' : 'text-ink-3'}`} />
      </button>
      {open && (
        <div
          role="dialog"
          className={`absolute top-[calc(100%+6px)] z-30 rounded-[10.625px] border border-line bg-white p-2 shadow-card ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ width }}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sub text-ink-2 hover:bg-surface">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-[#9a3412]" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </label>
  );
}

export function RadioRow({ checked, onChange, children }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sub hover:bg-surface ${checked ? 'font-semibold text-brand-deep' : 'text-ink-2'}`}
    >
      {children}
      {checked && <span aria-hidden="true">✓</span>}
    </button>
  );
}
