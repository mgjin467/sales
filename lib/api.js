'use client';

// Data layer: each list is fetched over the network as JSON, then filtered, sorted and cut into
// pages the way a database query with a range would be (rows + total count).
const cache = new Map();

async function load(table) {
  if (!cache.has(table)) {
    cache.set(
      table,
      fetch(`/data/${table}.json`, { cache: 'force-cache' }).then((r) => {
        if (!r.ok) throw new Error(`데이터를 불러오지 못했습니다 (${r.status})`);
        return r.json();
      }),
    );
  }
  try {
    return await cache.get(table);
  } catch (e) {
    cache.delete(table);
    throw e;
  }
}

export const PAGE_SIZE = 20;

function matches(row, q, fields) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  return fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle));
}

function sortRows(rows, sort) {
  const [key, dir] = (sort || '').split('.');
  if (!key) return rows;
  const m = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    // Empty values come first when ascending (e.g. sites not started yet), last when descending.
    if (x == null && y == null) return 0;
    if (x == null) return dir === 'asc' ? -1 : 1;
    if (y == null) return dir === 'asc' ? 1 : -1;
    return x > y ? m : x < y ? -m : 0;
  });
}

export async function loadAll(table) {
  return load(table);
}

export async function query(table, { sgg, sggs, sido, q, filters = {}, where, sort, page = 1, pageSize = PAGE_SIZE, searchFields = ['title', 'address'] } = {}) {
  const all = await load(table);
  const set = sggs && sggs.length ? new Set(sggs) : null;
  let rows = all.filter((r) => {
    if (set && !set.has(r.sgg)) return false;
    if (!set && sgg && r.sgg !== sgg) return false;
    if (!set && !sgg && sido && !String(r.sgg).startsWith(sido)) return false;
    if (where && !where(r)) return false;
    for (const [k, v] of Object.entries(filters)) {
      if (v && r[k] !== v) return false;
    }
    return matches(r, q, searchFields);
  });
  rows = sortRows(rows, sort);
  const count = rows.length;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((p - 1) * pageSize, p * pageSize), count, page: p, pages };
}

export async function getOne(table, id) {
  const all = await load(table);
  return all.find((r) => r.id === id) || null;
}

export async function related(table, key, value, limit = 8) {
  const all = await load(table);
  return all.filter((r) => r[key] === value).slice(0, limit);
}

// Saved sites ("담기") are the 영업 현황 rows that point at a site.
import { savedSiteIds, toggleSite } from './board';
export function savedIds() {
  return savedSiteIds();
}
export async function toggleSaved(table, id) {
  const row = await getOne(table, id);
  if (!row) return savedSiteIds();
  return toggleSite(row);
}
