'use client';

import Link from 'next/link';
import { Icon } from './Icons';
import { NAV } from '@/lib/nav';
import { signOut } from '@/lib/auth';
import useSession from './useSession';
import { PageHeader } from './ui';

export default function MobileMenu() {
  const session = useSession();
  return (
    <div className="mx-auto w-full max-w-[640px]">
      <PageHeader title="메뉴" sub={session ? `${session.name} 님` : undefined} />
      <div className="flex flex-col gap-4 px-4">
        {NAV.map((g) => (
          <section key={g.title || 'top'} className="rounded-[10.625px] border border-line">
            {g.title && (
              <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sub font-semibold text-ink-1">
                <Icon name={g.icon} size={18} stroke={g.color} />
                {g.title}
              </h2>
            )}
            <ul className="divide-y divide-line">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="flex items-center gap-2 px-4 py-3 text-body text-ink-2 active:bg-surface">
                    {it.icon && <Icon name={it.icon} size={18} />}
                    <span className="flex-1">{it.label}</span>
                    {it.badge && <span className="rounded-full bg-brand-deep px-2 py-px text-[11px] font-semibold leading-[16px] text-white">{it.badge}</span>}
                    <Icon name="chevRight" size={15} strokeWidth={2} className="text-ink-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {session && (
          <button type="button" onClick={signOut} className="flex h-[47px] items-center justify-center gap-2 rounded border border-line text-body text-ink-2 active:bg-surface">
            <Icon name="logout" size={18} />
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
}
