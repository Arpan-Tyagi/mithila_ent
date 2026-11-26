import 'server-only';
import { checkBotId } from 'botid/server';

// Invisible bot check for the public contact and wholesale forms (Vercel
// BotID, Basic level: free, no keys, no puzzle). The browser side is declared
// in src/instrumentation-client.ts; both lists must name the same routes.
//
// On Vercel a failed check blocks the request. Off Vercel (local `next start`,
// e2e runs) BotID cannot run, so the per-IP rate limit is the only guard.
export async function isLikelyBot(): Promise<boolean> {
  try {
    const { isBot, isVerifiedBot } = await checkBotId();
    return isBot && !isVerifiedBot;
  } catch (err) {
    if (process.env.VERCEL) {
      console.error('BotID check failed:', (err as Error).message);
      return true;
    }
    return false;
  }
}
