// Macht aus einem echten Video ein Reel im Stil „Aufnahme + große Überschrift + wechselnde Kurz-Fakten“:
//   node video-reel.js posts/<datei>.json
// Erwartet in der Post-Datei: "video": { "file", "start", "duration", "credit", "short", "license", "page",
//   optional "headline" (sonst Titel der ersten Folie) und "captions" (sonst Überschriften der Inhaltsfolien) }.
// Ergebnis: out/<id>/video-reel.mp4 (9:16, für den Feed) und out/<id>/video-45.mp4 (4:5, als Folie im Karussell).
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const FPS = 30;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mark = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');

// Layout je Format: wo die Überschrift steht, wo das Video sitzt und wo die Fakten erscheinen
const LAYOUTS = {
  reel: { W: 1080, H: 1920, head: [200, 470], video: 560, caption: [1250, 1640], headSize: 76, capSize: 58 },
  '45': { W: 1080, H: 1350, head: [40, 300], video: 330, caption: [930, 1230], headSize: 64, capSize: 48 },
};

const css = (L) => `*{box-sizing:border-box}html,body{margin:0;width:${L.W}px;height:${L.H}px;background:transparent;font-family:"DejaVu Sans",Arial,sans-serif}
.head{position:absolute;left:0;right:0;top:${L.head[0]}px;height:${L.head[1] - L.head[0]}px;background:rgba(10,14,40,.92);display:flex;align-items:center;padding:0 64px}
.head h1{margin:0;color:#fff;font-size:${L.headSize}px;line-height:1.08;font-weight:800;letter-spacing:-.01em}
.hl{color:#ffe14d}
.cap{position:absolute;left:64px;right:64px;top:${L.caption[0]}px;height:${L.caption[1] - L.caption[0]}px;display:flex;align-items:center}
.cap p{margin:0;color:#fff;font-size:${L.capSize}px;line-height:1.25;font-weight:700;text-shadow:0 3px 16px rgba(0,0,0,.8)}
.cap .hl{background:#ffe14d;color:#141a2e;padding:0 .12em;text-shadow:none;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.foot{position:absolute;left:64px;right:64px;bottom:${L.H === 1920 ? 150 : 28}px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;
 font-family:"DejaVu Sans Mono",monospace;color:rgba(255,255,255,.85);font-size:${L.H === 1920 ? 30 : 24}px;text-shadow:0 2px 8px rgba(0,0,0,.8)}
.foot .credit{font-family:"DejaVu Sans",sans-serif;font-size:${L.H === 1920 ? 22 : 20}px;text-align:right;max-width:60%}`;

async function overlays(page, L, post, captions, tmp, tag) {
  await page.setViewportSize({ width: L.W, height: L.H });
  const headline = post.video.headline || post.slides[0].title;
  const credit = post.video.short || `Video: ${post.video.credit}`;
  await page.setContent(`<style>${css(L)}</style><div class="head"><h1>${mark(headline)}</h1></div>
    <div class="foot"><span>@krass.erforscht</span><span class="credit">${esc(credit)}</span></div>`);
  // Überschrift verkleinern, falls sie nicht ins Band passt
  await page.evaluate(() => { const h = document.querySelector('h1'), b = document.querySelector('.head');
    for (let k = 0; k < 30 && h.scrollHeight > b.clientHeight - 20; k++) h.style.fontSize = parseFloat(getComputedStyle(h).fontSize) * 0.95 + 'px'; });
  await page.screenshot({ path: path.join(tmp, `${tag}-frame.png`), omitBackground: true });
  for (const [i, c] of captions.entries()) {
    await page.setContent(`<style>${css(L)}</style><div class="cap"><p>${mark(c)}</p></div>`);
    await page.screenshot({ path: path.join(tmp, `${tag}-cap${i}.png`), omitBackground: true });
  }
}

function render(L, post, captions, music, tmp, tag, out) {
  const v = post.video;
  const dur = v.duration;
  const per = dur / captions.length;
  const args = ['-y', '-v', 'error',
    '-ss', String(v.start || 0), '-t', String(dur), '-i', v.file,
    '-i', path.join(tmp, `${tag}-frame.png`), ...captions.flatMap((_, i) => ['-i', path.join(tmp, `${tag}-cap${i}.png`)]),
    '-stream_loop', '-1', '-ss', String(music.start), '-i', music.file];
  const musicIdx = 2 + captions.length;
  // Hintergrund: dasselbe Video vergrößert und unscharf; davor das Video in voller Breite
  const f = [
    `[0:v]fps=${FPS},split[a][b]`,
    `[a]scale=${L.W}:${L.H}:force_original_aspect_ratio=increase,crop=${L.W}:${L.H},boxblur=30:3,eq=brightness=-0.15[bg]`,
    `[b]scale=${L.W}:-2[fg]`,
    `[bg][fg]overlay=0:${L.video}[base]`,
    `[base][1:v]overlay=0:0[o0]`,
  ];
  let last = 'o0';
  captions.forEach((_, i) => {
    const from = (i * per).toFixed(2), to = ((i + 1) * per).toFixed(2);
    f.push(`[${last}][${2 + i}:v]overlay=0:0:enable='between(t,${from},${to})'[o${i + 1}]`);
    last = `o${i + 1}`;
  });
  f.push(`[${last}]format=yuv420p[v]`);
  f.push(`[${musicIdx}:a]atrim=0:${dur},afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=sample_rates=44100:channel_layouts=stereo[aout]`);
  args.push('-filter_complex', f.join(';'), '-map', '[v]', '-map', '[aout]', '-t', String(dur),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out);
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

(async () => {
  const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const v = post.video;
  if (!v?.file) throw new Error('Kein "video" in der Post-Datei');
  const total = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v.file]).toString().trim();
  v.start = Math.max(0, Math.min(v.start || 0, total - 3));
  // 8 bis 30 Sekunden: lang genug für die Fakten, kurz genug, dass man bis zum Ende schaut
  v.duration = Math.max(8, Math.min(v.duration || 15, 30, total - v.start));
  const captions = v.captions || post.slides.filter(s => !s.type && s.title).map(s => s.title).slice(0, 4);

  const dir = path.join('out', post.id);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = fs.mkdtempSync('/tmp/vreel-');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage();
  for (const [tag, L] of Object.entries(LAYOUTS)) await overlays(page, L, post, captions, tmp, tag);
  await browser.close();

  const m = JSON.parse(execFileSync('node', ['--max-http-header-size=262144', 'music.js', post.tone || 'staunen', String(Math.ceil(v.duration))],
    { env: process.env, stdio: ['ignore', 'pipe', 'inherit'] }).toString());
  const music = { file: m.file, start: m.seconds > v.duration + 30 ? Math.min(15, Math.round(m.seconds * 0.1)) : 0 };
  fs.writeFileSync(path.join(dir, 'video-music.json'), JSON.stringify({ title: m.title, artist: m.artist, source: m.source, license: m.license, credit: m.credit }, null, 2));

  render(LAYOUTS.reel, post, captions, music, tmp, 'reel', path.join(dir, 'video-reel.mp4'));
  render(LAYOUTS['45'], post, captions, music, tmp, '45', path.join(dir, 'video-45.mp4'));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Video-Reel (${v.duration.toFixed(1)} s, ${m.credit || 'eigene Klangfläche'}) -> ${dir}/video-reel.mp4 und video-45.mp4`);
})().catch(e => { console.error(e.message); process.exit(1); });
