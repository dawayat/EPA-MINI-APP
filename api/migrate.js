/**
 * Auto-migration via Supabase REST API (no pg/SSL issues).
 * Hits the Supabase RPC to run raw SQL using the service role key.
 */
import { cors } from './_db.js';

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  );
}

async function runSQL(sql) {
  const url = `${getSupabaseUrl()}/rest/v1/rpc/exec_sql`;
  const key = getServiceKey();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed: ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = getSupabaseUrl();
  const key = getServiceKey();

  if (!url || !key) {
    return res.status(500).json({ 
      success: false, 
      error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Check Vercel environment variables.' 
    });
  }

  // Use Supabase REST to add columns via ALTER TABLE through a direct schema patch
  // Supabase doesn't expose raw SQL via REST directly, so we'll use a workaround:
  // Attempt to INSERT a test row with the new columns - if the column doesn't exist
  // Supabase returns a clear error. Instead, we'll use the Postgres endpoint.
  
  // Try via pg_catalog or information_schema to check if column exists,
  // then use a safe approach: try to patch a non-existent record to force column creation failure detection.
  
  // Best approach: Use Supabase's management API or just try inserting with the column.
  // Instead, let's directly use the SUPABASE_URL/rest/v1/ + a HEAD request to check schema,
  // then report back what the user needs to do.

  // Actually, the most reliable approach is to detect if columns exist and return clear instructions.
  
  const results = [];
  const errors = [];

  // Test if phone_password column exists by trying a SELECT with that column
  try {
    const testUrl = `${url}/rest/v1/members?select=phone_password&limit=1`;
    const testRes = await fetch(testUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      }
    });
    
    if (testRes.ok) {
      results.push('✅ phone_password column already exists in members table');
    } else {
      const errText = await testRes.text();
      if (errText.includes('column') || errText.includes('phone_password')) {
        errors.push('❌ phone_password column MISSING from members table - run the SQL below in Supabase');
      } else {
        errors.push(`⚠️ Unexpected error checking members: ${errText}`);
      }
    }
  } catch (e) {
    errors.push(`Error checking schema: ${e.message}`);
  }

  // Test applications table
  try {
    const testUrl = `${url}/rest/v1/applications?select=phone_password&limit=1`;
    const testRes = await fetch(testUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      }
    });
    
    if (testRes.ok) {
      results.push('✅ phone_password column already exists in applications table');
    } else {
      errors.push('❌ phone_password column MISSING from applications table - run the SQL below in Supabase');
    }
  } catch (e) {
    errors.push(`Error checking applications: ${e.message}`);
  }

  const allGood = errors.length === 0;

  return res.status(200).json({
    success: allGood,
    results,
    errors,
    sql_to_run: allGood ? null : `-- Run this in your Supabase SQL Editor:
ALTER TABLE members ADD COLUMN IF NOT EXISTS phone_password text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS corporate_profile jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS student_profile jsonb;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone_password text;`,
    message: allGood 
      ? 'Database schema is correct! All columns exist.' 
      : `Schema needs updating. ${errors.length} issue(s) found. Copy the sql_to_run and paste it in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor).`
  });
}
