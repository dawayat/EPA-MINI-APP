import pkg from 'pg';
const { Pool } = pkg;

let pool;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function ensureSchema(db) {
  await db.query(`
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

    CREATE TABLE IF NOT EXISTS universities (
      id text PRIMARY KEY,
      name text NOT NULL,
      city text,
      type text,
      is_accredited boolean DEFAULT true,
      departments text[]
    );

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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id text PRIMARY KEY,
      action text NOT NULL,
      entity_type text NOT NULL,
      entity_id text,
      admin_username text NOT NULL DEFAULT 'system',
      created_at timestamptz DEFAULT now()
    );
  `);
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
