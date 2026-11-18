// Placeholder lockup (the original's logo artwork is not copied). One 167×36 picture, like the original's.
const MARK = (
  <>
    <rect x="2" y="2" width="24" height="24" rx="6" fill="none" stroke="#171717" strokeWidth="2.4" />
    <rect x="15" y="6" width="6" height="6" rx="1" fill="#e4572e" />
    <path d="M6 18c4-1 7-4 9-9" fill="none" stroke="#171717" strokeWidth="2.2" strokeLinecap="round" />
  </>
);

export default function Logo({ small = false }) {
  if (small) {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        {MARK}
      </svg>
    );
  }
  return (
    <svg width="167" height="36" viewBox="0 0 167 36" role="img" aria-label="현장노트">
      <g transform="translate(0 4)">{MARK}</g>
      <text x="38" y="24" fontFamily="'Pretendard Variable', Pretendard, system-ui, sans-serif" fontSize="17.5" fontWeight="700" letterSpacing="-0.4" fill="#171717">
        현장노트
      </text>
      <text x="111" y="24" fontFamily="'Pretendard Variable', Pretendard, system-ui, sans-serif" fontSize="11" fontWeight="600" fill="#737373">
        sample
      </text>
    </svg>
  );
}
