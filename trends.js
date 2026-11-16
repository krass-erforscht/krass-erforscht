// Tägliche Trend-Auswertung: Was ist bei deutschen Wissens-Shorts gerade angesagt? (offizielle YouTube Data API, kostenlos)
//   node trends.js   → data/trends.md (zum Lesen) und data/trends.json
// Sucht die meistgesehenen deutschsprachigen Shorts der letzten 7 Tage zu Wissen/Tiere/Weltall/Physik/Natur
// und fasst Themen, Längen, Titel-Muster und Top-Beispiele zusammen. Kostet ca. 600 von 10.000 Quota-Einheiten am Tag.
const fs = require('fs');
const API = 'https://www.googleapis.com/youtube/v3';
const env = k => (process.env[k] || '').trim();
const QUERIES = ['wissenschaft fakten', 'tiere fakten', 'weltall fakten', 'physik', 'natur wunder', 'unglaubliche fakten'];
const TOPICS = { tiere: /tier|hund|katze|vogel|fisch|hai|schlange|insekt|affe|elefant|löwe|spinne|wal|krähe/i, weltraum: /weltall|universum|urknall|dimension|planet|stern|mond|sonne|mars|galax|schwarz.*loch|nasa|astronaut/i,
  koerper: /körper|gehirn|blut|herz|haut|auge|schlaf/i, physik: /physik|mathe|paradox|licht|gravitation|atom|quanten/i, natur: /natur|vulkan|meer|ozean|wetter|erdbeben|wald|pflanze/i,
  geschichte: /dino|antik|geschichte|ägypt|römer|fossil|urzeit/i, technik: /technik|roboter|ki\b|erfindung|maschine/i };

async function token() {
  const r = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('YT_CLIENT_ID'), client_secret: env('YT_CLIENT_SECRET'), refresh_token: env('YT_REFRESH_TOKEN'), grant_type: 'refresh_token' }) })).json();
  if (!r.access_token) throw new Error('YouTube-Zugang abgelehnt');
  return r.access_token;
}
const secs = d => { const m = /PT(?:(\d+)M)?(?:(\d+)S)?/.exec(d) || []; return (+m[1] || 0) * 60 + (+m[2] || 0); };
const median = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
const german = v => /^de/.test(v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage || '') || /\b(der|die|das|und|ist|nicht|wie|warum|dieses|diese)\b/i.test(v.snippet.title);

(async () => {
  const t = await token();
  const get = async p => { const r = await (await fetch(`${API}/${p}`, { headers: { Authorization: `Bearer ${t}` } })).json(); if (r.error) throw new Error(r.error.message); return r; };
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const ids = new Set();
  for (const q of QUERIES) {
    const s = await get(`search?part=id&type=video&videoDuration=short&relevanceLanguage=de&regionCode=DE&order=viewCount&maxResults=50&publishedAfter=${since}&q=${encodeURIComponent(q)}`);
    for (const it of s.items) ids.add(it.id.videoId);
  }
  const vids = [], arr = [...ids];
  for (let i = 0; i < arr.length; i += 50) vids.push(...(await get(`videos?part=snippet,statistics,contentDetails&id=${arr.slice(i, i + 50).join(',')}`)).items);
  const rows = vids.filter(german).map(v => ({ title: v.snippet.title, channel: v.snippet.channelTitle, views: +v.statistics.viewCount || 0,
    likes: +v.statistics.likeCount || 0, s: secs(v.contentDetails.duration), id: v.id,
    topic: Object.keys(TOPICS).find(k => TOPICS[k].test(v.snippet.title + ' ' + (v.snippet.description || '').slice(0, 200))) || 'sonstiges' }))
    .sort((a, b) => b.views - a.views);
  const top = rows.slice(0, 40);
  const byTopic = {};
  for (const r of top) (byTopic[r.topic] ||= []).push(r.views);
  const topics = Object.entries(byTopic).map(([k, v]) => ({ thema: k, videos: v.length, aufrufe: v.reduce((a, b) => a + b, 0) })).sort((a, b) => b.aufrufe - a.aufrufe);
  const pct = f => Math.round(top.filter(f).length / Math.max(top.length, 1) * 100);
  const md = [`# Trends deutscher Wissens-Shorts (letzte 7 Tage, Stand ${new Date().toISOString().slice(0, 10)})`, '',
    `${rows.length} deutschsprachige Shorts ausgewertet, davon die 40 meistgesehenen genauer.`, '',
    `- Länge der Top 40: Median ${median(top.map(r => r.s))} s`,
    `- Titel: ${pct(r => /[\u{1F300}-\u{1FAFF}]/u.test(r.title))} % mit Emoji, ${pct(r => /\?/.test(r.title))} % Frage, ${pct(r => /\d/.test(r.title))} % Zahl/Liste`, '',
    '## Angesagteste Themen (Aufrufe der Top 40)', '', ...topics.map(t => `- ${t.thema}: ${t.videos} Videos, ${t.aufrufe.toLocaleString('de-DE')} Aufrufe`), '',
    '## Top 15 Beispiele', '', ...top.slice(0, 15).map(r => `- ${r.views.toLocaleString('de-DE')} Aufrufe · ${r.s} s · ${r.topic} · „${r.title.replace(/#\S+/g, '').trim().slice(0, 90)}“ (${r.channel})`)];
  fs.writeFileSync('data/trends.md', md.join('\n') + '\n');
  fs.writeFileSync('data/trends.json', JSON.stringify({ datum: new Date().toISOString(), themen: topics, top }, null, 2));
  console.log(md.slice(0, 12 + topics.length).join('\n'));
})().catch(e => { console.error(e.message); process.exit(1); });
