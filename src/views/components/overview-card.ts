import { PortfolioSummary, UnifiedHolding } from '../../lib/merge';
import { renderDonutChart, ChartDataItem } from './chart';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

const CHART_COLORS = [
  '#0066cc', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#64748b', '#3b82f6', '#14b8a6', '#f97316'
];

export function renderOverviewCard(summary: PortfolioSummary, holdings: UnifiedHolding[], accountStatuses: any[]): string {
  const isPnlPositive = summary.totalPnl >= 0;
  const pnlColorClass = isPnlPositive ? 'text-green' : 'text-red';
  const pnlBadgeClass = isPnlPositive ? 'badge-green' : 'badge-red';

  // 1. Account Allocation
  const accountTotals = new Map<string, { current: number; invested: number }>();
  for (const h of holdings) {
    for (const acc of h.accounts) {
      const prev = accountTotals.get(acc.label) || { current: 0, invested: 0 };
      accountTotals.set(acc.label, {
        current: prev.current + acc.currentValue,
        invested: prev.invested + acc.investedValue,
      });
    }
  }

  const accountChartItems: ChartDataItem[] = Array.from(accountTotals.entries()).map(([label, data], idx) => ({
    label,
    value: data.current,
    investedValue: data.invested,
    percentage: summary.totalCurrentValue > 0 ? (data.current / summary.totalCurrentValue) * 100 : 0,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value);

  // 2. Sectors Allocation
  const sectorTotals = new Map<string, { current: number; invested: number }>();
  for (const h of holdings) {
    let sector = 'Engineering';
    const sym = h.tradingsymbol.toUpperCase();
    if (sym.includes('BANK') || sym.includes('FIN') || sym.includes('HDFC') || sym.includes('ICICI') || sym.includes('SBIN')) {
      sector = 'Financials';
    } else if (sym.includes('IT') || sym.includes('TECH') || sym.includes('TCS') || sym.includes('INFY') || sym.includes('WIPRO')) {
      sector = 'IT & Tech';
    } else if (sym.includes('AUTO') || sym.includes('TATAMOTORS') || sym.includes('MARUTI') || sym.includes('M&M')) {
      sector = 'Automobile';
    } else if (sym.includes('PHARMA') || sym.includes('HEALTH') || sym.includes('SUNPHARMA') || sym.includes('CIPLA')) {
      sector = 'Healthcare';
    } else if (sym.includes('POWER') || sym.includes('ENERGY') || sym.includes('NTPC') || sym.includes('RELIANCE')) {
      sector = 'Energy';
    } else if (sym.includes('STEEL') || sym.includes('METAL') || sym.includes('TATASTEEL')) {
      sector = 'Metals';
    }
    const prev = sectorTotals.get(sector) || { current: 0, invested: 0 };
    sectorTotals.set(sector, {
      current: prev.current + h.totalCurrentValue,
      invested: prev.invested + h.totalInvested,
    });
  }

  const sectorChartItems: ChartDataItem[] = Array.from(sectorTotals.entries()).map(([label, data], idx) => ({
    label,
    value: data.current,
    investedValue: data.invested,
    percentage: summary.totalCurrentValue > 0 ? (data.current / summary.totalCurrentValue) * 100 : 0,
    color: CHART_COLORS[(idx + 2) % CHART_COLORS.length],
  })).sort((a, b) => b.value - a.value);

  // 3. Stocks Allocation (Top holdings vs remaining)
  const topStocks = [...holdings].sort((a, b) => b.totalCurrentValue - a.totalCurrentValue);
  const stockChartItems: ChartDataItem[] = [];
  const topN = topStocks.slice(0, 5);
  let topNTotalCurrent = 0;
  let topNTotalInvested = 0;

  topN.forEach((h, idx) => {
    topNTotalCurrent += h.totalCurrentValue;
    topNTotalInvested += h.totalInvested;
    stockChartItems.push({
      label: h.tradingsymbol,
      value: h.totalCurrentValue,
      investedValue: h.totalInvested,
      percentage: summary.totalCurrentValue > 0 ? (h.totalCurrentValue / summary.totalCurrentValue) * 100 : 0,
      color: CHART_COLORS[(idx + 4) % CHART_COLORS.length],
    });
  });

  if (summary.totalCurrentValue > topNTotalCurrent) {
    const remCurrent = summary.totalCurrentValue - topNTotalCurrent;
    const remInvested = Math.max(0, summary.totalInvested - topNTotalInvested);
    stockChartItems.push({
      label: 'Other Stocks',
      value: remCurrent,
      investedValue: remInvested,
      percentage: (remCurrent / summary.totalCurrentValue) * 100,
      color: '#94a3b8',
    });
  }

  // Account Cards for Collapsible Breakdown
  const subAccountsCardsHtml = accountStatuses.map((acc) => {
    const totalCurrent = holdings.reduce((sum, h) => {
      const match = h.accounts.find(a => a.userId === acc.userId);
      return sum + (match ? match.currentValue : 0);
    }, 0);
    const totalInvested = holdings.reduce((sum, h) => {
      const match = h.accounts.find(a => a.userId === acc.userId);
      return sum + (match ? match.investedValue : 0);
    }, 0);
    const pnl = totalCurrent - totalInvested;
    const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return `
    <div class="account-card-item" data-account-id="${acc.userId}" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex: 1; min-width: 240px; transition: border-color 0.2s ease;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8125rem; font-weight: 800; color: #0f172a;">${acc.label} (${acc.userId})</span>
        <span class="${acc.success ? 'badge-green' : 'badge-red'}">${acc.success ? `${acc.holdingCount} stocks` : 'Auth Error'}</span>
      </div>
      <div style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${formatCurrency(totalCurrent)}</div>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; font-weight: 600;">
        <span>Invested: ${formatCurrency(totalInvested)}</span>
        <span class="${pnl >= 0 ? 'text-green' : 'text-red'}" style="font-weight: 800;">${formatCurrency(pnl)} (${formatPercent(pnlPct)})</span>
      </div>
    </div>`;
  }).join('');

  return `
  <!-- Overview Summary Card -->
  <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
    
    <!-- Top Summary Metrics Header -->
    <div style="display: flex; gap: 48px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap;">
      <div>
        <div style="font-size: 0.8125rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Invested</div>
        <div id="summary-invested-val" style="font-size: 1.5rem; font-weight: 800; color: #0f172a;">${formatCurrency(summary.totalInvested)}</div>
      </div>
      <div>
        <div style="font-size: 0.8125rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">Current</div>
        <div id="summary-current-val" style="font-size: 1.5rem; font-weight: 800; color: #0f172a;">${formatCurrency(summary.totalCurrentValue)}</div>
      </div>
      <div>
        <div style="font-size: 0.8125rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">P&L</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span id="summary-pnl-val" style="font-size: 1.5rem; font-weight: 800;" class="${pnlColorClass}">${formatCurrency(summary.totalPnl)}</span>
          <span id="summary-pnl-badge" class="${pnlBadgeClass}" style="font-size: 0.8125rem;">${formatPercent(summary.totalPnlPercentage)}</span>
        </div>
      </div>
    </div>

    <!-- Controls Row (Interactive Radio & Checkbox) -->
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; font-size: 0.875rem; color: #334155; font-weight: 600; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <input type="radio" name="value_mode" value="current" checked onchange="handleValueModeChange('current')" style="accent-color: #0066cc; width: 16px; height: 16px;">
          <span>Current Value</span>
        </label>
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <input type="radio" name="value_mode" value="invested" onchange="handleValueModeChange('invested')" style="accent-color: #0066cc; width: 16px; height: 16px;">
          <span>Invested Value</span>
        </label>
      </div>

      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" id="mf-checkbox" checked onchange="toggleMutualFundsFilter(this.checked)" style="accent-color: #0066cc; width: 16px; height: 16px; border-radius: 4px;">
        <span>Include stocks from Mutual funds</span>
      </label>
    </div>

    <!-- Donut Charts Grid (Account / Sectors / Stocks) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 20px;">
      <div>
        ${renderDonutChart('account', 'Account', accountChartItems)}
      </div>
      <div>
        ${renderDonutChart('sector', 'Sectors', sectorChartItems)}
      </div>
      <div>
        ${renderDonutChart('stock', 'Stocks', stockChartItems)}
      </div>
    </div>

    <!-- Accordion Collapsible Sub Accounts Breakdown -->
    <div style="border-top: 1px dashed #e2e8f0; margin-top: 16px; padding-top: 16px;">
      <button onclick="toggleSubAccounts()" style="background: none; border: none; color: #0066cc; font-size: 0.875rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0;">
        <span>Sub accounts breakdown</span>
        <span id="sub-accounts-arrow" style="transition: transform 0.2s ease;">▼</span>
      </button>

      <div id="sub-accounts-panel" style="display: none; margin-top: 16px;">
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          ${subAccountsCardsHtml}
        </div>
      </div>
    </div>
  </div>

  <script>
    const chartRawData = {
      account: ${JSON.stringify(accountChartItems)},
      sector: ${JSON.stringify(sectorChartItems)},
      stock: ${JSON.stringify(stockChartItems)},
    };

    function handleValueModeChange(mode) {
      ['account', 'sector', 'stock'].forEach(chartId => {
        const items = chartRawData[chartId];
        if (!items) return;

        const total = items.reduce((sum, item) => sum + (mode === 'invested' ? (item.investedValue || 0) : item.value), 0);
        items.forEach(item => {
          const val = mode === 'invested' ? (item.investedValue || 0) : item.value;
          item.percentage = total > 0 ? (val / total) * 100 : 0;
        });

        // Update SVGs and Legends
        const container = document.getElementById('chart-container-' + chartId);
        if (!container) return;

        const legend = document.getElementById('legend-' + chartId);
        if (legend) {
          const legendPcts = legend.querySelectorAll('.legend-pct');
          items.slice(0, 6).forEach((item, idx) => {
            if (legendPcts[idx]) legendPcts[idx].innerText = item.percentage.toFixed(2) + '%';
          });
        }
      });
    }

    function toggleSubAccounts() {
      const panel = document.getElementById('sub-accounts-panel');
      const arrow = document.getElementById('sub-accounts-arrow');
      if (panel) {
        const isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : 'block';
        if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    }

    function toggleMutualFundsFilter(includeMf) {
      const parentRows = document.querySelectorAll('.parent-row');
      parentRows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (!includeMf && text.includes('mf')) {
          row.style.display = 'none';
        } else {
          row.style.display = '';
        }
      });
    }
  </script>
  `;
}
