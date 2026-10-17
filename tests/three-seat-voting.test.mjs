import test from 'node:test';import assert from 'node:assert/strict';
import { electionResults } from '../api/_governance_results.js';
import { hashPassword,verifyPassword } from '../api/_password.js';
import { createMemberSession,requireMemberSession } from '../api/_member_session.js';
import { createTemporaryMember,approveProvisionalMember } from '../api/_provisional.js';
test('three-seat results select leaders, preserve ties at the boundary and do not select zero-vote candidates',()=>{
 const candidates=['A','B','C','D','E'].map(id=>({id,name:id,approved:true}));
 assert.deepEqual(electionResults(candidates,{A:9,B:8,C:7,D:6},3).filter(r=>r.status==='elected').map(r=>r.candidateId),['A','B','C']);
 const tied=electionResults(candidates,{A:9,B:8,C:7,D:7},3);assert.deepEqual(tied.filter(r=>r.status==='tie').map(r=>r.candidateId),['C','D']);assert.equal(tied.filter(r=>r.status==='elected').length,2);
 assert.equal(electionResults(candidates,{},3).filter(r=>r.status==='elected').length,0);
});
test('new passwords are hashed and voting-only sessions cannot access full-member endpoints',()=>{
 const password='A temporary test password';const hash=hashPassword(password);assert.notEqual(hash,password);assert.ok(verifyPassword(password,hash));assert.equal(verifyPassword('wrong',hash),false);assert.ok(verifyPassword('legacy','legacy'));
 process.env.EPA_MEMBER_SESSION_SECRET='test-secret';const session=createMemberSession('m1','voting_only');const req={headers:{authorization:`Bearer ${session.token}`}};
 assert.throws(()=>requireMemberSession(req,'m1'),e=>e.statusCode===403);assert.equal(requireMemberSession(req,'m1',{allowVotingOnly:true}).scope,'voting_only');assert.throws(()=>requireMemberSession(req,'m2',{allowVotingOnly:true}),e=>e.statusCode===401);
});
test('temporary account creation uses server hashing, trusted admin identity and keeps credentials out of the response',async()=>{
 const original=global.fetch;let payload;global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return Response.json({id:'temp-1',success:true,votingAccessUntil:'2026-10-24'});};
 try{const result=await createTemporaryMember({fullName:'Example Full Member',email:'EXAMPLE@EXAMPLE.ORG',password:'A secure test password'},'admin');assert.equal(payload.p_email,'example@example.org');assert.equal(payload.p_admin,'admin');assert.ok(verifyPassword('A secure test password',payload.p_password_hash));assert.equal('password' in result,false);await assert.rejects(()=>createTemporaryMember({fullName:'Example Full Member',email:'invalid',password:'long-password'},'admin'),e=>e.statusCode===400);}finally{global.fetch=original;}
});
test('registration approval retains the existing voting identity and requires the normal application evidence',async()=>{
 const original=global.fetch;let update;const app={id:'app',provisional_member_id:'temp-1',membership_type:'FULL',status:'SUBMITTED',email:'example@example.org',photo_url:'photo',phone:'phone',city:'city',gender:'F',date_of_birth:'1990-01-01',degree_certificate_url:'degree',id_document_url:'id',agreed_to_ethics:true,email_verified:true,payment:{receipt_url:'receipt'},qualifications:[{field:'Psychology',institution:'University',degree_level:'BA'}]};
 global.fetch=async(url,options={})=>{if(options.method==='PATCH'){update=JSON.parse(options.body);return new Response(null,{status:204});}return Response.json(String(url).includes('/applications?')?[app]:[{id:'temp-1',email:'example@example.org',registration_required:true}]);};
 try{const result=await approveProvisionalMember('app',{id:'another-id',membership_number:'EPA-FULL',status:'ACTIVE'});assert.equal(result.id,'temp-1');assert.equal(update.id,'temp-1');assert.equal(update.registration_required,false);assert.equal(update.voting_access_until,null);app.id_document_url=null;await assert.rejects(()=>approveProvisionalMember('app',{}),e=>e.statusCode===400);}finally{global.fetch=original;}
});

test('temporary member can sign in with the assigned password and receives a restricted session',async()=>{
 const { default: auth }=await import('../api/auth.js');const original=global.fetch;process.env.EPA_MEMBER_SESSION_SECRET='test-secret';const stored=hashPassword('Assigned-password-123');
 global.fetch=async()=>Response.json([{id:'temporary-member',email:'temporary@example.invalid',phone_password:stored,registration_required:true,onboarding_completed:false,must_change_password:false,status:'ACTIVE',membership_type:'FULL',voting_access_until:new Date(Date.now()+86400000).toISOString()}]);
 const response={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(data){this.data=data;return this;}};
 try{await auth({method:'POST',body:{action:'login',identifier:'temporary@example.invalid',password:'Assigned-password-123'}},response);assert.equal(response.code,200);assert.equal(response.data.success,true);assert.equal(response.data.member.phone_password,undefined);const req={headers:{authorization:`Bearer ${response.data.session.token}`}};assert.equal(requireMemberSession(req,'temporary-member',{allowVotingOnly:true}).scope,'voting_only');assert.throws(()=>requireMemberSession(req,'temporary-member'),e=>e.statusCode===403);}finally{global.fetch=original;}
});
