// Von erfolgreichen Kanälen lernen (YouTube, offizielle Data API, kostenlos).
//   node vorbilder.js entdecken [gruppe]   → sucht deutschsprachige Shorts-Kanäle zu den Suchbegriffen der Gruppe und nimmt echte auf
//   node vorbilder.js youtube [gruppe]     → holt die neuesten Shorts aller Vorbilder, schreibt data/vorbilder.md und data/vorbilder.json
//   node vorbilder.js hinzufuegen <gruppe> @handle …  → bestimmte Kanäle aufnehmen (werden ebenso auf Echtheit geprüft)
//   node vorbilder.js liste                → zeigt die beobachteten Kanäle
// Gruppen: wissen (krass.erforscht), nachrichten (tagesbild.kompakt). Ohne Angabe: die erste Gruppe in data/vorbilder-kanaele.json.
//
// Gekaufte Abonnenten/Aufrufe aussortieren: Ein Kanal zählt nur, wenn seine Zahlen zueinander passen –
//   Likes pro Aufruf 0,5–15 % (gekaufte Aufrufe bringen kaum Likes, gekaufte Likes zu viele),
//   Kommentare vorhanden, mittlere Aufrufe nicht winzig im Vergleich zu den Abonnenten (gekaufte Abos schauen nichts),
//   mindestens 5 Shorts in den letzten 90 Tagen.
// Gemessen wird pro Video der „Ausreißer-Wert“: Aufrufe geteilt durch den Median des eigenen Kanals.
// So vergleicht man Videos großer und kleiner Kanäle fair: Was hat ein Video, das 3× besser lief als sonst bei diesem Kanal?
// Kosten: ca. 3 Einheiten pro Kanal und Lauf, Suche 100 Einheiten (Tageslimit 10.000, Uploads brauchen 1.600 – daher Suche sparsam).
const fs = require('fs');

const API = 'https://www.googleapis.com/youtube/v3';
const LIST = 'data/vorbilder-kanaele.json';
const OUT_JSON = 'data/vorbilder.json';
const OUT_MD = 'data/vorbilder.md';
const MAX_KANAELE = 25;
const MIN_MEDIAN = 1000; // Vorbild nur, wenn die Shorts im Median mind. 1.000 Aufrufe haben
const env = k => (process.env[k] || '').trim();

const DEFAULT_LIST = {
  wissen: { suche: ['wissenschaft fakten shorts', 'krasse fakten tiere', 'weltraum fakten', 'wusstest du schon wissenschaft', 'physik experiment shorts'], kanaele: [] },
  nachrichten: { suche: ['nachrichten kurz erklärt', 'news in 60 sekunden', 'was heißt das für dich nachrichten', 'wirtschaft einfach erklärt shorts'], kanaele: [] },
};

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

let TOKEN;
async function get(path, params) {
  const url = `${API}/${path}?${new URLSearchParams(params)}`;
  const r = await (await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  if (r.error) throw new Error(`YouTube ${path}: ${r.error.message}`);
  return r;
}

const median = a => { const s = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); if (!s.length) return null;
  const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = x => x == null ? '–' : (Math.round(x * 10) / 10).toLocaleString('de-DE');
const n0 = x => x == null ? '–' : Math.round(x).toLocaleString('de-DE');
const pct = x => x == null ? '–' : `${r1(x * 100)} %`;
const seconds = iso => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '') || [];
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0); };
const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const berlin = d => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
  .formatToParts(d).map(x => [x.type, x.value])); return { hour: +p.hour, weekday: WEEKDAY[['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)] }; };

function loadList() {
  const l = fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST)) : DEFAULT_LIST;
  for (const [k, v] of Object.entries(DEFAULT_LIST)) l[k] ||= v;
  return l;
}

// Kanal-Daten und die Shorts der letzten 90 Tage
async function channelData(channelId) {
  const c = (await get('channels', { part: 'snippet,statistics,contentDetails', id: channelId })).items?.[0];
  if (!c) return null;
  const uploads = c.contentDetails.relatedPlaylists.uploads;
  const pl = await get('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 50 }).catch(() => ({ items: [] }));
  const ids = (pl.items || []).map(i => i.contentDetails.videoId);
  const vids = ids.length ? (await get('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') })).items || [] : [];
  const now = Date.now();
  const videos = vids.map(v => ({
    id: v.id, titel: v.snippet.title, beschreibung: (v.snippet.description || '').slice(0, 500), tags: (v.snippet.tags || []).length,
    veroeffentlicht: v.snippet.publishedAt, dauer: seconds(v.contentDetails.duration),
    aufrufe: +v.statistics.viewCount || 0, likes: v.statistics.likeCount == null ? null : +v.statistics.likeCount,
    kommentare: v.statistics.commentCount == null ? null : +v.statistics.commentCount,
    alter_tage: (now - new Date(v.snippet.publishedAt)) / 864e5,
  })).filter(v => v.dauer > 0 && v.dauer <= 180 && v.alter_tage <= 90);
  return {
    id: c.id, name: c.snippet.title, handle: c.snippet.customUrl || null, land: c.snippet.country || null,
    abonnenten: c.statistics.hiddenSubscriberCount ? null : +c.statistics.subscriberCount, videos,
  };
}

// Echtheits-Prüfung: Passen Abonnenten, Aufrufe, Likes und Kommentare zueinander?
function echtheit(k) {
  const reif = k.videos.filter(v => v.alter_tage >= 3);
  const views = reif.reduce((a, v) => a + v.aufrufe, 0);
  const likes = reif.reduce((a, v) => a + (v.likes || 0), 0);
  const comments = reif.reduce((a, v) => a + (v.kommentare || 0), 0);
  const med = median(reif.map(v => v.aufrufe));
  const likeRate = views ? likes / views : null;
  const grund = [];
  if (reif.length < 5) grund.push(`nur ${reif.length} Shorts in 90 Tagen`);
  if (likeRate != null && likeRate < 0.005) grund.push(`kaum Likes (${pct(likeRate)} der Aufrufe) – Hinweis auf gekaufte Aufrufe`);
  if (likeRate != null && likeRate > 0.15) grund.push(`ungewöhnlich viele Likes (${pct(likeRate)}) – Hinweis auf gekaufte Likes`);
  if (views > 50000 && comments === 0) grund.push('keine Kommentare trotz vieler Aufrufe');
  if (k.abonnenten > 50000 && med != null && med / k.abonnenten < 0.002) grund.push(`Abos schauen kaum (Median ${n0(med)} Aufrufe bei ${n0(k.abonnenten)} Abos) – Hinweis auf gekaufte Abos`);
  return { echt: grund.length === 0, grund, likeRate, kommentarRate: views ? comments / views : null, medianAufrufe: med, shorts: reif.length,
    proWoche: k.videos.length / Math.max(1, Math.min(90, Math.max(...k.videos.map(v => v.alter_tage), 1))) * 7 };
}

// Merkmale eines Videos, die man selbst steuern kann
function merkmale(v) {
  const t = v.titel, { hour, weekday } = berlin(new Date(v.veroeffentlicht));
  const tagsInText = (`${t} ${v.beschreibung}`.match(/#[\p{L}\d_]+/gu) || []).length;
  return {
    laenge: v.dauer <= 15 ? 'bis 15 s' : v.dauer <= 30 ? '16–30 s' : v.dauer <= 60 ? '31–60 s' : '61–180 s',
    uhrzeit: hour < 10 ? '06–09 Uhr' : hour < 14 ? '10–13 Uhr' : hour < 18 ? '14–17 Uhr' : hour < 21 ? '18–20 Uhr' : '21–05 Uhr',
    wochentag: weekday,
    zahl_im_titel: /\d/.test(t) ? 'mit Zahl' : 'ohne Zahl',
    frage_im_titel: /\?/.test(t) ? 'Frage' : 'keine Frage',
    ausruf_im_titel: /!/.test(t) ? 'mit !' : 'ohne !',
    emoji_im_titel: /\p{Extended_Pictographic}/u.test(t) ? 'mit Emoji' : 'ohne Emoji',
    grossbuchstaben: /\b[A-ZÄÖÜ]{4,}\b/.test(t) ? 'Wort in GROSSBUCHSTABEN' : 'normal geschrieben',
    titellaenge: t.length <= 40 ? 'kurz (≤40)' : t.length <= 70 ? 'mittel (41–70)' : 'lang (>70)',
    du_ansprache: /\b(du|dich|dir|dein\w*)\b/i.test(t) ? 'spricht mit „du“ an' : 'ohne „du“',
    hook: /^\W*(angenommen|was wäre|was passiert,? wenn|stell dir vor)/i.test(t) ? 'Gedankenspiel („Angenommen …“, „Was wäre, wenn …“)'
      : /^\W*(dies(e|er|es)?|das ist|hier)\b/i.test(t) ? 'Zeigt auf etwas („Dieses …“, „Das ist …“)'
      : /^\W*(warum|wieso|weshalb|wie|was|wer|wo|wann)\b/i.test(t) ? 'W-Frage („Warum …“)'
      : /^\W*(du|dein|wenn du)\b/i.test(t) ? 'Spricht direkt an („Du …“)' : 'anderer Anfang',
    hashtags: tagsInText === 0 ? 'keine' : tagsInText <= 3 ? '1–3' : tagsInText <= 6 ? '4–6' : 'über 6',
  };
}
const NAMES = { laenge: 'Videolänge', uhrzeit: 'Uhrzeit (Berlin)', wochentag: 'Wochentag', zahl_im_titel: 'Zahl im Titel', frage_im_titel: 'Frage im Titel',
  ausruf_im_titel: 'Ausrufezeichen im Titel', emoji_im_titel: 'Emoji im Titel', grossbuchstaben: 'GROSSBUCHSTABEN im Titel', titellaenge: 'Titellänge',
  du_ansprache: 'Ansprache mit „du“', hook: 'Titelanfang (Hook-Art)', hashtags: 'Hashtags in Titel/Beschreibung' };

async function entdecken(gruppe) {
  const list = loadList(), g = list[gruppe];
  const seit = new Date(Date.now() - 30 * 864e5).toISOString();
  const found = new Map();
  for (const q of g.suche) {
    const r = await get('search', { part: 'snippet', q, type: 'video', videoDuration: 'short', relevanceLanguage: 'de', regionCode: 'DE',
      order: 'viewCount', publishedAfter: seit, maxResults: 25 });
    for (const it of r.items || []) found.set(it.snippet.channelId, (found.get(it.snippet.channelId) || 0) + 1);
  }
  const bekannt = new Set([...g.kanaele.map(k => k.id), ...(g.abgelehnt || []).map(k => k.id)]);
  let neu = 0;
  for (const id of [...found.keys()].filter(id => !bekannt.has(id))) {
    if (g.kanaele.length >= MAX_KANAELE) break;
    const k = await channelData(id); if (!k) continue;
    const e = echtheit(k);
    // Deutschsprachig: Land DE/AT/CH (oder leer) und mehr als die Hälfte der Titel mit typischen deutschen Wörtern
    const deTitel = k.videos.filter(v => /\b(der|die|das|und|ist|nicht|ein|eine|du|wie|warum|wird|für|mit|auf)\b/i.test(v.titel)).length;
    const deutsch = (!k.land || ['DE', 'AT', 'CH'].includes(k.land)) && deTitel > k.videos.length / 2;
    if (e.echt && deutsch && e.medianAufrufe < MIN_MEDIAN) { console.log(`· ${k.name}: zu klein (Median ${n0(e.medianAufrufe)})`); continue; }
    if (e.echt && deutsch) { g.kanaele.push({ id, name: k.name, handle: k.handle, seit: new Date().toISOString().slice(0, 10) }); neu++;
      console.log(`+ ${k.name} (${n0(k.abonnenten)} Abos, Median ${n0(e.medianAufrufe)} Aufrufe, Likes ${pct(e.likeRate)})`); }
    else { (g.abgelehnt ||= []).push({ id, name: k.name, grund: deutsch ? e.grund.join('; ') : `nicht deutschsprachig (${k.land || '?'})` });
      console.log(`– ${k.name}: ${deutsch ? e.grund.join('; ') : `nicht deutschsprachig (${k.land || '?'})`}`); }
  }
  fs.writeFileSync(LIST, JSON.stringify(list, null, 2));
  console.log(`${neu} neue Vorbilder, jetzt ${g.kanaele.length} in „${gruppe}“.`);
}

async function hinzufuegen(gruppe, handles) {
  const list = loadList(), g = list[gruppe];
  for (const h of handles) {
    const c = (await get('channels', { part: 'id', forHandle: h.replace(/^@?/, '@') })).items?.[0];
    if (!c) { console.log(`? ${h}: nicht gefunden`); continue; }
    if (g.kanaele.some(k => k.id === c.id)) { console.log(`= ${h}: schon dabei`); continue; }
    const k = await channelData(c.id), e = echtheit(k);
    if (!e.echt) { console.log(`– ${k.name}: ${e.grund.join('; ')}`); continue; }
    g.kanaele.push({ id: c.id, name: k.name, handle: k.handle, seit: new Date().toISOString().slice(0, 10) });
    console.log(`+ ${k.name} (${n0(k.abonnenten)} Abos, Median ${n0(e.medianAufrufe)} Aufrufe, Likes ${pct(e.likeRate)})`);
  }
  fs.writeFileSync(LIST, JSON.stringify(list, null, 2));
}

async function youtube(gruppe) {
  const list = loadList(), g = list[gruppe];
  if (!g.kanaele.length) throw new Error(`Noch keine Vorbilder in „${gruppe}“: zuerst node vorbilder.js entdecken ${gruppe}`);
  const kanaele = [];
  for (const k of g.kanaele) {
    const d = await channelData(k.id).catch(e => { console.error(`${k.name}: ${e.message}`); return null; });
    if (!d) continue;
    const e = echtheit(d);
    kanaele.push({ ...d, ...e });
  }
  const echt = kanaele.filter(k => k.echt);
  // Ausreißer-Wert je Video (nur Videos, die mind. 3 Tage alt sind – vorher steigen die Aufrufe noch stark)
  const videos = echt.flatMap(k => k.videos.filter(v => v.alter_tage >= 3).map(v => ({ ...v, kanal: k.name,
    wert: k.medianAufrufe ? v.aufrufe / k.medianAufrufe : null, likeRate: v.aufrufe ? (v.likes || 0) / v.aufrufe : null, m: merkmale(v) })));

  // Merkmale vergleichen: mittlerer Ausreißer-Wert mit/ohne. Nur Gruppen mit mind. 8 Videos aus mind. 3 Kanälen zählen.
  const vergleich = Object.keys(NAMES).map(f => {
    const groups = {};
    for (const v of videos) (groups[v.m[f]] ||= []).push(v);
    const rows = Object.entries(groups).map(([wert, gv]) => ({ wert, videos: gv.length, kanaele: new Set(gv.map(v => v.kanal)).size,
      ausreisser: median(gv.map(v => v.wert)), likes: median(gv.map(v => v.likeRate)) }))
      .filter(r => r.videos >= 8 && r.kanaele >= 3).sort((a, b) => b.ausreisser - a.ausreisser);
    const spanne = rows.length > 1 ? rows[0].ausreisser / Math.max(rows[rows.length - 1].ausreisser, 0.01) : 1;
    return { merkmal: f, name: NAMES[f], rows, spanne };
  }).filter(c => c.rows.length > 1).sort((a, b) => b.spanne - a.spanne);

  const top = [...videos].sort((a, b) => b.wert - a.wert).slice(0, 15);
  const heute = new Date().toISOString().slice(0, 10);
  const verlauf = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON)) : {};
  (verlauf[gruppe] ||= []).push({ datum: heute, kanaele: kanaele.map(k => ({ id: k.id, name: k.name, abonnenten: k.abonnenten,
    medianAufrufe: k.medianAufrufe, likeRate: k.likeRate, shorts: k.shorts, echt: k.echt })),
    vergleich: vergleich.map(c => ({ merkmal: c.merkmal, rows: c.rows })), top: top.map(v => ({ id: v.id, kanal: v.kanal, titel: v.titel, dauer: v.dauer, aufrufe: v.aufrufe, wert: v.wert })) });
  verlauf[gruppe] = verlauf[gruppe].filter((x, i, a) => a.findIndex(y => y.datum === x.datum) === i || i === a.length - 1).slice(-60);
  fs.writeFileSync(OUT_JSON, JSON.stringify(verlauf, null, 2));

  // Bericht
  const L = [];
  L.push(`# Vorbilder auf YouTube – Gruppe „${gruppe}“ (Stand ${heute})`, '');
  L.push(`${echt.length} von ${kanaele.length} Kanälen bestehen die Echtheits-Prüfung, ${videos.length} Shorts (3–90 Tage alt) im Vergleich.`);
  L.push('„Ausreißer-Wert“ = Aufrufe eines Videos geteilt durch den Median seines Kanals (2,0 = doppelt so gut wie sonst bei diesem Kanal).', '');
  L.push('Wichtig: Das zeigt, was bei *anderen* funktioniert. Eine Idee daraus erst als Regel „im Test“ übernehmen und mit unseren eigenen Zahlen prüfen.', '');
  L.push('## Was gut laufende Shorts gemeinsam haben', '');
  if (!vergleich.length) L.push('Noch zu wenige Videos für einen Vergleich.');
  for (const c of vergleich) {
    L.push(`### ${c.name} (Unterschied ${r1(c.spanne)}×)`, '| Ausprägung | Videos | Kanäle | Ausreißer-Wert (Median) | Likes/Aufrufe |', '|---|---|---|---|---|');
    for (const r of c.rows) L.push(`| ${r.wert} | ${r.videos} | ${r.kanaele} | ${r1(r.ausreisser)} | ${pct(r.likes)} |`);
    L.push('');
  }
  L.push('## Die 15 stärksten Ausreißer (zum genauer Ansehen)', '', '| Kanal | Titel | Länge | Aufrufe | Ausreißer |', '|---|---|---|---|---|');
  for (const v of top) L.push(`| ${v.kanal} | [${v.titel.replace(/\|/g, '/')}](https://youtube.com/shorts/${v.id}) | ${v.dauer} s | ${n0(v.aufrufe)} | ${r1(v.wert)}× |`);
  L.push('', '## Beobachtete Kanäle', '', '| Kanal | Abos | Shorts/Woche | Median-Aufrufe | Likes/Aufrufe | Kommentare/Aufrufe | Echt? |', '|---|---|---|---|---|---|---|');
  for (const k of kanaele.sort((a, b) => (b.medianAufrufe || 0) - (a.medianAufrufe || 0)))
    L.push(`| ${k.name} | ${n0(k.abonnenten)} | ${r1(k.proWoche)} | ${n0(k.medianAufrufe)} | ${pct(k.likeRate)} | ${pct(k.kommentarRate)} | ${k.echt ? 'ja' : `nein: ${k.grund.join('; ')}`} |`);
  fs.writeFileSync(OUT_MD, L.join('\n') + '\n');
  console.log(`${OUT_MD} geschrieben: ${echt.length}/${kanaele.length} echte Kanäle, ${videos.length} Videos.`);
  for (const c of vergleich.slice(0, 4)) console.log(`  ${c.name}: am besten „${c.rows[0].wert}“ (${r1(c.rows[0].ausreisser)}), am schwächsten „${c.rows.at(-1).wert}“ (${r1(c.rows.at(-1).ausreisser)})`);
}

(async () => {
  const [mode, arg, ...rest] = process.argv.slice(2);
  const gruppe = arg || Object.keys(loadList())[0];
  if (mode === 'liste') {
    for (const [name, g] of Object.entries(loadList())) console.log(`${name}: ${g.kanaele.map(k => k.name).join(', ') || '(leer)'}`);
    return;
  }
  TOKEN = await accessToken();
  if (mode === 'entdecken') await entdecken(gruppe);
  else if (mode === 'youtube') await youtube(gruppe);
  else if (mode === 'hinzufuegen') await hinzufuegen(gruppe, rest);
  else console.log('node vorbilder.js entdecken|youtube|liste [wissen|nachrichten]');
})().catch(e => { console.error(e.message); process.exit(1); });
