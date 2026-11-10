// Gemeinsame Auswahl-Logik: immer nach der besten Reichweite richten, aber weiter dazulernen.
//   node choose.js empfehlung   → Empfehlung für Thema und Ton des heutigen Posts (JSON)
// Regeln für jede Auswahl (Uhrzeit, Format, Thema, Ton):
//   - Gezählt wird die Reichweite (erreichte Konten) aller Posts, die mindestens einen Tag alt sind.
//   - Optionen mit weniger als 2 solchen Posts sind noch kaum getestet und kommen bevorzugt dran (am wenigsten getestete zuerst).
//   - Sonst: an 3 von 4 Tagen die Option mit der höchsten mittleren Reichweite (Median), am 4. eine andere zum Weiterlernen.
// Die Zufallsentscheidung hängt nur vom Datum ab, damit alle Läufe eines Tages dasselbe Ergebnis bekommen.
const fs = require('fs');

const MIN_DATA = 2;
const EXPLORE = 0.25;

function posts() {
  const all = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  // Zahlen jüngerer Posts sind noch nicht aussagekräftig
  return all.filter(p => p.stats && Date.now() - new Date(p.postedAt) > 864e5);
}

// Pseudozufall aus Datum und Art der Entscheidung (z. B. „uhrzeit“): gleicher Tag → gleiche Zahl zwischen 0 und 1
function dayRandom(kind) {
  const key = new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) + kind;
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return (h % 10000) / 10000;
}

// options: Liste möglicher Werte; groupOf: ordnet einem Post seinen Wert zu; kind: Name der Entscheidung
// valueOf (optional): was gezählt wird, Standard = erreichte Konten; filter (optional): nur diese Posts zählen
function choose(options, groupOf, kind, valueOf = p => p.stats.reach, filter = () => true) {
  const data = posts().filter(filter);
  const reaches = o => data.filter(p => groupOf(p) === o).map(valueOf);
  // Median statt Durchschnitt: ein einzelner viraler Ausreißer soll nicht die ganze Auswahl umwerfen
  const avg = o => {
    const r = reaches(o).sort((a, b) => a - b);
    if (!r.length) return 0;
    const m = Math.floor(r.length / 2);
    return r.length % 2 ? r[m] : (r[m - 1] + r[m]) / 2;
  };
  const rows = options.map(o => ({ option: o, posts: reaches(o).length, reichweite: Math.round(avg(o) * 100) / 100 }));
  const fresh = rows.filter(r => r.posts < MIN_DATA).sort((a, b) => a.posts - b.posts);
  const ranked = rows.slice().sort((a, b) => b.reichweite - a.reichweite);
  let pick, why;
  if (fresh.length) {
    // Kaum getestete Optionen bekommen eine faire Chance, die ruhigste davon per Tageszufall
    pick = fresh.filter(r => r.posts === fresh[0].posts)[Math.floor(dayRandom(kind) * fresh.filter(r => r.posts === fresh[0].posts).length)].option;
    why = 'noch kaum getestet';
  } else if (dayRandom(kind) >= EXPLORE) {
    pick = ranked[0].option; why = 'beste Reichweite';
  } else {
    const others = ranked.slice(1);
    pick = others[Math.floor(dayRandom(kind + 'x') * others.length)].option; why = 'zum Weiterlernen';
  }
  return { pick, why, rows: ranked };
}

const TOPICS = ['weltraum', 'tiere', 'natur', 'technik', 'koerper', 'geschichte', 'kurios'];
const TONES = ['staunen', 'witzig', 'nuetzlich'];

module.exports = { choose, posts, dayRandom, MIN_DATA, EXPLORE };
if (require.main === module && process.argv[2] === 'empfehlung') {
  const thema = choose(TOPICS, p => p.topic, 'thema');
  const ton = choose(TONES, p => p.tone, 'ton');
  console.log(JSON.stringify({ thema: thema.pick, themaGrund: thema.why, ton: ton.pick, tonGrund: ton.why,
    themen: thema.rows, toene: ton.rows }, null, 2));
}
