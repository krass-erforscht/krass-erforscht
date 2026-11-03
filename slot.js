// Entscheidet, ob im aktuellen Zeitfenster gepostet wird: node slot.js <morgens|mittags|abends>
// Gibt "JA" oder "NEIN" aus. Pro Tag wird genau einmal gepostet.
// Die Uhrzeit richtet sich nach der besten bisherigen Reichweite, mit gelegentlichen Tests anderer Zeiten (siehe choose.js).
const fs = require('fs');
const { choose } = require('./choose');
const SLOTS = { morgens: [7, 8, 9, 10], mittags: [11, 12, 13, 14], abends: [17, 18, 19, 20, 21] };

const slot = process.argv[2];
if (!SLOTS[slot]) { console.error('Fenster muss morgens, mittags oder abends sein'); process.exit(1); }
const berlinDate = d => new Date(d).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];

if (posted.some(p => berlinDate(p.postedAt) === berlinDate(Date.now()))) { console.log('NEIN (heute schon gepostet)'); process.exit(0); }

const hour = p => +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(new Date(p.postedAt));
const slotOf = p => Object.keys(SLOTS).find(s => SLOTS[s].includes(hour(p)));
const { pick, why } = choose(Object.keys(SLOTS), slotOf, 'uhrzeit');
console.log(pick === slot ? `JA (${why})` : `NEIN (heute ist ${pick} dran, ${why})`);
