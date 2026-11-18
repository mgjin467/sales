export const NAV = [
  { title: null, items: [{ href: '/', label: '홈', icon: 'home' }, { href: '/calendar', label: '일정', icon: 'calendar' }] },
  {
    title: '현장 영업', key: 'market', icon: 'market', color: '#0284c7',
    items: [
      { href: '/sites', label: '신축 현장' },
      { href: '/remodel', label: '리모델링 현장' },
      { href: '/designers', label: '설계사무소 DB' },
      { href: '/companies', label: '건설업체 DB' },
    ],
  },
  {
    title: '영업 관리', key: 'sales', icon: 'sales', color: '#c2410c',
    items: [
      { href: '/my/board', label: '영업 현황' },
      { href: '/my/estimates', label: '견적 산출', badge: '베타' },
      { href: '/my/accounts', label: '거래처 관리' },
      { href: '/my/goals', label: 'OKR' },
    ],
  },
  {
    title: '계약 관리', key: 'ar', icon: 'ar', color: '#059669',
    items: [{ href: '/my/contracts', label: '전자 계약서' }, { href: '/my/ar', label: '수금 관리' }],
  },
  {
    title: '공사 관리', key: 'won', icon: 'won', color: '#4f46e5',
    items: [{ href: '/my/build', label: '현장 손익' }, { href: '/my/schedule', label: '공사 기록' }, { href: '/my/defects', label: 'AS 기록' }],
  },
  {
    title: '부가 서비스', key: 'extra', icon: 'extra', color: '#7c3aed',
    items: [{ href: '/drive', label: '첨부 보관함', badge: '베타' }, { href: '/materials', label: '건축자재 DB', badge: '베타' }],
  },
];

export const TABS = [
  { href: '/coach', label: 'AI 영업비서', icon: 'chat' },
  { href: '/map', label: '지도', icon: 'pinCircle' },
  { href: '/my/board', label: '영업', icon: 'board' },
  { href: '/calendar', label: '일정', icon: 'calendar' },
  { href: '/menu', label: '메뉴', icon: 'menu' },
];

// Pages that exist in the menu but are only placeholders in this rebuild.
export const PLACEHOLDER_PAGES = {
  'my/estimates': '견적 산출',
  'my/accounts': '거래처 관리',
  'my/goals': 'OKR',
  'my/contracts': '전자 계약서',
  'my/ar': '수금 관리',
  'my/build': '현장 손익',
  'my/schedule': '공사 기록',
  'my/defects': 'AS 기록',
  drive: '첨부 보관함',
  materials: '건축자재 DB',
  terms: '이용약관',
  privacy: '개인정보처리방침',
  refund: '환불정책',
};

export function normPath(p) {
  if (!p) return '/';
  const s = p.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

export function isActive(href, pathname) {
  const p = normPath(pathname);
  if (href === '/') return p === '/';
  if (href === '/my/board') return p === '/my/board';
  return p === href || p.startsWith(href + '/');
}
