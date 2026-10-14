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

export async function sendEmail({ to, bcc, subject, html, text, attachments = [] }) {
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
    const mailOptions = {
      from,
      to,
      replyTo: process.env.GMAIL_USER,
      subject,
      html,
      attachments,
      text: text || 'This is an official email from the Ethiopian Psychologists\' Association.',
      headers: { 'X-Entity-Ref-ID': `epa-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }
    };
    if (bcc) mailOptions.bcc = bcc;
    const result = await transporter.sendMail(mailOptions);
    return { provider: 'gmail', messageId: result.messageId };
  }

  const body = { from: process.env.EMAIL_FROM, to: [to], reply_to: process.env.GMAIL_USER || undefined, subject, html, text: text || undefined };
  if (attachments.length) body.attachments = attachments.map(a => ({ filename: a.filename, content: a.content.toString('base64'), content_id: a.cid }));
  if (bcc) body.bcc = bcc.split(',').map(e => e.trim()).filter(Boolean);
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
      body: `<p>Hello ${escapeHtml(name)},</p><p>We have received your EPA membership application and it is now with the membership review team.</p><p style="background:#f3f8ef;border-left:3px solid #1d5b35;border-radius:8px;padding:14px"><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p><p>We will update you within <b>1–2 working days</b>. Once approved, you can access your portal with your registered email or phone number and password, or through Telegram when available.</p>`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name},\n\nWe received your membership application (${applicationNumber}). Our membership review team will update you within 1–2 working days.`
  };
}

export function applicationStatusEmail(name, applicationNumber, status, note) {
  const statusText = status === 'APPROVED'
    ? 'Your EPA membership has been approved'
    : status === 'REJECTED'
      ? 'Your EPA membership application was not approved'
      : 'Your EPA application needs an update';
  return {
    subject: `${statusText} · ${applicationNumber}`,
    html: emailShell({
      eyebrow: 'EPA application update',
      title: statusText,
      body: `<p>Hello ${escapeHtml(name)},</p><p><b>Application reference:</b> ${escapeHtml(applicationNumber)}</p>${status === 'APPROVED' ? '<p>Your EPA membership has been approved. Your Digital ID and portal access are now ready. Sign in with your registered email or phone number and password, or open EPA through Telegram when available.</p>' : status === 'REJECTED' ? '<p>After review, we are unable to approve your EPA membership application at this time.</p>' : '<p>The EPA membership review team has reviewed your application and posted an update.</p>'}${note ? `<p style="background:#f3f8ef;border-left:3px solid #1d5b35;border-radius:8px;padding:14px"><b>Message from EPA:</b><br>${escapeHtml(note)}</p>` : ''}`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name},\n\n${statusText}.\nApplication reference: ${applicationNumber}${note ? `\n\nMessage from EPA: ${note}` : ''}`
  };
}

export function validateAnnouncementLocation(announcement) {
  const location = announcement.attachments?.find(a => a.type === 'location');
  if (!location) return;
  let url;
  try { url = new URL(location.url); } catch { throw new Error('Enter a valid Google Maps link.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || !((host === 'maps.app.goo.gl') || (host === 'goo.gl' && url.pathname.startsWith('/maps/')) || (host === 'maps.google.com') || ((host === 'google.com' || host === 'www.google.com') && url.pathname.startsWith('/maps')))) throw new Error('Use an HTTPS Google Maps share link.');
  if (!location.map_image_url) throw new Error('Upload a map screenshot so the map is visible in the email.');
}

export function announcementEmail(name, announcement, { preview = false } = {}) {
  validateAnnouncementLocation(announcement);
  const attachments = [];
  const image = (value, id) => {
    if (!value) return '';
    const match = String(value).match(/^data:image\/(jpeg|png|gif);base64,([A-Za-z0-9+/=]+)$/);
    if (match) {
      if (match[2].length > 2800000) throw new Error('Email image is too large. Upload a smaller image.');
      if (preview) return value;
      attachments.push({ filename: id + '.' + match[1], content: Buffer.from(match[2], 'base64'), cid: id + '@epa', contentType: 'image/' + match[1] });
      return 'cid:' + id + '@epa';
    }
    throw new Error('Please upload the email photo/map as a JPG, PNG or GIF.');
  };
  const location = announcement.attachments?.find(a => a.type === 'location');
  const cover = image(announcement.attachments?.find(a => a.type === 'cover')?.url || announcement.cover_photo_url, 'venue');
  const map = image(location?.map_image_url, 'location-map');
  const link = escapeHtml(location?.url || '');
  const venueName = escapeHtml(location?.name || 'Event venue');
  const photoHtml = cover ? `<tr><td style="padding:0 28px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><img src="${escapeHtml(cover)}" width="584" alt="${location ? venueName : 'Announcement'} photo" style="display:block;border:0;border-radius:12px;width:100%;max-width:584px;height:auto"></td></tr>${location ? '<tr><td style="padding:10px 0 0;color:#6e796f;font-size:12px">' + venueName + ' &middot; We look forward to welcoming you</td></tr>' : ''}</table></td></tr>` : '';
  const locationHtml = location ? `<tr><td style="padding:4px 28px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dce5d9;border-radius:12px;background:#f7faf4"><tr><td style="padding:24px 20px 18px"><div style="font-size:10px;letter-spacing:2px;color:#57754b;font-weight:bold">YOUR DESTINATION</div><h2 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:1.2;color:#173719;margin:10px 0">${venueName}</h2><p style="font-size:14px;color:#52604f;line-height:1.6;margin:0">${escapeHtml(location.address || '')}</p></td></tr><tr><td style="padding:0 20px"><a href="${link}" target="_blank"><img src="${escapeHtml(map)}" width="544" alt="Map of ${venueName} — click to open Google Maps" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px"></a></td></tr><tr><td style="padding:18px 20px 24px"><p style="font-size:12px;color:#6e796f;line-height:1.6;margin:0 0 16px">Tap the map to see the exact location and plan your journey.</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#1d5b35" style="border-radius:8px;text-align:center"><a href="${link}" target="_blank" style="display:inline-block;border:1px solid #1d5b35;border-radius:8px;color:#ffffff;padding:15px 22px;font-size:14px;line-height:1.3;text-decoration:none;font-weight:bold">Open location in Google Maps &rarr;</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#6e796f;margin:14px 0 0">Map not visible? The button above always provides the location link.<br><a href="${link}" target="_blank" style="color:#1d5b35;text-decoration:underline">Open the location directly</a></p></td></tr></table></td></tr>` : '';
  const content = String(announcement.content || '');
  const formattedContent = escapeHtml(content).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>').split(/\n\s*\n/).map(paragraph => '<p style="margin:0 0 18px">' + paragraph.replace(/\n/g, '<br>') + '</p>').join('');
  const greeting = /^\s*(Dear|Hello)\b/i.test(content) ? '' : '<p style="margin:0 0 16px">Hello ' + escapeHtml(name || 'EPA member') + ',</p>';
  const baseUrl = appUrl();
  const portalHtml = baseUrl ? '<a href="' + escapeHtml(baseUrl) + '" style="color:#1d5b35;font-weight:bold;text-decoration:underline">Visit the EPA member portal &rarr;</a>' : '';
  return {
    subject: 'EPA News · ' + announcement.title,
    attachments,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 8px;background:#eef2eb;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #dce5d9;border-radius:16px"><tr><td style="background:#173719;border-radius:16px 16px 0 0;padding:28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:14px">${baseUrl ? '<img src="' + escapeHtml(baseUrl) + '/epa-logo.png" width="48" height="48" alt="EPA" style="display:block;border:0;border-radius:50%">' : '<div style="color:#e2cf8e;font-family:Georgia,serif;font-size:28px">EPA</div>'}</td><td style="color:#ffffff;font-size:15px;font-weight:bold;line-height:1.5">Ethiopian Psychologists’ Association<br><span style="color:#c5d2be;font-size:10px;font-weight:normal;letter-spacing:1.5px">CONNECTING MEMBERS · ADVANCING PSYCHOLOGY</span></td></tr></table></td></tr><tr><td style="padding:32px 28px 24px"><div style="font-size:10px;letter-spacing:2px;color:#57754b;font-weight:bold">${escapeHtml(announcement.category || announcement.type || 'Association').toUpperCase()} · OFFICIAL ANNOUNCEMENT</div><h1 style="font-family:Georgia,Times,serif;font-weight:normal;color:#173719;font-size:34px;line-height:1.2;margin:14px 0 18px">${escapeHtml(announcement.title)}</h1><table role="presentation" width="54" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#c5ac62" style="font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>${photoHtml}<tr><td style="padding:0 28px 20px;color:#465247;font-size:15px;line-height:1.8">${greeting}${formattedContent}</td></tr>${locationHtml}<tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.7;color:#6e796f">${portalHtml}</td></tr><tr><td style="padding:22px 28px;border-top:1px solid #e7ece3;background:#f7faf4;border-radius:0 0 16px 16px;color:#718073;font-size:11px;line-height:1.7"><b style="color:#465247">Ethiopian Psychologists’ Association</b><br>Established 1992 · Official member communication<br>Questions about the event? Reply to this email.</td></tr></table></td></tr></table></body></html>`,
    text: 'Ethiopian Psychologists’ Association\n\n' + announcement.title + '\n\n' + (announcement.content || '') + (location ? '\n\nLocation: ' + (location.name || '') + '\n' + (location.address || '') + '\nOpen Google Maps: ' + location.url : '')
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

export function passwordResetEmail(name, code) {
  return {
    subject: 'Reset your EPA member portal password',
    html: emailShell({
      eyebrow: 'EPA Account Security',
      title: 'Reset your password',
      body: `<p>Hello ${escapeHtml(name || 'EPA Member')},</p><p>We received a request to reset your EPA member portal password. Enter the verification code below to set a new password:</p><div style="background:#f3f8ef;border:1px solid #cddfc7;border-radius:12px;color:#173719;font-family:Arial,Helvetica,sans-serif;font-size:27px;font-weight:700;letter-spacing:6px;margin:22px 0;padding:18px;text-align:center">${escapeHtml(code)}</div><p>This code will expire in <b>15 minutes</b>. If you did not request this password reset, please ignore this email or notify the EPA Secretariat.</p>`
    }),
    text: `Ethiopian Psychologists’ Association\n\nHello ${name || 'EPA Member'},\n\nEnter this 6-digit confirmation code to reset your EPA password: ${code}\n\nThis code expires in 15 minutes. If you did not request this, you can ignore this message.`
  };
}
