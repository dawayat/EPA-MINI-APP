import nodemailer from 'nodemailer';

const RESEND_API_URL = 'https://api.resend.com/emails';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function appUrl() {
  const configured = process.env.APP_URL || process.env.VITE_APP_URL || process.env.VERCEL_URL || '';
  if (!configured) return '';
  return configured.startsWith('http') ? configured.replace(/\/$/, '') : `https://${configured.replace(/\/$/, '')}`;
}

function emailShell({ eyebrow, title, body, actionLabel, actionUrl, footer = 'Ethiopian Psychologists’ Association · Established 1992' }) {
  const baseUrl = appUrl();
  const logoUrl = baseUrl ? `${baseUrl}/epa-logo.png` : '';
  const action = actionLabel && actionUrl ? `<tr><td style="padding:8px 32px 32px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#1d5b35;border-radius:9px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.1px;padding:13px 20px;text-decoration:none">${escapeHtml(actionLabel)}</a></td></tr>` : '';
  const logo = logoUrl ? `<img src="${escapeHtml(logoUrl)}" width="52" height="52" alt="EPA logo" style="border:0;border-radius:50%;display:block;height:52px;width:52px">` : '<div style="background:#d4ff00;border-radius:50%;color:#173719;font-size:17px;font-weight:800;height:52px;line-height:52px;text-align:center;width:52px">EPA</div>';
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light"></head><body style="background:#f4f6f3;margin:0;padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #dfe6df;border-radius:18px;max-width:620px;overflow:hidden;width:100%"><tr><td style="background:#173719;padding:24px 32px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding-right:14px">${logo}</td><td style="font-family:Arial,Helvetica,sans-serif"><div style="color:#d4ff00;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase">Official member service</div><div style="color:#ffffff;font-size:17px;font-weight:700;line-height:1.3;margin-top:3px">Ethiopian Psychologists’ Association</div></td></tr></table></td></tr><tr><td style="font-family:Arial,Helvetica,sans-serif;padding:30px 32px 8px"><div style="color:#5b6b5c;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase">${escapeHtml(eyebrow)}</div><h1 style="color:#18271a;font-size:25px;line-height:1.25;margin:10px 0 16px">${escapeHtml(title)}</h1><div style="color:#465247;font-size:15px;line-height:1.65">${body}</div></td></tr>${action}<tr><td style="border-top:1px solid #e7ece7;color:#718073;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;padding:17px 32px">${escapeHtml(footer)}<br>This is an official service email. Reply to this message if you need assistance.</td></tr></table></td></tr></table></body></html>`;
}

export function isEmailConfigured() {
  return Boolean(
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    (process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
  );
}

export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) throw new Error('Email delivery is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to Vercel, or configure Resend.');

  // Gmail SMTP is the primary no-domain option. Use a Google App Password,
  // never the Gmail account password. Resend remains available as a fallback.
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
    const gmailAddress = process.env.GMAIL_USER.trim().toLowerCase();
    const configuredAddress = (process.env.EMAIL_FROM || '').match(/<([^>]+)>|([^<>\s]+@[^<>\s]+)/)?.[1] || (process.env.EMAIL_FROM || '').trim();
    // Gmail only authorizes the connected account as the sender. Avoid a
    // mismatched From address, which looks suspicious to recipient filters.
    const from = configuredAddress.toLowerCase() === gmailAddress
      ? process.env.EMAIL_FROM
      : `EPA Membership <${process.env.GMAIL_USER}>`;
    const result = await transporter.sendMail({
      from,
      to,
      replyTo: process.env.GMAIL_USER,
      subject,
      html,
      text: text || 'This is an official email from the Ethiopian Psychologists’ Association.',
      headers: { 'X-Entity-Ref-ID': `epa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }
    });
    return { provider: 'gmail', messageId: result.messageId };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], reply_to: process.env.GMAIL_USER || undefined, subject, html, text: text || undefined })
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
      body: `<p>Hello ${escapeHtml(name || 'there')},</p><p>Enter this confirmation code in the EPA application form to confirm this email address.</p><div style="background:#f3f8ef;border:1px solid #cddfc7;border-radius:12px;color:#173719;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:700;letter-spacing:6px;margin:22px 0;padding:18px;text-align:center">${escapeHtml(code)}</div><p>This code expires in 15 minutes. If you did not begin an EPA application, you can ignore this message.</p>`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name || 'there'},\n\nEnter this confirmation code in the EPA application form: ${code}\n\nThis code expires in 15 minutes. If you did not begin an EPA application, you can ignore this message.`
  };
}

export function applicationReceivedEmail(name, applicationNumber) {
  return {
    subject: `EPA application received · ${applicationNumber}`,
    html: emailShell({
      eyebrow: 'Application received',
      title: 'Thank you — your application is under review',
      body: `<p>Hello ${escapeHtml(name)},</p><p>We have received your EPA membership application and it is now with the accreditation team.</p><p style="background:#f3f8ef;border-left:3px solid #1d5b35;border-radius:8px;padding:14px"><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p><p>We will update you within <b>1–2 working days</b>. Once approved, you can access your portal with your registered email or phone number and password, or through Telegram when available.</p>`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name},\n\nWe received your membership application (${applicationNumber}). Our accreditation team will update you within 1–2 working days.`
  };
}

export function applicationStatusEmail(name, applicationNumber, status, note) {
  const statusText = status === 'APPROVED' ? 'Your EPA membership has been approved' : status === 'REJECTED' ? 'There is an update on your EPA application' : 'Your EPA application needs an update';
  return {
    subject: `${statusText} · ${applicationNumber}`,
    html: emailShell({
      eyebrow: 'EPA application update',
      title: statusText,
      body: `<p>Hello ${escapeHtml(name)},</p><p><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p>${status === 'APPROVED' ? '<p>Your membership has been approved. Your Digital ID and portal access are now ready. Sign in with your registered email or phone number and password, or open EPA through Telegram when available.</p>' : '<p>The EPA Accreditation Team has reviewed your application and posted an update.</p>'}${note ? `<p style="background:#f3f8ef;border-left:3px solid #1d5b35;border-radius:8px;padding:14px"><b>Message from EPA:</b><br>${escapeHtml(note)}</p>` : ''}`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name},\n\n${statusText}.\nApplication reference: ${applicationNumber}${note ? `\n\nMessage from EPA: ${note}` : ''}`
  };
}

export function announcementEmail(name, announcement) {
  return {
    subject: `EPA News · ${announcement.title}`,
    html: emailShell({
      eyebrow: `${announcement.category || 'Association'} announcement`,
      title: announcement.title,
      body: `<p>Hello ${escapeHtml(name || 'EPA member')},</p><p>${escapeHtml(announcement.content || '').replace(/\n/g, '<br>')}</p><p>You can open the EPA member portal to read the full update, join the discussion, or vote on a draft.</p>`,
      actionLabel: 'Open EPA portal',
      actionUrl: appUrl() || undefined
    }),
    text: `Ethiopian Psychologists’ Association\n\n${announcement.title}\n\n${announcement.content || ''}\n\nOpen the EPA member portal for the full update.`
  };
}

export function memberInviteEmail(name, membershipNumber, temporaryPassword) {
  return {
    subject: 'Your EPA member account is ready',
    html: emailShell({
      eyebrow: 'EPA member access',
      title: 'Welcome to the EPA member portal',
      body: `<p>Hello ${escapeHtml(name)},</p><p>Your existing membership has been added to the EPA digital registry.</p><p style="background:#f3f8ef;border-left:3px solid #1d5b35;border-radius:8px;padding:14px"><b>Membership number:</b> ${escapeHtml(membershipNumber)}<br><b>Temporary password:</b> ${escapeHtml(temporaryPassword)}</p><p>Sign in with this email address and temporary password. On first sign-in, you will choose a new password and complete only the profile details that are missing. Keep this temporary password private.</p>`,
      actionLabel: 'Open member portal',
      actionUrl: appUrl() || undefined
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name},\n\nYour existing membership is now in the EPA digital registry.\nMembership number: ${membershipNumber}\nTemporary password: ${temporaryPassword}\n\nSign in with this email address and temporary password, then choose a new password and complete your profile.`
  };
}
