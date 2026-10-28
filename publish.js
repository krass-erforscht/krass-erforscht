// Veröffentlicht einen gerenderten Post auf Instagram (Aufrufvarianten siehe unten über dem Hauptteil).
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

// Instagram erlaubt seit Dezember 2025 höchstens 5 Hashtags pro Post; überzählige werden entfernt
function limitHashtags(caption) {
  let n = 0;
  return caption.replace(/#[\p{L}\p{N}_]+/gu, tag => (++n <= 5 ? tag : '')).replace(/[ \t]+$/gm, '').trim();
}

// Bildbeschreibung für blinde Menschen und die Instagram-Suche: der Text der Folie ohne Formatierung
function altText(post, slide) {
  const text = [slide.big, slide.title, ...(slide.text || [])].filter(Boolean).join(' ').replace(/\*\*/g, '');
  return `Folie von @krass.erforscht (${post.category}): ${text}`.slice(0, 1000);
}

// GitHub liefert Videos ohne Video-Dateityp aus; jsDelivr spiegelt das Repo mit richtigem Typ.
// Die Commit-ID in der Adresse verhindert, dass eine alte Version aus dem Zwischenspeicher kommt.
function cdnUrl(post, name) {
  const sha = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
  return `https://cdn.jsdelivr.net/gh/krass-erforscht/krass-erforscht@${sha}/out/${post.id}/${name}`;
}

// Instagram verarbeitet Videos im Hintergrund; bis zu 10 Minuten warten
async function waitReady(containerId) {
  for (let i = 0; i < 60; i++) {
    await sleep(10000);
    const r = await (await fetch(`${API}/${containerId}?fields=status_code,status&access_token=${IG_TOKEN}`)).json();
    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new Error(`Video-Verarbeitung: ${r.status}`);
  }
  throw new Error('Video-Verarbeitung dauert zu lange');
}

// Beschreibung mit allen Pflicht-Nachweisen: Musik (CC BY) und Video, falls noch nicht drinsteht
function fullCaption(post, musicFile) {
  const music = musicFile && fs.existsSync(`out/${post.id}/${musicFile}`) ? JSON.parse(fs.readFileSync(`out/${post.id}/${musicFile}`)) : null;
  const v = post.video;
  const videoCredit = v && !post.caption.includes(v.credit) ? `\n${v.symbolisch ? 'Symbolvideo' : 'Video'}: ${v.credit}, ${v.license}` : '';
  return limitHashtags(post.caption) + videoCredit + (music?.credit ? `\n${music.credit}` : '');
}

function logPost(post, fields) {
  const log = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  let entry = log.find(p => p.id === post.id);
  if (!entry) log.push(entry = { id: post.id, postedAt: new Date().toISOString(), topic: post.topic, tone: post.tone, sourceUrl: post.source.url });
  Object.assign(entry, fields);
  fs.writeFileSync('data/posted.json', JSON.stringify(log, null, 2));
}

// Reel veröffentlichen: das Folien-Reel nur im Reels-Tab, das Video-Reel auch im Feed
async function publishReel(post, { file, musicFile, feed }) {
  const container = await call(`${IG_USER_ID}/media`, { media_type: 'REELS', video_url: cdnUrl(post, file), caption: fullCaption(post, musicFile), share_to_feed: String(feed) });
  await waitReady(container.id);
  const { id } = await call(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  return id;
}

// Karussell aus den Folien; mit videoSlide wird das 4:5-Video als zweite Folie eingefügt
async function publishCarousel(post, { videoSlide }) {
  const children = [];
  let withAlt = true;
  for (let i = 1; i <= post.slides.length; i++) {
    const params = { image_url: `${GITHUB_RAW_BASE}/out/${post.id}/${i}.jpg`, is_carousel_item: 'true' };
    let item;
    try {
      item = await call(`${IG_USER_ID}/media`, withAlt ? { ...params, alt_text: altText(post, post.slides[i - 1]) } : params);
    } catch (e) {
      // Falls Instagram die Bildbeschreibung bei Karussell-Folien nicht annimmt: ohne weitermachen
      if (!withAlt) throw e;
      withAlt = false;
      console.error(`Bildbeschreibung nicht angenommen (${e.message}), poste ohne`);
      item = await call(`${IG_USER_ID}/media`, params);
    }
    children.push(item.id);
    if (videoSlide && i === 1) {
      const vid = await call(`${IG_USER_ID}/media`, { media_type: 'VIDEO', video_url: cdnUrl(post, 'video-45.mp4'), is_carousel_item: 'true' });
      await waitReady(vid.id);
      children.push(vid.id);
    }
  }
  const container = await call(`${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: fullCaption(post, videoSlide ? 'video-music.json' : null) });
  await sleep(10000); // Instagram braucht kurz, um die Bilder zu verarbeiten
  if (videoSlide) await waitReady(container.id);
  const { id } = await call(`${IG_USER_ID}/media_publish`, { creation_id: container.id });
  return id;
}

// Aufruf:
//   node publish.js posts/<datei>.json            Format „bilder“: Karussell aus Fotos/Folien
//   node publish.js posts/<datei>.json --zusammen Format „zusammen“: Karussell mit dem echten Video als zweiter Folie
//   node publish.js posts/<datei>.json --video    Format „video“: echtes Video als Reel im Feed (video-reel.mp4)
//   node publish.js posts/<datei>.json --reel     zusätzlich das Folien-Reel (nur Reels-Tab), nach „bilder“ oder „zusammen“
(async () => {
  if (!IG_TOKEN) throw new Error('IG_TOKEN fehlt');
  const post = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const has = flag => process.argv.includes(flag);
  if (has('--reel')) {
    const id = await publishReel(post, { file: 'reel.mp4', musicFile: 'music.json', feed: false });
    logPost(post, { reelMediaId: id });
    console.log(`Folien-Reel veröffentlicht: ${post.id} (Media-ID ${id})`);
  } else if (has('--video')) {
    const id = await publishReel(post, { file: 'video-reel.mp4', musicFile: 'video-music.json', feed: true });
    logPost(post, { mediaId: id, format: 'video' });
    console.log(`Video-Reel veröffentlicht: ${post.id} (Media-ID ${id})`);
  } else {
    const format = has('--zusammen') ? 'zusammen' : 'bilder';
    const id = await publishCarousel(post, { videoSlide: format === 'zusammen' });
    logPost(post, { mediaId: id, format });
    console.log(`Karussell (${format}) veröffentlicht: ${post.id} (Media-ID ${id})`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
