// Setzt mehrere Videoausschnitte zu einem Video zusammen (für erzählte Reels von 25–45 s, die mehr als eine Szene brauchen):
//   node clips.js videos/<post-id>.mp4 "<datei>|<start>|<dauer>" "<datei>|<start>|<dauer>" …
// Jeder Ausschnitt wird auf 1280×720 (16:9) gebracht; Bilder (.jpg/.png) werden mit langsamem Zoom zu Clips.
// Ergebnis ohne Ton, danach wie gewohnt in die Post-Datei („video.file“, start 0) eintragen und video-reel.js laufen lassen.
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const [out, ...items] = process.argv.slice(2);
if (!out || !items.length) { console.error('Aufruf: node clips.js <ziel.mp4> "<datei>|<start>|<dauer>" …'); process.exit(1); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'clips-'));
const parts = items.map((it, i) => {
  const [file, start = '0', dur = '6'] = it.split('|');
  const p = path.join(tmp, `p${i}.mp4`);
  const img = /\.(jpe?g|png)$/i.test(file);
  const vf = img
    ? `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+0.0008,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(dur * 30)}:s=1280x720:fps=30,setsar=1,format=yuv420p`
    : 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1,format=yuv420p';
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...(img ? [] : ['-ss', start]), '-t', dur, ...(img ? ['-i', file] : ['-stream_loop', '-1', '-i', file]),
    '-t', dur, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '19', '-r', '30', p]);
  return p;
});
fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(p => `file '${p}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${items.length} Ausschnitte -> ${out}`);
