const RESEND_API_URL = 'https://api.resend.com/emails';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function emailShell({ eyebrow, title, body, actionLabel, actionUrl, footer = 'Ethiopian Psychologists’ Association · Established 1992' }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f5f2;font-family:Arial,sans-serif;color:#152016"><div style="max-width:620px;margin:32px auto;background:#ffffff;border:1px solid #dde3da;border-radius:22px;overflow:hidden"><div style="padding:28px 32px;background:linear-gradient(135deg,#153a1a,#09130a);color:#ffffff"><div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:#d4ff00;text-transform:uppercase">${escapeHtml(eyebrow)}</div><h1 style="margin:10px 0 0;font-size:26px;line-height:1.15">${escapeHtml(title)}</h1></div><div style="padding:30px 32px;font-size:15px;line-height:1.65;color:#465247">${body}${actionLabel && actionUrl ? `<p style="margin:26px 0 4px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#d4ff00;color:#0b160c;padding:13px 18px;border-radius:10px;font-weight:800;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:.5px">${escapeHtml(actionLabel)}</a></p>` : ''}</div><div style="padding:17px 32px;border-top:1px solid #e8ece6;font-size:11px;color:#798278">${escapeHtml(footer)}</div></div></body></html>`;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured()) throw new Error('Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM to Vercel.');
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html })
  });
  if (!response.ok) throw new Error(`Email provider failed: ${await response.text()}`);
  return response.json();
}

export function verificationEmail(name, code) {
  return {
    subject: 'Verify your EPA membership application email',
    html: emailShell({
      eyebrow: 'EPA Membership',
      title: 'Confirm your email address',
      body: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Use the confirmation code below to verify your email and submit your membership application.</p><div style="margin:22px 0;padding:18px;background:#f0ffe0;border:1px solid #ccefa2;border-radius:14px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:800;color:#173719">${escapeHtml(code)}</div><p>This code expires in 15 minutes. If you did not start an EPA application, you can safely ignore this email.</p>`
    })
  };
}

export function applicationReceivedEmail(name, applicationNumber) {
  return {
    subject: `EPA application received · ${applicationNumber}`,
    html: emailShell({
      eyebrow: 'Application received',
      title: 'Thank you — your application is under review',
      body: `<p>Hello ${escapeHtml(name)},</p><p>We have received your EPA membership application.</p><p style="padding:14px;background:#f6f8f4;border-radius:12px"><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p><p>Our accreditation team will review your submission and get back to you within <b>1–2 working days</b>. You can use your phone number and password to access your account, or Telegram sign-in once your membership is approved.</p>`
    })
  };
}

export function applicationStatusEmail(name, applicationNumber, status, note) {
  const statusText = status === 'APPROVED' ? 'Your EPA membership has been approved' : status === 'REJECTED' ? 'There is an update on your EPA application' : 'Your EPA application needs an update';
  return {
    subject: `${statusText} · ${applicationNumber}`,
    html: emailShell({
      eyebrow: 'EPA application update',
      title: statusText,
      body: `<p>Hello ${escapeHtml(name)},</p><p><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p>${status === 'APPROVED' ? '<p>Your Digital ID and member portal access are ready. Sign in with your registered phone number or email and password, or use Telegram when available.</p>' : '<p>The EPA Accreditation Team has updated your application record.</p>'}${note ? `<p style="padding:14px;background:#f6f8f4;border-radius:12px"><b>Message from EPA:</b><br>${escapeHtml(note)}</p>` : ''}`
    })
  };
}

export function announcementEmail(name, announcement) {
  return {
    subject: `EPA News · ${announcement.title}`,
    html: emailShell({
      eyebrow: `${announcement.category || 'Association'} announcement`,
      title: announcement.title,
      body: `<p>Hello ${escapeHtml(name || 'EPA member')},</p><p>${escapeHtml(announcement.content || '').replace(/\n/g, '<br>')}</p><p>Open the EPA member portal to join the discussion, add a comment, or vote on drafts.</p>`,
      actionLabel: 'Open EPA portal',
      actionUrl: process.env.APP_URL || process.env.VITE_APP_URL || undefined
    })
  };
}

export function memberInviteEmail(name, membershipNumber, temporaryPassword) {
  return {
    subject: 'Your EPA member account is ready',
    html: emailShell({
      eyebrow: 'EPA member access',
      title: 'Welcome to the EPA member portal',
      body: `<p>Hello ${escapeHtml(name)},</p><p>Your existing membership has been added to the EPA digital registry.</p><p style="padding:14px;background:#f6f8f4;border-radius:12px"><b>Membership number:</b> ${escapeHtml(membershipNumber)}<br><b>Temporary password:</b> ${escapeHtml(temporaryPassword)}</p><p>Sign in using this email address and temporary password. On first sign-in, you will create a new password and complete your profile, including your photo. Keep this password private.</p>`,
      actionLabel: 'Open member portal',
      actionUrl: process.env.APP_URL || process.env.VITE_APP_URL || undefined
    })
  };
}
