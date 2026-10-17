import { electionResults } from './_governance_results.js';
import { createTemporaryMember } from './_provisional.js';
import { dbSelect, noStore, supabaseHeaders, supabaseUrl } from './_db.js';
import { requireAdmin } from './_admin.js';
import { requireMemberSession } from './_member_session.js';
const idPattern = /^[a-zA-Z0-9_-]{1,100}$/;
const fail = (code, message) => Object.assign(new Error(message), { statusCode: code });
async function allRows(table, query) {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await dbSelect(table, `${query}&limit=1000&offset=${offset}`);
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}
const identity = member => ({ name: `${member?.first_name || ''} ${member?.father_name || ''}`.trim() || 'EPA member', membershipNumber: member?.membership_number || '' });
export default async function handleGovernance(req, res) {
  noStore(res);
  try {
    const admin = req.query.admin === 'true';
    let actor, member;
    if (admin) actor = requireAdmin(req).username;
    else {
      actor = String(req.query.memberId || '');
      requireMemberSession(req, actor, { allowVotingOnly: true });
      if (!idPattern.test(actor)) throw fail(400, 'Invalid member.');
      [member] = await dbSelect('members', `id=eq.${encodeURIComponent(actor)}&select=id,first_name,father_name,membership_number,status,membership_type,registration_required,voting_access_until&limit=1`);
      if (!member || !['ACTIVE', 'EXPIRED'].includes(member.status)) throw fail(403, 'Member access is unavailable.');
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (admin && body.operation === 'temporary-member') return res.status(201).json(await createTemporaryMember(body, actor));
      const allowed = admin ? ['create', 'phase', 'approve'] : ['nominate', 'vote'];
      if (!allowed.includes(body.operation)) throw fail(400, 'Invalid operation.');
      if (!admin && (member.status !== 'ACTIVE' || member.membership_type !== 'FULL')) throw fail(403, 'Only active full professional members may vote or nominate themselves.');
      if (!admin && member.registration_required && (!member.voting_access_until || Date.parse(member.voting_access_until) <= Date.now())) throw fail(403, 'Temporary voting access has ended. Complete normal registration and obtain approval.');
      if (!admin && member.registration_required && body.operation === 'nominate') throw fail(403, 'Complete normal registration before nominating yourself.');
      // Actor and admin privilege always come from the verified server session.
      const response = await fetch(supabaseUrl('rpc/governance_action'), { method: 'POST', headers: supabaseHeaders(), body: JSON.stringify({ p_actor: actor, p_admin: admin, p_operation: body.operation, p_payload: body }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'P0001') throw fail(409, data.message);
        if (data.code === '23505') throw fail(409, 'A ballot or nomination with these details already exists.');
        if (['22P02', '23502', '23514'].includes(data.code)) throw fail(400, 'Please check the ballot details.');
        throw new Error('Governance transaction failed.');
      }
      return res.status(200).json(data);
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
    const polls = await dbSelect('governance_polls', `select=*&order=created_at.desc${admin ? '' : '&phase=neq.draft'}&limit=100`);
    const [settings, restrictions] = admin ? [[], []] : await Promise.all([
      dbSelect('bylaws_settings', 'id=eq.articles&select=enabled&limit=1'),
      dbSelect('bylaws_access', `member_id=eq.${encodeURIComponent(actor)}&select=restricted&limit=1`)
    ]);
    const visible = polls.filter(p => admin || p.kind !== 'articles' || (settings[0]?.enabled && !restrictions[0]?.restricted));
    const summaries = await Promise.all(visible.map(async p => {
      const [candidates, votes] = await Promise.all([
        allRows('governance_candidates', `poll_id=eq.${p.id}&select=id,member_id,manifesto,approved,created_at,members(first_name,father_name,membership_number,status,membership_type)&order=created_at.asc`),
        allRows('governance_votes', `poll_id=eq.${p.id}&select=member_id,choice,choices,created_at,members(first_name,father_name,membership_number)&order=created_at.asc`)
      ]);
      const counts = {};
      for (const v of votes) for (const choice of (v.choices || [v.choice])) counts[choice] = (counts[choice] || 0) + 1;
      const candidateData = candidates.map(c=>({id:c.id,approved:c.approved,...identity(c.members)}));
      return { ...p, canNominate: !member?.registration_required, results: p.kind === 'election' && p.phase === 'closed' ? electionResults(candidateData, counts, p.seats || 3) : [], eligible: admin || (member.status === 'ACTIVE' && p.eligible_types.includes(member.membership_type) && (!member.registration_required || Date.parse(member.voting_access_until) > Date.now())),
        candidates: candidates.filter(c => admin || c.approved || c.member_id === actor).map(c => ({ id: c.id, memberId: c.member_id, ...identity(c.members), manifesto: c.manifesto, approved: c.approved, eligible: c.members?.status === 'ACTIVE' && p.eligible_types.includes(c.members?.membership_type) })),
        total: votes.length, counts: admin || p.kind === 'articles' || p.phase === 'closed' ? counts : {},
        myVote: votes.find(v => v.member_id === actor)?.choices || votes.find(v => v.member_id === actor)?.choice || null,
        voters: admin || p.kind === 'articles' ? votes.map(v => ({ ...identity(v.members), votedAt: v.created_at })) : []
      };
    }));
    const audit = admin ? await dbSelect('governance_audit', 'select=id,poll_id,actor,operation,created_at&order=created_at.desc&limit=100') : undefined;
    return res.status(200).json({ polls: summaries, ...(admin ? { audit } : {}) });
  } catch (error) {
    if (!error.statusCode) console.error('[governance]', error.message);
    return res.status(error.statusCode || 503).json({ error: error.statusCode ? error.message : 'Voting is temporarily unavailable. Please try again.' });
  }
}
