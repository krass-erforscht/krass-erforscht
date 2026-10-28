// Veröffentlicht einen gerenderten Post als Karussell auf Instagram: node publish.js posts/<datei>.json
// Mit --reel stattdessen das Video out/<id>/reel.mp4 als Reel (nach dem Karussell desselben Posts).
// Braucht IG_TOKEN (Instagram-Zugriffsschlüssel) als Umgebungsvariable.
// Die Dateien unter out/<id>/ müssen vorher ins GitHub-Repo gepusht sein, damit Instagram sie abrufen kann.
const fs = require('fs');
const { execFileSync } = require('child_process');
const API = 'https://graph.instagram.com/v23.0';
const { IG_USER_ID = 'me', IG_TOKEN } = process.env;
const GITHUB_RAW_BASE = process.env.GITHUB_RAW_BASE || 'https://raw.githubusercontent.com/krass-erforscht/krass-erforscht/main';

async function call(path, params) {
  const res = await fetch(`${API}/${path}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: IG_TOKEN }) });
  const json = await res.json();
  if (json.error) throw new Error(`${path}: ${json.error.message}`);
  return json;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// GitHub liefert Videos ohne Video-Dateityp aus; jsDelivr spiegelt das Repo mit richtigem Typ.
// Die Commit-ID in der Adresse verhindert, dass eine alte Version aus dem Zwischenspeicher kommt.
async function publishReel(post) {
  const sha = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
  const video_url = `https://cdn.jsdelivr.net/gh/krass-erforscht/krass-erforscht@${sha}/out/${post.id}/reel.mp4`;
  const container = await call(`${IG_USER_ID}/media`, { media_type: 'REELS', video_url, caption: post.caption, share_to_feed: 'false' });
  for (let i = 0; i < 60; i++) { // Instagram verarbeitet Videos im Hintergrund, bis zu 10 Minuten warten
    await sleep(10000);
    const r = await (await fetch(`${API}/${container.id}?fields=status_code,status&access_token=${IG_TOKEN}`)).json();
    if (r.status_code === 'FINISHED') break;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new Error(`Reel-Verarbeitung: ${r.status}`);
  }
  const { id } = await call(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  const log = JSON.parse(fs.readFileSync('data/posted.json'));
  const entry = log.find(p => p.id === post.id);
  if (entry) entry.reelMediaId = id;
  fs.writeFileSync('data/posted.json', JSON.stringify(log, null, 2));
  console.log(`Reel veröffentlicht: ${post.id} (Media-ID ${id})`);
}

(async () => {
  if (!IG_TOKEN) throw new Error('IG_TOKEN fehlt');
  const file = process.argv[2];
  const post = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (process.argv.includes('--reel')) return publishReel(post);
  const children = [];
  for (let i = 1; i <= post.slides.length; i++) {
    const { id } = await call(`${IG_USER_ID}/media`, { image_url: `${GITHUB_RAW_BASE}/out/${post.id}/${i}.jpg`, is_carousel_item: 'true' });
    children.push(id);
  }
  const container = await call(`${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption });
  await sleep(10000); // Instagram braucht kurz, um die Bilder zu verarbeiten
  const { id: mediaId } = await call(`${IG_USER_ID}/media_publish`, { creation_id: container.id });

  const log = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  log.push({ id: post.id, mediaId, postedAt: new Date().toISOString(), topic: post.topic, tone: post.tone, sourceUrl: post.source.url });
  fs.writeFileSync('data/posted.json', JSON.stringify(log, null, 2));
  console.log(`Veröffentlicht: ${post.id} (Media-ID ${mediaId})`);
})().catch(e => { console.error(e.message); process.exit(1); });
