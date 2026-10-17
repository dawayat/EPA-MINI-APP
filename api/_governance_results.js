export function electionResults(candidates,counts,seats=3) {
 const sorted=candidates.filter(c=>c.approved).map(c=>({...c,votes:counts[c.id]||0})).sort((a,b)=>b.votes-a.votes||a.name.localeCompare(b.name));
 return sorted.map((c,index)=>{const first=sorted.findIndex(x=>x.votes===c.votes),last=sorted.findLastIndex(x=>x.votes===c.votes);return {candidateId:c.id,name:c.name,votes:c.votes,rank:first+1,status:c.votes===0?'no_votes':first<seats&&last>=seats?'tie':last<seats?'elected':'not_elected'};});
}
