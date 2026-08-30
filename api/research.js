import { dbInsert, dbSelect, dbUpdate, cors } from './_db.js';

const VALID_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REVISION_REQUESTED', 'DECLINED']);
const VALID_TYPES = new Set(['Research Paper', 'Journal Article', 'Case Study', 'Conference Paper', 'Other']);

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const rows = await dbSelect('research_submissions', 'order=submitted_at.desc');
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const submission = req.body || {};
      if (!submission.member_id || !submission.title?.trim() || !submission.abstract?.trim() || !submission.file_url || !submission.file_name) {
        return res.status(400).json({ success: false, error: 'Title, abstract, and a research file are required.' });
      }
      if (submission.title.trim().length > 300 || submission.abstract.trim().length > 5000) {
        return res.status(400).json({ success: false, error: 'The title or abstract is too long.' });
      }
      const members = await dbSelect('members', `id=eq.${submission.member_id}&select=id,first_name,father_name,membership_number,email,phone&limit=1`);
      const member = members[0];
      if (!member) return res.status(404).json({ success: false, error: 'Member account was not found.' });

      const row = {
        id: id('research'),
        member_id: member.id,
        author_name: `${member.first_name} ${member.father_name}`.trim(),
        author_membership_number: member.membership_number,
        author_email: member.email || null,
        author_phone: member.phone || null,
        title: submission.title.trim(),
        abstract: submission.abstract.trim(),
        keywords: Array.isArray(submission.keywords) ? submission.keywords.slice(0, 12) : [],
        publication_type: VALID_TYPES.has(submission.publication_type) ? submission.publication_type : 'Research Paper',
        file_url: submission.file_url,
        file_name: submission.file_name,
        submitted_at: new Date().toISOString(),
        status: 'SUBMITTED'
      };
      await dbInsert('research_submissions', row);
      return res.status(201).json({ success: true, submission: row });
    }

    if (req.method === 'PATCH') {
      const { id: submissionId, status, review_notes } = req.body || {};
      if (!submissionId || !VALID_STATUSES.has(status)) {
        return res.status(400).json({ success: false, error: 'A valid submission status is required.' });
      }
      await dbUpdate('research_submissions', { status, review_notes: review_notes || null }, 'id', submissionId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[research]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
