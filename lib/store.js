'use client';

// Tiny shared state between the list pages and the map panel / AI panel (no library needed).
const state = {
  mapOpen: false,
  coachOpen: false,
  mapSites: null, // rows the current list matches (null = every site)
  focus: null, // a site the map should fly to
  inView: null, // ids inside the map's view, when the list follows the map
};
const subs = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  subs.forEach((fn) => fn({ ...state }));
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

import { useEffect, useState } from 'react';
export function useStore() {
  const [s, setS] = useState(() => ({ ...state }));
  useEffect(() => {
    setS({ ...state });
    return subscribe(setS);
  }, []);
  return s;
}

const MAP_KEY = 'ohj-demo-map-open';
export function initMapOpen() {
  try {
    if (localStorage.getItem(MAP_KEY) === '1') setState({ mapOpen: true });
  } catch {}
}
export function setMapOpen(open) {
  try { if (open) localStorage.setItem(MAP_KEY, '1'); else localStorage.removeItem(MAP_KEY); } catch {}
  setState({ mapOpen: open });
}
