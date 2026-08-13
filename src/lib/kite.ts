import { KiteConnect } from 'kiteconnect';

export interface KiteHolding {
  tradingsymbol: string;
  exchange: string;
  instrument_token: number;
  isin: string;
  product: string;
  price: number;
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  realised_quantity: number;
  authorised_quantity: number;
  authorised_date?: string;
  opening_quantity: number;
  short_quantity: number;
  collateral_quantity: number;
  collateral_type?: string | null;
  discrepancy: boolean;
  average_price: number;
  last_price: number;
  close_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface FetchHoldingsResult {
  accountId: string;
  label: string;
  userId: string;
  success: boolean;
  holdings: KiteHolding[];
  error?: string;
}

export async function fetchHoldingsForAccount(
  accountId: string,
  label: string,
  userId: string,
  apiKey: string,
  accessToken: string
): Promise<FetchHoldingsResult> {
  try {
    const kc = new KiteConnect({ api_key: apiKey });
    kc.setAccessToken(accessToken);
    
    const holdings = await kc.getHoldings();

    return {
      accountId,
      label,
      userId,
      success: true,
      holdings: (holdings || []) as KiteHolding[],
    };
  } catch (err: any) {
    return {
      accountId,
      label,
      userId,
      success: false,
      holdings: [],
      error: err.message || String(err),
    };
  }
}
