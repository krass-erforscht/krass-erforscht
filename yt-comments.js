// Kommentare unter den eigenen YouTube-Videos lesen und beantworten (offizielle YouTube Data API, Berechtigung youtube.force-ssl).
//   node yt-comments.js list                          → offene Kommentare als JSON (mit Post-Titel zum Einordnen)
//   node yt-comments.js reply <kommentar-id> "<text>" → Antwort veröffentlichen
//   node yt-comments.js skip <kommentar-id>           → bewusst nicht beantworten (Spam, Beleidigung …)
// In data/yt-answered.json stehen nur die IDs erledigter Kommentare, keine Namen oder Texte (das Repo ist öffentlich).
// Es gelten dieselben Regeln wie für Instagram-Kommentare (CLAUDE.md, Abschnitt „Kommentare“).
const fs = require('fs');
const API = 'https://www.googleapis.com/youtube/v3';
const FILE = 'data/yt-answered.json';
const env = k => (process.env[k] || '').trim();

const done = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
const save = () => fs.writeFileSync(FILE, JSON.stringify(done, null, 2));

async function token() {
  const r = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('YT_CLIENT_ID'), client_secret: env('YT_CLIENT_SECRET'), refresh_token: env('YT_REFRESH_TOKEN'), grant_type: 'refresh_token' }) })).json();
  if (!r.access_token) throw new Error(`YouTube-Zugang abgelehnt: ${r.error}`);
  if (!/youtube\.force-ssl/.test(r.scope || '')) throw new Error('Dem Zugang fehlt die Berechtigung youtube.force-ssl (Kommentare)');
  return r.access_token;
}

async function call(t, path, opts = {}) {
  const r = await (await fetch(`${API}/${path}`, { ...opts, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } })).json();
  if (r.error) throw new Error(`${r.error.code} ${r.error.message}`);
  return r;
}

(async () => {
  const [mode, id, text] = process.argv.slice(2);
  const t = await token();
  if (mode === 'list') {
    const ch = (await call(t, 'channels?part=id&mine=true')).items[0].id;
    const log = fs.existsSync('data/youtube.json') ? JSON.parse(fs.readFileSync('data/youtube.json')) : [];
    const open = [];
    let page = '';
    do {
      const r = await call(t, `commentThreads?part=snippet,replies&allThreadsRelatedToChannelId=${ch}&maxResults=100${page ? `&pageToken=${page}` : ''}`);
      for (const it of r.items || []) {
        const top = it.snippet.topLevelComment;
        const s = top.snippet;
        if (done.includes(top.id) || s.authorChannelId?.value === ch) continue;
        // Schon von Hand oder früher beantwortet?
        if ((it.replies?.comments || []).some(c => c.snippet.authorChannelId?.value === ch)) continue;
        const entry = log.find(d => d.videoId === it.snippet.videoId);
        const post = entry && fs.existsSync(`posts/${entry.id}.json`) ? JSON.parse(fs.readFileSync(`posts/${entry.id}.json`)) : null;
        open.push({ id: top.id, video: it.snippet.videoId, post: entry?.id, postTitle: post?.slides?.[0]?.title || entry?.id,
          username: s.authorDisplayName, text: s.textOriginal, timestamp: s.publishedAt });
      }
      page = r.nextPageToken;
    } while (page);
    console.log(JSON.stringify(open, null, 2));
  } else if (mode === 'reply') {
    if (!id || !text) throw new Error('Aufruf: node yt-comments.js reply <kommentar-id> "<text>"');
    await call(t, 'comments?part=snippet', { method: 'POST', body: JSON.stringify({ snippet: { parentId: id, textOriginal: text } }) });
    done.push(id); save();
    console.log('Antwort veröffentlicht.');
  } else if (mode === 'skip') {
    done.push(id); save();
    console.log('Ausgelassen.');
  } else {
    console.error('Aufruf: node yt-comments.js list | reply <id> "<text>" | skip <id>');
    process.exit(1);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
