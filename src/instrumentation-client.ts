import * as Sentry from '@sentry/nextjs';

// Browser error monitoring. Inert until NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,

  sendDefaultPii: false,
  
  beforeSend(event) {
    if (event.request) {
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }
    if (event.extra) {
      delete event.extra['supplier_identity'];
      delete event.extra['pricing_margins'];
      if (event.extra.user) {
        delete (event.extra.user as Record<string, unknown>)['email'];
        delete (event.extra.user as Record<string, unknown>)['name'];
      }
    }
    return event;
  },

  beforeSendTransaction(event) {
    if (event.transaction) {
      event.transaction = event.transaction.replace(
        /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
        '<UUID>'
      ).replace(/ORD-\d+/g, '<ORDER_ID>');
    }
    return event;
  },
});
