// Rasterizes all toybox item sprites to one PNG for visual review.
// Requires the dev server running (imports the real module through Vite).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  defaultViewport: { width: 1600, height: 700 },
});
const page = await browser.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

const dataUrl = await page.evaluate(async () => {
  const mod = await import('/src/toybox/itemSprites.js');
  const ids = mod.ITEM_IDS;
  const S = mod.ITEM_SIZE;
  const scale = 7;
  const pad = 14;
  const cols = 7;
  const rows = Math.ceil(ids.length / cols);
  const out = document.createElement('canvas');
  out.width = cols * (S * scale + pad) + pad;
  out.height = rows * (S * scale + pad + 22) + pad;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#101a33';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = false;
  ctx.font = '13px monospace';
  ids.forEach((id, i) => {
    const cx = pad + (i % cols) * (S * scale + pad);
    const cy = pad + Math.floor(i / cols) * (S * scale + pad + 22);
    ctx.drawImage(mod.buildItemSprite(id), cx, cy, S * scale, S * scale);
    ctx.fillStyle = '#eae6f2';
    ctx.fillText(id, cx, cy + S * scale + 15);
  });
  return out.toDataURL('image/png');
});

fs.writeFileSync('.shots/items.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('SAVED .shots/items.png');
await browser.close();
