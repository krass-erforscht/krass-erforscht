// Entscheidet, ob im aktuellen Zeitfenster gepostet wird: node slot.js <morgens|mittags|abends>
// Gibt "JA" oder "NEIN" aus. Pro Tag wird genau einmal gepostet.
// Testphase (erste 21 Posts): die Fenster wechseln sich täglich ab, damit jede Uhrzeit gleich oft getestet wird.
// Danach: das Fenster mit den besten Punkten aus data/learnings.json.
const fs = require('fs');
const SLOTS = { morgens: [7, 8, 9, 10], mittags: [11, 12, 13, 14], abends: [17, 18, 19, 20, 21] };
const TEST_POSTS = 21;

const slot = process.argv[2];
if (!SLOTS[slot]) { console.error('Fenster muss morgens, mittags oder abends sein'); process.exit(1); }
const berlinDate = d => new Date(d).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];

if (posted.some(p => berlinDate(p.postedAt) === berlinDate(Date.now()))) { console.log('NEIN (heute schon gepostet)'); process.exit(0); }

let chosen;
if (posted.length < TEST_POSTS) {
  const day = Math.floor(Date.now() / 864e5);
  chosen = Object.keys(SLOTS)[day % 3];
} else {
  const ranking = fs.existsSync('data/learnings.json') ? JSON.parse(fs.readFileSync('data/learnings.json')).ranking : [];
  const score = name => {
    const rows = ranking.filter(r => r.gruppe.startsWith('uhrzeit:') && SLOTS[name].includes(+r.gruppe.slice(8)));
    const n = rows.reduce((a, r) => a + r.posts, 0);
    return n ? rows.reduce((a, r) => a + r.punkte * r.posts, 0) / n : -1;
  };
  chosen = Object.keys(SLOTS).sort((a, b) => score(b) - score(a))[0];
}
console.log(chosen === slot ? 'JA' : `NEIN (heute ist ${chosen} dran)`);
