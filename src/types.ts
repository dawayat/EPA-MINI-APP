export type MembershipTypeCode = 'STUDENT' | 'FULL' | 'CORPORATE';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type MemberStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';

export interface MembershipType {
  code: MembershipTypeCode;
  name: string;
  amharicName: string;
  fee: number;
  currency: string;
  period: string;
  description: string;
  amharicDescription: string;
  badgeColor: string;
  requirements: string[];
  benefits: string[];
}

export interface Qualification {
  degree_level: string; // 'BSc' | 'BA' | 'MSc' | 'MA' | 'PhD'
  field: string;
  institution: string;
  graduation_year: number;
  document_url?: string;
}

export interface StudentProfile {
  university_name: string;
  field_of_study: string;
  academic_year: number;
  student_id_number: string;
  expected_graduation_year: number;
  student_id_url?: string;
}

export interface CorporateProfile {
  organization_name: string;
  org_type: string; // 'Hospital' | 'NGO' | 'Clinic' | 'University' | 'Corporate' | 'Government'
  tin_number: string;
  contact_person: string;
  contact_title: string;
  contact_phone: string;
  contact_email: string;
  staff_count: number;
  headquarters_city: string;
  services_description: string;
  website?: string;
  registration_cert_url?: string;
  logo_url?: string;
}

export interface PaymentProof {
  id: string;
  amount: number;
  currency: string;
  provider: 'Telebirr' | 'CBE' | 'Awash Bank' | 'Direct Transfer';
  transaction_number: string;
  payment_date: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  receipt_url?: string;
}

export interface Application {
  id: string;
  application_number: string;
  first_name: string;
  father_name: string;
  grandfather_name?: string;
  amharic_full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  city?: string;
  membership_type: MembershipTypeCode;
  status: ApplicationStatus;
  gender?: 'M' | 'F';
  photo_url?: string;
  id_document_url?: string;
  degree_certificate_url?: string;
  qualifications?: Qualification[];
  student_profile?: StudentProfile;
  corporate_profile?: CorporateProfile;
  payment?: PaymentProof;
  submitted_at: string;
  admin_notes?: string;
  rejection_reason?: string;
  telegram_id?: number | string;
  phone_password?: string;
  // Full member specific
  current_workplace?: string;
  current_specialty?: string;
  years_of_experience?: number;
  license_number?: string;
  national_id_number?: string;
}

export interface Member {
  id: string;
  membership_number: string; // e.g. "EPA-2026-8849"
  verification_token: string;
  
  // Auth
  telegram_id?: number | string;
  telegram_username?: string;
  email?: string;
  phone_password?: string; // Simple password for phone-based login fallback
  
  // Personal
  first_name: string;
  father_name: string;
  grandfather_name?: string;
  amharic_full_name?: string;
  gender?: 'M' | 'F';
  date_of_birth?: string;
  phone?: string;
  city: string;
  
  // Membership
  membership_type: MembershipTypeCode;
  status: MemberStatus;
  
  // Profile
  photo_url?: string;
  specialty?: string;
  workplace?: string;
  bio?: string;
  is_available_for_consultation?: boolean;
  show_contact_in_directory?: boolean;
  
  // Professional
  license_number?: string;
  
  // CPD
  cpd_points: number;
  
  // Dates
  issued_at: string;
  expires_at: string;
  is_verified: boolean;
  
  // Admin
  is_admin?: boolean;
  
  // Corporate specific
  corporate_profile?: CorporateProfile;

  // Student specific
  student_profile?: StudentProfile;
}

export interface Announcement {
  id: string;
  title: string;
  amharic_title?: string;
  category: 'General' | 'Event' | 'Research' | 'Policy' | 'Training' | 'Election' | 'CPD' | 'News';
  content: string;
  cover_image_url?: string;
  cover_photo_url?: string; // alias used in admin form
  published_at: string;
  author: string;
  likes_count: number;
  views_count: number;
  is_featured?: boolean;
  cover_gradient?: string;
  target_audience?: string[];
  is_published?: boolean;
  file_attachment_url?: string;
  is_draft?: boolean;
}

export type AnnouncementVoteChoice = 'approve' | 'adjust';

export interface AnnouncementComment {
  id: string;
  announcement_id: string;
  member_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface MemberMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  amharic_name?: string;
  city: string;
  type: 'Public' | 'Private' | 'Technical';
  is_accredited: boolean;
  departments: string[];
}

export interface CPDCourse {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  instructor_title: string;
  instructor_photo_url?: string;
  points: number;
  category: 'Ethics' | 'Clinical' | 'Counseling' | 'Research' | 'Neuropsychology' | 'Trauma' | 'Child Psychology';
  duration: string;
  date: string;
  mode: 'Online Webinar' | 'In-Person (Addis Ababa)' | 'Self-Paced Module';
  location?: string;
  zoom_link?: string;
  materials_url?: string;
  cover_image_url?: string;
  max_participants?: number;
  registered_count?: number;
  registered: boolean;
  is_completed?: boolean;
  eligible_types?: MembershipTypeCode[];
}

export interface ElectionCandidate {
  id: string;
  election_id?: string;
  member_id?: string;
  name: string;
  title: string;
  institution: string;
  running_for: 'President' | 'Vice President' | 'Secretary General' | 'Research Chair' | 'Ethics Board' | 'Treasurer';
  manifesto: string;
  votes_count: number;
  avatar_url?: string;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  position: ElectionCandidate['running_for'];
  is_active: boolean;
  voting_starts_at?: string;
  voting_ends_at?: string;
  results_published?: boolean;
  eligible_voter_types?: MembershipTypeCode[];
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_username: string;
  created_at: string;
}

export interface ArticleComment {
  id: string;
  author_name: string;
  author_membership_number?: string;
  content: string;
  created_at: string;
}

export interface ResearchArticle {
  id: string;
  member_id: string;
  author_name: string;
  author_membership_number: string;
  title: string;
  abstract: string;
  content: string;
  keywords: string[];
  published_at: string;
  comments: ArticleComment[];
  likes_count: number;
}

export type DraftVoteChoice = 'APPROVE' | 'NEEDS_ADJUSTMENT';

export interface DraftVote {
  announcement_id: string;
  member_id: string;
  choice: DraftVoteChoice;
  comment?: string;
}
