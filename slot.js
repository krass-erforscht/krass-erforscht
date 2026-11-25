// Entscheidet, ob im aktuellen Zeitfenster gepostet wird: node slot.js <morgens|mittags|abends|spaet>
// Gibt "JA" oder "NEIN" aus. Pro Tag wird genau einmal gepostet.
// Die Uhrzeit richtet sich nach der besten bisherigen Reichweite, mit gelegentlichen Tests anderer Zeiten (siehe choose.js).
// Damit das Format die Uhrzeit nicht verfälscht (Bilder-Posts laufen viel schlechter als Videos), zählt jede Reichweite
// im Verhältnis zum Median ihres Formats: 2,0 = doppelt so viel wie ein typischer Post desselben Formats.
const fs = require('fs');
const { choose, posts } = require('./choose');
const SLOTS = { morgens: [6, 7, 8, 9, 10], mittags: [11, 12, 13, 14, 15], abends: [16, 17, 18, 19], spaet: [20, 21, 22, 23] };

const slot = process.argv[2];
if (!SLOTS[slot]) { console.error('Fenster muss morgens, mittags, abends oder spaet sein'); process.exit(1); }
const berlinDate = d => new Date(d).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];

// 24.11.: Test mit 2 Instagram-Posts pro Tag (Reichweite hat Vorrang) – im besten und zweitbesten Fenster
const POSTS_PER_DAY = 2;
const postedToday = posted.filter(p => berlinDate(p.postedAt) === berlinDate(Date.now())).length;
if (postedToday >= POSTS_PER_DAY) { console.log('NEIN (heute schon ' + postedToday + '× gepostet)'); process.exit(0); }
// Absicherung (23.11.): Liegt der letzte Instagram-Post über 30 Stunden zurück (z. B. verpasster Lauf), sofort posten
const lastPost = Math.max(0, ...posted.map(p => +new Date(p.postedAt)));
if (lastPost && Date.now() - lastPost > 30 * 3600e3) { console.log('JA (Nachholen: letzter Post vor über 30 Stunden)'); process.exit(0); }

const hour = p => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(p.postedAt));
const slotOf = p => Object.keys(SLOTS).find(s => SLOTS[s].includes(hour(p)));
const median = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmt = p => p.format || 'bilder';
const all = posts(), byFormat = {};
for (const p of all) (byFormat[fmt(p)] ||= []).push(p.stats.reach);
const relative = p => p.stats.reach / Math.max(median(byFormat[fmt(p)]), 1);
let { pick, why, rows } = choose(Object.keys(SLOTS), slotOf, 'uhrzeit', relative);
// Die Tagesentscheidung festhalten: neue Statistiken im Laufe des Tages dürfen das Fenster nicht mehr verschieben
// (am 21.11. sprang die Wahl nachmittags von „abends“ auf das schon vergangene „morgens“).
const MEMO = 'data/slot-heute.json', today = berlinDate(Date.now());
const memo = fs.existsSync(MEMO) ? JSON.parse(fs.readFileSync(MEMO)) : {};
if (memo.datum === today && SLOTS[memo.fenster]) { pick = memo.fenster; why = memo.grund; }
else fs.writeFileSync(MEMO, JSON.stringify({ datum: today, fenster: pick, grund: why }, null, 2) + '\n');
const second = (memo.datum === today && memo.zweites && memo.zweites !== pick) ? memo.zweites : rows.map(r => r.option).find(o => o !== pick);
fs.writeFileSync(MEMO, JSON.stringify({ datum: today, fenster: pick, grund: why, zweites: second }, null, 2) + '\n');
const lastToday = Math.max(0, ...posted.filter(p => berlinDate(p.postedAt) === berlinDate(Date.now())).map(p => +new Date(p.postedAt)));
const gapOk = !lastToday || Date.now() - lastToday > 2 * 3600e3;   // mindestens 2 Stunden zwischen zwei Posts
const usedSlots = posted.filter(p => berlinDate(p.postedAt) === berlinDate(Date.now())).map(slotOf);
if (usedSlots.includes(slot)) console.log(`NEIN (in diesem Fenster heute schon gepostet)`);
else if (slot === pick && gapOk) console.log(`JA (${why})`);
else if (slot === second && gapOk) console.log(`JA (zweiter Post des Tages, ${postedToday ? 'nach ' + pick : 'vor ' + pick})`);
else console.log(`NEIN (heute sind ${pick} und ${second} dran)`);
console.error(rows.map(r => `${r.option}: ${r.reichweite}× (${r.posts} Posts)`).join(', '));
