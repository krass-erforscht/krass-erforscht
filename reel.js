// Macht aus den gerenderten Folien ein Reel (9:16, MP4) mit passender Musik: node reel.js posts/<datei>.json
// Erst render.js laufen lassen. Ergebnis: out/<id>/reel.mp4
// Jede Folie steht so lange, wie man zum Lesen braucht, mit leichtem Zoom und weichen Übergängen.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const W = 1080, H = 1920, FPS = 30, FADE = 0.4;

// Lesedauer: Grundzeit plus etwa 0,28 Sekunden pro Wort, zwischen 3 und 7 Sekunden
function duration(slide) {
  const words = [slide.title, slide.big, ...(slide.text || [])].join(' ').split(/\s+/).filter(Boolean).length;
  return Math.min(7, Math.max(3, 1.5 + words * 0.28));
}

(async () => {
  const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const dir = path.join('out', post.id);
  const tmp = fs.mkdtempSync('/tmp/reel-');

  // Jede Folie mittig auf den blauen Marken-Hintergrund setzen
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (let i = 1; i <= post.slides.length; i++) {
    const img = fs.readFileSync(path.join(dir, `${i}.jpg`)).toString('base64');
    await page.setContent(`<body style="margin:0;width:${W}px;height:${H}px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:40px;
      font-family:'DejaVu Sans Mono',monospace;background-color:#1b2cc1;
      background-image:linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.07) 2px,transparent 2px);background-size:65px 65px">
      <img src="data:image/jpeg;base64,${img}" style="width:${W - 80}px;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.35)">
      <div style="color:#ffe14d;font-size:38px;letter-spacing:.06em">@krass.erforscht</div></body>`);
    await page.screenshot({ path: path.join(tmp, `${i}.png`) });
  }
  await browser.close();

  // Videoschnitt mit ffmpeg: Zoom pro Folie, Überblendungen dazwischen, stille Tonspur
  const durs = post.slides.map(duration);
  const args = ['-y'];
  durs.forEach((d, i) => args.push('-loop', '1', '-t', String(d), '-i', path.join(tmp, `${i + 1}.png`)));
  const total = durs.reduce((a, b) => a + b, 0) - FADE * (durs.length - 1);

  // Musik passend zum Ton des Posts; ccMixter schickt sehr große Kopfzeilen, daher die höhere Grenze
  const music = JSON.parse(execFileSync('node', ['--max-http-header-size=262144', 'music.js', post.tone || 'staunen', String(Math.ceil(total))],
    { env: process.env, stdio: ['ignore', 'pipe', 'inherit'] }).toString());
  // Lange Stücke nicht ganz von vorn, damit kein leises Intro läuft; kurze Stücke werden wiederholt
  const start = music.seconds > total + 30 ? Math.min(15, Math.round(music.seconds * 0.1)) : 0;
  args.push('-stream_loop', '-1', '-ss', String(start), '-i', music.file);
  fs.writeFileSync(path.join(dir, 'music.json'), JSON.stringify({ title: music.title, artist: music.artist, source: music.source,
    license: music.license, licenseUrl: music.licenseUrl, page: music.page, credit: music.credit }, null, 2));

  const parts = durs.map((d, i) =>
    `[${i}:v]scale=${W * 2}:-1,zoompan=z='min(zoom+0.0005,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(d * FPS)}:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p[v${i}]`);
  let last = 'v0', offset = 0;
  for (let i = 1; i < durs.length; i++) {
    offset += durs[i - 1] - FADE;
    parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[x${i}]`);
    last = `x${i}`;
  }
  // Ton: sanft ein- und ausblenden, Lautstärke auf übliches Social-Media-Niveau angleichen
  parts.push(`[${durs.length}:a]atrim=0:${total.toFixed(2)},afade=t=in:d=0.8,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11,aformat=sample_rates=44100:channel_layouts=stereo[a]`);
  args.push('-filter_complex', parts.join(';'), '-map', `[${last}]`, '-map', '[a]', '-t', total.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.join(dir, 'reel.mp4'));
  execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Reel (${total.toFixed(1)} s, ${music.credit || 'eigene Klangfläche'}) -> ${path.join(dir, 'reel.mp4')}`);
})();
