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
  return data as AuditLog[];;
}

// MUTATIONS

export async function submitApplication(appData: Partial<Application>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  // Sanitize: strip undefined/null fields and map to DB-safe types
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(appData)) {
    if (val !== undefined && val !== null && val !== '') {
      sanitized[key] = val;
    }
  }

  // Status must match DB ENUM: SUBMITTED, UNDER_REVIEW, CORRECTION_REQUIRED, APPROVED, REJECTED
  // Map PAYMENT_PENDING -> SUBMITTED, DRAFT -> SUBMITTED
  const statusMap: Record<string, string> = {
    DRAFT: 'SUBMITTED',
    PAYMENT_PENDING: 'SUBMITTED',
  };
  if (sanitized.status && statusMap[sanitized.status]) {
    sanitized.status = statusMap[sanitized.status];
  }

  // gender is optional in DB so remove if blank
  if (!sanitized.gender) delete sanitized.gender;
  if (!sanitized.date_of_birth) delete sanitized.date_of_birth;

  // jsonb columns must be actual objects (not stringified)
  if (sanitized.student_profile && typeof sanitized.student_profile === 'string') {
    try { sanitized.student_profile = JSON.parse(sanitized.student_profile); } catch { delete sanitized.student_profile; }
  }
  if (sanitized.qualifications && typeof sanitized.qualifications === 'string') {
    try { sanitized.qualifications = JSON.parse(sanitized.qualifications); } catch { delete sanitized.qualifications; }
  }
  if (sanitized.payment && typeof sanitized.payment === 'string') {
    try { sanitized.payment = JSON.parse(sanitized.payment); } catch { delete sanitized.payment; }
  }
  if (sanitized.corporate_profile && typeof sanitized.corporate_profile === 'string') {
    try { sanitized.corporate_profile = JSON.parse(sanitized.corporate_profile); } catch { delete sanitized.corporate_profile; }
  }

  console.log('[API] Submitting application to Supabase:', sanitized);
  const { data, error } = await supabase!.from('applications').insert([sanitized]).select();
  if (error) {
    console.error('[API] Submit application error:', error);
    return { success: false, error: error.message };
  }
  console.log('[API] Application submitted successfully:', data);
  return { success: true };
}

export async function publishAnnouncement(announcementData: Partial<Announcement>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  // Map frontend Announcement fields to DB columns
  const dbRow: Record<string, any> = {
    id: announcementData.id,
    title: announcementData.title,
    content: announcementData.content || '',
    type: announcementData.category || 'General',
    published_at: announcementData.published_at || new Date().toISOString(),
    author_name: announcementData.author || 'EPA Executive Directorate',
    status: 'PUBLISHED',
  };

  // Optional fields
  if (announcementData.cover_photo_url) dbRow.attachments = [{ type: 'cover', url: announcementData.cover_photo_url }];
  if (announcementData.file_attachment_url) {
    const existing = dbRow.attachments || [];
    dbRow.attachments = [...existing, { type: 'file', url: announcementData.file_attachment_url }];
  }
  if (announcementData.target_audience) dbRow.target_audience = announcementData.target_audience;
  if (announcementData.is_draft) dbRow.status = 'DRAFT';

  // Strip undefined
  for (const k of Object.keys(dbRow)) {
    if (dbRow[k] === undefined) delete dbRow[k];
  }

  console.log('[API] Publishing announcement to Supabase:', dbRow);
  const { data, error } = await supabase!.from('announcements').insert([dbRow]).select();
  if (error) {
    console.error('[API] Publish announcement error:', error);
    return { success: false, error: error.message };
  }
  console.log('[API] Announcement published:', data);
  return { success: true };
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
  // ── IMAGES: compress + convert to base64 data URL ──────────────────────
  // Stored directly in the database as a data URL — no storage bucket needed!
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_DIM = 600; // max width or height in pixels
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
          else       { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        // JPEG at 72% quality ≈ 30–80 KB — perfectly fine in a text column
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(objectUrl); // fallback: local blob URL
      };
      img.src = objectUrl;
    });
  }

  // ── DOCUMENTS (PDF, DOCX, etc.): try Supabase storage ─────────────────
  if (isSupabaseConfigured) {
    const fileExt = file.name.split('.').pop() || 'bin';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    try {
      const { error } = await supabase!.storage
        .from('storage')
        .upload(safeFileName, file, { upsert: true });
      if (!error) {
        const { data } = supabase!.storage.from('storage').getPublicUrl(safeFileName);
        return data.publicUrl;
      }
      console.warn('[API] Storage upload failed, using local URL:', error.message);
    } catch (e) {
      console.warn('[API] Storage exception:', e);
    }
  }

  // ── FALLBACK: local blob URL (works only for this browser session) ─────
  return URL.createObjectURL(file);
}

