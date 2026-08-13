export interface ChartDataItem {
  label: string;
  value: number;
  investedValue?: number;
  percentage: number;
  color: string;
}

export function renderDonutChart(chartId: string, title: string, items: ChartDataItem[], size = 140): string {
  if (items.length === 0) {
    items = [{ label: 'No Data', value: 1, percentage: 100, color: '#e2e8f0' }];
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  const renderSegmentCircles = (dataItems: ChartDataItem[]) => {
    let currentOffset = 0;
    return dataItems.map((item) => {
      const strokeDash = (item.percentage / 100) * circumference;
      const strokeDasharray = `${strokeDash} ${circumference - strokeDash}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += strokeDash;

      return `<circle 
        cx="60" 
        cy="60" 
        r="${radius}" 
        fill="transparent" 
        stroke="${item.color}" 
        stroke-width="18" 
        stroke-dasharray="${strokeDasharray}" 
        stroke-dashoffset="${strokeDashoffset}" 
        style="transition: stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease;"
      />`;
    }).join('');
  };

  const renderLegend = (dataItems: ChartDataItem[]) => {
    return dataItems.slice(0, 6).map((item) => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.75rem; font-weight: 500; color: #475569; margin-bottom: 4px;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; max-width: 110px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; flex-shrink: 0;"></span>
          <span title="${item.label}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.label}</span>
        </div>
        <span class="legend-pct" style="font-weight: 700; color: #0f172a;">${item.percentage.toFixed(2)}%</span>
      </div>
    `).join('');
  };

  return `
  <div id="chart-container-${chartId}" style="display: flex; align-items: center; gap: 16px;">
    <div style="position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0;">
      <svg id="svg-${chartId}" viewBox="0 0 120 120" width="${size}" height="${size}" style="transform: rotate(-90deg); overflow: visible;">
        ${renderSegmentCircles(items)}
      </svg>
      <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 800; color: #334155;">
        ${title}
      </div>
    </div>
    <div id="legend-${chartId}" style="flex: 1; min-width: 120px; max-height: 140px; overflow-y: auto;">
      ${renderLegend(items)}
    </div>
  </div>
  `;
}
