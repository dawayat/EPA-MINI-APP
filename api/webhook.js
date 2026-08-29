export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    
    if (message && message.text === '/start') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
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
