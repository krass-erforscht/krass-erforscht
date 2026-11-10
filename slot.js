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

if (posted.some(p => berlinDate(p.postedAt) === berlinDate(Date.now()))) { console.log('NEIN (heute schon gepostet)'); process.exit(0); }

const hour = p => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(p.postedAt));
const slotOf = p => Object.keys(SLOTS).find(s => SLOTS[s].includes(hour(p)));
const median = a => { const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmt = p => p.format || 'bilder';
const all = posts(), byFormat = {};
for (const p of all) (byFormat[fmt(p)] ||= []).push(p.stats.reach);
const relative = p => p.stats.reach / Math.max(median(byFormat[fmt(p)]), 1);
const { pick, why, rows } = choose(Object.keys(SLOTS), slotOf, 'uhrzeit', relative);
console.log(pick === slot ? `JA (${why})` : `NEIN (heute ist ${pick} dran, ${why})`);
console.error(rows.map(r => `${r.option}: ${r.reichweite}× (${r.posts} Posts)`).join(', '));
