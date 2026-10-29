// Sucht frei nutzbare Videos, die zeigen, was der Post beschreibt:
//   node find-video.js "<englischer Suchbegriff>" <post-id>
//   node find-video.js --url <direkte-mp4-adresse> <post-id> --credit "<Urheber>" --license "<CC BY 4.0 …>" --page <quelle>
//     (für Videos, die bei der Recherche gefunden wurden, z. B. Zusatzmaterial einer Open-Access-Studie unter CC BY)
// Quellen: NASA (gemeinfrei), ESA/Webb, ESA/Hubble und ESO (CC BY 4.0), Wikimedia Commons (freie Lizenzen).
// Lädt bis zu 5 Kandidaten nach videos/candidates/<post-id>-v<n>.<ext> und legt je einen Bogen mit Standbildern
// daneben (…-v<n>-frames.jpg, 12 Bilder mit Zeitstempel). Die Standbilder ansehen: Nur ein Video nehmen, das wirklich das Beschriebene zeigt.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const UA = { 'User-Agent': 'krass-erforscht/0.3 (Instagram-Wissensseite; https://github.com/krass-erforscht/krass-erforscht)' };
const DIR = 'videos/candidates';
const MAX_BYTES = 150e6;
const FREE_TEXT = /^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  // Bei Überlastung (vor allem Wikimedia) länger warten: 5, 15, 30, 45 Sekunden
  for (const wait of [5, 15, 30, 45]) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429 || res.status >= 500) { await sleep(wait * 1000); continue; }
    return res.json();
  }
  throw new Error(`zu viele Anfragen: ${new URL(url).host}`);
}

async function nasa(q, max) {
  const r = await getJson(`https://images-api.nasa.gov/search?media_type=video&q=${encodeURIComponent(q)}`);
  const out = [];
  for (const item of r.collection?.items?.slice(0, 12) || []) {
    if (out.length >= max) break;
    const d = item.data?.[0];
    if (!d || /copyright|©|courtesy of/i.test(JSON.stringify(d))) continue; // fremde Rechte überspringen
    const assets = await getJson(item.href);
    const url = assets.find(u => /~(medium|mobile)\.mp4$/i.test(u)) || assets.find(u => /~orig\.mp4$/i.test(u));
    if (url) out.push({ url: url.replace('http://', 'https://'), title: d.title, credit: `NASA${d.center ? '/' + d.center : ''}`, license: 'Public Domain (NASA)', page: `https://images.nasa.gov/details/${d.nasa_id}` });
  }
  return out;
}

// ESA/Webb, ESA/Hubble und ESO haben dieselbe Seitenstruktur; die Suchseite listet Video-IDs mit Vorschautitel
function esaVideos(name, site, cdn, credit) {
  const fn = async (q, max) => {
    const html = await (await fetch(`${site}/videos/?search=${encodeURIComponent(q)}`, { headers: UA })).text();
    const ids = [...new Set([...html.matchAll(/href="(?:\/public)?\/videos\/([a-z0-9_-]+)\/"/g)].map(m => m[1]))]
      .filter(id => !['feed', 'search', 'viewall', 'archive'].includes(id));
    const titles = [...html.matchAll(/alt="(?:Video thumbnail for )?([^"]+)"/g)].map(m => m[1]).filter(t => !/logo|Creative Commons/i.test(t));
    return ids.slice(0, max).map((id, i) => ({ url: `${cdn}/medium_podcast/${id}.mp4`, title: titles[i] || id, credit, license: 'CC BY 4.0', page: `${site}/videos/${id}/` }));
  };
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
}
const webb = esaVideos('webb', 'https://esawebb.org', 'https://cdn.esawebb.org/archives/videos', 'ESA/Webb, NASA & CSA');
const hubble = esaVideos('hubble', 'https://esahubble.org', 'https://cdn.esahubble.org/archives/videos', 'ESA/Hubble & NASA');
const eso = esaVideos('eso', 'https://www.eso.org/public', 'https://cdn.eso.org/videos', 'ESO');

async function commons(q, max) {
  const api = 'https://commons.wikimedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=6&gsrlimit=15' +
    '&prop=videoinfo&viprop=url|extmetadata|mime|derivatives&gsrsearch=' + encodeURIComponent(q + ' filetype:video');
  const r = await getJson(api);
  const out = [];
  for (const p of Object.values(r.query?.pages || {}).sort((a, b) => a.index - b.index)) {
    if (out.length >= max) break;
    const vi = p.videoinfo?.[0], m = vi?.extmetadata || {};
    const lic = m.LicenseShortName?.value || '';
    if (!vi || !FREE_TEXT.test(lic)) continue;
    // Eine mittlere Umwandlung laden statt des oft riesigen Originals
    const d = (vi.derivatives || []).find(d => /720p|480p/.test(d.transcodekey || '')) || { src: vi.url };
    const artist = (m.Artist?.value || 'Unbekannt').replace(/<[^>]+>/g, '').trim().slice(0, 60);
    out.push({ url: d.src, title: p.title, credit: `${artist} / Wikimedia Commons`, license: lic, page: vi.descriptionurl });
  }
  return out;
}

// Lädt ein Video, prüft die Länge und legt einen Bogen mit 6 Standbildern daneben
async function fetchCandidate(c, file) {
  let res;
  for (const wait of [5, 15, 30]) { // Wikimedia lehnt Downloads bei Andrang kurz ab
    res = await fetch(c.url, { headers: UA });
    if (res.status !== 429) break;
    await sleep(wait * 1000);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (+res.headers.get('content-length') > MAX_BYTES) throw new Error('zu groß');
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const seconds = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  if (!(seconds > 3)) throw new Error('kein lesbares Video');
  const frames = file.replace(/\.[^.]+$/, '-frames.jpg');
  // 12 Standbilder mit Zeitstempel, damit man den besten Abschnitt für --start/--dauer wählen kann
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf',
    `fps=12/${seconds.toFixed(2)},scale=320:-2,drawtext=fontfile=${font}:text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=4x3`,
    '-frames:v', '1', frames]);
  return { file, frames, seconds: Math.round(seconds), ...c };
}

(async () => {
  const args = process.argv.slice(2);
  const opt = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const manual = opt('--url'), credit = opt('--credit'), license = opt('--license'), page = opt('--page');
  fs.mkdirSync(DIR, { recursive: true });
  let found = [];
  let id;
  if (manual) {
    id = args[0];
    if (!credit || !license) throw new Error('--credit und --license angeben');
    found = [{ url: manual, title: 'manuell', credit, license, page: page || manual }];
  } else {
    const [q] = args; id = args[1];
    for (const [src, max] of [[nasa, 2], [webb, 2], [hubble, 1], [eso, 1], [commons, 3]]) {
      try { found.push(...await src(q, max)); } catch (e) { console.error(`${src.name}: ${e.message}`); }
    }
  }
  const result = [];
  for (const c of found) {
    if (result.length >= 5) break;
    const ext = (c.url.match(/\.(mp4|webm|ogv|mov)(\?|$)/i) || [, 'mp4'])[1].toLowerCase();
    try { result.push(await fetchCandidate(c, path.join(DIR, `${id}-v${result.length + 1}.${ext}`))); }
    catch (e) { console.error(`${c.url}: ${e.message}`); }
  }
  console.log(JSON.stringify(result, null, 2));
})().catch(e => { console.error(e.message); process.exit(1); });
