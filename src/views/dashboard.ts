import { renderHtmlLayout } from './layout';
import { UnifiedPortfolioResult } from '../lib/merge';

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

export function renderDashboardPage(data: UnifiedPortfolioResult): string {
  const { summary, holdings, accountStatuses } = data;

  const pnlClass = summary.totalPnl >= 0 ? 'text-green' : 'text-red';
  const pnlBadgeClass = summary.totalPnl >= 0 ? 'badge-green' : 'badge-red';
  const dayClass = summary.totalDayChange >= 0 ? 'text-green' : 'text-red';
  const dayBadgeClass = summary.totalDayChange >= 0 ? 'badge-green' : 'badge-red';

  // Render Account Status Bar
  const accountPillsHtml = accountStatuses
    .map((acc) => {
      const isLive = acc.success;
      const dotClass = isLive ? 'dot-green' : 'dot-red';
      const statusText = isLive ? `${acc.holdingCount} stocks` : (acc.error || 'Token Expired / Auth Error');
      return `
      <div class="account-pill" title="${acc.error || ''}">
        <div class="dot ${dotClass}"></div>
        <strong>${acc.label} (${acc.userId})</strong>: 
        <span style="color: ${isLive ? 'var(--text-muted)' : 'var(--red-text)'};">${statusText}</span>
      </div>`;
    })
    .join('');

  // Render Table Rows
  const tableRowsHtml = holdings
    .map((h, idx) => {
      const rowId = `subrow-${idx}`;
      const isPnlPositive = h.totalPnl >= 0;
      const isDayPositive = h.totalDayChange >= 0;

      const accountBadges = h.accounts
        .map((a) => `<span style="background-color: var(--surface-card); border: 1px solid var(--surface-border); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px;">${a.label}: ${a.quantity}</span>`)
        .join('');

      const subTableRows = h.accounts
        .map(
          (a) => `
        <tr>
          <td><strong>${a.label}</strong> (${a.userId})</td>
          <td>${a.quantity}</td>
          <td>${formatCurrency(a.averagePrice)}</td>
          <td>${formatCurrency(a.investedValue)}</td>
          <td>${formatCurrency(a.currentValue)}</td>
          <td class="${a.pnl >= 0 ? 'text-green' : 'text-red'}" style="font-weight: 600;">
            ${formatCurrency(a.pnl)}
          </td>
        </tr>`
        )
        .join('');

      return `
      <tr class="parent-row" onclick="toggleRow('${rowId}')">
        <td>
          <div style="font-weight: 700; font-size: 0.95rem;">${h.tradingsymbol}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${h.exchange} • ISIN: ${h.isin}</div>
        </td>
        <td>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${accountBadges}
          </div>
        </td>
        <td style="font-weight: 600;">${h.totalQuantity}</td>
        <td>${formatCurrency(h.blendedAvgPrice)}</td>
        <td style="font-weight: 600;">${formatCurrency(h.lastPrice)}</td>
        <td style="font-weight: 700; color: #fff;">${formatCurrency(h.totalCurrentValue)}</td>
        <td>
          <div class="${isPnlPositive ? 'text-green' : 'text-red'}" style="font-weight: 700;">
            ${formatCurrency(h.totalPnl)}
          </div>
          <span class="${isPnlPositive ? 'badge-green' : 'badge-red'}">
            ${formatPercent((h.totalPnl / h.totalInvested) * 100)}
          </span>
        </td>
        <td>
          <div class="${isDayPositive ? 'text-green' : 'text-red'}" style="font-weight: 600;">
            ${formatCurrency(h.totalDayChange)}
          </div>
          <span class="${isDayPositive ? 'badge-green' : 'badge-red'}">
            ${formatPercent(h.dayChangePercentage)}
          </span>
        </td>
      </tr>
      <tr id="${rowId}" class="sub-table-row">
        <td colspan="8" style="padding: 0;">
          <div class="sub-table-wrapper">
            <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
              Breakdown per Zerodha Account for <strong>${h.tradingsymbol}</strong>
            </div>
            <table class="sub-table">
              <thead>
                <tr>
                  <th>Account Member</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>Invested Amount</th>
                  <th>Current Value</th>
                  <th>P&L</th>
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
    })
    .join('');

  const bodyContent = `
  <!-- Summary Cards Grid -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="card-label">Total Portfolio Value</div>
      <div class="card-value">${formatCurrency(summary.totalCurrentValue)}</div>
      <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px;">Invested: ${formatCurrency(summary.totalInvested)}</div>
    </div>

    <div class="summary-card">
      <div class="card-label">Total Overall Return</div>
      <div class="card-value ${pnlClass}">${formatCurrency(summary.totalPnl)}</div>
      <div style="margin-top: 4px;">
        <span class="${pnlBadgeClass}">${formatPercent(summary.totalPnlPercentage)}</span>
      </div>
    </div>

    <div class="summary-card">
      <div class="card-label">Day's P&L</div>
      <div class="card-value ${dayClass}">${formatCurrency(summary.totalDayChange)}</div>
      <div style="margin-top: 4px;">
        <span class="${dayBadgeClass}">${formatPercent(summary.totalDayChangePercentage)}</span>
      </div>
    </div>

    <div class="summary-card">
      <div class="card-label">Unified Coverage</div>
      <div class="card-value">${summary.stockCount} <span style="font-size: 1rem; color: var(--text-muted); font-weight: 400;">Unique Stocks</span></div>
      <div style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px;">Across ${summary.accountCount} Zerodha Accounts</div>
    </div>
  </div>

  <!-- Status Bar & Controls -->
  <div class="status-bar">
    <div class="status-items">
      <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-right: 4px;">ACCOUNTS:</span>
      ${accountPillsHtml}
    </div>

    <div style="display: flex; gap: 8px;">
      <button onclick="triggerReAuth()" id="reauth-btn" class="btn btn-secondary">
        ⚡ Re-Authenticate Accounts
      </button>
      <button onclick="window.location.href = '/?refresh=1'" class="btn btn-primary">
        🔄 Refresh Prices
      </button>
    </div>
  </div>

  <!-- Controls Bar -->
  <div class="controls-bar">
    <input type="text" id="stock-search" class="search-input" placeholder="Search by stock symbol or ISIN..." onkeyup="filterStocks()">
    <div style="font-size: 0.8125rem; color: var(--text-muted);">
      💡 <em>Tip: Click any stock row to view per-account distribution.</em>
    </div>
  </div>

  <!-- Table -->
  <div class="table-container">
    <table id="holdings-table">
      <thead>
        <tr>
          <th>Stock / Exchange</th>
          <th>Holders Breakdown</th>
          <th>Total Qty</th>
          <th>Blended Avg</th>
          <th>LTP</th>
          <th>Current Value</th>
          <th>Overall P&L</th>
          <th>Day's P&L</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml.length > 0 ? tableRowsHtml : `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No holdings found. Ensure accounts are authenticated via "Re-Authenticate Accounts".</td></tr>`}
      </tbody>
    </table>
  </div>

  <script>
    function toggleRow(id) {
      const row = document.getElementById(id);
      if (row) {
        row.classList.toggle('open');
      }
    }

    function filterStocks() {
      const query = document.getElementById('stock-search').value.toLowerCase();
      const parentRows = document.querySelectorAll('.parent-row');
      
      parentRows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const nextSubRow = row.nextElementSibling;
        
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
          if (nextSubRow && nextSubRow.classList.contains('sub-table-row')) {
            nextSubRow.classList.remove('open');
          }
        }
      });
    }

    async function triggerReAuth() {
      const btn = document.getElementById('reauth-btn');
      btn.innerText = '⏳ Authenticating...';
      btn.disabled = true;

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
        btn.innerText = '⚡ Re-Authenticate Accounts';
        btn.disabled = false;
      }
    }
  </script>
  `;

  return renderHtmlLayout('Dashboard — Family Holdings', bodyContent);
}
