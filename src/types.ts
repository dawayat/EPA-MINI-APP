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
  degree_level: string; // 'BSc' | 'BA' | 'MSc' | 'MA' | 'PhD';
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
}

export interface CorporateProfile {
  organization_name: string;
  org_type: string;
  tin_number: string;
  contact_person: string;
  staff_count: number;
  headquarters_city: string;
}

export interface PaymentProof {
  id: string;
  amount: number;
  currency: string;
  provider: 'Telebirr' | 'CBE' | 'Awash Bank' | 'Direct Transfer';
  transaction_number: string;
  payment_date: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  receipt_image?: string;
}

export interface Application {
  id: string;
  application_number: string;
  first_name: string;
  father_name: string;
  grandfather_name?: string;
  amharic_full_name?: string;
  gender: 'M' | 'F';
  email: string;
  phone: string;
  date_of_birth: string;
  city: string;
  membership_type: MembershipTypeCode;
  status: ApplicationStatus;
  photo_url?: string;
  id_document_url?: string;
  qualifications?: Qualification[];
  student_profile?: StudentProfile;
  corporate_profile?: CorporateProfile;
  payment?: PaymentProof;
  submitted_at: string;
  admin_notes?: string;
  rejection_reason?: string;
  verification_token?: string;
}

export interface Member {
  id: string;
  membership_number: string; // e.g. "EPA-2026-8849"
  verification_token: string;
  first_name: string;
  father_name: string;
  grandfather_name?: string;
  amharic_full_name?: string;
  photo_url?: string;
  email: string;
  phone: string;
  city: string;
  membership_type: MembershipTypeCode;
  status: MemberStatus;
  specialty: string;
  workplace: string;
  bio?: string;
  cpd_points: number;
  issued_at: string;
  expires_at: string;
  is_verified: boolean;
  license_number?: string;
  telegram_username?: string;
}

export interface Announcement {
  id: string;
  title: string;
  amharic_title?: string;
  category: 'General' | 'Event' | 'Research' | 'Policy' | 'Training' | 'Election';
  content: string;
  published_at: string;
  author: string;
  likes_count: number;
  views_count: number;
  is_featured?: boolean;
  cover_gradient?: string;
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
  instructor: string;
  instructor_title: string;
  points: number;
  category: 'Ethics' | 'Clinical' | 'Counseling' | 'Research' | 'Neuropsychology';
  duration: string;
  date: string;
  mode: 'Online Webinar' | 'In-Person (Addis Ababa)' | 'Self-Paced Module';
  registered: boolean;
  is_completed?: boolean;
}

export interface ElectionCandidate {
  id: string;
  name: string;
  title: string;
  institution: string;
  running_for: 'President' | 'Vice President' | 'Secretary General' | 'Research Chair' | 'Ethics Board';
  manifesto: string;
  votes_count: number;
  avatar_url?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  admin_username: string;
  created_at: string;
}
