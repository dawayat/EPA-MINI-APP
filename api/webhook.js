export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const reply = async (chatId, text) => {
      if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
      });
      if (!response.ok) throw new Error('Telegram could not deliver the bot reply.');
    };

    // Large announcement media never passes through Vercel. An administrator
    // sends a photo/video to the bot, then pastes this bot-scoped File ID into
    // the secure admin composer. Telegram can reuse files up to 50 MB.
    const video = message?.video;
    const photo = message?.photo?.[message.photo.length - 1];
    const media = video || photo;
    if (message?.chat?.id && media?.file_id) {
      const size = Number(media.file_size || 0);
      const max = 50 * 1024 * 1024;
      try {
        if (size > max) {
          await reply(message.chat.id, 'This file is larger than 50 MB, so the EPA bot cannot reuse it for a channel post. Please send a compressed photo or video up to 50 MB.');
        } else {
          const kind = video ? 'video' : 'photo';
          const fileId = String(media.file_id).replace(/[&<>]/g, '');
          await reply(message.chat.id, `Received your ${kind}. Paste this File ID into the EPA admin announcement composer:\n\n<code>${fileId}</code>\n\nSelect Telegram ${kind} before publishing.`);
        }
      } catch (err) {
        console.error('Error replying with Telegram media File ID:', err);
      }
    }
    
    if (message && message.text === '/start') {
      const appUrl = process.env.VITE_APP_URL || 'https://epa-mini-app.vercel.app';
      const chatId = message.chat.id;

      if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN is not set');
        return res.status(500).send('Internal Server Error');
      }

      const replyUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const replyBody = {
        chat_id: chatId,
        text: 'Welcome to the Ethiopian Psychologists\' Association! Click the button below to launch the Official EPA Portal.',
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Open EPA Portal',
              web_app: { url: appUrl }
            }
          ]]
        }
      };

      try {
        const response = await fetch(replyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(replyBody)
        });
        const data = await response.json();
        console.log('Telegram reply sent:', data);
      } catch (err) {
        console.error('Error sending message to Telegram:', err);
      }
    }
    
    res.status(200).send('OK');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
