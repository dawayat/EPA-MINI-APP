-- ============================================================
-- EPA MINI APP — FULL SUPABASE SCHEMA
-- Paste this into your Supabase SQL Editor and run it
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE membership_type AS ENUM ('STUDENT', 'FULL', 'CORPORATE');
CREATE TYPE member_status AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'PENDING');
CREATE TYPE application_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'PAYMENT_PENDING', 'UNDER_REVIEW',
  'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'
);
CREATE TYPE announcement_category AS ENUM (
  'General', 'Event', 'Research', 'Policy', 'Training', 'Election', 'CPD', 'News'
);
CREATE TYPE cpd_mode AS ENUM ('Online Webinar', 'In-Person (Addis Ababa)', 'Self-Paced Module');
CREATE TYPE cpd_category AS ENUM ('Ethics', 'Clinical', 'Counseling', 'Research', 'Neuropsychology', 'Trauma', 'Child Psychology');
CREATE TYPE election_position AS ENUM ('President', 'Vice President', 'Secretary General', 'Research Chair', 'Ethics Board', 'Treasurer');
CREATE TYPE payment_provider AS ENUM ('Telebirr', 'CBE', 'Awash Bank', 'Direct Transfer');
CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ');

-- ============================================================
-- TABLES
-- ============================================================

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_number TEXT UNIQUE NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  
  -- Auth & Identity
  telegram_id BIGINT UNIQUE,
  telegram_username TEXT,
  email TEXT UNIQUE,
  
  -- Personal Info
  first_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  grandfather_name TEXT,
  amharic_full_name TEXT,
  gender TEXT CHECK (gender IN ('M', 'F')) DEFAULT 'M',
  date_of_birth DATE,
  phone TEXT,
  city TEXT DEFAULT 'Addis Ababa',
  
  -- Membership
  membership_type membership_type NOT NULL,
  status member_status DEFAULT 'PENDING',
  
  -- Profile
  photo_url TEXT,
  specialty TEXT,
  workplace TEXT,
  bio TEXT,
  is_available_for_consultation BOOLEAN DEFAULT FALSE,
  show_contact_in_directory BOOLEAN DEFAULT TRUE,
  
  -- Professional (Full Members)
  license_number TEXT,
  
  -- CPD
  cpd_points INTEGER DEFAULT 0,
  
  -- Dates
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  
  -- Applicant Info
  first_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  grandfather_name TEXT,
  amharic_full_name TEXT,
  gender TEXT CHECK (gender IN ('M', 'F')),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  city TEXT,
  
  -- Membership
  membership_type membership_type NOT NULL,
  status application_status DEFAULT 'DRAFT',
  
  -- Documents
  photo_url TEXT,
  id_document_url TEXT,
  degree_certificate_url TEXT,
  additional_docs JSONB DEFAULT '[]',
  
  -- Academic (Student)
  student_university TEXT,
  student_field TEXT,
  student_year INTEGER,
  student_id_number TEXT,
  expected_graduation_year INTEGER,
  student_id_url TEXT,
  
  -- Professional (Full Member)
  qualifications JSONB DEFAULT '[]', -- [{degree_level, field, institution, graduation_year, document_url}]
  current_workplace TEXT,
  current_specialty TEXT,
  years_of_experience INTEGER,
  
  -- Corporate
  org_name TEXT,
  org_type TEXT,
  tin_number TEXT,
  org_contact_person TEXT,
  org_contact_title TEXT,
  org_contact_phone TEXT,
  org_services TEXT,
  org_staff_count INTEGER,
  org_headquarters TEXT,
  org_registration_url TEXT,
  org_logo_url TEXT,
  
  -- Payment
  payment_provider payment_provider,
  payment_transaction_number TEXT,
  payment_date DATE,
  payment_amount NUMERIC,
  payment_receipt_url TEXT,
  payment_status payment_status DEFAULT 'PENDING',
  
  -- Admin
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES members(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Telegram
  telegram_id BIGINT,
  
  -- Dates
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amharic_title TEXT,
  category announcement_category DEFAULT 'General',
  content TEXT NOT NULL,
  cover_image_url TEXT,
  cover_gradient TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  target_audience TEXT[] DEFAULT ARRAY['ALL'], -- ['ALL', 'STUDENT', 'FULL', 'CORPORATE']
  author TEXT DEFAULT 'EPA Executive Directorate',
  author_id UUID REFERENCES members(id),
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CPD Courses table
CREATE TABLE cpd_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  instructor_title TEXT,
  instructor_photo_url TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  category cpd_category DEFAULT 'Clinical',
  duration TEXT,
  date TIMESTAMPTZ,
  mode cpd_mode DEFAULT 'Online Webinar',
  location TEXT,
  zoom_link TEXT,
  materials_url TEXT,
  cover_image_url TEXT,
  max_participants INTEGER,
  registered_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  certificate_template_url TEXT,
  eligible_types TEXT[] DEFAULT ARRAY['STUDENT', 'FULL'], -- who can register
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CPD Registrations (members registered for courses)
CREATE TABLE cpd_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  course_id UUID NOT NULL REFERENCES cpd_courses(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  UNIQUE(member_id, course_id)
);

-- Elections table
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  position election_position NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  voting_starts_at TIMESTAMPTZ,
  voting_ends_at TIMESTAMPTZ,
  results_published BOOLEAN DEFAULT FALSE,
  eligible_voter_types TEXT[] DEFAULT ARRAY['FULL'], -- only full members can vote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Election Candidates
CREATE TABLE election_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id),
  member_id UUID REFERENCES members(id), -- linked to member profile if applicable
  name TEXT NOT NULL,
  title TEXT,
  institution TEXT,
  manifesto TEXT,
  avatar_url TEXT,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes (auditable)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id),
  candidate_id UUID NOT NULL REFERENCES election_candidates(id),
  voter_id UUID NOT NULL REFERENCES members(id),
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_id, voter_id) -- one vote per election per member
);

-- Universities registry
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amharic_name TEXT,
  city TEXT,
  type TEXT CHECK (type IN ('Public', 'Private', 'Technical')) DEFAULT 'Public',
  is_accredited BOOLEAN DEFAULT TRUE,
  departments TEXT[] DEFAULT ARRAY['Psychology Department'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  admin_id UUID REFERENCES members(id),
  admin_username TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement Likes (to prevent duplicate likes)
CREATE TABLE announcement_likes (
  member_id UUID NOT NULL REFERENCES members(id),
  announcement_id UUID NOT NULL REFERENCES announcements(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, announcement_id)
);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- ============================================================
-- CREATE BUCKET avatars (public: true)
-- CREATE BUCKET documents (public: false)
-- CREATE BUCKET announcement-covers (public: true)
-- CREATE BUCKET cpd-materials (public: false)

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpd_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Members: everyone can read directory (public profiles), members can update their own
CREATE POLICY "Members are publicly viewable" ON members FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Members can update own profile" ON members FOR UPDATE USING (auth.uid()::text = id::text);

-- Announcements: all published ones are public
CREATE POLICY "Published announcements are public" ON announcements FOR SELECT USING (is_published = TRUE);

-- CPD Courses: public read
CREATE POLICY "CPD courses are public" ON cpd_courses FOR SELECT USING (TRUE);

-- Elections & candidates: public read
CREATE POLICY "Elections are public" ON elections FOR SELECT USING (TRUE);
CREATE POLICY "Candidates are public" ON election_candidates FOR SELECT USING (TRUE);

-- Universities: public read
CREATE POLICY "Universities are public" ON universities FOR SELECT USING (TRUE);

-- Votes: members can insert their own vote, cannot read others
CREATE POLICY "Members can vote" ON votes FOR INSERT WITH CHECK (auth.uid()::text = voter_id::text);
CREATE POLICY "Members can see their own vote" ON votes FOR SELECT USING (auth.uid()::text = voter_id::text);

-- CPD Registrations: members can manage their own
CREATE POLICY "Members manage own CPD registrations" ON cpd_registrations FOR ALL USING (auth.uid()::text = member_id::text);

-- Applications: users can only see/edit their own
CREATE POLICY "Applicants manage own application" ON applications FOR ALL USING (auth.uid()::text = telegram_id::text);

-- ============================================================
-- SEED DATA — Universities
-- ============================================================
INSERT INTO universities (name, amharic_name, city, type, is_accredited, departments) VALUES
('Addis Ababa University', 'አዲስ አበባ ዩኒቨርሲቲ', 'Addis Ababa', 'Public', TRUE, ARRAY['Department of Psychology', 'School of Social Work']),
('Jimma University', 'ጅማ ዩኒቨርሲቲ', 'Jimma', 'Public', TRUE, ARRAY['Department of Psychiatry', 'Department of Psychology']),
('Hawassa University', 'ሐዋሳ ዩኒቨርሲቲ', 'Hawassa', 'Public', TRUE, ARRAY['College of Health Sciences', 'Department of Psychology']),
('Bahir Dar University', 'ባህር ዳር ዩኒቨርሲቲ', 'Bahir Dar', 'Public', TRUE, ARRAY['Department of Psychology']),
('Mekelle University', 'መቀሌ ዩኒቨርሲቲ', 'Mekelle', 'Public', TRUE, ARRAY['College of Health Sciences']),
('Unity University', 'ዩኒቲ ዩኒቨርሲቲ', 'Addis Ababa', 'Private', TRUE, ARRAY['Department of Psychology']),
('St. Mary University', 'ቅዱስ ማርያም ዩኒቨርሲቲ', 'Addis Ababa', 'Private', TRUE, ARRAY['Psychology Department']),
('Dilla University', 'ዲላ ዩኒቨርሲቲ', 'Dilla', 'Public', TRUE, ARRAY['Department of Psychology']),
('Wolkite University', 'ወልቂጤ ዩኒቨርሲቲ', 'Wolkite', 'Public', TRUE, ARRAY['Psychology Department']),
('Arba Minch University', 'አርባ ምንጭ ዩኒቨርሲቲ', 'Arba Minch', 'Public', TRUE, ARRAY['Psychology Department']);
