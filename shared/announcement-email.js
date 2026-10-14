// Shared by the live composer preview and the outgoing email. No network or delivery side effects.
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

export function validateAnnouncementLocation(announcement) {
  const location = announcement.attachments?.find(a => a.type === 'location');
  if (!location) return;
  let url;
  try { url = new URL(location.url); } catch { throw new Error('Enter a valid Google Maps link.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || !((host === 'maps.app.goo.gl') || (host === 'goo.gl' && url.pathname.startsWith('/maps/')) || (host === 'maps.google.com') || ((host === 'google.com' || host === 'www.google.com') && url.pathname.startsWith('/maps')))) throw new Error('Use an HTTPS Google Maps share link.');
  if (!location.map_image_url) throw new Error('Upload a map screenshot so the map is visible in the email.');
}

export function renderAnnouncementEmail(name, announcement, { preview = false, baseUrl = '' } = {}) {
  if (!preview) validateAnnouncementLocation(announcement);
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
  const venuePhoto = announcement.attachments?.find(a => a.type === 'cover');
  const rightLayout = venuePhoto?.layout === 'right';
  const cover = image((rightLayout ? venuePhoto?.right_url || venuePhoto?.url : venuePhoto?.url) || announcement.cover_photo_url, 'venue');
  const map = image(location?.map_image_url, 'location-map');
  let safeLink = '';
  try { validateAnnouncementLocation({ attachments: location ? [{ ...location, map_image_url: 'preview' }] : [] }); safeLink = location?.url || ''; } catch {}
  const link = escapeHtml(safeLink);
  const venueName = escapeHtml(location?.name || 'Event venue');
  const photoHtml = cover ? `<tr><td style="padding:0 28px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><img src="${escapeHtml(cover)}" width="584" alt="${location ? venueName : 'Announcement'} photo" style="display:block;border:0;border-radius:12px;width:100%;max-width:584px;height:auto"></td></tr>${location ? '<tr><td style="padding:12px 2px 0;color:#6e796f;font-size:12px;line-height:1.5">' + venueName + ' &middot; We look forward to welcoming you</td></tr>' : ''}</table></td></tr>` : '';
  const locationHtml = location ? `<tr><td style="padding:4px 28px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dce5d9;border-radius:12px;background:#f7faf4"><tr><td style="padding:24px 20px 18px"><div style="font-size:10px;letter-spacing:2px;color:#57754b;font-weight:bold">YOUR DESTINATION</div><h2 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:1.2;color:#173719;margin:10px 0">${venueName}</h2><p style="font-size:14px;color:#52604f;line-height:1.6;margin:0">${escapeHtml(location.address || '')}</p></td></tr><tr><td style="padding:0 20px">${map ? '<a href="' + link + '" target="_blank"><img src="' + escapeHtml(map) + '" width="544" alt="Map of ' + venueName + ' — click to open Google Maps" style="display:block;width:100%;max-width:544px;height:auto;border:0;border-radius:8px"></a>' : '<p style="padding:28px;text-align:center;background:#eaf0e4;color:#57754b;border-radius:8px">Upload the map screenshot to add a visible map here.</p>'}</td></tr><tr><td style="padding:18px 20px 24px"><p style="font-size:12px;color:#6e796f;line-height:1.6;margin:0 0 16px">Tap the map to see the exact location and plan your journey.</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#1d5b35" style="border-radius:8px;text-align:center"><a href="${link}" target="_blank" style="display:inline-block;border:1px solid #1d5b35;border-radius:8px;color:#ffffff;padding:15px 22px;font-size:14px;line-height:1.3;text-decoration:none;font-weight:bold">Open location in Google Maps &rarr;</a></td></tr></table><p style="font-size:12px;line-height:1.6;color:#6e796f;margin:14px 0 0">Map not visible? The button above always provides the location link.<br><a href="${link}" target="_blank" style="color:#1d5b35;text-decoration:underline">Open the location directly</a></p></td></tr></table></td></tr>` : '';
  const content = String(announcement.content || '');
  if (!preview && (!String(announcement.title || '').trim() || !content.trim())) throw new Error('Add an announcement title and message before sending.');
  const formattedContent = escapeHtml(content).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>').split(/\n\s*\n/).map(paragraph => '<p style="margin:0 0 18px">' + paragraph.replace(/\n/g, '<br>') + '</p>').join('');
  const greeting = /^\s*(Dear|Hello)\b/i.test(content) ? '' : '<p style="margin:0 0 16px">Hello ' + escapeHtml(name || 'EPA member') + ',</p>';
  const portalHtml = baseUrl ? '<a href="' + escapeHtml(baseUrl) + '" style="color:#1d5b35;font-weight:bold;text-decoration:underline">Visit the EPA member portal &rarr;</a>' : '';
  const messageBody = greeting + (content.trim() ? formattedContent : '<p style="padding:18px;background:#f7faf4;color:#718073;border-radius:8px">Write your announcement message above. It will appear here as you type.</p>');
  const messageHtml = rightLayout && cover
    ? `<tr><td style="padding:0 28px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="epa-email-copy" width="50%" valign="top" style="width:50%;vertical-align:top;padding-right:20px;color:#465247;font-size:14px;line-height:1.8">${messageBody}</td><td class="epa-email-photo" width="50%" valign="top" style="width:50%;vertical-align:top"><img src="${escapeHtml(cover)}" width="272" alt="${venueName} photo — right-half crop" style="display:block;border:0;border-radius:12px;width:100%;max-width:272px;height:auto"><p style="font-size:11px;line-height:1.6;color:#6e796f;margin:12px 2px 0">${venueName}</p></td></tr></table></td></tr>`
    : photoHtml + `<tr><td style="padding:0 28px 20px;color:#465247;font-size:15px;line-height:1.8">${messageBody}</td></tr>`;
  return {
    subject: 'EPA News · ' + announcement.title,
    attachments,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media screen and (max-width:600px){.epa-email-copy,.epa-email-photo{display:block!important;width:100%!important;box-sizing:border-box!important}.epa-email-copy{padding-right:0!important}.epa-email-photo{padding-top:20px!important}.epa-email-photo img{max-width:100%!important}}</style></head><body style="margin:0;padding:24px 8px;background:#eef2eb;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #dce5d9;border-radius:16px"><tr><td style="background:#173719;border-radius:16px 16px 0 0;padding:28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:14px">${baseUrl ? '<img src="' + escapeHtml(baseUrl) + '/epa-logo.png" width="48" height="48" alt="EPA" style="display:block;border:0;border-radius:50%">' : '<div style="color:#e2cf8e;font-family:Georgia,serif;font-size:28px">EPA</div>'}</td><td style="color:#ffffff;font-size:15px;font-weight:bold;line-height:1.5">Ethiopian Psychologists’ Association<br><span style="color:#c5d2be;font-size:10px;font-weight:normal;letter-spacing:1.5px">CONNECTING MEMBERS · ADVANCING PSYCHOLOGY</span></td></tr></table></td></tr><tr><td style="padding:32px 28px 24px"><div style="font-size:10px;letter-spacing:2px;color:#57754b;font-weight:bold">${escapeHtml(announcement.category || announcement.type || 'Association').toUpperCase()} · OFFICIAL ANNOUNCEMENT</div><h1 style="font-family:Georgia,Times,serif;font-weight:normal;color:#173719;font-size:34px;line-height:1.2;margin:14px 0 18px">${escapeHtml(announcement.title)}</h1><table role="presentation" width="54" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#c5ac62" style="font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>${messageHtml}${locationHtml}<tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.7;color:#6e796f">${portalHtml}</td></tr><tr><td style="padding:22px 28px;border-top:1px solid #e7ece3;background:#f7faf4;border-radius:0 0 16px 16px;color:#718073;font-size:11px;line-height:1.7"><b style="color:#465247">Ethiopian Psychologists’ Association</b><br>Established 1992 · Official member communication<br>Questions about the event? Reply to this email.</td></tr></table></td></tr></table></body></html>`,
    text: 'Ethiopian Psychologists’ Association\n\n' + announcement.title + '\n\n' + (announcement.content || '') + (location ? '\n\nLocation: ' + (location.name || '') + '\n' + (location.address || '') + '\nOpen Google Maps: ' + location.url : '')
  };
}

