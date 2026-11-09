// Baut aus einem Drehbuch eine Kurz-Doku (1920×1080) mit Sprecherstimme C, Untertiteln, Musik und Abspann:
//   node doku.js doku/<id>.json
// Drehbuch: { id, title, description, tags, mood, segments: [ { text, visual: { file, start?, position? }, label?, credit } ], sources: [] }
//   text: ein Satz pro Zeile (Zahlen ausschreiben, damit die Stimme sie richtig spricht).
//   visual.file: Video (.mp4/.webm) oder Bild (.jpg/.png); Bilder bekommen einen langsamen Zoom.
//   visual.fit: true = ganzes Motiv zeigen (Hochformat/Quadrat), Rand unscharf gefüllt; visual.position: Ausschnitt (crop x:y)
//   visuals: [ {file, start, fit, label, credit}, … ] statt visual – mehrere Motive, Zeit wird gleichmäßig geteilt.
//   kapitel: Name eines YouTube-Kapitels ab diesem Abschnitt (erster Abschnitt braucht eins); hashtags: ["#…"] für die Beschreibung.
//   label: kurze Einblendung oben links (z. B. „Brasilien, vor 115 Mio. Jahren“), credit: Kurz-Nachweis unten rechts.
// Ergebnis: out/doku-<id>/doku.mp4 und vorschau.jpg; Sprachaufnahme wird zwischengespeichert (nur neu, wenn der Text sich ändert).
// Die Stimme braucht die einmalige Einrichtung aus stimme/sprechen.py (Python-Umgebung unter /tmp/cb).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const music = require('./music.js');

const W = 1920, H = 1080, FPS = 30, LEAD = 1.0, TAIL = 1.2, END = 8;
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const PY = process.env.STIMME_PY || '/tmp/cb/bin/python';
const ff = args => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const isVideo = f => /\.(mp4|webm|mov|ogv)$/i.test(f);

// Zeilenumbruch für Untertitel (höchstens ~52 Zeichen pro Zeile)
function wrap(text, max = 52) {
  const lines = [''];
  for (const w of text.split(' ')) {
    if ((lines.at(-1) + ' ' + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim();
  }
  return lines.join('\n');
}

// Text in eine Datei schreiben, damit drawtext keine Sonderzeichen-Probleme hat
function textFile(dir, name, text) {
  const f = path.join(dir, name);
  fs.writeFileSync(f, text.replace(/%/g, '%%'));
  return f;
}

// Ein Motiv als Clip ohne Schrift: Video (ggf. in Schleife) oder Bild mit langsamem Zoom
function visualClip(v, d, out) {
  const input = isVideo(v.file) ? ['-ss', String(v.start || 0), '-stream_loop', '-1', '-i', v.file] : ['-i', v.file];
  // fit: ganzes Bild/Video zeigen (z. B. quadratisch), Rand mit unscharfer Kopie füllen
  const fit = `split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:2,eq=brightness=-0.15[bg];` +
    `[b]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
  const base = v.fit && isVideo(v.file) ? `${fit},fps=${FPS}`
    : v.fit ? `${fit},zoompan=z='min(zoom+0.0004,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(d * FPS)}:s=${W}x${H}:fps=${FPS}`
    : isVideo(v.file) ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS}`
    : `scale=${W * 1.5}:${H * 1.5}:force_original_aspect_ratio=increase,crop=${W * 1.5}:${H * 1.5}:${v.position || '(iw-ow)/2:(ih-oh)/2'},` +
      `zoompan=z='min(zoom+0.0006,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(d * FPS)}:s=${W}x${H}:fps=${FPS}`;
  ff([...input, '-t', d.toFixed(2), '-vf', `${base},setsar=1,format=yuv420p`, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', String(FPS), out]);
  return out;
}

function main() {
  const spec = JSON.parse(fs.readFileSync(process.argv[2]));
  const dir = `out/doku-${spec.id}`, tmp = path.join(dir, 'tmp');
  fs.mkdirSync(tmp, { recursive: true });

  // 1. Sprecher: alle Abschnitte in einem Durchgang (Leerzeile = Absatz), mit Zwischenspeicher
  const lines = spec.segments.map(s => s.text.split('\n').map(l => l.trim()).filter(Boolean));
  const script = lines.map(l => l.join('\n')).join('\n\n');
  const hash = crypto.createHash('sha1').update(script).digest('hex').slice(0, 10);
  const voice = path.join(dir, `stimme-${hash}.wav`);
  if (!fs.existsSync(voice)) {
    fs.writeFileSync(path.join(tmp, 'text.txt'), script);
    console.log('Sprecherstimme wird erzeugt (dauert einige Minuten) …');
    execFileSync(PY, [path.join(__dirname, 'stimme/sprechen.py'), path.join(tmp, 'text.txt'), voice], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
  const times = JSON.parse(fs.readFileSync(voice.replace(/\.wav$/, '.json')));

  // 2. Abschnittsgrenzen aus den Satzzeiten: jeder Abschnitt läuft bis zum ersten Satz des nächsten
  let k = 0;
  const segTimes = lines.map(l => { const t = times.slice(k, k + l.length); k += l.length; return t; });
  const voiceEnd = times.at(-1).end;
  const bounds = segTimes.map((t, i) => {
    const start = i === 0 ? 0 : t[0].start - 0.25 + LEAD;
    const end = i < segTimes.length - 1 ? segTimes[i + 1][0].start - 0.25 + LEAD : voiceEnd + LEAD + TAIL;
    return { start, end };
  });

  // 3. Bildspur je Abschnitt: Video oder Bild mit Zoom, darauf Untertitel, Einblendung und Nachweis
  const clips = spec.segments.map((seg, i) => {
    const { start, end } = bounds[i], d = end - start;
    const out = path.join(tmp, `seg${i}.mp4`);
    // Mehrere Motive pro Abschnitt möglich (visuals): die Zeit wird gleichmäßig aufgeteilt
    const vs = seg.visuals || [{ ...seg.visual, label: seg.label, credit: seg.credit }];
    const part = d / vs.length;
    const f = [];
    vs.forEach((v, n) => {
      const a = n * part, b = a + part;
      if (v.label) f.push(`drawtext=fontfile=${FONT}:textfile=${textFile(tmp, `label${i}-${n}.txt`, v.label)}:fontsize=40:fontcolor=white:` +
        `box=1:boxcolor=0x1d4ed8@0.85:boxborderw=14:x=60:y=60:enable='between(t,${(a + 0.3).toFixed(2)},${Math.min(b, a + 6).toFixed(2)})'`);
      if (v.credit) f.push(`drawtext=fontfile=${FONT_R}:textfile=${textFile(tmp, `credit${i}-${n}.txt`, v.credit)}:fontsize=22:fontcolor=white@0.85:` +
        `box=1:boxcolor=black@0.4:boxborderw=6:x=w-tw-30:y=30:enable='between(t,${a.toFixed(2)},${b.toFixed(2)})'`);
    });
    segTimes[i].forEach((t, j) => {
      const a = (t.start + LEAD - start).toFixed(2), b = (t.end + LEAD - start + 0.2).toFixed(2);
      f.push(`drawtext=fontfile=${FONT}:textfile=${textFile(tmp, `sub${i}-${j}.txt`, wrap(t.text))}:fontsize=44:fontcolor=white:line_spacing=10:` +
        `box=1:boxcolor=black@0.55:boxborderw=16:x=(w-tw)/2:y=h-th-90:enable='between(t,${a},${b})'`);
    });
    f.push('format=yuv420p');
    const raws = vs.map((v, n) => visualClip(v, part, path.join(tmp, `raw${i}-${n}.mp4`)));
    const list = path.join(tmp, `raw${i}.txt`);
    fs.writeFileSync(list, raws.map(r => `file '${path.resolve(r)}'`).join('\n'));
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-t', d.toFixed(2), '-vf', f.join(','), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-r', String(FPS), out]);
    console.log(`Abschnitt ${i + 1}/${spec.segments.length}: ${d.toFixed(1)} s`);
    return out;
  });

  return { spec, dir, tmp, voice, clips, bounds, total: bounds.at(-1).end + END };
}

// Kapitel für YouTube (Abschnitte mit „kapitel“; YouTube verlangt mind. 3, das erste bei 0:00, jedes mind. 10 s lang)
function chapters(spec, bounds) {
  const t = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const list = spec.segments.map((s, i) => s.kapitel ? { at: i === 0 ? 0 : bounds[i].start, name: s.kapitel } : null).filter(Boolean);
  if (list.length < 3 || list[0].at !== 0 || list.some((c, i) => i && c.at - list[i - 1].at < 10)) return '';
  return 'Kapitel:\n' + list.map(c => `${t(c.at)} ${c.name}`).join('\n');
}

(async () => {
  const { spec, dir, tmp, voice, clips, bounds, total } = main();

  // 4. Abspann: Quellen, Nachweise, KI-Hinweis
  // Musik pro Doku merken, damit ein Neubau dieselbe Musik behält (wichtig für Nachweise in schon hochgeladenen Videos)
  const musFile = path.join(dir, 'music.json');
  const mus = fs.existsSync(musFile) ? JSON.parse(fs.readFileSync(musFile)) : await music.pick(spec.mood || 'staunen', 60);
  fs.writeFileSync(musFile, JSON.stringify(mus, null, 2));
  const credits = [...new Set(spec.segments.flatMap(s => s.visuals ? s.visuals.map(v => v.credit) : [s.credit]).filter(Boolean))];
  const endText = ['Quellen: ' + spec.sources.join(' · '), '', ...credits, mus.credit || '', '',
    'Text und Stimme mit KI erstellt – Fakten aus den genannten Quellen geprüft.', '', 'Mehr kuriose Wissenschaft: @krass.erforscht']
    .map(l => wrap(l, 80)).join('\n');
  const endClip = path.join(tmp, 'ende.mp4');
  ff(['-f', 'lavfi', '-i', `color=c=0x0b1220:s=${W}x${H}:d=${END}:r=${FPS}`, '-vf',
    `drawtext=fontfile=${FONT_R}:textfile=${textFile(tmp, 'ende.txt', endText)}:fontsize=30:fontcolor=white:line_spacing=12:x=(w-tw)/2:y=(h-th)/2,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', endClip]);

  // 5. Zusammenfügen: Bildspur, Stimme (mit Vorlauf), Musik leise darunter, am Ende ausblenden
  const list = path.join(tmp, 'list.txt');
  fs.writeFileSync(list, [...clips, endClip].map(c => `file '${path.resolve(c)}'`).join('\n'));
  const out = path.join(dir, 'doku.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-i', voice, '-stream_loop', '-1', '-i', mus.file, '-filter_complex',
    `[1:a]adelay=${LEAD * 1000}|${LEAD * 1000},aresample=48000,pan=stereo|c0=c0|c1=c0,apad=pad_dur=4,loudnorm=I=-16,aresample=48000[v];` +
    `[2:a]aresample=48000,volume=0.10,afade=t=in:d=2,afade=t=out:st=${(total - 4).toFixed(2)}:d=4[m];` +
    `[v][m]amix=inputs=2:duration=first:normalize=0,apad[a]`,
    '-map', '0:v', '-map', '[a]', '-t', total.toFixed(2), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);

  // 6. Vorschaubild: Standbild aus dem ersten Abschnitt mit großem Titel
  const thumb = path.join(dir, 'vorschau.jpg');
  ff(['-ss', '0.5', '-i', clips[0], '-frames:v', '1', '-vf',
    `scale=1280:720,drawbox=y=ih-300:w=iw:h=300:color=black@0.6:t=fill,drawtext=fontfile=${FONT}:textfile=${textFile(tmp, 'thumb.txt', (spec.thumbText || spec.title).split('\n').map(l => wrap(l, 26)).join('\n'))}:` +
    `fontsize=68:fontcolor=white:line_spacing=8:x=50:y=h-th-60`, '-q:v', '3', thumb]);

  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ id: spec.id, title: spec.title, tags: spec.tags, output: out, thumbnail: thumb,
    description: [spec.description, chapters(spec, bounds), 'Quellen: ' + spec.sources.join(' · '), 'Bild- und Videonachweise:\n' + credits.join('\n'), mus.credit,
      'Text und Stimme mit KI erstellt. Die Fakten stammen aus den genannten Quellen.',
      '🔔 Jeden Tag eine echte, kuriose Entdeckung aus der Wissenschaft – abonnier @krass.erforscht!',
      (spec.hashtags || spec.tags.slice(0, 5).map(t => '#' + t.replace(/\s+/g, ''))).join(' ')].filter(Boolean).join('\n\n') }, null, 2));
  console.log(`Doku (${dur(out).toFixed(0)} s) -> ${out}`);
})().catch(e => { console.error(e.message); process.exit(1); });
