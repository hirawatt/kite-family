import { renderHtmlLayout } from './layout';

export function renderLoginPage(errorMsg?: string): string {
  const content = `
  <div style="max-width: 420px; margin: 80px auto 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="margin: 0 auto 14px auto; width: 44px; height: 44px; background: linear-gradient(135deg, #0066cc, #004499); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #ffffff; font-weight: 900;">
        K
      </div>
      <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Family Holdings Login</h2>
      <p style="color: #64748b; font-size: 0.875rem; margin-top: 6px; font-weight: 500;">Enter master password to access unified holdings</p>
    </div>

    ${
      errorMsg
        ? `<div style="background-color: #fef2f2; color: #b91c1c; padding: 12px 16px; border-radius: 6px; font-size: 0.875rem; margin-bottom: 20px; border: 1px solid #fecaca; font-weight: 600;">
            ${errorMsg}
          </div>`
        : ''
    }

    <form method="POST" action="/api/auth/login">
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 0.8125rem; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Master Password</label>
        <input type="password" name="password" required autofocus style="width: 100%; background-color: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; padding: 12px 16px; border-radius: 6px; font-size: 1rem; outline: none;" placeholder="••••••••">
      </div>

      <button type="submit" style="width: 100%; padding: 14px; background-color: #0066cc; color: #ffffff; border: none; border-radius: 6px; font-size: 1rem; font-weight: 700; cursor: pointer;">
        Log In
      </button>
    </form>
  </div>
  `;

  return renderHtmlLayout('Login — Zerodha Family Holdings', content);
}
