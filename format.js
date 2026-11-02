// Wählt das Format für den heutigen Post: node format.js <ja|nein>   (ja = ein passendes echtes Video wurde gefunden)
// Formate: bilder (Karussell mit Fotos + Folien-Reel), video (echtes Video als Reel im Feed),
//          zusammen (Karussell mit dem Video als zweiter Folie + Folien-Reel).
// Testphase: solange ein Format weniger als 5 veröffentlichte Posts hat, kommt das am wenigsten genutzte dran.
// Danach: zu 70 % das Format mit der höchsten durchschnittlichen Reichweite (bei Gleichstand die besseren Punkte),
// zu 30 % ein anderes zum Weitertesten.
const fs = require('fs');
const hasVideo = process.argv[2] === 'ja';
if (!hasVideo) { console.log('bilder'); process.exit(0); }

const FORMATS = ['bilder', 'video', 'zusammen'];
const MIN_TESTS = 5;
const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
const ranking = fs.existsSync('data/learnings.json') ? JSON.parse(fs.readFileSync('data/learnings.json')).ranking : [];
const used = f => posted.filter(p => (p.format || 'bilder') === f).length;

// Gezählt werden alle veröffentlichten Posts; das Ranking in learnings.json enthält nur Posts ab 30 erreichten Konten
// und würde schwache Formate sonst nie als „getestet“ zählen
const untested = FORMATS.filter(f => used(f) < MIN_TESTS);
let choice;
if (untested.length) {
  // Am wenigsten genutztes Format zuerst, damit alle gleich oft drankommen
  choice = untested.sort((a, b) => used(a) - used(b))[0];
} else {
  // Durchschnittliche Reichweite aus allen Posts mit Zahlen, nicht nur aus denen über 30 Konten
  const reach = f => { const ps = posted.filter(p => (p.format || 'bilder') === f && p.stats); return ps.length ? ps.reduce((a, p) => a + p.stats.reach, 0) / ps.length : 0; };
  const row = f => ranking.find(r => r.gruppe === `format:${f}`) || {};
  const best = FORMATS.slice().sort((a, b) => reach(b) - reach(a) || (row(b).punkte || 0) - (row(a).punkte || 0));
  choice = Math.random() < 0.7 ? best[0] : best[1 + Math.floor(Math.random() * 2)];
}
console.log(choice);
