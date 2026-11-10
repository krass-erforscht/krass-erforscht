// Tägliche Algorithmus-Analyse: Was bringt Aufrufe, Likes und Follower?
//   node analyse.js   (nach node insights.js)  → data/analyse.md (zum Lesen) und data/analyse.json
// Vergleicht alle Posts nach Merkmalen (Format, Thema, Ton, Uhrzeit, Wochentag, Überschrift, Videolänge, Wiedergabedauer …)
// und nennt die deutlichsten Unterschiede. Mittelwerte als Median, damit ein viraler Ausreißer nicht alles verzerrt.
// Wenig Daten = vorsichtig deuten: Unterschiede zwischen Gruppen mit nur 1–2 Posts sind Hinweise, keine Beweise.
const fs = require('fs');

const posted = JSON.parse(fs.readFileSync('data/posted.json')).filter(p => p.stats && Date.now() - new Date(p.postedAt) > 864e5);
const account = fs.existsSync('data/account.json') ? JSON.parse(fs.readFileSync('data/account.json')) : [];
const yt = fs.existsSync('data/youtube.json') ? JSON.parse(fs.readFileSync('data/youtube.json')) : [];

const median = a => { const s = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); if (!s.length) return null;
  const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = x => x == null ? '–' : (Math.round(x * 10) / 10).toLocaleString('de-DE');
const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Merkmale und Kennzahlen pro Post
const rows = posted.map(p => {
  const post = fs.existsSync(`posts/${p.id}.json`) ? JSON.parse(fs.readFileSync(`posts/${p.id}.json`)) : {};
  const s = p.stats, reel = p.format === 'video' ? s : p.reelStats;
  const when = new Date(p.postedAt);
  const hour = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(when);
  const title = (post.video?.headline || post.slides?.[0]?.title || '').replace(/\*\*/g, '');
  const dur = post.video?.duration || null;
  const watch = reel?.ig_reels_avg_watch_time ? reel.ig_reels_avg_watch_time / 1000 : null;
  const reach = Math.max(s.reach || 0, 1);
  return {
    id: p.id, datum: p.postedAt.slice(0, 10), titel: title,
    // Merkmale
    format: p.format || 'bilder', thema: p.topic, ton: p.tone, uhrzeit: `${hour} Uhr`, wochentag: WEEKDAY[when.getDay()],
    ueberschrift: title.length <= 45 ? 'kurz (≤45 Zeichen)' : 'lang (>45 Zeichen)',
    zahl_im_titel: /\d/.test(title) ? 'mit Zahl' : 'ohne Zahl',
    frage_im_titel: /\?/.test(title) ? 'Frage' : 'Aussage',
    videolaenge: dur == null ? null : dur <= 15 ? 'bis 15 s' : dur <= 25 ? '16–25 s' : 'über 25 s',
    test: post.test || null,
    symbolvideo: post.video ? (post.video.symbolisch ? 'Symbolvideo' : 'echtes Video') : null,
    // Kennzahlen
    reichweite: s.reach || 0, aufrufe: s.views || null, likes: s.likes || 0, kommentare: s.comments || 0,
    shares: s.shares || 0, saves: s.saved || 0, follows: s.follows ?? null, profilbesuche: s.profile_visits ?? null,
    // Anteil geschaut nur beim Format „video“: dort ist das Reel genau das Video aus der Post-Datei
    wiedergabe_s: watch, wiedergabe_anteil: watch && dur && p.format === 'video' ? watch / dur : null,
    likes_pro_1000: (s.likes || 0) / reach * 1000, teilen_speichern_pro_1000: ((s.shares || 0) + (s.saved || 0)) / reach * 1000,
  };
});

// Gruppenvergleich: Median-Reichweite und Interaktionsrate je Ausprägung eines Merkmals
const FEATURES = ['format', 'thema', 'ton', 'uhrzeit', 'wochentag', 'ueberschrift', 'zahl_im_titel', 'frage_im_titel', 'videolaenge', 'symbolvideo', 'test'];
const NAMES = { format: 'Format', thema: 'Thema', ton: 'Ton', uhrzeit: 'Uhrzeit', wochentag: 'Wochentag', ueberschrift: 'Überschrift',
  zahl_im_titel: 'Zahl in der Überschrift', frage_im_titel: 'Frage oder Aussage', videolaenge: 'Videolänge', symbolvideo: 'Echtes Video oder Symbolvideo', test: 'Getestete Regel (Feld „test“ im Post)' };
const compare = FEATURES.map(f => {
  const groups = {};
  for (const r of rows) if (r[f] != null) (groups[r[f]] ||= []).push(r);
  const list = Object.entries(groups).map(([wert, g]) => ({ wert, posts: g.length, reichweite: median(g.map(r => r.reichweite)),
    // Raten über die ganze Gruppe gerechnet (Summe/Summe), weil einzelne Shares/Saves sonst im Median verschwinden
    likes_pro_1000: g.reduce((a, r) => a + r.likes, 0) / Math.max(g.reduce((a, r) => a + r.reichweite, 0), 1) * 1000,
    teilen_speichern_pro_1000: g.reduce((a, r) => a + r.shares + r.saves, 0) / Math.max(g.reduce((a, r) => a + r.reichweite, 0), 1) * 1000,
    wiedergabe_s: median(g.map(r => r.wiedergabe_s)) })).sort((a, b) => b.reichweite - a.reichweite);
  return { merkmal: f, name: NAMES[f], gruppen: list };
}).filter(c => c.gruppen.length > 1);

// Rangkorrelation (Spearman): hängt Reichweite mit der Zuschau-Dauer zusammen?
function spearman(pairs) {
  if (pairs.length < 4) return null;
  const rank = vals => { const s = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const r = []; s.forEach(([, i], k) => r[i] = k); return r; };
  const a = rank(pairs.map(p => p[0])), b = rank(pairs.map(p => p[1])), n = pairs.length;
  return 1 - 6 * a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0) / (n * (n * n - 1));
}
const watchCorr = spearman(rows.filter(r => r.wiedergabe_anteil != null).map(r => [r.wiedergabe_anteil, r.reichweite]));

// Deutlichste Unterschiede (mind. 2 Posts je Gruppe, mind. 1,5-fache Reichweite) als Hinweise
const hints = [];
for (const c of compare) {
  const ok = c.gruppen.filter(g => g.posts >= 2);
  if (ok.length < 2) continue;
  const best = ok[0], worst = ok.at(-1);
  if (best.reichweite >= 1.5 * Math.max(worst.reichweite, 1))
    hints.push(`${c.name}: „${best.wert}“ erreicht im Mittel ${r1(best.reichweite)} Konten, „${worst.wert}“ nur ${r1(worst.reichweite)} (${best.posts} bzw. ${worst.posts} Posts).`);
}
if (watchCorr != null) hints.push(`Zuschau-Anteil und Reichweite: Rangkorrelation ${r1(watchCorr)} (${watchCorr > 0.4 ? 'deutlicher Zusammenhang – Videos, die bis zum Ende geschaut werden, verbreiten sich weiter' : watchCorr > 0.1 ? 'schwacher Zusammenhang' : 'kein klarer Zusammenhang'}).`);

const sorted = rows.slice().sort((a, b) => b.reichweite - a.reichweite);
const fol = account.length ? account.at(-1).followers : null, fol7 = account.find(a => Date.now() - new Date(a.day) <= 7 * 864e5)?.followers;

const md = [];
md.push(`# Algorithmus-Analyse (${new Date().toISOString().slice(0, 10)})`, '',
  `${rows.length} Posts ausgewertet (mind. 1 Tag alt). Follower: ${fol ?? '–'}${fol7 != null && fol != null ? ` (seit ${account.find(a => a.followers === fol7).day}: ${fol - fol7 >= 0 ? '+' : ''}${fol - fol7})` : ''}.`,
  `Gesamtreichweite: ${rows.reduce((a, r) => a + r.reichweite, 0).toLocaleString('de-DE')} Konten, Median pro Post: ${r1(median(rows.map(r => r.reichweite)))}.`, '',
  '## Deutlichste Unterschiede (Hinweise, noch wenig Daten)', '', ...(hints.length ? hints.map(h => `- ${h}`) : ['- Noch keine deutlichen Unterschiede mit genug Posts.']), '',
  '## Top 3', '', ...sorted.slice(0, 3).map(r => `- **${r.titel}** (${r.datum}, ${r.format}, ${r.thema}/${r.ton}, ${r.uhrzeit}): ${r.reichweite} Konten, ${r.likes} Likes, ${r.shares} Shares, ${r.saves} Saves${r.wiedergabe_s ? `, Ø ${r1(r.wiedergabe_s)} s geschaut` : ''}`), '',
  '## Flop 3', '', ...sorted.slice(-3).reverse().map(r => `- **${r.titel}** (${r.datum}, ${r.format}, ${r.thema}/${r.ton}, ${r.uhrzeit}): ${r.reichweite} Konten, ${r.likes} Likes`), '',
  '## Vergleich nach Merkmalen (Median)', '');
for (const c of compare) {
  md.push(`### ${c.name}`, '', '| Ausprägung | Posts | Reichweite (Median) | Likes je 1000 erreichte | Teilen+Speichern je 1000 | Ø geschaut im Reel (s) |', '|---|---|---|---|---|---|');
  for (const g of c.gruppen) md.push(`| ${g.wert} | ${g.posts} | ${r1(g.reichweite)} | ${r1(g.likes_pro_1000)} | ${r1(g.teilen_speichern_pro_1000)} | ${r1(g.wiedergabe_s)} |`);
  md.push('');
}
md.push('## Alle Posts', '', '| Datum | Titel | Format | Reichweite | Aufrufe | Likes | Shares | Saves | Follows | Ø geschaut | Anteil geschaut |', '|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) md.push(`| ${r.datum} | ${r.titel.slice(0, 45)} | ${r.format} | ${r.reichweite} | ${r.aufrufe ?? '–'} | ${r.likes} | ${r.shares} | ${r.saves} | ${r.follows ?? '–'} | ${r.wiedergabe_s ? r1(r.wiedergabe_s) + ' s' : '–'} | ${r.wiedergabe_anteil ? Math.round(r.wiedergabe_anteil * 100) + ' %' : '–'} |`);
if (yt.length) md.push('', `## YouTube`, '', `${yt.length} Videos hochgeladen (Aufrufzahlen: siehe youtube.js statistik).`);

fs.writeFileSync('data/analyse.md', md.join('\n') + '\n');
fs.writeFileSync('data/analyse.json', JSON.stringify({ datum: new Date().toISOString(), hinweise: hints, watchCorr, vergleich: compare, posts: rows }, null, 2));
console.log(md.slice(0, md.indexOf('## Vergleich nach Merkmalen (Median)')).join('\n'));
