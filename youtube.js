// Lädt ein Video auf den YouTube-Kanal @krass.erforscht hoch (offizielle YouTube Data API, kostenlos).
//   node youtube.js test                                  → prüft den Zugang und zeigt den Kanal
//   node youtube.js short posts/<datei>.json              → Video-Reel des Posts als YouTube Short
//   node youtube.js doku out/doku-<id>/meta.json        → fertige Kurz-Doku (doku.js) als normales Video
// Braucht YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN. Jeder Upload wird in data/youtube.json vermerkt.
// Hinweis: Google stellt Uploads nicht überprüfter Apps meist auf „privat“; der Nutzer schaltet sie in YouTube Studio frei.
const fs = require('fs');

const API = 'https://www.googleapis.com/youtube/v3';
const LOG = 'data/youtube.json';
const env = k => (process.env[k] || '').trim();

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('YT_CLIENT_ID'), client_secret: env('YT_CLIENT_SECRET'),
      refresh_token: env('YT_REFRESH_TOKEN'), grant_type: 'refresh_token' }),
  });
  const t = await res.json();
  if (!t.access_token) throw new Error(`YouTube-Zugang abgelehnt: ${t.error} ${t.error_description || ''}`);
  return t.access_token;
}

// Resumable Upload: erst Metadaten schicken, dann die Datei an die zurückgegebene Adresse
async function upload(token, file, meta) {
  const size = fs.statSync(file).size;
  const init = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
    body: JSON.stringify(meta),
  });
  if (!init.ok) throw new Error(`Upload-Start fehlgeschlagen: ${init.status} ${await init.text()}`);
  const res = await fetch(init.headers.get('location'), {
    method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) }, body: fs.readFileSync(file),
  });
  const v = await res.json();
  if (!v.id) throw new Error(`Upload fehlgeschlagen: ${res.status} ${JSON.stringify(v.error || v)}`);
  return v;
}

async function thumbnail(token, videoId, file) {
  const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' }, body: fs.readFileSync(file),
  });
  if (!res.ok) console.error(`Vorschaubild nicht gesetzt: ${res.status} ${(await res.text()).slice(0, 200)}`);
}

// YouTube erlaubt höchstens 100 Zeichen Titel, 5000 Zeichen Beschreibung und keine spitzen Klammern
const clean = (s, max) => s.replace(/[<>]/g, '').slice(0, max);
const tagsFrom = text => [...new Set((text.match(/#[\p{L}\d_]+/gu) || []).map(t => t.slice(1)))].slice(0, 10);

function meta({ title, description, tags }) {
  return {
    snippet: { title: clean(title, 100), description: clean(description, 5000), tags, categoryId: '28', // Wissenschaft & Technik
      defaultLanguage: 'de', defaultAudioLanguage: 'de' },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
  };
}

function log(entry) {
  const all = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG)) : [];
  all.push({ ...entry, uploadedAt: new Date().toISOString() });
  fs.writeFileSync(LOG, JSON.stringify(all, null, 2));
}

(async () => {
  const [mode, file] = process.argv.slice(2);
  const token = await accessToken();
  if (mode === 'test') {
    const c = await (await fetch(`${API}/channels?part=snippet&mine=true`, { headers: { Authorization: `Bearer ${token}` } })).json();
    for (const ch of c.items || []) console.log(`Kanal: ${ch.snippet.title} ${ch.snippet.customUrl}`);
    return;
  }
  const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG)) : [];
  if (mode === 'short') {
    const post = JSON.parse(fs.readFileSync(file));
    if (done.some(d => d.id === post.id && d.type === 'short')) return console.log('Schon als Short hochgeladen.');
    const video = `out/${post.id}/video-reel.mp4`;
    if (!fs.existsSync(video)) throw new Error(`${video} fehlt (erst video-reel.js laufen lassen)`);
    const music = fs.existsSync(`out/${post.id}/video-music.json`) ? JSON.parse(fs.readFileSync(`out/${post.id}/video-music.json`)).credit : '';
    const title = (post.video?.headline || post.slides[0].title).replace(/\*\*/g, '');
    const description = [post.caption.replace(/\n#.*$/s, ''), music, `Video: ${post.video?.credit || ''} (${post.video?.license || ''})`,
      '#Shorts #wissenschaft'].filter(Boolean).join('\n\n');
    const v = await upload(token, video, meta({ title: `${title} #Shorts`, description, tags: tagsFrom(post.caption) }));
    log({ id: post.id, type: 'short', videoId: v.id, privacy: v.status?.privacyStatus });
    console.log(`Short hochgeladen: https://youtube.com/shorts/${v.id} (Status: ${v.status?.privacyStatus})`);
  } else if (mode === 'doku') {
    const d = JSON.parse(fs.readFileSync(file));
    if (done.some(x => x.id === d.id && x.type === 'doku')) return console.log('Doku schon hochgeladen.');
    const v = await upload(token, d.output, meta({ title: d.title, description: d.description, tags: d.tags || [] }));
    if (d.thumbnail && fs.existsSync(d.thumbnail)) await thumbnail(token, v.id, d.thumbnail);
    log({ id: d.id, type: 'doku', videoId: v.id, privacy: v.status?.privacyStatus });
    console.log(`Doku hochgeladen: https://youtu.be/${v.id} (Status: ${v.status?.privacyStatus})`);
  } else {
    console.error('Aufruf: node youtube.js test | short <post.json> | doku <doku.json>');
    process.exit(1);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
