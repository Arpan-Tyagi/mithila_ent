export async function sendWhatsAppNotification(phoneNumber: string, message: string) {
  // TODO: Integrate with your preferred WhatsApp API provider (e.g., Twilio, Meta Cloud API, Interakt)
  // Example implementation for Meta Cloud API:
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn('[WhatsApp] Credentials missing. Mocking WhatsApp message:', message);
    return;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('[WhatsApp] Error sending message:', errorData);
    } else {
      console.log('[WhatsApp] Notification sent successfully');
    }
  } catch (error) {
    console.error('[WhatsApp] Exception sending message:', error);
  }
}
