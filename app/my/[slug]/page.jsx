import { PLACEHOLDER_PAGES } from '@/lib/nav';
import Placeholder from '@/components/Placeholder';

// /my/* placeholder pages (/my/board has its own page).
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_PAGES)
    .filter((p) => p.startsWith('my/'))
    .map((p) => ({ slug: p.slice(3) }));
}

export default function Page({ params }) {
  const key = `my/${params.slug}`;
  return <Placeholder path={key} title={PLACEHOLDER_PAGES[key]} />;
}
