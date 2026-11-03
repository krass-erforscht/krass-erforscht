// Wählt das Format für den heutigen Post: node format.js <ja|nein>   (ja = ein passendes echtes Video wurde gefunden)
// Formate: bilder (Karussell mit Fotos + Folien-Reel), video (echtes Video als Reel im Feed),
//          zusammen (Karussell mit dem Video als zweiter Folie + Folien-Reel).
// Richtet sich nach der besten bisherigen Reichweite, mit gelegentlichen Tests anderer Formate (siehe choose.js).
const { choose } = require('./choose');
if (process.argv[2] !== 'ja') { console.log('bilder'); process.exit(0); }
const { pick, why, rows } = choose(['bilder', 'video', 'zusammen'], p => p.format || 'bilder', 'format');
console.log(pick);
console.error(`(${why}: ${rows.map(r => `${r.option} ${r.reichweite} Konten aus ${r.posts} Posts`).join(', ')})`);
