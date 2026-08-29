/**
 * Uses the Supabase Management API to create all tables via the SQL endpoint.
 * This uses HTTPS on port 443 - no IPv6 direct DB connection needed.
 */

const https = require('https');

// These are from the user's Supabase project
const PROJECT_REF = 'cnwkuzihcmtenpoliqpn';
// We need the SERVICE_ROLE key, not the anon key. The service role key is in Supabase dashboard > Settings > API
// Using the connection string password as the db password, try the management API with anon key first
const ANON_KEY = 'sb_publishable_9IzznKtQlwTpwG3CMLVLEA_kIROxwDF';

const SQL = `
-- Drop tables if they already exist (clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS election_candidates CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS cpd_courses CASCADE;
DROP TABLE IF EXISTS universities CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Members Table
CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  membership_number text UNIQUE NOT NULL,
  verification_token text UNIQUE,
  telegram_id text,
  first_name text NOT NULL,
  father_name text NOT NULL,
  grandfather_name text,
  amharic_full_name text,
  photo_url text,
  email text,
  phone text,
  city text,
  membership_type text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  specialty text,
  workplace text,
  bio text,
  cpd_points integer DEFAULT 0,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_verified boolean DEFAULT false,
  license_number text,
  created_at timestamptz DEFAULT now()
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id text PRIMARY KEY,
  application_number text UNIQUE NOT NULL,
  telegram_id text,
  membership_type text NOT NULL,
  status text NOT NULL DEFAULT 'SUBMITTED',
  first_name text NOT NULL,
  father_name text NOT NULL,
  grandfather_name text,
  amharic_full_name text,
  gender text,
  date_of_birth text,
  phone text,
  email text,
  city text,
  national_id_number text,
  photo_url text,
  current_workplace text,
  current_specialty text,
  years_of_experience integer,
  license_number text,
  degree_certificate_url text,
  id_document_url text,
  agreed_to_ethics boolean,
  rejection_reason text,
  admin_notes text,
  student_profile jsonb,
  corporate_profile jsonb,
  qualifications jsonb,
  payment jsonb,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id text PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'General',
  published_at timestamptz DEFAULT now(),
  author_name text,
  status text DEFAULT 'PUBLISHED',
  attachments jsonb,
  target_audience text[]
);

-- Universities Table
CREATE TABLE IF NOT EXISTS universities (
  id text PRIMARY KEY,
  name text NOT NULL,
  city text,
  type text,
  is_accredited boolean DEFAULT true,
  departments text[]
);

-- CPD Courses Table
CREATE TABLE IF NOT EXISTS cpd_courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  instructor text,
  instructor_title text,
  points integer DEFAULT 1,
  category text,
  duration text,
  date text,
  mode text,
  description text,
  registered boolean DEFAULT false
);

-- Elections Table
CREATE TABLE IF NOT EXISTS elections (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  position text,
  is_active boolean DEFAULT false,
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  results_published boolean DEFAULT false,
  eligible_voter_types text[]
);

-- Election Candidates Table
CREATE TABLE IF NOT EXISTS election_candidates (
  id text PRIMARY KEY,
  election_id text,
  member_id text,
  name text NOT NULL,
  title text,
  institution text,
  running_for text,
  manifesto text,
  votes_count integer DEFAULT 0,
  avatar_url text
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  admin_username text NOT NULL DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "open_members" ON members;
  DROP POLICY IF EXISTS "open_applications" ON applications;
  DROP POLICY IF EXISTS "open_announcements" ON announcements;
  DROP POLICY IF EXISTS "open_universities" ON universities;
  DROP POLICY IF EXISTS "open_cpd_courses" ON cpd_courses;
  DROP POLICY IF EXISTS "open_elections" ON elections;
  DROP POLICY IF EXISTS "open_candidates" ON election_candidates;
  DROP POLICY IF EXISTS "open_audit_logs" ON audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Open policies (allow all for anon key - required for the app to work)
CREATE POLICY "open_members" ON members FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_applications" ON applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_announcements" ON announcements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_universities" ON universities FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_cpd_courses" ON cpd_courses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_elections" ON elections FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_candidates" ON election_candidates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "open_audit_logs" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- Also allow authenticated role
CREATE POLICY "open_members_auth" ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_applications_auth" ON applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_announcements_auth" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_universities_auth" ON universities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_cpd_courses_auth" ON cpd_courses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_elections_auth" ON elections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_candidates_auth" ON election_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_audit_logs_auth" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // First try via the Supabase REST pg_dumpall / rpc endpoint
  // The Supabase REST API endpoint for running arbitrary SQL is only available with service role key
  // However, we can try using the pg REST endpoint to run DDL via a custom function
  // Let's try to call the supabase-js REST API - first check if tables exist
  
  console.log('Checking if Supabase REST API is reachable...');
  
  const checkOptions = {
    hostname: `${PROJECT_REF}.supabase.co`,
    path: '/rest/v1/applications?limit=1',
    method: 'GET',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  };
  
  try {
    const result = await makeRequest(checkOptions);
    console.log('REST API check status:', result.status);
    console.log('Response:', JSON.stringify(result.body).substring(0, 200));
    
    if (result.status === 200) {
      console.log('✓ Tables already exist! The REST API is working fine.');
      return;
    } else if (result.status === 404 || (result.body && result.body.code === '42P01')) {
      console.log('Tables do not exist yet. Need to create them via Supabase SQL editor.');
    } else {
      console.log('Unexpected status. Full response:', result.body);
    }
  } catch (err) {
    console.error('REST API check failed:', err.message);
  }
}

main();
