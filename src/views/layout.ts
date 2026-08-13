export function renderHtmlLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #f4f6f9;
      --surface-color: #ffffff;
      --surface-card: #f8fafc;
      --surface-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --accent-blue: #0066cc;
      --accent-blue-hover: #0052a3;
      --green-bg: #f0fdf4;
      --green-text: #15803d;
      --red-bg: #fef2f2;
      --red-text: #b91c1c;
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

    .container {
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px 32px;
      width: 100%;
      flex: 1;
    }

    .text-green {
      color: var(--green-text) !important;
    }

    .text-red {
      color: var(--red-text) !important;
    }

    .badge-green {
      background-color: var(--green-bg);
      color: var(--green-text);
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #bbf7d0;
      display: inline-block;
    }

    .badge-red {
      background-color: var(--red-bg);
      color: var(--red-text);
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #fecaca;
      display: inline-block;
    }

    tr.parent-row {
      cursor: pointer;
    }

    tr.parent-row:hover {
      background-color: #f8fafc !important;
    }

    .sub-table-row {
      display: none;
    }

    .sub-table-row.open {
      display: table-row;
    }

    footer {
      border-top: 1px solid var(--surface-border);
      background-color: var(--surface-color);
      padding: 20px 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8125rem;
      margin-top: 40px;
    }

    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 16px 12px;
      }
    }
  </style>
</head>
<body>
  <main class="container">
    ${bodyContent}
  </main>

  <footer>
    Zerodha Unified Family Holdings Dashboard • Powered by Kite Connect v3 API & Hono
  </footer>

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
  </script>
</body>
</html>`;
}
