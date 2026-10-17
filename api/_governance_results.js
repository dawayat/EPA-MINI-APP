export function electionResults(candidates,counts,seats=3) {
 const sorted=candidates.filter(c=>c.approved).map(c=>({...c,votes:counts[c.id]||0})).sort((a,b)=>b.votes-a.votes||a.name.localeCompare(b.name));
 return sorted.map((c,index)=>{const first=sorted.findIndex(x=>x.votes===c.votes),last=sorted.findLastIndex(x=>x.votes===c.votes);return {candidateId:c.id,name:c.name,votes:c.votes,rank:first+1,status:c.votes===0?'no_votes':first<seats&&last>=seats?'tie':last<seats?'elected':'not_elected'};});
}
export function articlesApproval(counts, total, phase) {
 const approvals = counts.approve || 0, required = Math.ceil(total * 2 / 3);
 const meetsThreshold = total > 0 && approvals * 3 >= total * 2;
 return { approvals, total, required, percentage: total ? approvals / total * 100 : 0, meetsThreshold,
   status: phase !== 'closed' ? 'pending' : total === 0 ? 'no_ballots' : meetsThreshold ? 'passed' : 'not_passed' };
}
