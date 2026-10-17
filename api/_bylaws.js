import { readBylawsDocument } from './_bylaws_content.js';
import { dbSelect, dbInsert, dbUpdate, dbUpsert, noStore } from './_db.js';
import { requireAdmin } from './_admin.js';
import { requireMemberSession } from './_member_session.js';

const fail = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const memberEvents = new Set(['opened', 'copy_attempt', 'print_attempt', 'save_attempt', 'capture_shortcut']);
const documentRevision = '2026-09-original-chart-grid-v2';

export default async function handleBylaws(req, res, loadDocument = readBylawsDocument) {
  noStore(res);
  try {
    const admin = req.query.admin === 'true';
    if (admin) {
      const session = requireAdmin(req);
      if (req.method === 'GET') {
        const [settings, access, events] = await Promise.all([
          dbSelect('bylaws_settings', 'id=eq.articles&limit=1'),
          dbSelect('bylaws_access', 'restricted=eq.true'),
          dbSelect('bylaws_events', 'order=created_at.desc&limit=100')
        ]);
        return res.status(200).json({ enabled: settings[0]?.enabled === true, access, events });
      }
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
      const body = req.body || {};
      if (body.operation === 'activation' && typeof body.enabled === 'boolean') {
        await dbUpdate('bylaws_settings', { enabled: body.enabled, updated_at: new Date().toISOString() }, 'id', 'articles');
        await dbInsert('bylaws_events', { actor: session.username, event: body.enabled ? 'activated' : 'deactivated' });
      } else if (body.operation === 'access' && typeof body.restricted === 'boolean' && typeof body.memberId === 'string') {
        const members = await dbSelect('members', `id=eq.${encodeURIComponent(body.memberId)}&select=id&limit=1`);
        if (!members.length) throw fail(404, 'Member not found.');
        await dbUpsert('bylaws_access', { member_id: body.memberId, restricted: body.restricted, updated_at: new Date().toISOString() }, 'member_id');
        await dbInsert('bylaws_events', { member_id: body.memberId, actor: session.username, event: body.restricted ? 'restricted' : 'restored' });
      } else throw fail(400, 'Invalid bylaws control.');
      return res.status(200).json({ success: true });
    }

    const memberId = String(req.query.memberId || '');
    requireMemberSession(req, memberId, { allowVotingOnly: true });
    const [members, settings, restrictions] = await Promise.all([
      dbSelect('members', `id=eq.${encodeURIComponent(memberId)}&select=id,first_name,father_name,membership_number,status,registration_required,voting_access_until&limit=1`),
      dbSelect('bylaws_settings', 'id=eq.articles&limit=1'),
      dbSelect('bylaws_access', `member_id=eq.${encodeURIComponent(memberId)}&limit=1`)
    ]);
    const member = members[0];
    if (!member || !['ACTIVE', 'EXPIRED'].includes(member.status)) throw fail(403, 'Member access is unavailable.');
    if (member.registration_required && (!member.voting_access_until || Date.parse(member.voting_access_until) <= Date.now())) throw fail(403, 'Temporary voting access has ended. Complete normal registration.');
    const available = settings[0]?.enabled === true && restrictions[0]?.restricted !== true;
    if (req.method === 'GET' && req.query.view !== 'content') return res.status(200).json({ available, ...(available ? { revision: documentRevision } : {}) });
    if (!available) throw fail(403, 'The administrator has disabled access to these articles.');
    if (req.method === 'GET') return res.status(200).json({
      ...loadDocument(),
      revision: documentRevision,
      watermark: `${member.first_name} ${member.father_name} · ${member.membership_number}`,
      issuedAt: new Date().toISOString()
    });
    if (req.method === 'POST') {
      if (!memberEvents.has(req.body?.event)) throw fail(400, 'Invalid reader event.');
      await dbInsert('bylaws_events', { member_id: memberId, actor: `${member.first_name} ${member.father_name} · ${member.membership_number}`, event: req.body.event });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    if (!error.statusCode) console.error('[bylaws]', error.message);
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Bylaws are temporarily unavailable. Please try again.' });
  }
}
