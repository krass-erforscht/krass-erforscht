// Findet den Hals (oberste Körperpixel-Mitte) eines Körperteils: node neck.mjs <body-rel>
import { execFileSync } from 'child_process';
import pw from '/opt/node-tools/node_modules/playwright/index.js'; const { chromium } = pw;
const rel = process.argv[2];
const { viewBox, inner } = JSON.parse(execFileSync('node', ['render.mjs', rel]).toString());
const [, , w, h] = viewBox.split(' ').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell' });
const p = await b.newPage();
const res = await p.evaluate(async ({ svg, w, h }) => {
  const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  await img.decode(); const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h).data;
  for (let y = 0; y < h; y++) { const xs = []; for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) xs.push(x);
    if (xs.length > 8) return { y, x: (xs[0] + xs.at(-1)) / 2, w: xs.at(-1) - xs[0] }; }
}, { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${inner}</svg>`, w, h });
console.log(JSON.stringify(res)); await b.close();
