import { FetchHoldingsResult, KiteHolding } from './kite.js';

export interface AccountHoldingDetail {
  accountId: string;
  label: string;
  userId: string;
  quantity: number;
  averagePrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  dayChange: number;
}

export interface UnifiedHolding {
  isin: string;
  tradingsymbol: string;
  exchange: string;
  totalQuantity: number;
  blendedAvgPrice: number;
  totalInvested: number;
  lastPrice: number;
  closePrice: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalDayChange: number;
  dayChangePercentage: number;
  accounts: AccountHoldingDetail[];
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  totalDayChange: number;
  totalDayChangePercentage: number;
  accountCount: number;
  stockCount: number;
}

export interface UnifiedPortfolioResult {
  summary: PortfolioSummary;
  holdings: UnifiedHolding[];
  accountStatuses: {
    accountId: string;
    label: string;
    userId: string;
    success: boolean;
    holdingCount: number;
    error?: string;
  }[];
}

export function mergeHoldings(accountResults: FetchHoldingsResult[]): UnifiedPortfolioResult {
  const mapByIsin = new Map<string, {
    isin: string;
    tradingsymbol: string;
    exchange: string;
    lastPrice: number;
    closePrice: number;
    accounts: AccountHoldingDetail[];
  }>();

  const accountStatuses: UnifiedPortfolioResult['accountStatuses'] = [];

  for (const result of accountResults) {
    accountStatuses.push({
      accountId: result.accountId,
      label: result.label,
      userId: result.userId,
      success: result.success,
      holdingCount: result.holdings.length,
      error: result.error,
    });

    if (!result.success || !result.holdings) continue;

    for (const h of result.holdings) {
      // Key primarily by ISIN, fallback to tradingsymbol if ISIN is missing
      const key = h.isin ? h.isin : h.tradingsymbol;

      if (!mapByIsin.has(key)) {
        mapByIsin.set(key, {
          isin: h.isin || key,
          tradingsymbol: h.tradingsymbol,
          exchange: h.exchange,
          lastPrice: h.last_price,
          closePrice: h.close_price,
          accounts: [],
        });
      }

      const entry = mapByIsin.get(key)!;
      // Update last price if non-zero
      if (h.last_price > 0) entry.lastPrice = h.last_price;
      if (h.close_price > 0) entry.closePrice = h.close_price;

      const qty = h.quantity + h.t1_quantity; // Include T1 unsettled quantity
      const avgPrice = h.average_price;
      const invested = qty * avgPrice;
      const currentVal = qty * entry.lastPrice;
      const pnl = currentVal - invested;
      const dayChange = qty * (h.day_change || 0);

      entry.accounts.push({
        accountId: result.accountId,
        label: result.label,
        userId: result.userId,
        quantity: qty,
        averagePrice: avgPrice,
        investedValue: invested,
        currentValue: currentVal,
        pnl,
        dayChange,
      });
    }
  }

  const unifiedHoldings: UnifiedHolding[] = [];

  let grandTotalInvested = 0;
  let grandTotalCurrentValue = 0;
  let grandTotalDayChange = 0;

  for (const [key, entry] of mapByIsin.entries()) {
    const totalQuantity = entry.accounts.reduce((sum, a) => sum + a.quantity, 0);
    const totalInvested = entry.accounts.reduce((sum, a) => sum + a.investedValue, 0);
    const blendedAvgPrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
    const totalCurrentValue = totalQuantity * entry.lastPrice;
    const totalPnl = totalCurrentValue - totalInvested;
    const totalDayChange = entry.accounts.reduce((sum, a) => sum + a.dayChange, 0);
    
    // Day change percentage relative to previous day close value
    const previousCloseValue = totalCurrentValue - totalDayChange;
    const dayChangePercentage = previousCloseValue > 0 ? (totalDayChange / previousCloseValue) * 100 : 0;

    grandTotalInvested += totalInvested;
    grandTotalCurrentValue += totalCurrentValue;
    grandTotalDayChange += totalDayChange;

    unifiedHoldings.push({
      isin: entry.isin,
      tradingsymbol: entry.tradingsymbol,
      exchange: entry.exchange,
      totalQuantity,
      blendedAvgPrice,
      totalInvested,
      lastPrice: entry.lastPrice,
      closePrice: entry.closePrice,
      totalCurrentValue,
      totalPnl,
      totalDayChange,
      dayChangePercentage,
      accounts: entry.accounts,
    });
  }

  // Sort by total current value descending by default
  unifiedHoldings.sort((a, b) => b.totalCurrentValue - a.totalCurrentValue);

  const grandTotalPnl = grandTotalCurrentValue - grandTotalInvested;
  const grandTotalPnlPct = grandTotalInvested > 0 ? (grandTotalPnl / grandTotalInvested) * 100 : 0;
  const grandPrevCloseVal = grandTotalCurrentValue - grandTotalDayChange;
  const grandDayChangePct = grandPrevCloseVal > 0 ? (grandTotalDayChange / grandPrevCloseVal) * 100 : 0;

  return {
    summary: {
      totalInvested: grandTotalInvested,
      totalCurrentValue: grandTotalCurrentValue,
      totalPnl: grandTotalPnl,
      totalPnlPercentage: grandTotalPnlPct,
      totalDayChange: grandTotalDayChange,
      totalDayChangePercentage: grandDayChangePct,
      accountCount: accountResults.length,
      stockCount: unifiedHoldings.length,
    },
    holdings: unifiedHoldings,
    accountStatuses,
  };
}
