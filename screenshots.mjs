import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const BASE = 'http://localhost:5173'
const OUT  = './screenshots'

if (!existsSync(OUT)) await mkdir(OUT)

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

const page = await browser.newPage()

// 1440×900, retina (2×) for high quality
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

// Default auth is already manager — no localStorage injection needed.
// But pre-warm the session by loading the base URL first.
await page.goto(BASE, { waitUntil: 'networkidle2' })

async function shot(name, url, { waitFor, afterLoad } = {}) {
  console.log(`  📸 ${name}`)
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' })
  if (afterLoad) await afterLoad(page)
  if (waitFor)   await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 600)) // let animations settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
}

console.log('\n🚀 Starting screenshots...\n')

// ── Main pages ────────────────────────────────────────────────────────────
await shot('01-dashboard',           '/dashboard')
await shot('02-team-dashboard',      '/team')
await shot('03-reimbursement-queue', '/team/reimbursement')
await shot('04-executive-dashboard', '/team/executive')
await shot('05-approvals-expenses',  '/approvals', { waitFor: 'table' })
await shot('06-approvals-travel',    '/approvals', {
  waitFor: 'table',
  afterLoad: async (p) => {
    // click the Travel Requests tab
    await p.waitForSelector('button', { timeout: 4000 })
    const buttons = await p.$$('button')
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent?.trim())
      if (text?.includes('TRAVEL REQUESTS')) { await btn.click(); break }
    }
    await new Promise(r => setTimeout(r, 400))
  },
})
await shot('07-expense-list',   '/expenses',    { waitFor: 'table' })
await shot('08-travel-list',    '/travel',      { waitFor: 'table' })
await shot('09-analytics',      '/analytics',   { waitFor: '.recharts-wrapper' })
await shot('10-policy',         '/policy',      { waitFor: '.grid' })
await shot('11-settings',       '/settings')

// ── Detail pages — grab first item from list ─────────────────────────────
// Expense detail
await page.goto(`${BASE}/expenses`, { waitUntil: 'networkidle2' })
await page.waitForSelector('table', { timeout: 6000 }).catch(() => {})
await new Promise(r => setTimeout(r, 500))
const expenseLink = await page.$('tbody tr td a')
if (expenseLink) {
  await expenseLink.click()
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: `${OUT}/12-expense-detail.png`, fullPage: true })
  console.log('  📸 12-expense-detail')
}

// Travel detail
await page.goto(`${BASE}/travel`, { waitUntil: 'networkidle2' })
await page.waitForSelector('table', { timeout: 6000 }).catch(() => {})
await new Promise(r => setTimeout(r, 500))
const travelLink = await page.$('tbody tr td a')
if (travelLink) {
  await travelLink.click()
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: `${OUT}/13-travel-detail.png`, fullPage: true })
  console.log('  📸 13-travel-detail')
}

// ── Report Wizard — all 3 steps ──────────────────────────────────────────
await shot('14-report-wizard-step1', '/reports')

// Step 2 — click "Preview Results"
await page.goto(`${BASE}/reports`, { waitUntil: 'networkidle2' })
await new Promise(r => setTimeout(r, 400))
const previewBtn = await page.evaluateHandle(() => {
  return Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent?.includes('Preview Results'))
})
if (previewBtn.asElement()) {
  await previewBtn.asElement().click()
  await new Promise(r => setTimeout(r, 1800)) // wait for data to load
  await page.screenshot({ path: `${OUT}/15-report-wizard-step2.png`, fullPage: true })
  console.log('  📸 15-report-wizard-step2')

  // Step 3 — click "Proceed to Export"
  const proceedBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.includes('Proceed to Export'))
  })
  if (proceedBtn.asElement()) {
    await proceedBtn.asElement().click()
    await new Promise(r => setTimeout(r, 400))
    await page.screenshot({ path: `${OUT}/16-report-wizard-step3.png`, fullPage: true })
    console.log('  📸 16-report-wizard-step3')
  }
}

// ── New forms ────────────────────────────────────────────────────────────
await shot('17-new-expense-form', '/expenses/new')
await shot('18-new-travel-form',  '/travel/new')

await browser.close()

console.log(`\n✅ Done! ${OUT}/ folder has all screenshots.\n`)
