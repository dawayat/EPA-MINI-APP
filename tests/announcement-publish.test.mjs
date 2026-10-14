import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import handler from '../api/announcements.js';
import { createAdminSession } from '../api/_admin.js';
import { buildAnnouncement, announcementAttachments } from '../shared/announcement-payload.js';
import { announcementRecipients, parseEmailContacts } from '../shared/announcement-recipients.js';
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=';
const input={title:'Annual conference',content:'Dear EPA Members,\n\nAssembly at Sapphire Hotel.',category:'Event',location_url:'https://maps.app.goo.gl/test',location_name:'Sapphire Addis Hotel',location_address:'Addis Ababa',map_image_url:pixel,cover_photo_url:pixel,venue_photo_layout:'right',venue_photo_crop_url:pixel,email_notify:true,publish_to_telegram:false};
const members=[{id:'m1',first_name:'First',father_name:'Member',email:'member@example.org'},{id:'m2',first_name:'Second',father_name:'Member',email:'reject@example.org'}];
const contacts=[{email:'MEMBER@example.org',display_name:'Duplicate'},{email:'extra@example.org',display_name:'Additional Contact',is_active:true}];
const response=()=>({statusCode:0,setHeader(){},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});

test('publish preserves all preview fields, including the chosen layout, map, crop and email switch',()=>{
  const announcement=buildAnnouncement(input);
  for(const key of ['location_url','location_name','location_address','map_image_url','venue_photo_layout','venue_photo_crop_url','email_notify']) assert.equal(announcement[key],input[key]);
  assert.equal(buildAnnouncement({...input,email_notify:false}).email_notify,false);
  const attachments=announcementAttachments(announcement);
  assert.equal(attachments.find(x=>x.type==='cover').layout,'right');
  assert.equal(attachments.find(x=>x.type==='cover').right_url,pixel);
  assert.equal(attachments.find(x=>x.type==='location').map_image_url,pixel);
});

test('recipient lists deduplicate emails and respect explicit selection',()=>{
  assert.equal(announcementRecipients(members,contacts).length,3);
  assert.deepEqual(announcementRecipients(members,contacts,['m1']).map(x=>x.email),['member@example.org']);
  assert.deepEqual(announcementRecipients(members,contacts,[]),[]);
  const parsed=parseEmailContacts('1. <one@example.org>\n2. First Person <two@example.edu>,\n3. "Prof. Second Person" <three@example.edu>,\n4. Third Person <four@example.org>,\n5. five@example.org,\n6. "six@example.org" <six@example.org>,\n7. "seven@example.org" <seven@example.org>,\n8. Fourth Person <eight@example.edu>,\n9. Fifth Person <nine@example.org>,\n10. "ten@example.org" <ten@example.org>');
  assert.equal(parsed.length,10);
  assert.equal(parsed.find(x=>x.email==='two@example.edu').display_name,'First Person');
});

test('real publish handler sends the current design in both modes, reports rejection, and never silently broadcasts an empty selection',async()=>{
  const keys=['EPA_ADMIN_USERNAME','EPA_ADMIN_PASSWORD','EPA_ADMIN_SESSION_SECRET','GMAIL_USER','GMAIL_APP_PASSWORD','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ANNOUNCEMENT_BCC_ALL'];
  const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  Object.assign(process.env,{EPA_ADMIN_USERNAME:'test-admin',EPA_ADMIN_PASSWORD:'test-password',EPA_ADMIN_SESSION_SECRET:'test-secret',GMAIL_USER:'sender@example.org',GMAIL_APP_PASSWORD:'test-password',SUPABASE_URL:'https://database.test',SUPABASE_SERVICE_ROLE_KEY:'test-key'});
  const originalTransport=nodemailer.createTransport;const originalFetch=globalThis.fetch;
  let sent=[],saved=[],queried=[],contactWrites=[];
  nodemailer.createTransport=()=>({sendMail:async options=>{sent.push(options);return {messageId:'test-message',rejected:(options.to==='reject@example.org'||options.bcc?.includes('reject@example.org'))?['reject@example.org']:[]};}});
  globalThis.fetch=async(url,options={})=>{
    const parsed=new URL(url);const table=parsed.pathname.split('/').pop();queried.push({table,method:options.method||'GET'});
    if(table==='members')return new Response(JSON.stringify(members));
    if(table==='announcement_email_contacts'&&options.method==='POST'){contactWrites.push(JSON.parse(options.body));return new Response('',{status:201});}
    if(table==='announcement_email_contacts')return new Response(JSON.stringify(contacts));
    if(table==='announcements'&&options.method==='POST'){saved.push(JSON.parse(options.body));return new Response('',{status:201});}
    throw new Error('Unexpected external request: '+table);
  };
  const token=createAdminSession().token;
  async function invoke(extra={}){
    sent=[];saved=[];queried=[];
    const announcement=buildAnnouncement({...input,...extra});const res=response();
    await handler({method:'POST',headers:{authorization:'Bearer '+token},body:{...announcement,type:announcement.category,attachments:announcementAttachments(announcement)}},res);
    return res;
  }
  try{
    for(const grouped of [false,true]){
      process.env.ANNOUNCEMENT_BCC_ALL=String(grouped);
      const res=await invoke();assert.equal(res.statusCode,201);
      assert.equal(res.body.emailed,2);assert.equal(res.body.emailReport.length,3);
      assert.equal(res.body.emailReport.find(x=>x.email==='reject@example.org').status,'failed');assert.ok(res.body.emailError);
      assert.equal(sent.length,grouped?1:3);
      for(const message of sent){assert.ok(message.html.includes('class="epa-email-photo"'));assert.ok(message.html.includes('cid:location-map@epa'));assert.ok(message.html.includes(input.content.split('\n')[0]));assert.equal(message.attachments.length,2);}
      assert.equal(saved[0].attachments.find(x=>x.type==='cover').layout,'right');
      if(grouped)assert.equal(sent[0].bcc.split(',').length,3);
    }
    const originalContacts=contacts.slice();
    contacts.push(...Array.from({length:51},(_,index)=>({email:'batch'+index+'@example.org',display_name:'Batch contact'})));
    process.env.ANNOUNCEMENT_BCC_ALL='true';
    const large=await invoke();
    assert.equal(large.body.emailReport.length,54);
    assert.equal(large.body.emailed,53);
    assert.equal(sent.length,2);
    assert.ok(sent.every(message=>message.bcc.split(',').length<=49));
    contacts.splice(0,contacts.length,...originalContacts);
    process.env.ANNOUNCEMENT_BCC_ALL='false';
    const selected=await invoke({recipient_member_ids:['m1']});assert.equal(selected.body.emailed,1);assert.equal(sent[0].to,'member@example.org');assert.ok(!queried.some(x=>x.table==='announcement_email_contacts'));
    const malformed=await invoke({recipient_member_ids:'m1'});assert.equal(malformed.statusCode,400);assert.equal(saved.length,0);assert.equal(sent.length,0);
    const empty=await invoke({recipient_member_ids:[]});assert.equal(empty.statusCode,400);assert.equal(saved.length,0);assert.equal(sent.length,0);
    const disabled=await invoke({email_notify:false});assert.equal(disabled.statusCode,201);assert.equal(saved.length,1);assert.equal(sent.length,0);assert.ok(!queried.some(x=>x.table==='members'));
    delete process.env.GMAIL_APP_PASSWORD;
    const notConfigured=await invoke();assert.equal(notConfigured.statusCode,503);assert.equal(saved.length,0);assert.equal(sent.length,0);
    process.env.GMAIL_APP_PASSWORD='test-password';
    sent=[];saved=[];queried=[];
    const res=response();
    await handler({method:'POST',query:{action:'contacts'},headers:{authorization:'Bearer '+token},body:{contacts:[{email:'member@example.org'},{email:'fresh@example.org',display_name:'New Contact'}]}},res).catch(error=>{throw error;});
    assert.equal(res.statusCode,201);
    assert.deepEqual(res.body.added,['fresh@example.org']);
    assert.deepEqual(res.body.skipped,['member@example.org']);
    assert.equal(contactWrites.length,1);
    assert.deepEqual(contactWrites[0],[{email:'fresh@example.org',display_name:'New Contact'}]);
    assert.equal(sent.length,0);
    assert.ok(!queried.some(x=>x.table==='members'&&x.method==='POST'));
    const unauthorized=response();
    await handler({method:'POST',query:{action:'contacts'},headers:{},body:{contacts:[{email:'unauthorized@example.org'}]}},unauthorized);
    assert.equal(unauthorized.statusCode,401);
    assert.equal(contactWrites.length,1);
  }finally{
    nodemailer.createTransport=originalTransport;globalThis.fetch=originalFetch;
    for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
  }
});
