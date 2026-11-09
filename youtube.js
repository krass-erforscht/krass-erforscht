// Lädt ein Video auf den YouTube-Kanal @krass.erforscht hoch (offizielle YouTube Data API, kostenlos).
//   node youtube.js test                                  → prüft den Zugang und zeigt den Kanal
//   node youtube.js reels posts/<datei>.json              → Video-Reel und Folien-Reel des Posts als YouTube Shorts (wie auf Instagram)
//   node youtube.js short posts/<datei>.json              → nur das Video-Reel
//   node youtube.js nachholen [anzahl]                    → ältere Reels nachträglich hochladen (höchstens ~6 Uploads pro Tag)
//   node youtube.js vorschau posts/<datei>.json           → Titel und Beschreibungen ansehen, ohne hochzuladen
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

const ABO = '🔔 Jeden Tag eine echte, kuriose Entdeckung aus der Wissenschaft – abonnier @krass.erforscht!';
const PER_DAY = 6; // YouTube erlaubt pro Tag ca. 6 Uploads (10.000 Quota-Einheiten, 1.600 pro Upload)

// Hashtags: die des Instagram-Posts, dazu #Shorts und #wissenschaft, höchstens 6 (YouTube zeigt die ersten 3 über dem Titel)
function hashtags(post, extra = []) {
  const own = (post.caption.match(/#[\p{L}\d_]+/gu) || []);
  return [...new Set([...extra, ...own, '#wissenschaft'].map(t => t.toLowerCase() === '#shorts' ? '#Shorts' : t))].slice(0, 6).join(' ');
}

// Beschreibung für Shorts: Text des Posts ohne Hashtag-Zeile, Video-/Musiknachweis, Abo-Hinweis, Hashtags am Ende
function shortDescription(post, { musicFile, withVideo }) {
  const music = fs.existsSync(musicFile) ? JSON.parse(fs.readFileSync(musicFile)).credit : '';
  const body = post.caption.replace(/\n#[^\n]*$/s, '').trim();
  const video = withVideo && post.video ? `${post.video.symbolisch ? 'Symbolvideo' : 'Video'}: ${post.video.credit} (${post.video.license})` : '';
  return [body, [video, music].filter(Boolean).join('\n'), ABO, hashtags(post, ['#Shorts'])].filter(Boolean).join('\n\n');
}

const plain = s => s.replace(/\*\*/g, '');
// Was zu einem Post hochgeladen werden kann: das Video-Reel (echtes Video) und das Folien-Reel
function uploadsFor(post) {
  const out = [];
  if (fs.existsSync(`out/${post.id}/video-reel.mp4`)) out.push({ type: 'short', file: `out/${post.id}/video-reel.mp4`,
    title: plain(post.video?.headline || post.slides[0].title), description: shortDescription(post, { musicFile: `out/${post.id}/video-music.json`, withVideo: true }) });
  if (fs.existsSync(`out/${post.id}/reel.mp4`)) out.push({ type: 'reel', file: `out/${post.id}/reel.mp4`,
    title: plain(post.slides[0].title), description: shortDescription(post, { musicFile: `out/${post.id}/music.json`, withVideo: false }) });
  // Gleiche Titel vermeiden, wenn beide Reels dieselbe Überschrift hätten
  if (out.length === 2 && out[0].title === out[1].title) out[1].title += ' (in Bildern)';
  return out;
}

async function uploadPost(token, post, types, done) {
  for (const u of uploadsFor(post).filter(u => types.includes(u.type))) {
    if (done.some(d => d.id === post.id && d.type === u.type)) { console.log(`${post.id} (${u.type}): schon hochgeladen`); continue; }
    const tags = [...new Set([...tagsFrom(post.caption), 'Wissenschaft', 'Shorts'])];
    const v = await upload(token, u.file, meta({ title: u.title, description: u.description, tags }));
    const entry = { id: post.id, type: u.type, videoId: v.id, privacy: v.status?.privacyStatus };
    log(entry); done.push(entry);
    console.log(`${post.id} (${u.type}) hochgeladen: https://youtube.com/shorts/${v.id} (Status: ${entry.privacy})`);
  }
}

const today = () => new Date().toISOString().slice(0, 10);

(async () => {
  const [mode, file, arg] = process.argv.slice(2);
  const token = await accessToken();
  if (mode === 'test') {
    const c = await (await fetch(`${API}/channels?part=snippet&mine=true`, { headers: { Authorization: `Bearer ${token}` } })).json();
    for (const ch of c.items || []) console.log(`Kanal: ${ch.snippet.title} ${ch.snippet.customUrl}`);
    return;
  }
  const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG)) : [];
  if (mode === 'short' || mode === 'reels') {
    // short: nur das Video-Reel; reels: Video-Reel und Folien-Reel (so wie auf Instagram)
    const post = JSON.parse(fs.readFileSync(file));
    await uploadPost(token, post, mode === 'short' ? ['short'] : ['short', 'reel'], done);
  } else if (mode === 'nachholen') {
    // Ältere Instagram-Reels nachträglich hochladen, ohne das Tageslimit zu sprengen (heutige Uploads werden mitgezählt)
    const left = Math.min(+(file || PER_DAY), PER_DAY - done.filter(d => (d.uploadedAt || '').startsWith(today())).length);
    const posts = JSON.parse(fs.readFileSync('data/posted.json')).map(p => p.id).filter(id => fs.existsSync(`posts/${id}.json`));
    const todo = posts.flatMap(id => { const post = JSON.parse(fs.readFileSync(`posts/${id}.json`));
      return uploadsFor(post).filter(u => !done.some(d => d.id === id && d.type === u.type)).map(u => ({ post, type: u.type })); });
    console.log(`Noch offen: ${todo.length}, heute möglich: ${Math.max(left, 0)}`);
    for (const t of todo.slice(0, Math.max(left, 0))) await uploadPost(token, t.post, [t.type], done);
  } else if (mode === 'doku') {
    const d = JSON.parse(fs.readFileSync(file));
    if (done.some(x => x.id === d.id && x.type === 'doku')) return console.log('Doku schon hochgeladen.');
    const v = await upload(token, d.output, meta({ title: d.title, description: d.description, tags: d.tags || [] }));
    if (d.thumbnail && fs.existsSync(d.thumbnail)) await thumbnail(token, v.id, d.thumbnail);
    log({ id: d.id, type: 'doku', videoId: v.id, privacy: v.status?.privacyStatus });
    console.log(`Doku hochgeladen: https://youtu.be/${v.id} (Status: ${v.status?.privacyStatus})`);
  } else if (mode === 'vorschau') {
    // Zeigt Titel und Beschreibung, ohne hochzuladen
    for (const u of uploadsFor(JSON.parse(fs.readFileSync(file)))) console.log(`--- ${u.type}: ${u.title}\n${u.description}\n`);
  } else {
    console.error('Aufruf: node youtube.js test | short <post.json> | reels <post.json> | nachholen [anzahl] | doku <meta.json> | vorschau <post.json>');
    process.exit(1);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
