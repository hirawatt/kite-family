import { renderHtmlLayout } from './layout';
import { UnifiedPortfolioResult } from '../lib/merge';
import { renderHeader } from './components/header';
import { renderOverviewCard } from './components/overview-card';
import { renderHoldingsTable } from './components/holdings-table';

export function renderDashboardPage(data: UnifiedPortfolioResult): string {
  const { summary, holdings, accountStatuses } = data;

  const headerHtml = renderHeader(accountStatuses);
  const overviewCardHtml = renderOverviewCard(summary, holdings, accountStatuses);
  const holdingsTableHtml = renderHoldingsTable(holdings);

  const fullContent = `
  ${headerHtml}
  <div style="margin-top: 24px;">
    ${overviewCardHtml}
    ${holdingsTableHtml}
  </div>
  `;

  return renderHtmlLayout('Holdings — Zerodha Family Portfolio', fullContent);
}
