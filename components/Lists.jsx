'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DataList from './DataList';
import { Field, StageBadge, fmtDate, fmtNum, fmtWon } from './ui';
import { related } from '@/lib/api';

const USES = ['단독주택', '공동주택', '제1종근린생활시설', '제2종근린생활시설', '공장', '창고시설', '업무시설', '노유자시설', '동물및식물관련시설'];
const SITE_SORTS = [
  { value: 'permitDate.desc', label: '최근 허가순' },
  { value: 'startDate.asc', label: '착공일 빠른순' },
  { value: 'grossArea.desc', label: '연면적 큰순' },
  { value: 'grossArea.asc', label: '연면적 작은순' },
];

function SiteDetail(r, { saved, onSave }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <StageBadge stage={r.stage} />
        <span className="text-sub text-ink-3">{r.region}</span>
      </div>
      <button
        type="button"
        onClick={onSave}
        aria-pressed={saved}
        className={`flex h-[42px] items-center justify-center gap-1.5 rounded-[10px] text-sub font-semibold ${saved ? 'border border-brand-deep bg-brand-soft text-brand-deep' : 'bg-brand-deep text-white hover:bg-brand'}`}
      >
        {saved ? '영업 현황에 담김 ✓' : '영업 현황에 담기'}
      </button>
      <dl>
        <Field label="주소">{r.address}</Field>
        <Field label="공사 구분">{r.work}</Field>
        <Field label="주용도">{r.use}</Field>
        <Field label="구조">{r.structure}</Field>
        <Field label="규모">지상 {r.floors}층{r.basement ? ` · 지하 ${r.basement}층` : ''}{r.households ? ` · ${r.households}세대` : ''}</Field>
        <Field label="대지면적"><span className="tabular">{fmtNum(r.siteArea)}㎡</span></Field>
        <Field label="연면적"><span className="tabular">{fmtNum(r.grossArea)}㎡</span></Field>
        <Field label="허가일"><span className="tabular">{fmtDate(r.permitDate)}</span></Field>
        <Field label={r.stage === '허가' ? '착공 예정일' : '착공일'}><span className="tabular">{fmtDate(r.startDate)}</span></Field>
        <Field label="건축주">{r.owner}</Field>
        <Field label="설계">{r.designer ? <Link className="text-brand-deep hover:underline" href={`/designers?sgg=${r.sgg}&open=${r.designerId}`}>{r.designer}</Link> : '—'}</Field>
        <Field label="시공">{r.company ? <Link className="text-brand-deep hover:underline" href={`/companies?sgg=${r.sgg}&open=${r.companyId}`}>{r.company}</Link> : '미정'}</Field>
      </dl>
      <p className="rounded bg-surface px-3 py-2 text-[12.75px] text-ink-4">예시 데이터입니다. 실제 인허가 정보가 아닙니다.</p>
    </div>
  );
}

function siteColumns() {
  return [
    {
      key: 'title', label: '현장', render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink-1">{r.title}</p>
          <p className="mt-0.5 text-[12.75px] text-ink-4">{r.address}</p>
        </div>
      ),
    },
    { key: 'use', label: '용도', width: 150 },
    { key: 'grossArea', label: '연면적(㎡)', align: 'right', width: 110, render: (r) => fmtNum(r.grossArea) },
    { key: 'floors', label: '층수', align: 'right', width: 64, render: (r) => `${r.floors}F` },
    { key: 'stage', label: '단계', width: 88, render: (r) => <StageBadge stage={r.stage} /> },
    { key: 'permitDate', label: '허가일', width: 104, render: (r) => <span className="tabular">{fmtDate(r.permitDate)}</span> },
    { key: 'startDate', label: '착공(예정)', width: 104, render: (r) => <span className="tabular">{fmtDate(r.startDate)}</span> },
    { key: 'company', label: '시공', width: 150, render: (r) => r.company || <span className="text-ink-4">미정</span> },
  ];
}

const siteMeta = (r) => (
  <>
    <StageBadge stage={r.stage} />
    <span>{r.use}</span>
    <span className="tabular">{fmtNum(r.grossArea)}㎡</span>
    <span className="tabular">허가 {fmtDate(r.permitDate)}</span>
    <span className="w-full truncate text-ink-4">{r.address}</span>
  </>
);

export function SitesList() {
  return (
    <DataList
      table="sites"
      title="신축 현장"
      sub="건축 인허가가 난 신축 현장을 지역별로 모아 봅니다"
      unit="개 현장"
      columns={siteColumns()}
      chips={{ key: 'stage', options: ['허가', '착공', '사용승인'] }}
      selects={[{ key: 'use', label: '용도', options: USES }]}
      sorts={SITE_SORTS}
      searchFields={['title', 'address', 'owner', 'designer', 'company']}
      searchPlaceholder="현장명, 주소, 업체명 검색"
      cardTitle={(r) => r.title}
      cardMeta={siteMeta}
      detail={SiteDetail}
      saveable
    />
  );
}

export function RemodelList() {
  return (
    <DataList
      table="remodel"
      title="리모델링 현장"
      sub="대수선 · 증축 · 용도변경 현장을 지역별로 모아 봅니다"
      unit="개 현장"
      columns={siteColumns().map((c) => (c.key === 'use' ? { ...c, label: '용도 · 구분', render: (r) => <span>{r.use}<span className="ml-1 text-ink-4">· {r.work}</span></span> } : c))}
      chips={{ key: 'work', options: ['대수선', '증축', '용도변경', '리모델링', '개축'] }}
      selects={[{ key: 'use', label: '용도', options: USES }]}
      sorts={SITE_SORTS}
      searchFields={['title', 'address', 'owner', 'designer', 'company']}
      searchPlaceholder="현장명, 주소, 업체명 검색"
      cardTitle={(r) => r.title}
      cardMeta={siteMeta}
      detail={SiteDetail}
      saveable
    />
  );
}

function RelatedSites({ field, id }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { related('sites', field, id).then(setRows); }, [field, id]);
  if (!rows) return <p className="text-sub text-ink-4">불러오는 중…</p>;
  if (!rows.length) return <p className="text-sub text-ink-4">연결된 현장이 없습니다.</p>;
  return (
    <ul className="flex flex-col divide-y divide-line rounded-[10.625px] border border-line">
      {rows.map((s) => (
        <li key={s.id}>
          <Link href={`/sites?sgg=${s.sgg}&open=${s.id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sub hover:bg-surface">
            <span className="min-w-0 truncate text-ink-1">{s.title}</span>
            <StageBadge stage={s.stage} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DesignersList() {
  return (
    <DataList
      table="designers"
      title="설계사무소 DB"
      sub="지역별 설계사무소와 최근 설계 현장"
      unit="곳"
      columns={[
        { key: 'name', label: '사무소', render: (r) => <span className="font-semibold text-ink-1">{r.name}</span> },
        { key: 'ceo', label: '대표', width: 90 },
        { key: 'region', label: '지역', width: 130 },
        { key: 'specialty', label: '주력', width: 110 },
        { key: 'projects', label: '최근 1년 설계', align: 'right', width: 120, render: (r) => `${r.projects}건` },
        { key: 'recent', label: '최근 허가', width: 110, render: (r) => <span className="tabular">{fmtDate(r.recent)}</span> },
        { key: 'phone', label: '연락처', width: 130, render: (r) => <span className="tabular">{r.phone}</span> },
      ]}
      chips={{ key: 'specialty', options: ['주거', '근린생활', '공장·창고', '공공', '복합'] }}
      sorts={[
        { value: 'projects.desc', label: '설계 많은순' },
        { value: 'recent.desc', label: '최근 허가순' },
        { value: 'name.asc', label: '이름순' },
      ]}
      searchFields={['name', 'ceo', 'region']}
      searchPlaceholder="사무소명, 대표자 검색"
      cardTitle={(r) => r.name}
      cardMeta={(r) => (
        <>
          <span>{r.region}</span>
          <span>{r.specialty}</span>
          <span>최근 1년 {r.projects}건</span>
        </>
      )}
      detail={(r) => (
        <div className="flex flex-col gap-5">
          <dl>
            <Field label="대표">{r.ceo}</Field>
            <Field label="지역">{r.region}</Field>
            <Field label="주력 분야">{r.specialty}</Field>
            <Field label="최근 1년 설계">{r.projects}건</Field>
            <Field label="최근 허가">{fmtDate(r.recent)}</Field>
            <Field label="연락처">{r.phone}</Field>
          </dl>
          <div>
            <h3 className="mb-2 text-sub font-semibold text-ink-1">설계한 신축 현장</h3>
            <RelatedSites field="designerId" id={r.id} />
          </div>
        </div>
      )}
    />
  );
}

const CREDIT_TONE = (c) => (c.startsWith('A') ? 'text-ok' : c.startsWith('BBB') ? 'text-info' : 'text-danger');

export function CompaniesList() {
  return (
    <DataList
      table="companies"
      title="건설업체 DB"
      sub="시공사 면허 · 시공능력 · 신용등급을 한눈에"
      unit="곳"
      columns={[
        { key: 'name', label: '업체', render: (r) => <span className="font-semibold text-ink-1">{r.name}</span> },
        { key: 'kind', label: '구분', width: 90 },
        { key: 'license', label: '면허', width: 190 },
        { key: 'region', label: '지역', width: 120 },
        { key: 'capacity', label: '시공능력평가액', align: 'right', width: 130, render: (r) => fmtWon(r.capacity) },
        { key: 'credit', label: '신용등급', width: 90, render: (r) => <span className={`font-semibold ${CREDIT_TONE(r.credit)}`}>{r.credit}</span> },
        { key: 'sites', label: '진행 현장', align: 'right', width: 90, render: (r) => `${r.sites}곳` },
      ]}
      chips={{ key: 'kind', options: ['종합건설', '전문건설'] }}
      sorts={[
        { value: 'capacity.desc', label: '시공능력 큰순' },
        { value: 'sites.desc', label: '진행 현장 많은순' },
        { value: 'name.asc', label: '이름순' },
      ]}
      searchFields={['name', 'ceo', 'license', 'region']}
      searchPlaceholder="업체명, 면허 검색"
      cardTitle={(r) => r.name}
      cardMeta={(r) => (
        <>
          <span>{r.kind}</span>
          <span>{r.region}</span>
          <span className={`font-semibold ${CREDIT_TONE(r.credit)}`}>{r.credit}</span>
          <span>{fmtWon(r.capacity)}</span>
        </>
      )}
      detail={(r) => (
        <div className="flex flex-col gap-5">
          <dl>
            <Field label="대표">{r.ceo}</Field>
            <Field label="구분">{r.kind}</Field>
            <Field label="면허">{r.license}</Field>
            <Field label="지역">{r.region}</Field>
            <Field label="시공능력">{fmtWon(r.capacity)}</Field>
            <Field label="신용등급"><span className={`font-semibold ${CREDIT_TONE(r.credit)}`}>{r.credit}</span></Field>
            <Field label="진행 현장">{r.sites}곳</Field>
            <Field label="연락처">{r.phone}</Field>
          </dl>
          <div>
            <h3 className="mb-2 text-sub font-semibold text-ink-1">시공 중인 신축 현장</h3>
            <RelatedSites field="companyId" id={r.id} />
          </div>
        </div>
      )}
    />
  );
}
