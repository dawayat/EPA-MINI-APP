/**
 * Supabase REST helper using SUPABASE_SERVICE_ROLE_KEY (server-side only).
 * The service role key bypasses all RLS policies.
 * Uses plain HTTPS on port 443 - no SSL cert issues.
 */

// Support multiple possible env var names for Supabase URL
function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  );
}

// Service role key has full DB access, bypasses RLS
function getServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}

export function supabaseHeaders() {
  const key = getServiceKey();
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };
}

export function supabaseUrl(table, query = '') {
  const base = getSupabaseUrl();
  return `${base}/rest/v1/${table}${query ? `?${query}` : ''}`;
}

export async function dbSelect(table, query = '') {
  const res = await fetch(supabaseUrl(table, query), {
    headers: { ...supabaseHeaders(), 'Prefer': 'return=representation' }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB SELECT ${table} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function dbInsert(table, row) {
  const res = await fetch(supabaseUrl(table), {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(row)
  });
  if (!res.ok && res.status !== 201) {
    const text = await res.text();
    throw new Error(`DB INSERT ${table} failed (${res.status}): ${text}`);
  }
  return true;
}

export async function dbUpsert(table, row, onConflict) {
  const res = await fetch(supabaseUrl(table, `on_conflict=${onConflict}`), {
    method: 'POST',
    headers: { ...supabaseHeaders(), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row)
  });
  if (!res.ok && res.status !== 201) {
    const text = await res.text();
    throw new Error(`DB UPSERT ${table} failed (${res.status}): ${text}`);
  }
  return true;
}

export async function dbUpdate(table, row, matchColumn, matchValue) {
  const res = await fetch(supabaseUrl(table, `${matchColumn}=eq.${matchValue}`), {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB UPDATE ${table} failed (${res.status}): ${text}`);
  }
  return true;
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Cache data which is intentionally public at Vercel's edge. This prevents a
 * cache revalidation from invoking the function and, more importantly, from
 * issuing another full PostgREST query to Supabase.
 */
export function cachePublic(res, seconds, staleSeconds = 86_400) {
  const value = `public, max-age=60, s-maxage=${seconds}, stale-while-revalidate=${staleSeconds}`;
  res.setHeader('Cache-Control', value);
  // Vercel consumes this header at its CDN and does not pass it to browsers.
  res.setHeader('Vercel-CDN-Cache-Control', value);
}

/** Keep private/admin responses out of shared CDN and browser caches. */
export function noStore(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
}
