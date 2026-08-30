import { dbInsert, dbSelect, dbUpsert, cors } from './_db.js';

const MAX_CONTENT_LENGTH = 2_000;
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function requireId(value, label) {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function requireContent(value) {
  if (typeof value !== 'string') throw new Error('Content is required');
  const content = value.trim();
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content must be between 1 and ${MAX_CONTENT_LENGTH} characters`);
  }
  return content;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function errorStatus(error) {
  return /required|between/i.test(error.message) ? 400 : 500;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const action = req.query.action;

      if (action === 'comments') {
        const announcementId = requireId(req.query.announcementId, 'Announcement id');
        const comments = await dbSelect(
          'announcement_comments',
          `announcement_id=eq.${announcementId}&order=created_at.asc`
        );
        return res.status(200).json(comments);
      }

      if (action === 'vote') {
        const announcementId = requireId(req.query.announcementId, 'Announcement id');
        const memberId = requireId(req.query.memberId, 'Member id');
        const votes = await dbSelect(
          'announcement_votes',
          `announcement_id=eq.${announcementId}&member_id=eq.${memberId}&limit=1`
        );
        return res.status(200).json(votes[0] || null);
      }

      if (action === 'messages') {
        const memberId = requireId(req.query.memberId, 'Member id');
        const messages = await dbSelect(
          'member_messages',
          `or=(sender_id.eq.${memberId},recipient_id.eq.${memberId})&order=created_at.asc`
        );
        return res.status(200).json(messages);
      }

      return res.status(400).json({ error: 'Unsupported community action' });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'comment') {
        const announcementId = requireId(req.body.announcementId, 'Announcement id');
        const memberId = requireId(req.body.memberId, 'Member id');
        const content = requireContent(req.body.content);
        const members = await dbSelect('members', `id=eq.${memberId}&select=first_name,father_name&limit=1`);
        if (!members[0]) return res.status(404).json({ error: 'Member not found' });

        const comment = {
          id: newId('comment'),
          announcement_id: announcementId,
          member_id: memberId,
          author_name: `${members[0].first_name} ${members[0].father_name}`.trim(),
          content,
          created_at: new Date().toISOString()
        };
        await dbInsert('announcement_comments', comment);
        return res.status(201).json({ success: true, comment });
      }

      if (action === 'vote') {
        const announcementId = requireId(req.body.announcementId, 'Announcement id');
        const memberId = requireId(req.body.memberId, 'Member id');
        const choice = req.body.choice;
        if (choice !== 'approve' && choice !== 'adjust') {
          return res.status(400).json({ error: 'Vote choice must be approve or adjust' });
        }

        const vote = {
          announcement_id: announcementId,
          member_id: memberId,
          choice,
          updated_at: new Date().toISOString()
        };
        await dbUpsert('announcement_votes', vote, 'announcement_id,member_id');
        return res.status(200).json({ success: true, vote });
      }

      if (action === 'message') {
        const senderId = requireId(req.body.senderId, 'Sender id');
        const recipientId = requireId(req.body.recipientId, 'Recipient id');
        if (senderId === recipientId) return res.status(400).json({ error: 'You cannot message yourself' });

        const message = {
          id: newId('message'),
          sender_id: senderId,
          recipient_id: recipientId,
          content: requireContent(req.body.content),
          created_at: new Date().toISOString()
        };
        await dbInsert('member_messages', message);
        return res.status(201).json({ success: true, message });
      }

      return res.status(400).json({ error: 'Unsupported community action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[community]', error.message);
    return res.status(errorStatus(error)).json({ success: false, error: error.message });
  }
}
