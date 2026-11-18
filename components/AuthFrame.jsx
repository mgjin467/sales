import Link from 'next/link';
import Logo from './Logo';

// Full-screen frame used by the login / signup / reset screens. It covers the app underneath.
export default function AuthFrame({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white pb-[var(--safe-bottom)]">
      <header className="px-5 py-5 sm:px-8">
        <Link href="/" aria-label="홈" className="inline-flex items-center">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[408px]">{children}</div>
      </main>
      <footer className="border-t border-line px-4 py-[25.5px]">
        <div className="mx-auto flex max-w-[476px] flex-col items-center gap-[8.5px] text-center text-[12.75px]">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ink-3">
            <Link className="hover:text-ink-1 hover:underline" href="/terms">이용약관</Link>
            <span className="text-line" aria-hidden="true">|</span>
            <Link className="font-medium text-ink-2 hover:text-ink-1 hover:underline" href="/privacy">개인정보처리방침</Link>
            <span className="text-line" aria-hidden="true">|</span>
            <Link className="hover:text-ink-1 hover:underline" href="/refund">환불정책</Link>
          </div>
          <p className="leading-relaxed text-ink-4">
            {[
              '㈜샘플컴퍼니앤씨',
              '대표 홍길동',
              '사업자등록번호 000-00-00000',
              '통신판매업 신고 제 0000-샘플서울-0000 호',
              '서울특별시 샘플구 샘플대로 1234 (샘플동)',
              '000-0000-0000',
              'support@example.com',
            ].map((t, i) => (
              <span key={t}>
                {i > 0 ? ' · ' : ''}
                <span className="whitespace-nowrap">{t}</span>
              </span>
            ))}
          </p>
          <p className="text-ink-4">© 주식회사 샘플컴퍼니앤씨. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
