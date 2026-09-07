// Headless visual check: screenshots the site at each chapter + collects console errors.
import puppeteer from 'puppeteer-core';

const OUT = './.shots';
const stops = process.argv[2]
  ? process.argv[2].split(',').map(Number)
  : [0, 0.18, 0.38, 0.58, 0.78, 1.0];

// second arg is the viewport, e.g. 390x844. Anything 768 or narrower is shot
// with touch emulation so `pointer: coarse` matches and the page takes the
// lite path, the same as a real phone.
const [W, H] = (process.argv[3] || '1440x900').split('x').map(Number);
const touch = W <= 768;

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  args: ['--use-angle=default', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, hasTouch: touch, isMobile: touch },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));

const total = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
for (let i = 0; i < stops.length; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * stops[i]));
  await new Promise((r) => setTimeout(r, 1600)); // let the eased chapter-coord settle
  await page.screenshot({ path: `${OUT}/shot_${W}_${i}_${stops[i]}.png` });
  console.log(`shot ${i} @ ${stops[i]}`);
}

console.log('--- console errors ---');
console.log(errors.length ? errors.join('\n') : '(none)');
await browser.close();
