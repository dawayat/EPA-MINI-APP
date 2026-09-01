import { dbSelect, dbInsert, dbUpdate, cachePublic, cors } from './_db.js';
import { announcementEmail, isEmailConfigured, sendEmail } from './_email.js';

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
  const mediaType = a.telegram_media_type || (mediaUrl.startsWith('data:video/') ? 'video' : 'image');
  const endpoint = mediaUrl ? (mediaType === 'video' ? 'sendVideo' : 'sendPhoto') : 'sendMessage';
  const url = `https://api.telegram.org/bot${botToken}/${endpoint}`;
  let response;
  if (mediaUrl) {
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
      payload.append(mediaType === 'video' ? 'video' : 'photo', mediaUrl);
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
      const a = req.body;
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
      let emailError = null;
      if (isEmailConfigured()) {
        try {
          const members = await dbSelect('members', 'status=eq.ACTIVE&email=not.is.null&select=first_name,father_name,email');
          const results = await Promise.allSettled(members.map(member => {
            const message = announcementEmail(`${member.first_name} ${member.father_name}`, { title: row.title, content: row.content, category: row.type });
            return sendEmail({ to: member.email, ...message });
          }));
          emailed = results.filter(result => result.status === 'fulfilled').length;
        } catch (error) {
          emailError = error.message;
          console.error('[announcements] email broadcast failed:', error.message);
        }
      }
      return res.status(201).json({ success: true, emailed, emailError, telegram });
    }

    if (req.method === 'DELETE') {
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
    return res.status(500).json({ success: false, error: err.message });
  }
}
