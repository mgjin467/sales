import { PLACEHOLDER_PAGES } from '@/lib/nav';
import Placeholder from '@/components/Placeholder';

// One-level placeholder pages: /drive, /materials, /terms, /privacy, /refund
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_PAGES).filter((p) => !p.includes('/')).map((slug) => ({ slug }));
}

export default function Page({ params }) {
  return <Placeholder path={params.slug} title={PLACEHOLDER_PAGES[params.slug]} />;
}
