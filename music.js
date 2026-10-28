// Sucht passende, frei lizenzierte Instrumentalmusik für ein Reel.
//   node music.js <staunen|witzig|nuetzlich> <mindestlänge-sekunden>   → gibt den gewählten Titel als JSON aus
// Quellen der Reihe nach: incompetech / Kevin MacLeod (CC BY 4.0), ccMixter (CC BY), Internet Archive (CC0).
// Schlagen alle fehl, wird eine ruhige Klangfläche selbst erzeugt, damit das Reel immer Ton hat.
// Bereits geladene Titel liegen in music/files/ (nicht im Repo), music/library.json merkt sich Herkunft, Lizenz und Nutzung.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const DIR = 'music', FILES = path.join(DIR, 'files'), LIB = path.join(DIR, 'library.json');
const UA = { 'User-Agent': 'krass-erforscht/0.3 (https://github.com/krass-erforscht/krass-erforscht)' };
const MIN_PER_MOOD = 8; // so viele Titel pro Stimmung vorrätig halten, damit sich die Musik abwechselt

// Stimmungen: Suchbegriffe pro Quelle
const MOODS = {
  staunen: { ccmixter: ['ambient', 'cinematic', 'atmospheric'], incompetech: /mysterious|calming|epic|dreamy|eerie|grooving/i, archive: 'ambient' },
  witzig: { ccmixter: ['funky', 'upbeat', 'quirky'], incompetech: /bouncy|humorous|silly|playful|quirky|light/i, archive: 'happy' },
  nuetzlich: { ccmixter: ['chill', 'lounge', 'downtempo'], incompetech: /relaxed|calming|bright|uplifting/i, archive: 'chill' },
};
const VOCALS = /vocal|singing|singer|rap|spoken|lyrics|acapella/i;

const lib = fs.existsSync(LIB) ? JSON.parse(fs.readFileSync(LIB)) : [];
const save = () => fs.writeFileSync(LIB, JSON.stringify(lib, null, 2));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Holt JSON mit bis zu drei Versuchen, weil einzelne Musikseiten manchmal kurz nicht antworten
async function getJson(url) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i >= 2) throw e; await sleep(3000 * (i + 1)); }
  }
}
const seconds = file => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();

async function download(url, name) {
  fs.mkdirSync(FILES, { recursive: true });
  const file = path.join(FILES, name.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 80) + '.mp3');
  if (!fs.existsSync(file)) {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`Download ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

// Jede Quelle liefert eine Liste möglicher Titel; geladen wird erst, wenn einer gebraucht wird
async function ccmixter(mood) {
  const out = [];
  for (const tag of MOODS[mood].ccmixter) {
    const r = await getJson(`https://ccmixter.org/api/query?f=json&limit=40&sort=rank&lic=by&tags=instrumental,${tag}`);
    for (const t of r) {
      const mp3 = t.files?.find(f => /\.mp3$/i.test(f.download_url || ''));
      if (!mp3 || VOCALS.test(t.upload_tags || '') || /-nc|-nd/.test(t.license_url || '')) continue;
      out.push({ source: 'ccMixter', title: t.upload_name, artist: t.user_name, license: 'CC BY', licenseUrl: t.license_url, page: t.file_page_url, url: mp3.download_url });
    }
  }
  return out;
}

async function incompetech(mood) {
  const all = await getJson('https://incompetech.com/music/royalty-free/pieces.json');
  return all.filter(p => MOODS[mood].incompetech.test(p.feel || '') && !VOCALS.test(p.instruments || ''))
    .map(p => ({ source: 'incompetech', title: p.title, artist: 'Kevin MacLeod', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      page: 'https://incompetech.com', url: `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(p.filename)}` }));
}

async function archive(mood) {
  const q = `mediatype:audio AND licenseurl:"http://creativecommons.org/publicdomain/zero/1.0/" AND subject:${MOODS[mood].archive}`;
  const r = await getJson(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier&fl[]=title&fl[]=creator&rows=15&sort[]=downloads+desc&output=json`);
  const out = [];
  for (const d of r.response?.docs || []) {
    const meta = await getJson(`https://archive.org/metadata/${d.identifier}`);
    const f = meta.files?.find(f => /mp3/i.test(f.format || '') && +f.length > 40 && +f.length < 600);
    if (f) out.push({ source: 'Internet Archive', title: f.title || d.title, artist: [].concat(d.creator || 'Unbekannt')[0], license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      page: `https://archive.org/details/${d.identifier}`, url: `https://archive.org/download/${d.identifier}/${encodeURIComponent(f.name)}` });
  }
  return out;
}

// Letzter Ausweg: ruhige Klangfläche aus Sinustönen, selbst erzeugt und damit frei von Rechten Dritter
function synth(mood, minSec) {
  fs.mkdirSync(FILES, { recursive: true });
  const file = path.join(FILES, `synth-${mood}.mp3`);
  const chord = { staunen: [110, 164.81, 220, 277.18], witzig: [261.63, 329.63, 392, 523.25], nuetzlich: [196, 246.94, 293.66, 392] }[mood];
  const expr = chord.map((f, i) => `0.05*sin(2*PI*${f}*t)*(0.7+0.3*sin(2*PI*${0.07 + i * 0.03}*t))`).join('+');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `aevalsrc='${expr}':s=44100:d=${Math.ceil(minSec) + 5}`,
    '-af', 'lowpass=f=1800,aecho=0.8:0.7:120:0.3,afade=t=in:d=1', '-ac', '2', '-b:a', '160k', file]);
  return { file, source: 'selbst erzeugt', title: 'Klangfläche', artist: 'krass.erforscht', license: 'eigene Erstellung', credit: null };
}

async function pick(mood, minSec) {
  if (!MOODS[mood]) mood = 'staunen';
  const usable = lib.filter(t => t.mood === mood && t.seconds >= minSec && fs.existsSync(t.file));
  if (usable.length < MIN_PER_MOOD) {
    // Das Internet Archive nur, wenn sonst gar nichts da ist: dort ist nicht sicher erkennbar, ob ein Stück Gesang enthält
    for (const src of usable.length ? [incompetech, ccmixter] : [incompetech, ccmixter, archive]) {
      try {
        const known = new Set(lib.map(t => t.url));
        const fresh = (await src(mood)).filter(t => !known.has(t.url)).sort(() => Math.random() - 0.5);
        for (const t of fresh.slice(0, 3)) {
          try {
            const file = await download(t.url, `${t.source}-${t.artist}-${t.title}`);
            const sec = seconds(file);
            if (sec < 30) { fs.rmSync(file); continue; }
            const entry = { ...t, mood, file, seconds: Math.round(sec), used: 0, lastUsed: null };
            lib.push(entry); usable.push(entry); save();
            if (usable.length >= MIN_PER_MOOD) break;
          } catch (e) { console.error(`${t.source}: ${e.message}`); }
        }
      } catch (e) { console.error(`${src.name}: ${e.message}`); }
      if (usable.length >= MIN_PER_MOOD) break;
    }
  }
  // Den am längsten nicht genutzten Titel nehmen, damit sich die Musik nicht wiederholt
  const track = usable.filter(t => t.seconds >= minSec).sort((a, b) => (a.lastUsed || '').localeCompare(b.lastUsed || ''))[0];
  if (!track) return synth(mood, minSec);
  track.used++; track.lastUsed = new Date().toISOString(); save();
  return { ...track, credit: `Musik: „${track.title}“ von ${track.artist} (${track.source}), ${track.license}` };
}

module.exports = { pick };
if (require.main === module) {
  pick(process.argv[2], +process.argv[3] || 30).then(t => console.log(JSON.stringify(t, null, 2)));
}
