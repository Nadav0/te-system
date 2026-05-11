import puppeteer from 'puppeteer-core';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT  = __dirname;
const BASE = 'http://localhost:5173';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ROLES = [
  { key: 'manager',  email: 'manager@company.com',  label: 'Manager'  },
  { key: 'employee', email: 'employee@company.com',  label: 'Employee' },
  { key: 'finance',  email: 'finance@company.com',   label: 'Finance'  },
];

const PAGES = {
  manager: [
    { path: '/dashboard',           name: '01-dashboard'           },
    { path: '/approvals',           name: '02-approvals'           },
    { path: '/expenses',            name: '03-expenses'            },
    { path: '/travel',              name: '04-travel'              },
    { path: '/team',                name: '05-team'                },
    { path: '/team/users',          name: '06-team-users'          },
    { path: '/team/executive',      name: '07-team-executive'      },
    { path: '/team/reimbursement',  name: '08-team-reimbursement'  },
    { path: '/analytics',           name: '09-analytics'           },
    { path: '/settings',            name: '10-settings'            },
  ],
  employee: [
    { path: '/dashboard',           name: '01-dashboard'           },
    { path: '/expenses',            name: '02-expenses'            },
    { path: '/expenses/new',        name: '03-expenses-new'        },
    { path: '/travel',              name: '04-travel'              },
    { path: '/travel/new',          name: '05-travel-new'          },
    { path: '/settings',            name: '06-settings'            },
  ],
  finance: [
    { path: '/dashboard',           name: '01-dashboard'           },
    { path: '/policy',              name: '02-policy'              },
    { path: '/expenses',            name: '03-expenses'            },
    { path: '/travel',              name: '04-travel'              },
    { path: '/coding-queue',        name: '05-coding-queue'        },
    { path: '/analytics',           name: '06-analytics'           },
    { path: '/reports',             name: '07-reports'             },
    { path: '/settings',            name: '08-settings'            },
  ],
};

async function shot(page, filename, description) {
  await new Promise(r => setTimeout(r, 900));
  const fullPath = join(OUT, `${filename}.png`);
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`  ✓  ${filename}.png`);
}

async function waitForApp(page) {
  await new Promise(r => setTimeout(r, 1200));
}

async function login(page, email) {
  // Clear storage first
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(`${BASE}/login`);
  await waitForApp(page);

  await page.type('input[type="email"]', email, { delay: 40 });
  await page.type('input[type="password"]', 'password', { delay: 40 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await waitForApp(page);
}

async function getFirstId(page, endpoint) {
  const token = await page.evaluate(() => localStorage.getItem('te_token'));
  const data = await page.evaluate(async (ep, tk) => {
    const r = await fetch(`/api${ep}`, { headers: { Authorization: `Bearer ${tk}` } });
    if (!r.ok) return [];
    return r.json();
  }, endpoint, token);
  return Array.isArray(data) && data.length > 0 ? data[0].id : null;
}

async function goTo(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0', timeout: 12000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // ── 00. Login page (empty) ──────────────────────────────────────
  console.log('\n── Login page ──');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await waitForApp(page);
  await shot(page, '00-login', 'Login — empty');

  // Login page filled
  await page.type('input[type="email"]', 'manager@company.com', { delay: 30 });
  await page.type('input[type="password"]', 'password', { delay: 30 });
  await shot(page, '00-login-filled', 'Login — filled');

  // ── Per-role ────────────────────────────────────────────────────
  for (const role of ROLES) {
    const dir = join(OUT, role.key);
    mkdirSync(dir, { recursive: true });
    console.log(`\n── ${role.label} ──`);

    await login(page, role.email);

    // All main pages
    for (const { path, name } of PAGES[role.key]) {
      await goTo(page, path);
      await shot(page, join(role.key, name), `${role.label} › ${path}`);
    }

    // Expense detail
    const expId = await getFirstId(page, '/expenses');
    if (expId) {
      await goTo(page, `/expenses/${expId}`);
      await shot(page, join(role.key, 'detail-expense'), `${role.label} › Expense Detail`);
    }

    // Travel detail
    const trvId = await getFirstId(page, '/travel');
    if (trvId) {
      await goTo(page, `/travel/${trvId}`);
      await shot(page, join(role.key, 'detail-travel'), `${role.label} › Travel Detail`);
    }

    // ── Notifications panel ──
    await goTo(page, '/dashboard');
    try {
      const bellBtn = await page.$('header button:nth-child(2)');
      if (bellBtn) { await bellBtn.click(); await new Promise(r => setTimeout(r, 700)); }
      await shot(page, join(role.key, 'ui-notifications'), `${role.label} › Notifications`);
      await page.keyboard.press('Escape');
    } catch (_) {}

    // ── Role switcher dropdown ──
    await goTo(page, '/dashboard');
    try {
      const buttons = await page.$$('header button');
      const lastBtn = buttons[buttons.length - 1];
      if (lastBtn) { await lastBtn.click(); await new Promise(r => setTimeout(r, 600)); }
      await shot(page, join(role.key, 'ui-role-switcher'), `${role.label} › Role Switcher`);
      await page.keyboard.press('Escape');
    } catch (_) {}

    // ── AI Chat widget ──
    await goTo(page, '/dashboard');
    try {
      const firstBtn = await page.$('header button');
      if (firstBtn) { await firstBtn.click(); await new Promise(r => setTimeout(r, 800)); }
      await shot(page, join(role.key, 'ui-chat-open'), `${role.label} › Chat Widget open`);
      if (firstBtn) await firstBtn.click();
    } catch (_) {}

    // ── Dark mode ──
    await goTo(page, '/dashboard');
    try {
      const themeBtn = await page.$('header button[title]');
      if (themeBtn) { await themeBtn.click(); await new Promise(r => setTimeout(r, 600)); }
      await shot(page, join(role.key, 'ui-dark-mode'), `${role.label} › Dark mode`);
      if (themeBtn) { await themeBtn.click(); await new Promise(r => setTimeout(r, 400)); }
    } catch (_) {}

    // ── Search active ──
    await goTo(page, '/expenses');
    try {
      const searchEl = await page.$('input[placeholder*="Search"], input[placeholder*="search"]');
      if (searchEl) {
        await searchEl.type('alice', { delay: 60 });
        await new Promise(r => setTimeout(r, 600));
        await shot(page, join(role.key, 'ui-search-results'), `${role.label} › Search results`);
        await searchEl.click({ clickCount: 3 });
        await searchEl.type(' ');
      }
    } catch (_) {}

    // ── Manager extras ──
    if (role.key === 'manager') {
      await goTo(page, '/approvals');
      try {
        const row = await page.$('table tbody tr');
        if (row) { await row.click(); await new Promise(r => setTimeout(r, 700)); }
        await shot(page, join(role.key, 'approvals-row-selected'), `Manager › Approval row selected`);
      } catch (_) {}
    }

    // ── Finance extras ──
    if (role.key === 'finance') {
      await goTo(page, '/coding-queue');
      try {
        const item = await page.$('.overflow-y-auto button, [class*="queue"] button');
        if (item) { await item.click(); await new Promise(r => setTimeout(r, 700)); }
        await shot(page, join(role.key, 'coding-queue-detail'), `Finance › Coding Queue item selected`);
      } catch (_) {}
    }

    // ── Employee extras ──
    if (role.key === 'employee') {
      await goTo(page, '/expenses/new');
      try {
        const inputs = await page.$$('input[type="text"], input:not([type])');
        if (inputs[0]) await inputs[0].type('Q2 Client Dinner', { delay: 40 });
        await new Promise(r => setTimeout(r, 400));
        await shot(page, join(role.key, 'expenses-new-filled'), `Employee › New Expense filled`);
      } catch (_) {}
    }
  }

  // ── API docs ────────────────────────────────────────────────────
  console.log('\n── API Docs ──');
  await page.goto('http://localhost:8000/docs', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, '00-api-docs', 'FastAPI Swagger UI');

  await browser.close();

  // Print summary
  console.log('\n✅  Done! Screenshots saved to docs/screenshots/');
  console.log('');
  const { readdirSync } = await import('fs');
  const count = (dir) => {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter(f => f.isFile() && f.name.endsWith('.png')).length;
    } catch { return 0; }
  };
  const roles = ['manager', 'employee', 'finance'];
  let total = count(OUT);
  roles.forEach(r => {
    const n = count(join(OUT, r));
    console.log(`  ${r.padEnd(10)} ${n} screenshots`);
    total += n;
  });
  console.log(`  ${'total'.padEnd(10)} ${total} screenshots`);
})();
