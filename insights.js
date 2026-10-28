// Holt die Statistiken aller veröffentlichten Posts und fasst zusammen, was am besten läuft: node insights.js
const fs = require('fs');
const API = 'https://graph.instagram.com/v23.0';
const { IG_TOKEN } = process.env;
const METRICS = ['reach', 'likes', 'comments', 'shares', 'saved', 'follows'];

(async () => {
  const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  for (const p of posted) {
    try {
      const r = await (await fetch(`${API}/${p.mediaId}/insights?metric=${METRICS.join(',')}&access_token=${IG_TOKEN}`)).json();
      if (r.error) throw new Error(r.error.message);
      p.stats = Object.fromEntries(r.data.map(m => [m.name, m.values?.[0]?.value ?? m.total_value?.value ?? 0]));
      p.statsAt = new Date().toISOString();
    } catch (e) { console.error(`${p.id}: ${e.message}`); }
  }
  fs.writeFileSync('data/posted.json', JSON.stringify(posted, null, 2));

  // Punkte pro Post: Shares und Saves zählen am meisten, weil Instagram sie am stärksten belohnt
  const score = s => s ? (s.shares * 5 + s.saved * 4 + (s.follows || 0) * 6 + s.comments * 2 + s.likes) / Math.max(s.reach, 1) * 100 : null;
  const groups = {};
  // Erst ab 30 erreichten Konten zählt ein Post, sonst verzerren einzelne Likes das Ranking
  for (const p of posted.filter(p => p.stats && p.stats.reach >= 30)) {
    const hour = new Date(p.postedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit' });
    for (const key of [`thema:${p.topic}`, `ton:${p.tone}`, `uhrzeit:${hour}`]) {
      (groups[key] ||= []).push(score(p.stats));
    }
  }
  const summary = Object.entries(groups)
    .map(([k, v]) => ({ gruppe: k, posts: v.length, punkte: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) }))
    .sort((a, b) => b.punkte - a.punkte);
  fs.writeFileSync('data/learnings.json', JSON.stringify({ aktualisiert: new Date().toISOString(), ranking: summary }, null, 2));
  console.table(summary);
})();
