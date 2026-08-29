import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Member, Application, Announcement, University, CPDCourse, 
  ElectionCandidate, AuditLog, Election
} from '../types';

export async function fetchMembers(): Promise<Member[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('members').select('*');
  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  return data as Member[];
}

export async function fetchApplications(): Promise<Application[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('applications').select('*');
  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
  return data as Application[];
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('announcements').select('*').order('published_at', { ascending: false });
  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
  return data as Announcement[];
}

export async function fetchUniversities(): Promise<University[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('universities').select('*').order('name');
  if (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
  return data as University[];
}

export async function fetchCPDCourses(): Promise<CPDCourse[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('cpd_courses').select('*').order('date', { ascending: false });
  if (error) {
    console.error('Error fetching CPD courses:', error);
    return [];
  }
  return data as CPDCourse[];
}

export async function fetchElections(): Promise<Election[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('elections').select('*');
  if (error) {
    console.error('Error fetching elections:', error);
    return [];
  }
  return data as Election[];
}

export async function fetchElectionCandidates(electionId?: string): Promise<ElectionCandidate[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase!.from('election_candidates').select('*');
  if (electionId) query = query.eq('election_id', electionId);
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
  return data as ElectionCandidate[];
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return data as AuditLog[];
}

// MUTATIONS

export async function submitApplication(appData: Partial<Application>) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!.from('applications').insert([appData]).select();
  if (error) throw error;
  return data[0];
}

export async function publishAnnouncement(announcementData: Partial<Announcement>) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!.from('announcements').insert([announcementData]).select();
  if (error) throw error;
  return data[0];
}

export async function updateApplicationStatus(id: string, status: string, adminNotes?: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!.from('applications')
    .update({ status, admin_notes: adminNotes })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function createCPDCourse(courseData: Partial<CPDCourse>) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
  const { data, error } = await supabase!.from('cpd_courses').insert([courseData]).select();
  if (error) throw error;
  return data[0];
}

export async function uploadFile(file: File): Promise<string> {
  if (!isSupabaseConfigured) return file.name; // fallback for demo mode
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase!.storage.from('storage').upload(filePath, file);
  if (error) throw error;

  const { data } = supabase!.storage.from('storage').getPublicUrl(filePath);
  return data.publicUrl;
}

