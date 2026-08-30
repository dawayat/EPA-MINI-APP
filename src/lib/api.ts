/**
 * API client - calls Vercel API routes which use POSTGRES_URL server-side.
 * The frontend never needs to know database credentials.
 */

import {
  Member, Application, Announcement, University, CPDCourse,
  ElectionCandidate, AuditLog, Election, ResearchSubmission
} from '../types';

// Base URL for API calls - works in both local dev and production
const API_BASE = '';

async function apiGet<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.error(`[API] GET ${path} failed:`, res.status, await res.text());
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(`[API] GET ${path} error:`, err);
    return [];
  }
}

async function apiPost(path: string, body: any): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[API] POST ${path} failed:`, res.status, data);
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`[API] POST ${path} error:`, err);
    return { success: false, error: err.message };
  }
}

async function apiPatch(path: string, body: any): Promise<{ success: boolean; error?: string; email?: { attempted: boolean; delivered: boolean; error?: string } }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` };
    return { success: true, email: data.email };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function apiDelete(path: string, body: any): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}` };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── FETCHERS ───────────────────────────────────────────────────────────────

export async function fetchMembers(): Promise<Member[]> {
  return apiGet<Member>('/api/members');
}

export async function fetchApplications(): Promise<Application[]> {
  return apiGet<Application>('/api/applications');
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const rows = await apiGet<any>('/api/announcements');
  // Map DB column names to frontend type fields
  return rows.map((r: any) => ({
    ...r,
    category: r.type,
    author: r.author_name,
    is_draft: Boolean(r.is_draft),
    cover_photo_url: r.attachments?.find((a: any) => a.type === 'cover')?.url || null,
    file_attachment_url: r.attachments?.find((a: any) => a.type === 'file')?.url || null,
  }));
}

export async function fetchUniversities(): Promise<University[]> {
  return apiGet<University>('/api/universities');
}

export async function fetchCPDCourses(): Promise<CPDCourse[]> {
  // CPD courses not yet in DB - return empty
  return [];
}

export async function fetchElections(): Promise<Election[]> {
  return [];
}

export async function fetchElectionCandidates(electionId?: string): Promise<ElectionCandidate[]> {
  return [];
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiGet<AuditLog>('/api/audit-logs');
}

export async function fetchResearchSubmissions(): Promise<ResearchSubmission[]> {
  return apiGet<ResearchSubmission>('/api/research');
}

// ─── MUTATIONS ──────────────────────────────────────────────────────────────

export async function submitApplication(appData: Partial<Application>): Promise<{ success: boolean; error?: string }> {
  // Sanitize: remove undefined/null/empty string fields
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(appData)) {
    if (val !== undefined && val !== null && val !== '') {
      sanitized[key] = val;
    }
  }

  // Map UNDER_REVIEW -> SUBMITTED for DB compatibility
  if (sanitized.status === 'UNDER_REVIEW') sanitized.status = 'SUBMITTED';

  console.log('[API] Submitting application:', sanitized.application_number);
  return apiPost('/api/applications', sanitized);
}

export async function publishAnnouncement(announcementData: Partial<Announcement>): Promise<{ success: boolean; error?: string }> {
  const dbRow: Record<string, any> = {
    id: announcementData.id,
    title: announcementData.title,
    content: announcementData.content || '',
    type: (announcementData as any).category || 'General',
    published_at: announcementData.published_at || new Date().toISOString(),
    author_name: (announcementData as any).author || 'EPA Executive Directorate',
    status: (announcementData as any).is_draft ? 'DRAFT' : 'PUBLISHED',
    is_draft: Boolean((announcementData as any).is_draft),
  };

  const attachments: any[] = [];
  if ((announcementData as any).cover_photo_url) {
    attachments.push({ type: 'cover', url: (announcementData as any).cover_photo_url });
  }
  if ((announcementData as any).file_attachment_url) {
    attachments.push({ type: 'file', url: (announcementData as any).file_attachment_url });
  }
  if (attachments.length > 0) dbRow.attachments = attachments;
  if (announcementData.target_audience) dbRow.target_audience = announcementData.target_audience;

  console.log('[API] Publishing announcement:', dbRow.title);
  return apiPost('/api/announcements', dbRow);
}

export async function updateApplicationStatus(id: string, status: string, adminNotes?: string) {
  const result = await apiPatch('/api/applications', { id, status, admin_notes: adminNotes });
  if (!result.success) throw new Error(result.error || 'Update failed');
  return { id, status, email: result.email };
}

export async function createMember(memberData: Partial<Member>) {
  return apiPost('/api/members', memberData);
}

export async function deleteMember(id: string) {
  return apiDelete('/api/members', { id });
}

export async function deleteAnnouncement(id: string) {
  return apiDelete('/api/announcements', { id });
}

export async function submitResearchSubmission(submission: Partial<ResearchSubmission>) {
  return apiPost('/api/research', submission);
}

export async function updateResearchSubmission(id: string, status: ResearchSubmission['status'], review_notes?: string) {
  return apiPatch('/api/research', { id, status, review_notes });
}

export async function createCPDCourse(courseData: Partial<CPDCourse>) {
  // Not yet implemented server-side - just return success locally
  return courseData;
}

// ─── FILE UPLOAD ─────────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<string> {
  // Images: compress + convert to base64 data URL (stored in DB as text)
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX_DIM = 800;
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
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(objectUrl);
      };
      img.src = objectUrl;
    });
  }

  // Non-image files: convert to base64 too (for documents < 5MB)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}
