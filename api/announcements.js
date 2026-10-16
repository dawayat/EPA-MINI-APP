import handleAnnouncementContacts from './_announcement_contacts.js';
import handleCertificates from './_certificates.js';
import handleBylaws from './_bylaws.js';
import { announcementRecipients } from '../shared/announcement-recipients.js';
import { dbSelect, dbInsert, dbUpdate, cachePublic, cors } from './_db.js';
import { announcementEmail, validateAnnouncementLocation, isEmailConfigured, sendEmail } from './_email.js';
import { requireAdmin } from './_admin.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
const configuredTelegramAppLink = () => {
  // This is the EPA bot's verified Direct Mini App link. Telegram recognizes
  // it as an in-app launch, unlike a raw website/Vercel URL.
  const configuredLink = String(process.env.TELEGRAM_MINI_APP_LINK || '').trim();
  return configuredLink || 'https://t.me/EPAMINIAPP_bot/EPAPORTAL';
};

async function postToTelegram(a) {
  if (!a.publish_to_telegram) return { attempted: false, posted: false };
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!botToken || !channelId) return { attempted: false, posted: false, error: 'Telegram is not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID in Vercel.' };

  const buttonUrl = String(a.telegram_button_url || configuredTelegramAppLink()).trim();
  if (!buttonUrl.startsWith('https://t.me/')) return { attempted: false, posted: false, error: 'Use a Telegram Mini App link beginning with https://t.me/ for the channel button.' };
  const reply_markup = { inline_keyboard: [[{ text: String(a.telegram_button_label || 'Open EPA Mini App').slice(0, 64), url: buttonUrl }]] };
  const caption = `<b>${escapeHtml(a.title || 'EPA Update').slice(0, 180)}</b>\n\n${escapeHtml(a.content || '').slice(0, 760)}`;
  const mediaUrl = String(a.telegram_media_url || '').trim();
  const telegramFileId = String(a.telegram_media_file_id || '').trim();
  // A Telegram file ID refers to media Telegram already hosts for this bot.
  // Reusing it avoids a browser -> Vercel -> Telegram media transfer entirely.
  const mediaReference = telegramFileId || mediaUrl;
  const mediaType = a.telegram_media_type || (mediaUrl.startsWith('data:video/') ? 'video' : 'image');
  const endpoint = mediaReference ? (mediaType === 'video' ? 'sendVideo' : 'sendPhoto') : 'sendMessage';
  const url = `https://api.telegram.org/bot${botToken}/${endpoint}`;
  let response;
  if (mediaReference) {
    const payload = new FormData();
    payload.append('chat_id', channelId);
    payload.append('caption', caption);
    payload.append('parse_mode', 'HTML');
    payload.append('reply_markup', JSON.stringify(reply_markup));
    if (mediaUrl.startsWith('data:')) {
      const [header, encoded] = mediaUrl.split(',', 2);
      const mime = header.match(/data:([^;]+)/)?.[1] || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
      const binary = Buffer.from(encoded || '', 'base64');
      payload.append(mediaType === 'video' ? 'video' : 'photo', new Blob([binary], { type: mime }), mediaType === 'video' ? 'epa-announcement.mp4' : 'epa-announcement.jpg');
    } else {
      payload.append(mediaType === 'video' ? 'video' : 'photo', mediaReference);
    }
    response = await fetch(url, { method: 'POST', body: payload });
  } else {
    response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channelId, text: caption, parse_mode: 'HTML', reply_markup })
    });
  }
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.description || 'Telegram rejected the channel post. Confirm that the bot can post messages in the channel.');
  return { attempted: true, posted: true, message_id: data.result?.message_id };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.query?.action === 'bylaws') return handleBylaws(req, res);
  if (req.query?.action === 'contacts') return handleAnnouncementContacts(req, res);
  if (req.query?.action === 'certificates') return handleCertificates(req, res);

  try {
    if (req.method === 'GET') {
      const announcementId = String(req.query.id || '').trim();
      const rows = await dbSelect(
        'announcements',
        announcementId
          ? `id=eq.${encodeURIComponent(announcementId)}&limit=1`
          : 'order=published_at.desc'
      );
      // Older rows can contain Telegram media data URLs. They are not used by
      // the portal, so never send them on an announcement response.
      const response = rows.map(({ attachments, ...announcement }) => ({
        ...announcement,
        attachments: Array.isArray(attachments)
          ? attachments.filter(attachment => attachment?.type !== 'telegram_media')
          : attachments
      }));
      cachePublic(res, announcementId ? 300 : 600);
      return res.status(200).json(announcementId ? (response[0] || null) : response);
    }

    if (req.method === 'POST') {
      requireAdmin(req);
      const a = req.body;
      // Channel-only posts deliberately bypass portal persistence, recipient
      // queries, email previews, test emails, and all email delivery paths.
      if (a.telegram_only === true) {
        if (!String(a.title || '').trim() || !String(a.content || '').trim()) return res.status(400).json({ error: 'Title and message are required.' });
        try {
          const telegram = await postToTelegram({ ...a, publish_to_telegram: true });
          if (!telegram.posted) return res.status(503).json({ success: false, error: telegram.error || 'Telegram is not configured.', telegram });
          return res.status(201).json({ success: true, emailed: 0, emailReport: [], telegram });
        } catch (error) {
          return res.status(502).json({ success: false, error: `Telegram post failed: ${error.message}` });
        }
      }
      validateAnnouncementLocation(a);
      const prepared = announcementEmail('EPA Member', a);
      if (a.preview_email) return res.status(200).json({ html: announcementEmail('EPA Member', a, { preview: true }).html });
      // Test delivery returns before persistence, Telegram, or member lookup.
      if (a.test_email) {
        const address = String(a.test_email).trim().toLowerCase();
        if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(address)) return res.status(400).json({ error: 'Enter one valid test email address.' });
        const delivery = await sendEmail({ to: address, ...prepared, subject: `[TEST — not sent to members] ${prepared.subject}` });
        return res.status(200).json({ success: true, recipient: address, delivery });
      }
      let members = [];
      let contactsWarning = null;
      if (a.email_notify !== false) {
        if (!isEmailConfigured()) return res.status(503).json({ error: 'Email delivery is not configured. The announcement was not published.' });
        if (Array.isArray(a.recipient_member_ids) && a.recipient_member_ids.length === 0) return res.status(400).json({ error: 'Select at least one recipient. The announcement was not published.' });
        if (a.recipient_member_ids != null && !Array.isArray(a.recipient_member_ids)) return res.status(400).json({ error: 'Recipient selection must be a list of member IDs.' });
        const allMembers = await dbSelect('members', 'status=eq.ACTIVE&email=not.is.null&select=id,first_name,father_name,email');
        let contacts = [];
        if (!Array.isArray(a.recipient_member_ids)) {
          try { contacts = await dbSelect('announcement_email_contacts', 'is_active=eq.true&select=email,display_name,is_active'); }
          catch (error) {
            // Keep existing member delivery working while the additive contact migration is installed.
            if (/PGRST205|42P01|does not exist|schema cache/i.test(error.message)) contactsWarning = 'Additional announcement contacts are not enabled yet. Only existing members were included.';
            else throw error;
          }
        }
        members = announcementRecipients(allMembers, contacts, a.recipient_member_ids);
        if (!members.length) return res.status(400).json({ error: 'No valid email recipients were found. The announcement was not published.' });
      }
      const row = {};
      const fields = [
        'id','title','content','type','status','published_at','author_name',
        'attachments','target_audience','is_draft'
      ];
      for (const f of fields) {
        if (a[f] !== undefined && a[f] !== null) row[f] = a[f];
      }
      // Telegram media is sent directly to Telegram below. Keeping the original
      // base64 video/photo in the announcement row serves no portal feature and
      // makes every future announcement query unnecessarily large.
      await dbInsert('announcements', row);
      let telegram = { attempted: false, posted: false };
      try {
        telegram = await postToTelegram(a);
      } catch (error) {
        telegram = { attempted: true, posted: false, error: error.message };
        console.error('[announcements] Telegram post failed:', error.message);
      }
      let emailed = 0;
      let emailError = contactsWarning;
      let emailReport = [];
      if (a.email_notify !== false && isEmailConfigured()) {
        try {
          // BCC mode: use up to 49 recipients plus the sender per provider request.
          // Set ANNOUNCEMENT_BCC_ALL=true in Vercel to enable this path.
          // All recipients get the same generic greeting; no personal names.
          if (process.env.ANNOUNCEMENT_BCC_ALL === 'true' && members.length > 0) {
            for (let offset = 0; offset < members.length; offset += 49) {
              const group = members.slice(offset, offset + 49);
              try {
                const delivery = await sendEmail({ to: process.env.GMAIL_USER || process.env.EMAIL_FROM, bcc: group.map(m => m.email).join(', '), ...prepared });
                const rejected = new Set((delivery.rejected || []).map(email => String(email).toLowerCase()));
                for (const member of group) {
                  const failed = rejected.has(member.email);
                  if (!failed) emailed++;
                  emailReport.push({ name: member.name, email: member.email, status: failed ? 'failed' : 'sent', ...(failed ? { error: 'The email provider rejected this recipient.' } : {}) });
                }
              } catch (error) {
                emailReport.push(...group.map(member => ({ name: member.name, email: member.email, status: 'failed', error: error.message })));
              }
            }
          } else {
            // Batched sequential sends to avoid Gmail SMTP rate-limits.
            // Gmail caps concurrent SMTP connections and throttles burst sends;
            // firing all emails in parallel causes it to silently drop the
            // excess, which is why only ~10 of 29 were delivered.
            // Sending in small batches of 5 with a 1-second pause between
            // batches keeps well under the per-connection limit.
            const BATCH_SIZE = 5;
            const BATCH_DELAY_MS = 1000;
            for (let i = 0; i < members.length; i += BATCH_SIZE) {
              const batch = members.slice(i, i + BATCH_SIZE);
              const batchResults = await Promise.allSettled(batch.map(member => {
                const message = announcementEmail(member.name, row);
                return sendEmail({ to: member.email, ...message });
              }));
              for (let j = 0; j < batchResults.length; j++) {
                const member = batch[j];
                if (batchResults[j].status === 'fulfilled') {
                  emailed++;
                  emailReport.push({ name: member.name, email: member.email, status: 'sent' });
                } else {
                  const reason = batchResults[j].reason?.message || 'unknown error';
                  emailReport.push({ name: member.name, email: member.email, status: 'failed', error: reason });
                  console.error(`[announcements] email failed for ${member.email}: ${reason}`);
                }
              }
              // Pause between batches (skip after the last batch)
              if (i + BATCH_SIZE < members.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
              }
            }
          }
          const failedCount = emailReport.filter(record => record.status === 'failed').length;
          if (failedCount) emailError = [emailError, `${failedCount} email(s) failed. See the delivery report.`].filter(Boolean).join(' ');
        } catch (error) {
          emailError = error.message;
          console.error('[announcements] email broadcast failed:', error.message);
        }
      }
      return res.status(201).json({ success: true, emailed, emailError, emailReport, telegram });
    }

    if (req.method === 'DELETE') {
      requireAdmin(req);
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Announcement id required' });
      const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
      const delRes = await fetch(`${base}/rest/v1/announcements?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        }
      });
      if (!delRes.ok && delRes.status !== 204) {
        const text = await delRes.text();
        throw new Error(`DELETE failed: ${text}`);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[announcements]', err.message);
    return res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
}
