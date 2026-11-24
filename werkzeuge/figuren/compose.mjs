// Setzt Körper + Frisur + Gesicht zu einer Figur zusammen und speichert sie als PNG mit transparentem Hintergrund.
// node compose.mjs <ziel.png> <body-rel> <head> <face> [hoehe-px] [hautfarbe] [oberteilfarbe]
import { execFileSync } from 'child_process';
import fs from 'fs';
import pw from '/opt/node-tools/node_modules/playwright/index.js'; const { chromium } = pw;
const [out, body, head, face, hpx = '900', skin = '#F2C9A5', top = '#5AAAEB'] = process.argv.slice(2);
const part = (rel, o = {}) => JSON.parse(execFileSync('node', ['render.mjs', rel, JSON.stringify(o)]).toString());
const src = fs.readFileSync('node_modules/@opeepsfun/open-peeps/build/Effigy.js', 'utf8');
// Frisur-Versatz wie im offiziellen Baukasten (createHair)
const m = new RegExp('head.type === "' + head + '"\\) \\{\\s*return React.createElement\\("g", \\{ transform: \'translate\\(([-\\d.]+) ([-\\d.]+)\\)').exec(src);
const [hx, hy] = m ? [+m[1], +m[2]] : [0, 0];
const B = part('body/' + body, { skinColor: skin, topColor: top, shoesColor: '#333', bottomColor: '#3a3f55' });
const H = part('head/' + head, { hairColor: '#4a3426', skinColor: skin });
const F = part('face/' + face, {});
const [, , bw, bh] = B.viewBox.split(' ').map(Number);
const neck = JSON.parse(execFileSync('node', ['neck.mjs', 'body/' + body]).toString().trim().split('\n').pop());
const HX = neck.x - 234.5 + hx, HY = -449 + hy, FX = neck.x - 45.5, FY = -273;
const minY = -520, W = bw, Hh = bh - minY;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${minY} ${W} ${Hh}" width="${Math.round(W * hpx / Hh)}" height="${hpx}">
<g>${B.inner}</g><g transform="translate(${HX} ${HY})">${H.inner}</g><g transform="translate(${FX} ${FY})">${F.inner}</g></svg>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell' });
const pg = await b.newPage({ viewport: { width: Math.round(W * hpx / Hh), height: +hpx } });
await pg.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
await pg.screenshot({ path: out, omitBackground: true }); await b.close();
