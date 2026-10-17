import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/_governance.js';
import { createMemberSession } from '../api/_member_session.js';
import { createAdminSession } from '../api/_admin.js';
test('governance authenticates identities, limits operations, hides election choices and uses trusted RPC actors',async()=>{
 process.env.EPA_MEMBER_SESSION_SECRET='test-member-secret';process.env.EPA_ADMIN_SESSION_SECRET='test-admin-secret';process.env.EPA_ADMIN_USERNAME='admin';process.env.EPA_ADMIN_PASSWORD='test';
 const original=global.fetch;let lastRpc,phase='voting',status='ACTIVE',kind='election',type='FULL',articlesEnabled=true,visibility='private';
 global.fetch=async(url,options={})=>{
  const address=String(url);
  if(address.includes('/rpc/governance_action')){lastRpc=JSON.parse(options.body);return Response.json({success:true});}
  if(address.includes('/members?'))return Response.json([{id:'m1',status,membership_type:type}]);
  if(address.includes('/governance_polls?'))return Response.json([{id:'poll',title:'Test ballot',kind,phase,voter_visibility:visibility,eligible_types:['FULL']}]);
  if(address.includes('/governance_candidates?'))return Response.json([{id:'c1',member_id:'m2',approved:true,manifesto:'A statement',members:{first_name:'Candidate',father_name:'One',status:'ACTIVE',membership_type:'FULL'}}]);
  if(address.includes('/governance_votes?'))return Response.json([{member_id:'m2',choice:'c1',created_at:'2026-10-17',members:{first_name:'Voter',father_name:'Two',membership_number:'EPA002'}}]);
  if(address.includes('/bylaws_settings?'))return Response.json([{enabled:articlesEnabled}]);
  if(address.includes('/bylaws_access?')||address.includes('/governance_audit?'))return Response.json([]);
  throw Error('Unexpected request');
 };
 const call=async({token,admin=false,memberId='m1',body}={})=>{const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(v){this.data=v;return this;}};await handler({method:body?'POST':'GET',query:{admin:String(admin),memberId},headers:token?{authorization:`Bearer ${token}`}:{},body},res);assert.match(res.headers['Cache-Control'],/no-store/);return res;};
 try{
 const token=createMemberSession('m1').token,adminToken=createAdminSession().token;
 assert.equal((await call()).code,401);
 assert.equal((await call({token,memberId:'m2'})).code,401);
 assert.equal((await call({token,admin:true})).code,401);
 assert.equal((await call({token,body:{operation:'phase',phase:'voting'}})).code,400);
 const live=(await call({token})).data.polls[0];assert.deepEqual(live.counts,{});assert.deepEqual(live.voters,[]);assert.equal(live.myVote,null);
 assert.equal((await call({token,body:{operation:'vote',pollId:'poll',choice:'c1',p_admin:true,memberId:'m2'}})).code,200);assert.equal(lastRpc.p_actor,'m1');assert.equal(lastRpc.p_admin,false);
 status='EXPIRED';assert.equal((await call({token,body:{operation:'vote'}})).code,403);status='ACTIVE';
 type='STUDENT';assert.equal((await call({token})).data.polls[0].eligible,false);assert.equal((await call({token,body:{operation:'nominate'}})).code,403);assert.equal((await call({token,body:{operation:'vote'}})).code,403);type='FULL';
 phase='closed';assert.equal((await call({token})).data.polls[0].counts.c1,1);
 assert.equal('voters' in (await call({token})).data.polls[0].candidates[0],false);
 visibility='members';phase='voting';assert.equal((await call({token})).data.polls[0].candidates[0].voters[0].name,'Voter Two');assert.equal((await call({token})).data.polls[0].counts.c1,1);
 phase='closed';assert.equal((await call({token})).data.polls[0].candidates[0].voters[0].name,'Voter Two');
 assert.equal((await call({token:adminToken,admin:true})).data.polls[0].candidates[0].voters[0].name,'Voter Two');
 visibility='private';assert.equal('voters' in (await call({token:adminToken,admin:true})).data.polls[0].candidates[0],false);
 kind='articles';const articles=(await call({token})).data.polls[0];assert.equal(articles.voters[0].name,'Voter Two');assert.equal('choice' in articles.voters[0],false);
 articlesEnabled=false;assert.equal((await call({token})).data.polls.length,0);
 const admin=(await call({token:adminToken,admin:true})).data;assert.equal(admin.polls[0].total,1);
 }finally{global.fetch=original;}
});
