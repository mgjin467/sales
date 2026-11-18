// 시도 → 시군구 (4-digit codes, the same shape the original's ?sgg= filter uses), with a rough centre for the map.
export const SIDO = [
  {
    code: '11', name: '서울특별시', short: '서울',
    sgg: [
      { code: '1111', name: '종로구', c: [37.573, 126.979] }, { code: '1121', name: '광진구', c: [37.538, 127.082] },
      { code: '1150', name: '강서구', c: [37.551, 126.849] }, { code: '1165', name: '서초구', c: [37.483, 127.032] },
      { code: '1168', name: '강남구', c: [37.517, 127.047] }, { code: '1171', name: '송파구', c: [37.514, 127.106] },
    ],
  },
  {
    code: '26', name: '부산광역시', short: '부산',
    sgg: [
      { code: '2635', name: '해운대구', c: [35.163, 129.163] }, { code: '2641', name: '금정구', c: [35.243, 129.092] },
      { code: '2671', name: '기장군', c: [35.244, 129.222] },
    ],
  },
  {
    code: '41', name: '경기도', short: '경기',
    sgg: [
      { code: '4113', name: '성남시', c: [37.42, 127.126] }, { code: '4117', name: '안양시', c: [37.394, 126.957] },
      { code: '4146', name: '용인시', c: [37.241, 127.178] }, { code: '4148', name: '파주시', c: [37.76, 126.78] },
      { code: '4159', name: '화성시', c: [37.2, 126.83] }, { code: '4161', name: '광주시', c: [37.429, 127.255] },
      { code: '4183', name: '양평군', c: [37.491, 127.487] },
    ],
  },
  {
    code: '43', name: '충청북도', short: '충북',
    sgg: [
      { code: '4311', name: '청주시', c: [36.642, 127.489] }, { code: '4313', name: '충주시', c: [36.991, 127.926] },
      { code: '4315', name: '제천시', c: [37.132, 128.191] }, { code: '4374', name: '증평군', c: [36.785, 127.581] },
      { code: '4375', name: '진천군', c: [36.855, 127.436] }, { code: '4376', name: '괴산군', c: [36.815, 127.787] },
      { code: '4377', name: '음성군', c: [36.94, 127.69] }, { code: '4378', name: '단양군', c: [36.985, 128.366] },
    ],
  },
  {
    code: '44', name: '충청남도', short: '충남',
    sgg: [
      { code: '4413', name: '천안시', c: [36.815, 127.114] }, { code: '4420', name: '아산시', c: [36.79, 127.002] },
      { code: '4423', name: '논산시', c: [36.187, 127.099] }, { code: '4481', name: '예산군', c: [36.682, 126.845] },
    ],
  },
  {
    code: '31', name: '울산광역시', short: '울산',
    sgg: [{ code: '3171', name: '울주군', c: [35.522, 129.242] }],
  },
  {
    code: '50', name: '제주특별자치도', short: '제주',
    sgg: [{ code: '5011', name: '제주시', c: [33.5, 126.531] }, { code: '5013', name: '서귀포시', c: [33.254, 126.56] }],
  },
];

export const ALL_SGG = SIDO.flatMap((s) => s.sgg.map((g) => ({ ...g, sido: s.code, sidoName: s.name, sidoShort: s.short })));

export function findSgg(code) {
  return ALL_SGG.find((g) => g.code === code) || null;
}

export function sidoOf(sggCode) {
  if (!sggCode) return null;
  return SIDO.find((s) => s.code === String(sggCode).slice(0, 2)) || null;
}

// "진천군 외 3곳" style label for a list of 시군구 codes.
export function regionLabel(codes) {
  if (!codes || codes.length === 0) return '전국';
  const first = findSgg(codes[0]);
  const name = first ? first.name : codes[0];
  return codes.length === 1 ? name : `${name} 외 ${codes.length - 1}곳`;
}
