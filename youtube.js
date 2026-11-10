// Lädt ein Video auf den YouTube-Kanal @krass.erforscht hoch (offizielle YouTube Data API, kostenlos).
//   node youtube.js test                                  → prüft den Zugang und zeigt den Kanal
//   node youtube.js reels posts/<datei>.json              → Video-Reel und Folien-Reel des Posts als YouTube Shorts (wie auf Instagram)
//   node youtube.js short posts/<datei>.json              → nur das Video-Reel
//   node youtube.js nachholen [anzahl]                    → ältere Reels nachträglich hochladen (höchstens ~6 Uploads pro Tag)
//   node youtube.js vorschau posts/<datei>.json           → Titel und Beschreibungen ansehen, ohne hochzuladen
//   node youtube.js statistik                             → Aufrufe/Likes aller Videos holen, beste Uhrzeit anzeigen
// Shorts werden zur gelernten besten Uhrzeit veröffentlicht (publishAt): erst testen, dann die Zeit mit den meisten Aufrufen.
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

function meta({ title, description, tags, publishAt }) {
  return {
    snippet: { title: clean(title, 100), description: clean(description, 5000), tags, categoryId: '28', // Wissenschaft & Technik
      defaultLanguage: 'de', defaultAudioLanguage: 'de' },
    // Mit publishAt lädt YouTube das Video privat hoch und schaltet es zur gewählten Uhrzeit selbst frei
    status: publishAt ? { privacyStatus: 'private', publishAt, selfDeclaredMadeForKids: false, containsSyntheticMedia: true }
      : { privacyStatus: 'public', selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
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


// ---- Beste YouTube-Uhrzeit: lernt aus den Aufrufen der eigenen Videos (gleiche Regel wie choose.js für Instagram) ----
const { dayRandom, MIN_DATA, EXPLORE } = require('./choose');
const YT_SLOTS = { morgens: 7, mittags: 12, nachmittags: 16, abends: 19, spaet: 21 };
const berlinHour = d => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(d));
const slotOfHour = h => Object.entries(YT_SLOTS).reduce((best, [k, v]) => Math.abs(v - h) < Math.abs(YT_SLOTS[best] - h) ? k : best, 'morgens');
function ytSlot(done) {
  // Nur Shorts zählen, die mindestens 2 Tage online sind (vorher sind die Aufrufzahlen noch nicht aussagekräftig)
  const data = done.filter(d => d.type !== 'doku' && d.stats && d.privacy === 'public' && d.publishedAt && Date.now() - new Date(d.publishedAt) > 2 * 864e5);
  const med = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
  // Aufrufe im Verhältnis zum Median der eigenen Art (Video-Short oder Folien-Reel), damit die Art die Uhrzeit nicht verfälscht
  const typeMed = t => Math.max(med(data.filter(d => d.type === t).map(d => d.stats.views)), 1);
  const rows = Object.keys(YT_SLOTS).map(o => { const v = data.filter(d => slotOfHour(berlinHour(d.publishedAt)) === o).map(d => d.stats.views / typeMed(d.type));
    return { option: o, posts: v.length, aufrufe: Math.round(med(v) * 100) / 100 }; });
  const fresh = rows.filter(r => r.posts < MIN_DATA).sort((a, b) => a.posts - b.posts);
  const ranked = rows.slice().sort((a, b) => b.aufrufe - a.aufrufe);
  if (fresh.length) { const f = fresh.filter(r => r.posts === fresh[0].posts); return { pick: f[Math.floor(dayRandom('yt') * f.length)].option, why: 'noch kaum getestet', rows: ranked }; }
  if (dayRandom('yt') >= EXPLORE) return { pick: ranked[0].option, why: 'meiste Aufrufe', rows: ranked };
  const o = ranked.slice(1); return { pick: o[Math.floor(dayRandom('ytx') * o.length)].option, why: 'zum Weiterlernen', rows: ranked };
}
// Nächster Zeitpunkt der gewählten Uhrzeit (Berlin); n-tes Video des Tages jeweils 40 Minuten später, damit nicht alles auf einmal kommt
function publishTime(slot, n) {
  const now = Date.now();
  for (let add = 0; add < 3; add++) {
    const day = new Date(now + add * 864e5).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' });
    // Berlin-Zeit in UTC umrechnen (Winter +1, Sommer +2): die Variante nehmen, die in Berlin wirklich die gewünschte Stunde ergibt
    for (const off of [1, 2]) {
      const base = new Date(`${day}T${String(YT_SLOTS[slot]).padStart(2, '0')}:00:00Z`).getTime() - off * 36e5;
      if (berlinHour(base) === YT_SLOTS[slot] && base > now + 20 * 6e4) return new Date(base + n * 40 * 6e4).toISOString();
    }
  }
  return null;
}
let uploadsToday = 0, todaySlot = null;

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
    todaySlot ||= ytSlot(done);
    const publishAt = publishTime(todaySlot.pick, uploadsToday++);
    const v = await upload(token, u.file, meta({ title: u.title, description: u.description, tags, publishAt }));
    const entry = { id: post.id, type: u.type, videoId: v.id, privacy: v.status?.privacyStatus, publishAt, publishedAt: publishAt || new Date().toISOString(), ytSlot: todaySlot.pick };
    log(entry); done.push(entry);
    console.log(`${post.id} (${u.type}) hochgeladen: https://youtube.com/shorts/${v.id} (${publishAt ? `erscheint ${new Date(publishAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} – ${todaySlot.pick}, ${todaySlot.why}` : 'sofort öffentlich'})`);
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
    // Echte Video-Shorts zuerst: sie bekommen auf YouTube bisher viel mehr Aufrufe als Folien-Reels
    todo.sort((a, b) => (a.type === 'short' ? 0 : 1) - (b.type === 'short' ? 0 : 1));
    console.log(`Noch offen: ${todo.length}, heute möglich: ${Math.max(left, 0)}`);
    for (const t of todo.slice(0, Math.max(left, 0))) await uploadPost(token, t.post, [t.type], done);
  } else if (mode === 'doku') {
    const d = JSON.parse(fs.readFileSync(file));
    if (done.some(x => x.id === d.id && x.type === 'doku')) return console.log('Doku schon hochgeladen.');
    const v = await upload(token, d.output, meta({ title: d.title, description: d.description, tags: d.tags || [] }));
    if (d.thumbnail && fs.existsSync(d.thumbnail)) await thumbnail(token, v.id, d.thumbnail);
    log({ id: d.id, type: 'doku', videoId: v.id, privacy: v.status?.privacyStatus });
    console.log(`Doku hochgeladen: https://youtu.be/${v.id} (Status: ${v.status?.privacyStatus})`);
  } else if (mode === 'statistik') {
    // Aufrufe, Likes und Kommentare aller eigenen Videos holen und in data/youtube.json speichern
    for (let i = 0; i < done.length; i += 50) {
      const ids = done.slice(i, i + 50).map(d => d.videoId).join(',');
      const r = await (await fetch(`${API}/videos?part=statistics,status,snippet&id=${ids}`, { headers: { Authorization: `Bearer ${token}` } })).json();
      for (const it of r.items || []) {
        const d = done.find(x => x.videoId === it.id);
        d.stats = { views: +it.statistics.viewCount || 0, likes: +it.statistics.likeCount || 0, comments: +it.statistics.commentCount || 0 };
        d.privacy = it.status.privacyStatus; d.publishedAt = it.snippet.publishedAt; d.statsAt = new Date().toISOString();
      }
    }
    fs.writeFileSync(LOG, JSON.stringify(done, null, 2));
    const s = ytSlot(done);
    console.log(`${done.length} Videos, ${done.reduce((a, d) => a + (d.stats?.views || 0), 0)} Aufrufe gesamt. Nächste Uhrzeit: ${s.pick} (${s.why}) – ` +
      s.rows.map(r => `${r.option} ${r.aufrufe}× aus ${r.posts}`).join(', '));
  } else if (mode === 'vorschau') {
    // Zeigt Titel und Beschreibung, ohne hochzuladen
    for (const u of uploadsFor(JSON.parse(fs.readFileSync(file)))) console.log(`--- ${u.type}: ${u.title}\n${u.description}\n`);
  } else {
    console.error('Aufruf: node youtube.js test | short <post.json> | reels <post.json> | nachholen [anzahl] | doku <meta.json> | vorschau <post.json>');
    process.exit(1);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
