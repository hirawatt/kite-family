import { getAccountConfigs } from './config';
import { authenticateAccount } from './http-auth';

export async function runDailyAutoAuth(env?: Record<string, string | undefined>, kvBinding?: any) {
  const accounts = getAccountConfigs(env);
  console.log(`[Cron] Starting daily auto-auth for ${accounts.length} account(s) at ${new Date().toISOString()}`);

  const results = [];
  for (const acc of accounts) {
    console.log(`[Cron] Authenticating account: ${acc.label} (${acc.userId})...`);
    const res = await authenticateAccount(acc, kvBinding);
    results.push({ accountId: acc.id, label: acc.label, ...res });
  }

  console.log(`[Cron] Daily auto-auth completed:`, JSON.stringify(results, null, 2));
  return results;
}

// Node.js background scheduler: check every minute if it's 6:15 AM IST
export function startNodeCronDaemon() {
  setInterval(async () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);

    // Trigger at 6:15 AM IST
    if (istDate.getUTCHours() === 6 && istDate.getUTCMinutes() === 15) {
      console.log('[NodeCron] 6:15 AM IST reached. Triggering automatic Zerodha re-auth loop.');
      try {
        await runDailyAutoAuth();
      } catch (e) {
        console.error('[NodeCron] Cron execution error:', e);
      }
    }
  }, 60 * 1000); // Check every minute
}
