// Sucht frei nutzbare Fotos (NASA und Wikimedia Commons): node find-image.js "suchbegriff" <post-id>
// Lädt bis zu 4 Kandidaten nach images/candidates/<post-id>-<n>.jpg und gibt Bildnachweis + Lizenz als JSON aus.
// Danach den passenden Kandidaten ansehen, auswählen und in die Post-Datei unter "image" eintragen.
const fs = require('fs');
const UA = { 'User-Agent': 'krass-erforscht/0.1 (Instagram-Wissensseite; https://github.com)' };
const FREE = /^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)/i;

async function nasa(q, max) {
  const out = [];
  const r = await (await fetch(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(q)}`, { headers: UA })).json();
  for (const item of r.collection?.items?.slice(0, 10) || []) {
    if (out.length >= max) break;
    const d = item.data?.[0];
    if (!d || /copyright|©/i.test(JSON.stringify(d))) continue; // Bilder mit fremdem Copyright überspringen
    const assets = await (await fetch(item.href, { headers: UA })).json();
    const url = assets.find(u => /~(large|medium)\.jpg$/i.test(u)) || assets.find(u => /~orig\.jpg$/i.test(u));
    if (url) out.push({ url: url.replace('http://', 'https://'), title: d.title, credit: `NASA${d.center ? '/' + d.center : ''}`, license: 'Public Domain (NASA)', page: `https://images.nasa.gov/details/${d.nasa_id}` });
  }
  return out;
}

async function commons(q, max) {
  const out = [];
  const api = 'https://commons.wikimedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=6&gsrlimit=10' +
    '&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1600&gsrsearch=' + encodeURIComponent(q + ' filetype:bitmap');
  const r = await (await fetch(api, { headers: UA })).json();
  for (const p of Object.values(r.query?.pages || {}).sort((a, b) => a.index - b.index)) {
    const ii = p.imageinfo?.[0], m = ii?.extmetadata || {};
    const lic = m.LicenseShortName?.value || '';
    if (out.length >= max) break;
    if (ii?.mime !== 'image/jpeg' || !FREE.test(lic)) continue;
    const artist = (m.Artist?.value || 'Unbekannt').replace(/<[^>]+>/g, '').trim().slice(0, 60);
    out.push({ url: ii.thumburl || ii.url, title: p.title, credit: `${artist} / Wikimedia Commons`, license: lic, page: ii.descriptionurl });
  }
  return out;
}

(async () => {
  const [q, id] = process.argv.slice(2);
  const found = [];
  for (const src of [nasa, commons]) {
    try { found.push(...await src(q, 2)); } catch (e) { console.error(`${src.name}: ${e.message}`); }
  }
  fs.mkdirSync('images/candidates', { recursive: true });
  const result = [];
  for (const [n, img] of found.entries()) {
    const file = `images/candidates/${id}-${n + 1}.jpg`;
    try {
      const res = await fetch(img.url, { headers: UA });
      if (!res.ok || !/^image\//.test(res.headers.get('content-type') || '')) throw new Error(res.status);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      result.push({ file, ...img });
    } catch (e) { console.error(`Download fehlgeschlagen: ${img.url}`); }
  }
  console.log(JSON.stringify(result, null, 2));
})();
