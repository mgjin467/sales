'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { loadAll } from '@/lib/api';
import { toggleSite, savedSiteIds } from '@/lib/board';
import { setState, useStore } from '@/lib/store';
import { GuideDialog } from './GuideButton';

const KINDS = [
  { key: '신축 현장', color: '#dc2626' },
  { key: '아파트', color: '#1d4ed8' },
  { key: '빌라', color: '#9333ea' },
];
const MAP_GUIDE = [
  ['지도에서 현장 찾기', '숫자 동그라미는 가까운 현장을 묶은 것입니다. 누르면 그 자리로 확대됩니다. 점을 누르면 현장 요약과 「담기」가 나옵니다.'],
  ['화면 내 현장 검색', '지도를 옮기거나 확대하면, 지금 화면 안에 있는 현장만 목록에 보입니다.'],
  ['거리뷰', '「거리뷰」를 켠 뒤 지도를 누르면 그 자리의 거리 사진을 새 창으로 엽니다.'],
  ['내 위치 · 위성지도', '「내 위치」로 지금 있는 곳으로 가고, 오른쪽 아래에서 일반지도와 위성지도를 바꿉니다.'],
];
const TILES = {
  normal: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap contributors', sub: 'abc' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles &copy; Esri', sub: '' },
};

export default function MapView({ onClose, className = '' }) {
  const router = useRouter();
  const store = useStore();
  const box = useRef(null);
  const L = useRef(null);
  const map = useRef(null);
  const tiles = useRef(null);
  const layer = useRef(null);
  const meDot = useRef(null);
  const sites = useRef([]);
  const streetRef = useRef(false);
  const [base, setBase] = useState('normal');
  const [shown, setShown] = useState(() => new Set(KINDS.map((k) => k.key)));
  const [inViewCount, setInViewCount] = useState(0);
  const [street, setStreet] = useState(false);
  const [guide, setGuide] = useState(false);
  const [note, setNote] = useState(null);
  const [ready, setReady] = useState(false);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  streetRef.current = street;

  // Create the map once.
  useEffect(() => {
    let alive = true;
    import('leaflet').then((mod) => {
      if (!alive || !box.current) return;
      const Lf = mod.default || mod;
      L.current = Lf;
      const m = Lf.map(box.current, { zoomControl: false, attributionControl: true }).setView([36.86, 127.6], 9);
      map.current = m;
      layer.current = Lf.layerGroup().addTo(m);
      m.on('moveend zoomend', () => draw());
      m.on('click', (e) => {
        if (streetRef.current) {
          window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`, '_blank', 'noopener');
        }
      });
      setReady(true);
    });
    return () => {
      alive = false;
      if (map.current) { map.current.remove(); map.current = null; }
      setState({ inView: null });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Base tiles.
  useEffect(() => {
    if (!ready) return;
    const t = TILES[base];
    if (tiles.current) tiles.current.remove();
    tiles.current = L.current.tileLayer(t.url, { attribution: t.attr, maxZoom: 19, subdomains: t.sub || 'abc' }).addTo(map.current);
  }, [base, ready]);

  // Which sites to show: what the open list matches, otherwise every site.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const apply = (rows) => { if (alive) { sites.current = rows; draw(); } };
    if (store.mapSites) apply(store.mapSites);
    else Promise.all([loadAll('sites'), loadAll('remodel')]).then(([a, b]) => apply([...a, ...b].filter((r) => r.stage !== '준공')));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mapSites, ready]);

  useEffect(() => { if (ready) draw(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [shown]);

  // Fly to a site picked in the list.
  useEffect(() => {
    if (!ready || !store.focus) return;
    const f = store.focus;
    map.current.flyTo([f.lat, f.lng], 15, { duration: 0.8 });
    setTimeout(() => openPopup(f), 900);
    setState({ focus: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.focus, ready]);

  useEffect(() => {
    if (map.current) setTimeout(() => map.current && map.current.invalidateSize(), 50);
  });

  function colorOf(r) {
    return (KINDS.find((k) => k.key === r.kindTag) || KINDS[0]).color;
  }

  function openPopup(r) {
    const Lf = L.current;
    const el = document.createElement('div');
    el.className = 'ohj-pop';
    const saved = savedSiteIds().has(r.id);
    el.innerHTML = `
      <p class="ohj-pop-t"></p><p class="ohj-pop-a"></p>
      <p class="ohj-pop-m"></p>
      <div class="ohj-pop-b"><button type="button" data-act="open">자세히</button><button type="button" data-act="save" class="${saved ? 'on' : ''}">${saved ? '담음' : '담기'}</button></div>`;
    el.querySelector('.ohj-pop-t').textContent = r.title;
    el.querySelector('.ohj-pop-a').textContent = r.address;
    el.querySelector('.ohj-pop-m').textContent = `${r.use} · 건축면적 ${Number(r.buildArea).toLocaleString('ko-KR')}m² · 허가 ${r.permitDate}${r.startDate ? ` · 착공 ${r.startDate}` : ' · 착공 전'}`;
    el.querySelector('[data-act=open]').addEventListener('click', () => {
      const base = r.id.startsWith('r') ? '/remodel' : '/sites';
      const here = window.location.pathname.replace(/\/$/, '');
      if (here === base) {
        const sp = new URLSearchParams(window.location.search);
        sp.set('open', r.id);
        router.replace(`${base}?${sp.toString()}`, { scroll: false });
      } else router.push(`${base}?sgg=${r.sgg}&open=${r.id}`);
    });
    const btn = el.querySelector('[data-act=save]');
    btn.addEventListener('click', () => {
      const on = toggleSite(r).has(r.id);
      btn.textContent = on ? '담음' : '담기';
      btn.className = on ? 'on' : '';
    });
    Lf.popup({ offset: [0, -4], maxWidth: 280 }).setLatLng([r.lat, r.lng]).setContent(el).openOn(map.current);
  }

  function draw() {
    const m = map.current;
    const Lf = L.current;
    if (!m || !Lf) return;
    layer.current.clearLayers();
    const bounds = m.getBounds();
    const visible = sites.current.filter((r) => shownRef.current.has(r.kindTag || '신축 현장') && bounds.contains([r.lat, r.lng]));
    setInViewCount(visible.length);
    setState({ inView: new Set(visible.map((r) => r.id)) });

    // Group nearby points on screen (60px cells) into numbered circles.
    const cell = 60;
    const cells = new Map();
    for (const r of visible) {
      const pt = m.latLngToContainerPoint([r.lat, r.lng]);
      const k = `${Math.floor(pt.x / cell)}:${Math.floor(pt.y / cell)}`;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(r);
    }
    const zoom = m.getZoom();
    for (const group of cells.values()) {
      if (group.length === 1 || zoom >= 16) {
        for (const r of group) {
          const mk = Lf.circleMarker([r.lat, r.lng], { radius: 7, color: '#fff', weight: 2, fillColor: colorOf(r), fillOpacity: 1 });
          mk.on('click', (e) => { Lf.DomEvent.stopPropagation(e); if (!streetRef.current) openPopup(r); });
          mk.bindTooltip(r.title, { direction: 'top', offset: [0, -6] });
          layer.current.addLayer(mk);
        }
      } else {
        const lat = group.reduce((s, r) => s + r.lat, 0) / group.length;
        const lng = group.reduce((s, r) => s + r.lng, 0) / group.length;
        const n = group.length;
        const size = n < 10 ? 34 : n < 100 ? 42 : 50;
        const icon = Lf.divIcon({
          className: '',
          html: `<div class="ohj-cluster" style="width:${size}px;height:${size}px">${n}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const mk = Lf.marker([lat, lng], { icon, keyboard: true, title: `현장 ${n}곳` });
        mk.on('click', () => {
          const b = Lf.latLngBounds(group.map((r) => [r.lat, r.lng]));
          m.flyToBounds(b.pad(0.3), { maxZoom: Math.min(zoom + 3, 17), duration: 0.6 });
        });
        layer.current.addLayer(mk);
      }
    }
  }

  function locate() {
    if (!navigator.geolocation) { flash('이 브라우저는 위치를 알려 주지 않습니다.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        map.current.flyTo(ll, 14, { duration: 0.8 });
        if (meDot.current) meDot.current.remove();
        meDot.current = L.current.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(map.current);
      },
      () => flash('위치 권한이 없어 내 위치를 찾지 못했습니다.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function flash(t) {
    setNote(t);
    setTimeout(() => setNote(null), 2600);
  }

  const toggleKind = (k) => {
    const n = new Set(shown);
    if (n.has(k)) n.delete(k); else n.add(k);
    setShown(n);
  };

  const btn = 'flex h-[34px] items-center gap-1.5 rounded-[8px] border-2 border-brand-deep bg-white px-2.5 text-sub font-semibold text-brand-deep shadow-sm hover:bg-brand-soft';

  return (
    <div className={`relative overflow-hidden rounded-[10.625px] border border-line bg-[#eef0f2] ${className}`}>
      <div ref={box} className={`absolute inset-0 ${street ? 'cursor-crosshair' : ''}`} aria-label="현장 지도" role="region" />

      <div className="pointer-events-none absolute left-2 top-2 z-[500] flex max-w-[calc(100%-180px)] flex-col items-start gap-1">
        <p className="pointer-events-auto rounded-full bg-white/95 px-2.5 py-1 text-[12.75px] text-ink-2 shadow-sm">
          지금 볼 현장 <strong className="tabular">{inViewCount.toLocaleString('ko-KR')}</strong>곳 · 화면 내 현장 검색 중
        </p>
        <div className="pointer-events-auto flex flex-wrap gap-1 rounded-full bg-white/95 px-2 py-1 shadow-sm">
          {KINDS.map((k) => (
            <button key={k.key} type="button" aria-pressed={shown.has(k.key)} onClick={() => toggleKind(k.key)} className={`flex items-center gap-1 text-[12.75px] ${shown.has(k.key) ? 'text-ink-2' : 'text-ink-4 line-through'}`}>
              <span className="size-3 rounded-full" style={{ background: shown.has(k.key) ? k.color : '#d4d4d4' }} />
              {k.key}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute right-2 top-2 z-[500] flex flex-col items-end gap-2">
        <button type="button" onClick={() => setGuide(true)} className="flex h-[30px] items-center gap-1 rounded-full border border-line bg-white px-3 text-sub text-ink-2 shadow-sm hover:bg-surface">
          이용 가이드
        </button>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => { setStreet((s) => !s); if (!street) flash('지도를 누르면 그 자리 거리뷰를 새 창으로 엽니다.'); }} aria-pressed={street} className={`${btn} ${street ? '!bg-brand-deep !text-white' : ''}`}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2.5" /><path d="M9.5 9h5l-.8 6h-1.2l-.5 6h-1l-.5-6H9.3z" /></svg>
            거리뷰
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className={btn}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 12h12M12 7l5 5-5 5M20 5v14" /></svg>
              지도 닫기
            </button>
          )}
        </div>
      </div>

      <button type="button" onClick={locate} className={`absolute bottom-6 left-2 z-[500] ${btn}`}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
        내 위치
      </button>

      <div className="absolute bottom-6 right-2 z-[500] flex gap-1.5">
        {[['normal', '일반지도', 'linear-gradient(135deg,#f3f1ea,#dfe9d8 50%,#cfe0f0)'], ['satellite', '위성지도', 'linear-gradient(135deg,#2d3b2a,#4d5b3a 50%,#1f2d3a)']].map(([k, label, bg]) => (
          <button key={k} type="button" onClick={() => setBase(k)} aria-pressed={base === k} className={`flex w-[62px] flex-col overflow-hidden rounded-[8px] border-2 bg-white text-[12px] shadow-sm ${base === k ? 'border-brand-deep text-brand-deep' : 'border-white text-ink-2'}`}>
            <span className="h-[34px] w-full" style={{ background: bg }} />
            <span className="py-0.5">{label}</span>
          </button>
        ))}
      </div>

      {note && <p role="status" className="absolute bottom-20 left-1/2 z-[600] -translate-x-1/2 rounded-full bg-ink-1/90 px-3 py-1.5 text-[12.75px] text-white">{note}</p>}
      {guide && <GuideDialog steps={MAP_GUIDE} onClose={() => setGuide(false)} />}
    </div>
  );
}
