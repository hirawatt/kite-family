import { UnifiedHolding } from '../../lib/merge';

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

export function renderHoldingsTable(holdings: UnifiedHolding[]): string {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute Top Gainers & Losers for Analytics Tab
  const sortedByPnlPct = [...holdings].sort((a, b) => {
    const aPct = a.totalInvested > 0 ? (a.totalPnl / a.totalInvested) * 100 : 0;
    const bPct = b.totalInvested > 0 ? (b.totalPnl / b.totalInvested) * 100 : 0;
    return bPct - aPct;
  });

  const topGainers = sortedByPnlPct.slice(0, 5);
  const topLosers = [...sortedByPnlPct].reverse().slice(0, 5).filter(h => h.totalPnl < 0);

  const topGainersHtml = topGainers.map(h => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem;">
      <span style="font-weight: 700; color: #0f172a;">${h.tradingsymbol}</span>
      <div style="text-align: right;">
        <div style="font-weight: 700;" class="text-green">${formatCurrency(h.totalPnl)}</div>
        <span class="badge-green">${formatPercent((h.totalPnl / h.totalInvested) * 100)}</span>
      </div>
    </div>
  `).join('');

  const topLosersHtml = topLosers.length > 0 ? topLosers.map(h => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem;">
      <span style="font-weight: 700; color: #0f172a;">${h.tradingsymbol}</span>
      <div style="text-align: right;">
        <div style="font-weight: 700;" class="text-red">${formatCurrency(h.totalPnl)}</div>
        <span class="badge-red">${formatPercent((h.totalPnl / h.totalInvested) * 100)}</span>
      </div>
    </div>
  `).join('') : '<div style="padding: 16px; color: #64748b; font-size: 0.875rem;">No loss-making stocks in portfolio.</div>';

  const tableRowsHtml = holdings.map((h, idx) => {
    const rowId = `subrow-${idx}`;
    const isPnlPositive = h.totalPnl >= 0;
    const isDayPositive = h.totalDayChange >= 0;
    const pnlPct = h.totalInvested > 0 ? (h.totalPnl / h.totalInvested) * 100 : 0;
    const accountUserIds = h.accounts.map(a => a.userId).join(' ');

    const accountPills = h.accounts.map(a => `
      <span style="background-color: #eff6ff; border: 1px solid #dbeafe; color: #0066cc; padding: 2px 7px; border-radius: 4px; font-size: 0.725rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
        <span>${a.userId}</span>
        <span>${a.quantity}</span>
      </span>
    `).join(' ');

    const subTableRows = h.accounts.map(a => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 16px; font-weight: 700; color: #0f172a;">${a.label} (${a.userId})</td>
        <td style="padding: 10px 16px; font-weight: 600;">${a.quantity}</td>
        <td style="padding: 10px 16px;">${formatCurrency(a.averagePrice)}</td>
        <td style="padding: 10px 16px;">${formatCurrency(a.investedValue)}</td>
        <td style="padding: 10px 16px; font-weight: 600;">${formatCurrency(a.currentValue)}</td>
        <td style="padding: 10px 16px; font-weight: 700;" class="${a.pnl >= 0 ? 'text-green' : 'text-red'}">
          ${formatCurrency(a.pnl)}
        </td>
      </tr>
    `).join('');

    return `
    <tr class="parent-row" data-account-ids="${accountUserIds}" data-symbol="${h.tradingsymbol}" data-qty="${h.totalQuantity}" data-avg="${h.blendedAvgPrice}" data-invested="${h.totalInvested}" data-ltp="${h.lastPrice}" data-current="${h.totalCurrentValue}" data-pnl="${h.totalPnl}" data-pnlpct="${pnlPct}" data-daypct="${h.dayChangePercentage}" onclick="toggleRow('${rowId}')" style="border-bottom: 1px solid #f1f5f9; transition: background-color 0.15s ease;">
      <td style="padding: 14px 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-weight: 800; font-size: 0.9375rem; color: #0f172a;">${h.tradingsymbol}</span>
          <span style="color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; font-size: 0.725rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            ${h.totalQuantity.toLocaleString('en-IN')}
          </span>
        </div>
        <div style="margin-top: 4px; display: flex; gap: 4px;">
          ${accountPills}
        </div>
      </td>
      <td style="padding: 14px 16px; font-weight: 600; color: #334155;">${h.totalQuantity.toLocaleString('en-IN')}</td>
      <td style="padding: 14px 16px; color: #475569;">${formatCurrency(h.blendedAvgPrice)}</td>
      <td style="padding: 14px 16px; color: #475569;">${formatCurrency(h.totalInvested)}</td>
      <td style="padding: 14px 16px; font-weight: 600; color: #0f172a;">${formatCurrency(h.lastPrice)}</td>
      <td style="padding: 14px 16px; font-weight: 700; color: #0f172a;">${formatCurrency(h.totalCurrentValue)}</td>
      <td style="padding: 14px 16px; font-weight: 700;" class="${isPnlPositive ? 'text-green' : 'text-red'}">
        ${formatCurrency(h.totalPnl)}
      </td>
      <td style="padding: 14px 16px; font-weight: 700;" class="${isDayPositive ? 'text-green' : 'text-red'}">
        ${formatPercent(h.dayChangePercentage)}
      </td>
    </tr>
    <tr id="${rowId}" class="sub-table-row">
      <td colspan="8" style="padding: 0;">
        <div class="sub-table-wrapper" style="background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
            Per-Account Breakdown for <strong>${h.tradingsymbol}</strong>
          </div>
          <table class="sub-table" style="background: #ffffff; width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
                <th style="padding: 8px 16px;">Member Account</th>
                <th style="padding: 8px 16px;">Qty</th>
                <th style="padding: 8px 16px;">Buy Avg</th>
                <th style="padding: 8px 16px;">Buy Value</th>
                <th style="padding: 8px 16px;">Present Value</th>
                <th style="padding: 8px 16px;">P&L</th>
              </tr>
            </thead>
            <tbody>
              ${subTableRows}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
    `;
  }).join('');

  return `
  <!-- Main Navigation Tabs (Holdings / Analytics) -->
  <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
    <div style="display: flex; gap: 24px;">
      <button id="tab-btn-holdings" onclick="switchMainTab('holdings')" style="background: none; border: none; border-bottom: 2px solid #0066cc; color: #0066cc; font-size: 0.9375rem; font-weight: 700; padding: 10px 4px; cursor: pointer;">
        Holdings
      </button>
      <button id="tab-btn-analytics" onclick="switchMainTab('analytics')" style="background: none; border: none; border-bottom: 2px solid transparent; color: #64748b; font-size: 0.9375rem; font-weight: 600; padding: 10px 4px; cursor: pointer;">
        Analytics
      </button>
    </div>

    <!-- Search Input & Stock Count -->
    <div style="display: flex; align-items: center; gap: 12px;">
      <span id="stock-count-label" style="font-size: 0.8125rem; font-weight: 600; color: #64748b;">
        Showing ${holdings.length} stocks
      </span>
      <input type="text" id="stock-search" placeholder="Search symbol or ISIN..." onkeyup="filterStocks()" style="padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8125rem; width: 240px; outline: none;">
    </div>
  </div>

  <!-- Timestamp Subheader -->
  <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    <span>Last updated: Equity — ${todayStr} | MF — ${todayStr}</span>
  </div>

  <!-- Section 1: Holdings Tab View -->
  <div id="tab-view-holdings" class="table-container" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
    <table id="holdings-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; user-select: none;">
          <th onclick="sortHoldingsTable('symbol')" style="padding: 12px 16px; cursor: pointer;">Symbol <span id="sort-icon-symbol">▲</span></th>
          <th onclick="sortHoldingsTable('qty')" style="padding: 12px 16px; cursor: pointer;">Qty. <span id="sort-icon-qty"></span></th>
          <th onclick="sortHoldingsTable('avg')" style="padding: 12px 16px; cursor: pointer;">Buy avg. <span id="sort-icon-avg"></span></th>
          <th onclick="sortHoldingsTable('invested')" style="padding: 12px 16px; cursor: pointer;">Buy value <span id="sort-icon-invested"></span></th>
          <th onclick="sortHoldingsTable('ltp')" style="padding: 12px 16px; cursor: pointer;">LTP ⓘ <span id="sort-icon-ltp"></span></th>
          <th onclick="sortHoldingsTable('current')" style="padding: 12px 16px; cursor: pointer;">Present value <span id="sort-icon-current"></span></th>
          <th onclick="sortHoldingsTable('pnl')" style="padding: 12px 16px; cursor: pointer;">P&L <span id="sort-icon-pnl"></span></th>
          <th onclick="sortHoldingsTable('daypct')" style="padding: 12px 16px; cursor: pointer;">P&L chg. <span id="sort-icon-daypct"></span></th>
        </tr>
      </thead>
      <tbody id="holdings-tbody">
        ${tableRowsHtml.length > 0 ? tableRowsHtml : `<tr><td colspan="8" style="text-align: center; padding: 48px; color: #64748b;">No holdings found. Ensure accounts are configured and authenticated.</td></tr>`}
      </tbody>
    </table>
  </div>

  <!-- Section 2: Analytics Tab View -->
  <div id="tab-view-analytics" style="display: none; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
    <!-- Top Gainers Card -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <h3 style="font-size: 1rem; font-weight: 800; color: #15803d; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        <span>Top Gainers (% Return)</span>
      </h3>
      ${topGainersHtml}
    </div>

    <!-- Top Losers Card -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <h3 style="font-size: 1rem; font-weight: 800; color: #b91c1c; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
        <span>Top Underperformers</span>
      </h3>
      ${topLosersHtml}
    </div>
  </div>

  <script>
    let currentSortKey = 'symbol';
    let currentSortAsc = true;

    function switchMainTab(tab) {
      const holdingsView = document.getElementById('tab-view-holdings');
      const analyticsView = document.getElementById('tab-view-analytics');
      const btnHoldings = document.getElementById('tab-btn-holdings');
      const btnAnalytics = document.getElementById('tab-btn-analytics');

      if (tab === 'holdings') {
        holdingsView.style.display = 'block';
        analyticsView.style.display = 'none';
        btnHoldings.style.borderBottomColor = '#0066cc';
        btnHoldings.style.color = '#0066cc';
        btnAnalytics.style.borderBottomColor = 'transparent';
        btnAnalytics.style.color = '#64748b';
      } else {
        holdingsView.style.display = 'none';
        analyticsView.style.display = 'grid';
        btnAnalytics.style.borderBottomColor = '#0066cc';
        btnAnalytics.style.color = '#0066cc';
        btnHoldings.style.borderBottomColor = 'transparent';
        btnHoldings.style.color = '#64748b';
      }
    }

    function filterByAccount(accountId) {
      const parentRows = document.querySelectorAll('.parent-row');
      let visibleCount = 0;

      parentRows.forEach(row => {
        const accounts = row.getAttribute('data-account-ids') || '';
        const nextSubRow = row.nextElementSibling;

        if (accountId === 'ALL' || accounts.includes(accountId)) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
          if (nextSubRow && nextSubRow.classList.contains('sub-table-row')) {
            nextSubRow.classList.remove('open');
          }
        }
      });

      const countLabel = document.getElementById('stock-count-label');
      if (countLabel) countLabel.innerText = 'Showing ' + visibleCount + ' stocks';
    }

    function sortHoldingsTable(key) {
      const tbody = document.getElementById('holdings-tbody');
      if (!tbody) return;

      if (currentSortKey === key) {
        currentSortAsc = !currentSortAsc;
      } else {
        currentSortKey = key;
        currentSortAsc = true;
      }

      ['symbol', 'qty', 'avg', 'invested', 'ltp', 'current', 'pnl', 'daypct'].forEach(k => {
        const icon = document.getElementById('sort-icon-' + k);
        if (icon) icon.innerText = k === currentSortKey ? (currentSortAsc ? '▲' : '▼') : '';
      });

      const rows = [];
      const parentRows = Array.from(tbody.querySelectorAll('.parent-row'));
      
      parentRows.forEach(p => {
        const sub = p.nextElementSibling;
        rows.push({ parent: p, sub: sub && sub.classList.contains('sub-table-row') ? sub : null });
      });

      rows.sort((a, b) => {
        let valA = a.parent.getAttribute('data-' + key) || '';
        let valB = b.parent.getAttribute('data-' + key) || '';

        if (key !== 'symbol') {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
      });

      rows.forEach(r => {
        tbody.appendChild(r.parent);
        if (r.sub) tbody.appendChild(r.sub);
      });
    }

    async function triggerReAuth() {
      const btn = document.getElementById('reauth-header-btn');
      if (btn) {
        btn.innerText = 'Authenticating...';
        btn.disabled = true;
      }

      try {
        const res = await fetch('/api/refresh-tokens', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          alert('Successfully re-authenticated Zerodha accounts!');
          window.location.reload();
        } else {
          alert('Authentication Warning: ' + (json.message || JSON.stringify(json)));
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to trigger re-auth: ' + err.message);
      } finally {
        if (btn) {
          btn.innerText = 'Re-Auth Accounts';
          btn.disabled = false;
        }
      }
    }
  </script>
  `;
}
