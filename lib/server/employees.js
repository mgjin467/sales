// Employee directory check against BigQuery (same table and rules as esigntech's bigQueryService.fetchEmployees),
// run on the server so the service-account key never reaches the browser.
import { SignJWT, importPKCS8 } from 'jose';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
let cached = { token: null, exp: 0 };

function serviceAccount() {
  const raw = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GCP_SERVICE_ACCOUNT_JSON 환경 변수가 없습니다.');
  let key;
  try {
    key = JSON.parse(raw);
  } catch {
    // Allow base64-encoded JSON as well.
    key = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  }
  if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, '\n');
  return key;
}

async function accessToken() {
  if (cached.token && Date.now() < cached.exp - 5 * 60 * 1000) return cached.token;
  const key = serviceAccount();
  const pk = await importPKCS8(key.private_key, 'RS256');
  // Drive scope is needed because 직원명부 can be a Google Sheets–linked table (same scopes as esigntech).
  const scope = 'https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/drive.readonly';
  const assertion = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(key.client_email)
    .setSubject(key.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(pk);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token Exchange Failed: ${data.error_description || data.error}`);
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cached.token;
}

async function runQuery(sql, projectId, location) {
  const token = await accessToken();
  const res = await fetch(`https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, useLegacySql: false, useQueryCache: false, location, timeoutMs: 20000 }),
  });
  let data = await res.json();
  if (!res.ok) throw new Error(`SQL Error: ${data.error?.message}`);
  while (!data.jobComplete && data.jobReference?.jobId) {
    await new Promise((r) => setTimeout(r, 1000));
    const r2 = await fetch(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries/${data.jobReference.jobId}?location=${data.jobReference.location || location}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    data = await r2.json();
    if (!r2.ok) throw new Error(`SQL Error during polling: ${data.error?.message}`);
  }
  if (data.errors?.length) throw new Error(`BigQuery Error: ${data.errors[0].message}`);
  if (!data.rows) return [];
  const fields = data.schema.fields.map((f) => f.name);
  return data.rows.map((row) => Object.fromEntries(row.f.map((c, i) => [fields[i], c.v])));
}

// Same matching as esigntech's isSameUser: full emails must match exactly; an ID without "@" matches the email's local part.
export function isSameUser(a, b) {
  if (!a || !b) return false;
  const n1 = String(a).toLowerCase().trim();
  const n2 = String(b).toLowerCase().trim();
  if (n1 === n2) return true;
  const e1 = n1.includes('@');
  const e2 = n2.includes('@');
  if (e1 && e2) return false;
  const id1 = n1.split('@')[0];
  const id2 = n2.split('@')[0];
  if (e1 && !e2) return id1 === n2;
  if (!e1 && e2) return n1 === id2;
  return id1 === id2;
}

function isActiveRow(row) {
  const empty = ['department', 'job_title', 'full_name', 'gmail'].every((k) => !(row[k] && String(row[k]).trim() !== ''));
  if (empty) return false;
  if (!('is_active' in row)) return true; // column missing → treat as active
  if (row.is_active === null || row.is_active === undefined) return false;
  const v = String(row.is_active).toUpperCase().trim();
  return v === 'O' || v === 'Y' || v === 'TRUE' || v === '1';
}

const ident = (s) => String(s).replace(/`/g, '');

// Returns the active employee row matching this email, or null. Throws if BigQuery can't be read.
export async function findEmployee(email) {
  const key = serviceAccount();
  const projectId = process.env.BQ_PROJECT_ID || key.project_id;
  const dataset = process.env.BQ_EMP_DATASET || 'management';
  const table = process.env.BQ_EMP_TABLE || '직원명부';
  const location = process.env.BQ_LOCATION || 'asia-northeast3';
  const sql = `/* ${Date.now()} */ SELECT * FROM \`${ident(projectId)}.${ident(dataset)}.${ident(table)}\``;
  const rows = await runQuery(sql, projectId, location);
  return rows.find((r) => isActiveRow(r) && isSameUser(r.gmail, email)) || null;
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || 'seogangrc@seogangrc.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
