// Macht aus 1–4 frei lizenzierten Standbildern ein kurzes Video mit langsamem Zoom, Beschriftung und Überblendungen,
// wenn es zum Thema kein echtes Video gibt (z. B. Satellitenbilder vorher/nachher, Fossilfoto + Vergleichsbild):
//   node bilder-video.js videos/<post-id>.mp4 "<bild1>|<beschriftung1>" "<bild2>|<beschriftung2>" …
// Jedes Bild steht ca. 6 Sekunden. Das Ergebnis (quadratisch, 1080 px) wird danach wie ein normales Video
// in die Post-Datei eingetragen und mit video-reel.js weiterverarbeitet.
const { execFileSync } = require('child_process');

const SIZE = 1080, FPS = 30, PER = 6, FADE = 1.5;
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
// drawtext braucht für Doppelpunkt, Apostroph und Backslash eine eigene Schreibweise
const escText = s => s.replace(/\\/g, '\\\\\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019');

const [out, ...items] = process.argv.slice(2);
if (!out || !items.length) { console.error('Aufruf: node bilder-video.js <ziel.mp4> "<bild>|<beschriftung>" …'); process.exit(1); }

const args = ['-y', '-v', 'error'];
const parts = [];
items.forEach((item, i) => {
  const [file, label] = item.split('|');
  // Ein einzelnes Bild als Eingang (kein -loop): zoompan erzeugt daraus selbst die nötigen Einzelbilder
  args.push('-i', file);
  const text = label ? `,drawtext=fontfile=${FONT}:text='${escText(label)}':x=30:y=30:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=12` : '';
  parts.push(`[${i}:v]scale=${SIZE}:${SIZE}:force_original_aspect_ratio=increase,crop=${SIZE}:${SIZE},` +
    `zoompan=z='min(zoom+0.0010,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${PER * FPS}:s=${SIZE}x${SIZE}:fps=${FPS}${text},setsar=1[v${i}]`);
});
let last = 'v0';
for (let i = 1; i < items.length; i++) {
  parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${(i * (PER - FADE)).toFixed(2)}[x${i}]`);
  last = `x${i}`;
}
parts.push(`[${last}]format=yuv420p[out]`);
args.push('-filter_complex', parts.join(';'), '-map', '[out]', '-c:v', 'libx264', '-crf', '20', '-an', out);
execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
const sec = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim();
console.log(`Bilder-Video (${sec.toFixed(1)} s) -> ${out}`);
