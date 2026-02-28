// Livegram-style Telegram bot for Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update = await request.json();
        await handleUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (err) {
        return new Response('Error', { status: 500 });
      }
    }
    return new Response('Bot is running!', { status: 200 });
  },
};

async function handleUpdate(update, env) {
  if (!update.message) return;

  const chatId = update.message.chat.id;
  const text = update.message.text;
  const fromId = update.message.from.id;

  // ADMIN_ID ni o'z Telegram ID'ingizga almashtiring!
  const ADMIN_ID = 5565455775; // Bu yerda sizning ID'ingiz turibdi

  // Agar xabar admin tomonidan yuborilgan bo'lsa
  if (fromId == ADMIN_ID) {
    // Admin kimningdir xabariga reply qilgan bo'lsa
    if (update.message.reply_to_message) {
      const originalMsg = update.message.reply_to_message;
      // Reply qilingan xabar aslida foydalanuvchidan forward qilingan bo'lishi kerak
      if (originalMsg && originalMsg.forward_from) {
        const targetUserId = originalMsg.forward_from.id;
        await sendMessage(targetUserId, text, env);
      }
    }
  } else {
    // Oddiy foydalanuvchi xabari – admin ga forward qilamiz
    await forwardMessage(ADMIN_ID, chatId, update.message.message_id, env);
    await sendMessage(chatId, "Xabaringiz adminga yuborildi. Javobni kuting.", env);
  }
}

async function sendMessage(chatId, text, env) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
  };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function forwardMessage(chatId, fromChatId, messageId, env) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/forwardMessage`;
  const body = {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
