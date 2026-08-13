export function renderHtmlLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --surface-color: #111827;
      --surface-card: #1f293d;
      --surface-border: #374151;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --accent-blue: #3b82f6;
      --accent-blue-hover: #2563eb;
      --green-bg: rgba(16, 185, 129, 0.12);
      --green-text: #10b981;
      --red-bg: rgba(244, 63, 94, 0.12);
      --red-text: #f43f5e;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: var(--accent-blue);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    header {
      background-color: var(--surface-color);
      border-bottom: 1px solid var(--surface-border);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 700;
      font-size: 1.25rem;
      color: #fff;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;
      font-weight: 900;
    }

    .user-nav {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease-in-out;
    }

    .btn-primary {
      background-color: var(--accent-blue);
      color: #fff;
    }

    .btn-primary:hover {
      background-color: var(--accent-blue-hover);
    }

    .btn-secondary {
      background-color: var(--surface-card);
      color: var(--text-main);
      border-color: var(--surface-border);
    }

    .btn-secondary:hover {
      background-color: #2d3748;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px;
      width: 100%;
      flex: 1;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background-color: var(--surface-color);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .card-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .card-subtext {
      font-size: 0.875rem;
      font-weight: 600;
      margin-top: 4px;
    }

    .text-green {
      color: var(--green-text);
    }

    .text-red {
      color: var(--red-text);
    }

    .badge-green {
      background-color: var(--green-bg);
      color: var(--green-text);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
    }

    .badge-red {
      background-color: var(--red-bg);
      color: var(--red-text);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
    }

    /* Status Bar */
    .status-bar {
      background-color: var(--surface-color);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .status-items {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .account-pill {
      background-color: var(--surface-card);
      border: 1px solid var(--surface-border);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-green {
      background-color: var(--green-text);
      box-shadow: 0 0 8px var(--green-text);
    }

    .dot-red {
      background-color: var(--red-text);
      box-shadow: 0 0 8px var(--red-text);
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-input {
      background-color: var(--surface-color);
      border: 1px solid var(--surface-border);
      color: var(--text-main);
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      width: 320px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--accent-blue);
    }

    /* Table Component */
    .table-container {
      background-color: var(--surface-color);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    th {
      background-color: var(--surface-card);
      color: var(--text-muted);
      font-weight: 600;
      padding: 14px 16px;
      border-bottom: 1px solid var(--surface-border);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }

    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--surface-border);
      vertical-align: middle;
    }

    tr.parent-row {
      cursor: pointer;
      transition: background-color 0.1s ease;
    }

    tr.parent-row:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .sub-table-row {
      background-color: #0d1322;
      display: none;
    }

    .sub-table-row.open {
      display: table-row;
    }

    .sub-table-wrapper {
      padding: 16px 24px;
      border-bottom: 1px solid var(--surface-border);
    }

    .sub-table {
      width: 100%;
      background-color: var(--surface-color);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-sm);
    }

    .sub-table th {
      background-color: #1a2234;
    }

    footer {
      border-top: 1px solid var(--surface-border);
      padding: 16px 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8125rem;
      margin-top: 40px;
    }

    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .search-input {
        width: 100%;
      }

      .controls-bar {
        flex-direction: column;
        align-items: stretch;
      }

      th, td {
        padding: 10px 8px;
        font-size: 0.8125rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">K</div>
      <span>Family Holdings</span>
    </div>
    <div class="user-nav">
      <a href="/api/auth/logout" class="btn btn-secondary">Logout</a>
    </div>
  </header>

  <main class="container">
    ${bodyContent}
  </main>

  <footer>
    Zerodha Unified Family Holdings Dashboard • Powered by Kite Connect v3 API & Hono
  </footer>
</body>
</html>`;
}
