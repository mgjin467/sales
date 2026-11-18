'use client';

// 영업 현황 rows and saved views, kept in this browser.
const ROWS = 'ohj-demo-board';
const VIEWS = 'ohj-demo-board-views';
const subs = new Set();

export const STAGES = ['발굴', '접촉', '견적', '계약', '종결', '실패'];
export const STAGE_COLOR = {
  발굴: '#0284c7', 접촉: '#7c3aed', 견적: '#c2410c', 계약: '#059669', 종결: '#15803d', 실패: '#737373',
};
export const KINDS = ['신축', '리모델링', '아파트', '빌라', '기타'];

export const COLUMNS = [
  { key: 'title', label: '현장', type: 'text', icon: 'A', width: 280, locked: true },
  { key: 'unit', label: '동·호수', type: 'text', icon: 'A', width: 120 },
  { key: 'kind', label: '구분', type: 'select', options: KINDS, icon: '⊙', width: 90 },
  { key: 'owner', label: '담당', type: 'text', icon: '◎', width: 90 },
  { key: 'stage', label: '단계', type: 'select', options: STAGES, icon: '⊙', width: 100 },
  { key: 'memo', label: '메모', type: 'text', icon: '¶', width: 220 },
  { key: 'quote', label: '견적(만원)', type: 'number', icon: '₩', width: 130, sum: true },
  { key: 'expect', label: '예상 매출(만원)', type: 'number', icon: '#', width: 140, sum: true },
  { key: 'contact', label: '거래처 담당자', type: 'text', icon: 'A', width: 120 },
  { key: 'phone', label: '연락처', type: 'text', icon: '✆', width: 130 },
  { key: 'visit', label: '방문일', type: 'date', icon: '▦', width: 120 },
];

export const DEFAULT_VIEWS = [
  { id: 'v-quote', name: '견적', type: 'table', filter: { stage: ['견적'] }, hidden: ['visit', 'unit', 'expect', 'kind'], sort: { key: 'quote', dir: 'desc' }, group: null, color: false, dense: false },
  { id: 'v-won', name: '계약·종결', type: 'table', filter: { stage: ['계약', '종결'] }, hidden: ['visit'], sort: null, group: null, color: false, dense: false },
  { id: 'v-lost', name: '실패', type: 'table', filter: { stage: ['실패'] }, hidden: ['visit'], sort: null, group: null, color: false, dense: false },
  { id: 'v-kanban', name: '단계 칸반', type: 'kanban', filter: {}, hidden: [], sort: null, group: 'stage', color: true, dense: false },
  { id: 'v-owner', name: '담당자별', type: 'table', filter: {}, hidden: [], sort: null, group: 'owner', color: false, dense: false },
  { id: 'v-all', name: '전체 보기', type: 'table', filter: {}, hidden: [], sort: null, group: null, color: false, dense: false },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getRows() { return read(ROWS, []); }
export function getViews() { return read(VIEWS, DEFAULT_VIEWS); }

function emit() { subs.forEach((fn) => fn()); }
export function onBoard(fn) { subs.add(fn); return () => subs.delete(fn); }

export function saveRows(rows) { localStorage.setItem(ROWS, JSON.stringify(rows)); emit(); }
export function saveViews(views) { localStorage.setItem(VIEWS, JSON.stringify(views)); emit(); }

export function newRow(patch = {}) {
  return {
    id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    siteId: null, title: '', unit: '', kind: '신축', owner: '', stage: '발굴', memo: '', quote: null, expect: null,
    contact: '', phone: '', visit: null, createdAt: new Date().toISOString().slice(0, 10), ...patch,
  };
}

export function addRow(patch) {
  const row = newRow(patch);
  saveRows([...getRows(), row]);
  return row;
}

export function updateRow(id, patch) {
  saveRows(getRows().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function removeRow(id) {
  saveRows(getRows().filter((r) => r.id !== id));
}

export function savedSiteIds() {
  return new Set(getRows().map((r) => r.siteId).filter(Boolean));
}

// 담기 / 빼기 from a site list.
export function toggleSite(site) {
  const rows = getRows();
  const has = rows.find((r) => r.siteId === site.id);
  if (has) saveRows(rows.filter((r) => r.siteId !== site.id));
  else {
    saveRows([...rows, newRow({
      siteId: site.id, title: site.title, memo: site.address, kind: site.work === '신축' ? (site.kindTag === '신축 현장' ? '신축' : site.kindTag) : '리모델링',
      contact: site.company || '', visit: site.startDate || null,
    })]);
  }
  return savedSiteIds();
}
