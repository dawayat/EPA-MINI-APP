import { Client } from 'pg';

export default async function handler(req, res) {
  const connectionString = 'postgresql://postgres:EPAMINIAPP91@db.cnwkuzihcmtenpoliqpn.supabase.co:5432/postgres';
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const sql = `
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
CREATE TABLE members (
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
CREATE TABLE applications (
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
CREATE TABLE announcements (
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
CREATE TABLE universities (
  id text PRIMARY KEY,
  name text NOT NULL,
  city text,
  type text,
  is_accredited boolean DEFAULT true,
  departments text[]
);

-- CPD Courses Table
CREATE TABLE cpd_courses (
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
CREATE TABLE elections (
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
CREATE TABLE election_candidates (
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
CREATE TABLE audit_logs (
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

-- Open policies (allow all for anon key)
CREATE POLICY "open_members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_universities" ON universities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_cpd_courses" ON cpd_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_elections" ON elections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_candidates" ON election_candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
`;
    await client.query(sql);
    res.status(200).json({ success: true, message: 'Database schema successfully applied.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await client.end();
  }
}
