import { renderHtmlLayout } from './layout';

export function renderLoginPage(errorMsg?: string): string {
  const content = `
  <div style="max-width: 420px; margin: 60px auto 0 auto; background-color: var(--surface-color); border: 1px solid var(--surface-border); border-radius: var(--radius-lg); padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div class="brand-logo" style="margin: 0 auto 12px auto; width: 44px; height: 44px; font-size: 24px;">K</div>
      <h2 style="font-size: 1.5rem; font-weight: 700;">Family Holdings Login</h2>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 4px;">Enter master password to access dashboard</p>
    </div>

    ${
      errorMsg
        ? `<div style="background-color: var(--red-bg); color: var(--red-text); padding: 12px; border-radius: var(--radius-sm); font-size: 0.875rem; margin-bottom: 20px; border: 1px solid rgba(244,63,94,0.3);">
            ${errorMsg}
          </div>`
        : ''
    }

    <form method="POST" action="/api/auth/login">
      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Master Password</label>
        <input type="password" name="password" required autofocus style="width: 100%; background-color: var(--bg-color); border: 1px solid var(--surface-border); color: #fff; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 1rem; outline: none;" placeholder="••••••••">
      </div>

      <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1rem;">Log In</button>
    </form>
  </div>
  `;

  return renderHtmlLayout('Login — Family Holdings', content);
}
