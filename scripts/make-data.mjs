// Generates the sample data the pages fetch (public/data/*.json).
// The real site reads its data from a private database; these are made-up records with the same shape.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_SGG } from '../lib/regions.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'data');
mkdirSync(out, { recursive: true });

let seed = 20261118;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pad = (n) => String(n).padStart(2, '0');
const TODAY = Date.UTC(2026, 10, 18);
const dateAt = (days) => {
  const d = new Date(TODAY + days * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const DONG = ['읍내리', '신정리', '상계리', '중앙동', '송정리', '덕산리', '문백리', '이월리', '광혜원리', '초평리', '월곡리', '오향리', '사곡리', '역동', '삼동리', '대소리', '금왕리', '백곡리', '사석리', '평곡리'];
const TOWN = ['읍', '면', '면', '동'];
const USE = [
  ['단독주택', 0.17], ['제1종근린생활시설', 0.15], ['제2종근린생활시설', 0.14], ['공동주택', 0.1],
  ['공장', 0.12], ['창고시설', 0.12], ['판매시설', 0.05], ['업무시설', 0.04], ['노유자시설', 0.03],
  ['자원순환관련시설', 0.04], ['동물및식물관련시설', 0.04],
];
const STRUCT = ['철근콘크리트구조', '일반철골구조', '경량철골구조', '목구조', '조적구조'];
const SURN = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황'];
const DESIGN_A = ['한빛', '도담', '바른', '새길', '온누리', '이음', '푸른', '다솜', '해든', '가온', '누리', '미래', '공간', '하늘', '세움', '단성', '연원'];
const BUILD_A = ['대성', '한결', '동진', '태영', '우림', '삼보', '신화', '보람', '성원', '청우', '금강', '대림', '한울', '동양', '세진', '혜성'];

function useOf() {
  let r = rnd();
  for (const [u, w] of USE) { if ((r -= w) <= 0) return u; }
  return USE[0][0];
}

const designers = [];
const companies = [];
let did = 1;
let cid = 1;
for (const g of ALL_SGG) {
  for (let i = 0; i < int(3, 6); i++) {
    designers.push({
      id: `d${did++}`, name: `${pick(DESIGN_A)}${pick(['', '종합', ''])}건축사사무소`, ceo: `${pick(SURN)}○○`, sgg: g.code, region: `${g.sidoShort} ${g.name}`,
      phone: `0${int(2, 63)}-${int(200, 999)}-****`, projects: int(2, 48), recent: dateAt(-int(3, 200)),
      specialty: pick(['주거', '근린생활', '공장·창고', '공공', '복합']),
    });
  }
  for (let i = 0; i < int(3, 6); i++) {
    const kind = pick(['종합건설', '전문건설', '종합건설']);
    companies.push({
      id: `c${cid++}`, name: `(주)${pick(BUILD_A)}${pick(['건설', '종합건설', '산업개발', '이앤씨', '건업'])}`, ceo: `${pick(SURN)}○○`,
      sgg: g.code, region: `${g.sidoShort} ${g.name}`, kind,
      license: kind === '종합건설' ? pick(['건축공사업', '토목건축공사업']) : pick(['실내건축공사업', '철근·콘크리트공사업', '금속창호·지붕건축물조립공사업']),
      capacity: int(8, 950) * 100000000, sites: int(1, 30), credit: pick(['A+', 'A', 'A-', 'BBB+', 'BBB', 'BB+', 'BB', 'B']),
      phone: `0${int(2, 63)}-${int(200, 999)}-****`,
    });
  }
}

function makeSites(kind) {
  const list = [];
  let id = 1;
  for (const g of ALL_SGG) {
    const n = g.code === '4375' ? 57 : int(14, 64);
    const ds = designers.filter((d) => d.sgg === g.code);
    const cs = companies.filter((c) => c.sgg === g.code);
    for (let i = 0; i < n; i++) {
      const use = useOf();
      const dong = pick(DONG);
      const town = `${pick(['감곡', '이월', '음성', '진천', '덕산', '문백', '초평', '백곡', '금왕', '대소', '삼성', '맹동'])}${pick(TOWN)}`;
      const floors = rnd() < 0.18 ? null : use === '공동주택' ? int(4, 15) : use === '단독주택' ? int(1, 3) : int(1, 5);
      const site = int(180, use === '공장' || use === '창고시설' ? 9000 : 1800);
      const buildArea = Math.round(site * (0.08 + rnd() * 0.5) * 100) / 100;
      const gfa = Math.round(buildArea * (floors || 1) * (0.8 + rnd() * 0.3) * 100) / 100;
      const permitDays = -int(2, 900);
      const started = rnd() < 0.55;
      const startDays = started ? Math.min(-1, permitDays + int(20, 200)) : null;
      const completeDays = permitDays + int(240, 900);
      const done = completeDays < 0 && started && rnd() < 0.7;
      const stage = done ? '준공' : started ? '착공' : '허가';
      const designer = pick(ds);
      const company = !started && rnd() < 0.5 ? null : pick(cs);
      const supervisor = rnd() < 0.35 ? null : pick(ds);
      const work = kind === 'remodel' ? pick(['대수선', '증축', '용도변경', '리모델링', '개축']) : '신축';
      const kindTag = use === '공동주택' ? (floors && floors >= 6 ? '아파트' : '빌라') : '신축 현장';
      const named = rnd() < 0.12;
      list.push({
        id: `${kind === 'remodel' ? 'r' : 's'}${String(id++).padStart(5, '0')}`,
        sgg: g.code,
        region: `${g.sidoShort} ${g.name}`,
        title: named ? `(주)${pick(BUILD_A)}${pick(['마트', '물류센터', '타워', '빌딩'])}${dong.replace(/(리|동)$/, '')}점` : `${town} ${dong} ${use.replace(/^제\d종/, '')} ${work}`,
        address: `${g.sidoName} ${g.name} ${town} ${dong} ${int(1, 999)}${rnd() < 0.6 ? `-${int(1, 40)}` : ''}`,
        use, work, kindTag, structure: pick(STRUCT), floors, basement: rnd() < 0.2 ? 1 : 0,
        siteArea: site, buildArea, grossArea: gfa, households: use === '공동주택' ? int(8, 120) : null,
        stage, permitDate: dateAt(permitDays), startDate: startDays == null ? null : dateAt(startDays),
        completeDate: dateAt(completeDays), completePlanned: completeDays > 0 || !done,
        owner: rnd() < 0.35 ? `(주)${pick(BUILD_A)}${pick(['개발', '산업', '홀딩스'])}` : `${pick(SURN)}○○`,
        designerId: designer ? designer.id : null, designer: designer ? designer.name : null,
        companyId: company ? company.id : null, company: company ? company.name : null,
        supervisor: supervisor ? supervisor.name : null,
        lat: Math.round((g.c[0] + (rnd() - 0.5) * 0.16) * 100000) / 100000,
        lng: Math.round((g.c[1] + (rnd() - 0.5) * 0.2) * 100000) / 100000,
      });
    }
  }
  list.sort((a, b) => (a.permitDate < b.permitDate ? 1 : -1));
  return list;
}

// "인기 개발 지역" and "한눈에 보는 착공" — made-up statistics with the same shape as the original's cards.
const stats = {
  updated: '2026.11.18',
  ranking: {
    title: '2026년 9월 착공한 현장 수 · 전월 대비 순위',
    rows: [
      { region: '경기 화성시', count: 74, move: 2 },
      { region: '충북 청주시', count: 73, move: 0 },
      { region: '울산 울주군', count: 62, move: -2 },
      { region: '경기 양평군', count: 57, move: 0 },
      { region: '충남 예산군', count: 53, move: 52 },
      { region: '경기 용인시', count: 50, move: -1 },
    ],
  },
  starts: {
    label: '2026년 9월 건축착공 · 잠정치',
    value: 7413,
    yoy: -20.8,
    unit: '동',
    month: 9,
    thisYear: [5600, 5500, 8000, 8600, 7100, 7700, 7300, 6600, 7413],
    lastYear: [5300, 6400, 8100, 9300, 8000, 8100, 8000, 7200, 8800, 7000, 7900, 8050],
    lastYearAvg: 7680,
  },
};

const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data));
write('sites.json', makeSites('new'));
write('remodel.json', makeSites('remodel'));
write('designers.json', designers);
write('companies.json', companies);
write('stats.json', stats);
console.log('sample data written to public/data');
