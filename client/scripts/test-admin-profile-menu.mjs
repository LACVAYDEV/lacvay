/**
 * Verifies admin profile menu actions invoke window navigation / session storage.
 * Run with dev server: npx vite (client) and node client/scripts/test-admin-profile-menu.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`${BASE}/admin/users`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);

  const url = page.url();
  if (url.includes('/login') || url === `${BASE}/` || url.endsWith('/')) {
    console.log('SKIP: not authenticated for /admin (at', url, '). Menu wiring test needs a logged-in admin session.');
    await browser.close();
    process.exit(0);
  }

  await page.getByRole('button', { name: 'Admin account menu' }).click();
  await page.getByRole('menuitem', { name: 'Switch to traveler' }).waitFor({ state: 'visible' });

  await page.getByRole('menuitem', { name: 'Switch to traveler' }).click();
  await page.waitForTimeout(500);

  const mode = await page.evaluate(() => localStorage.getItem('lacvay-session-mode'));
  const afterUrl = page.url();
  const ok = mode === 'user' && !afterUrl.includes('/admin');
  console.log(ok ? 'PASS: switch to traveler' : 'FAIL: switch to traveler', { mode, afterUrl });
  if (!ok) process.exitCode = 1;

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
