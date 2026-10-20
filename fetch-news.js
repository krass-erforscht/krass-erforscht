// Sammelt aktuelle Meldungen aus Wissenschafts-Feeds: node fetch-news.js > data/candidates.json
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

const FEEDS = [
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/top/science.xml' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/strange_offbeat.xml' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/space_time.xml' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/plants_animals.xml' },
  { name: 'scinexx', url: 'https://www.scinexx.de/feed/' },
  { name: 'Spektrum.de', url: 'https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996406' },
];
const MAX_AGE_DAYS = 4;

const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const parser = new XMLParser({ ignoreAttributes: true });
  const seen = new Set(fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')).map(p => p.sourceUrl) : []);
  const items = [];
  for (const feed of FEEDS) {
    try {
      const xml = await (await fetch(feed.url, { headers: { 'User-Agent': 'krass-erforscht/0.1' } })).text();
      const list = [].concat(parser.parse(xml)?.rss?.channel?.item || []);
      for (const it of list) {
        const date = new Date(it.pubDate || it['dc:date'] || Date.now());
        if (Date.now() - date > MAX_AGE_DAYS * 864e5 || seen.has(it.link)) continue;
        items.push({ source: feed.name, title: strip(it.title), summary: strip(it.description).slice(0, 600), url: it.link, date: date.toISOString() });
      }
    } catch (e) { console.error(`Feed fehlgeschlagen: ${feed.url} (${e.message})`); }
  }
  const unique = [...new Map(items.map(i => [i.url, i])).values()].sort((a, b) => b.date.localeCompare(a.date));
  console.log(JSON.stringify(unique, null, 2));
})();
