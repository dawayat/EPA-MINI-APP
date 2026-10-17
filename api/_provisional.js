import { dbSelect, dbUpdate, supabaseHeaders, supabaseUrl } from './_db.js';
import { hashPassword } from './_password.js';
const fail=(code,message)=>Object.assign(new Error(message),{statusCode:code});
export async function createTemporaryMember(body,admin) {
 const fullName=String(body.fullName||'').trim().replace(/\s+/g,' '),email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
 if(fullName.length<3||fullName.length>160||!fullName.includes(' '))throw fail(400,'Enter the member’s full name.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw fail(400,'Enter a valid email address.');
 if(password.length<10||password.length>128)throw fail(400,'Use a password of 10 to 128 characters.');
 const response=await fetch(supabaseUrl('rpc/temporary_member_create'),{method:'POST',headers:supabaseHeaders(),body:JSON.stringify({p_name:fullName,p_email:email,p_password_hash:hashPassword(password),p_admin:admin})});
 const data=await response.json();if(!response.ok){if(data.code==='P0001'||data.code==='23505')throw fail(409,'An account already exists with this email. Use the existing member account.');throw new Error('Temporary member creation failed.');}return data;
}
export async function approveProvisionalMember(applicationId,row) {
 const [app]=await dbSelect('applications',`id=eq.${encodeURIComponent(applicationId)}&limit=1`);
 if(!app?.provisional_member_id)throw fail(400,'The linked registration application was not found.');
 const [member]=await dbSelect('members',`id=eq.${encodeURIComponent(app.provisional_member_id)}&limit=1`);
 if(!member?.registration_required)throw fail(409,'This account no longer requires registration.');
 const complete=app.membership_type==='FULL'&&app.photo_url&&app.phone&&app.city&&app.gender&&app.date_of_birth&&app.degree_certificate_url&&app.id_document_url&&app.agreed_to_ethics&&app.email_verified&&app.payment?.receipt_url&&app.qualifications?.some(q=>q.field&&q.institution&&q.degree_level);
 if(!complete||String(app.email).toLowerCase()!==String(member.email).toLowerCase())throw fail(400,'Complete the normal full-member registration, documents, verified email, ethics agreement and payment before approval.');
 if(!['SUBMITTED','UNDER_REVIEW','APPROVED'].includes(app.status))throw fail(409,'This application is not ready for approval.');
 const update={...row,id:member.id,email:member.email,membership_type:'FULL',registration_required:false,voting_access_until:null,onboarding_completed:true,must_change_password:false};
 if(app.phone_password)update.phone_password=app.phone_password.startsWith('scrypt$') ? app.phone_password : hashPassword(app.phone_password);else delete update.phone_password;
 delete update.verification_token; // Preserve the original identity and all ballots.
 await dbUpdate('members',update,'id',member.id);
 return {success:true,id:member.id,member:{...member,...update,phone_password:undefined}};
}
