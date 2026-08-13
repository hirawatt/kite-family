import 'dotenv/config';

export interface AccountConfig {
  id: string;
  label: string;
  userId: string;
  password?: string;
  totpSecret?: string;
  apiKey: string;
  apiSecret: string;
}

export function getAccountConfigs(passedEnv?: Record<string, string | undefined>): AccountConfig[] {
  // Merge process.env with passedEnv, ensuring valid non-empty string values win
  const mergedEnv: Record<string, string | undefined> = { ...process.env };
  if (passedEnv) {
    for (const [key, val] of Object.entries(passedEnv)) {
      if (val !== undefined && val !== '') {
        mergedEnv[key] = val;
      }
    }
  }

  const accounts: AccountConfig[] = [];
  
  // Scan up to 20 accounts
  for (let i = 1; i <= 20; i++) {
    const userId = mergedEnv[`ACCOUNT_${i}_USER_ID`]?.trim();
    const apiKey = mergedEnv[`ACCOUNT_${i}_API_KEY`]?.trim();
    const apiSecret = mergedEnv[`ACCOUNT_${i}_API_SECRET`]?.trim();

    if (userId && apiKey && apiSecret) {
      accounts.push({
        id: `account_${i}`,
        label: mergedEnv[`ACCOUNT_${i}_LABEL`]?.trim() || `Account ${i} (${userId})`,
        userId,
        password: mergedEnv[`ACCOUNT_${i}_PASSWORD`]?.trim(),
        totpSecret: mergedEnv[`ACCOUNT_${i}_TOTP_SECRET`]?.trim(),
        apiKey,
        apiSecret,
      });
    }
  }

  return accounts;
}

export function getDashboardPassword(passedEnv?: Record<string, string | undefined>): string {
  const mergedEnv: Record<string, string | undefined> = { ...process.env };
  if (passedEnv) {
    for (const [key, val] of Object.entries(passedEnv)) {
      if (val !== undefined && val !== '') {
        mergedEnv[key] = val;
      }
    }
  }
  return mergedEnv.DASHBOARD_PASSWORD?.trim() || 'admin';
}
