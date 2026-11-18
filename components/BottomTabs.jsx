'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icons';
import { TABS, isActive } from '@/lib/nav';

export default function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 md:hidden" style={{ bottom: 'var(--tab-gap)' }}>
      <ul className="glass-tab pointer-events-auto flex h-[60px] w-full max-w-[480px] items-center gap-0.5 rounded-full px-1.5">
        {TABS.map((t) => {
          const on = isActive(t.href, pathname);
          return (
            <li key={t.href} className="h-full min-w-0 flex-1 py-1.5">
              <Link
                href={t.href}
                aria-current={on ? 'page' : undefined}
                className={`flex h-full w-full flex-col items-center justify-center gap-[2px] whitespace-nowrap rounded-full px-1 text-[12.75px] leading-none transition-colors active:bg-black/5 ${on ? 'bg-brand-soft font-semibold text-brand-deep' : 'font-medium text-ink-2'}`}
              >
                <span className="relative">
                  <Icon name={t.icon} size={25.5} className="" />
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
