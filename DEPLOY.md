# 로그인 / Vercel 배포 안내

## 로그인 방식 (esigntech와 동일)
1. 접속하면 로그인 화면이 먼저 나옵니다 (이용약관·개인정보처리방침·환불정책만 예외).
2. **Google 계정으로 로그인** (Firebase, esigntech와 같은 Firebase 프로젝트).
3. 서버(`/api/auth/login`)가 확인:
   - `ADMIN_EMAILS`에 있는 계정 → **관리자**로 로그인 (직원명부에 없어도 됨)
   - BigQuery `seogang.management.직원명부`의 `gmail` 열에 이메일 또는 ID(@ 앞부분)가 있고 `is_active`가 O/Y/TRUE/1 → **직원**으로 로그인
   - 그 외 → "직원 명부에 등록된 계정이 아닙니다."
4. 로그인 유지 시간은 기본 1시간 (esigntech와 동일, `SESSION_HOURS`로 변경). 끝나면 로그인 화면으로 돌아갑니다.
5. 로그인하지 않으면 `/data/*.json` 데이터도 받을 수 없습니다 (401).

서비스 계정 키는 서버(Vercel 환경 변수)에만 있고 브라우저로 내려가지 않습니다.

## Vercel 배포
1. 압축을 푼 폴더 내용을 GitHub 저장소 최상위에 올린 뒤, Vercel에서 **Add New → Project → 그 저장소 Import** 합니다.
   (Framework: Next.js 자동 인식, Root Directory·Build Command는 기본값 그대로)
2. Vercel → Settings → **Environment Variables** 에 넣습니다. 필수:
   - `SESSION_SECRET` : 긴 임의 문자열
   - `GCP_SERVICE_ACCOUNT_JSON` : BigQuery 서비스 계정 키 JSON 한 줄 (또는 base64)
   - `ADMIN_EMAILS` : 관리자 이메일 (쉼표로 여러 개, 기본값 seogangrc@seogangrc.com)

   선택 (기본값 그대로면 안 넣어도 됨): `BQ_PROJECT_ID`(seogang), `BQ_EMP_DATASET`(management),
   `BQ_EMP_TABLE`(직원명부), `BQ_LOCATION`(asia-northeast3), `SESSION_HOURS`(1),
   `NEXT_PUBLIC_FIREBASE_*`(esigntech와 같은 Firebase 프로젝트)

   현장 샘플 데이터(`public/data/*.json`)는 저장소에 없어도 됩니다. `npm run build` 때 자동으로 만들어집니다.
3. **Firebase 콘솔 → Authentication → Settings → 승인된 도메인**에 배포 도메인(예: `ohyunjang.vercel.app`, 커스텀 도메인)을 추가합니다. 안 하면 Google 로그인 팝업에서 `auth/unauthorized-domain` 오류가 납니다.
4. 서비스 계정에 BigQuery 조회 권한 + 직원명부가 연결된 Google 시트 보기 권한이 있어야 합니다 (현재 키는 확인됨).

## 로컬 실행
```
npm install
npm run build
npm run start
```
`.env.local`(git 제외)에 환경 변수가 들어 있습니다.
