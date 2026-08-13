export function renderHeader(accountStatuses: any[] = []): string {
  const currentDate = new Date().toISOString().slice(0, 10);

  const accountOptionsHtml = accountStatuses.map(acc => `
    <option value="${acc.userId}">${acc.label} (${acc.userId})</option>
  `).join('');

  return `
  <header style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 14px 32px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); position: sticky; top: 0; z-index: 50;">
    <!-- Left Logo & Title -->
    <div style="display: flex; align-items: center; gap: 10px;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066cc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
      </svg>
      <span style="font-weight: 800; font-size: 1.35rem; color: #0f172a; letter-spacing: -0.02em;">Holdings</span>
    </div>

    <!-- Right Controls & Actions -->
    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <!-- Date Badge -->
      <span style="background: #eff6ff; color: #0066cc; border: 1px solid #bfdbfe; font-size: 0.8125rem; font-weight: 700; padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span>${currentDate}</span>
      </span>

      <!-- Account Filter Select -->
      <div style="position: relative;">
        <select id="account-filter-select" onchange="filterByAccount(this.value)" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 0.8125rem; font-weight: 700; padding: 6px 14px; border-radius: 6px; cursor: pointer; outline: none;">
          <option value="ALL">All Family Accounts</option>
          ${accountOptionsHtml}
        </select>
      </div>

      <!-- Refresh Prices Button -->
      <button onclick="window.location.href = '/?refresh=1'" style="background: #ffffff; color: #0066cc; border: 1px solid #0066cc; font-size: 0.8125rem; font-weight: 700; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        <span>Refresh Prices</span>
      </button>

      <!-- Re-Auth Accounts Button -->
      <button id="reauth-header-btn" onclick="triggerReAuth()" style="background: #ffffff; color: #475569; border: 1px solid #cbd5e1; font-size: 0.8125rem; font-weight: 700; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        <span>Re-Auth Accounts</span>
      </button>

      <div style="height: 20px; width: 1px; background: #e2e8f0; margin: 0 4px;"></div>

      <!-- Logout -->
      <a href="/api/auth/logout" style="color: #64748b; font-size: 0.875rem; font-weight: 600; text-decoration: none; padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; background: #ffffff;">
        Logout
      </a>
    </div>
  </header>
  `;
}
