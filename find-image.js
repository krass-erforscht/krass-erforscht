// Sucht frei nutzbare Fotos in mehreren Quellen:
//   node find-image.js "<englischer Suchbegriff>" <post-id> [--taxon "<wissenschaftlicher Name>"]
// Quellen: iNaturalist (Tiere, Pflanzen, Pilze), GBIF (Museums- und Forschungsfotos), NASA, Wikimedia Commons.
// Lädt bis zu 8 Kandidaten nach images/candidates/<post-id>-<n>.jpg und gibt Bildnachweis + Lizenz als JSON aus.
// Danach jeden Kandidaten ansehen, den passendsten auswählen und in die Post-Datei unter "image" eintragen.
// Erlaubt sind nur Lizenzen ohne Einschränkung auf nicht-kommerzielle Nutzung: Public Domain, CC0, CC BY, CC BY-SA.
const fs = require('fs');
const UA = { 'User-Agent': 'krass-erforscht/0.2 (Instagram-Wissensseite; https://github.com/krass-erforscht/krass-erforscht)' };
const FREE_INAT = new Set(['cc0', 'cc-by', 'cc-by-sa']);
const FREE_TEXT = /^(public domain|pd|cc0|cc by(-sa)? [0-9.]+)/i;
const FREE_URL = /creativecommons\.org\/(publicdomain|licenses\/by\/|licenses\/by-sa\/)/i;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Holt JSON und wartet bei Überlastung (429) kurz, bevor es erneut versucht
async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429 || res.status === 503) { await sleep(3000 * (i + 1)); continue; }
    return res.json();
  }
  throw new Error(`zu viele Anfragen: ${new URL(url).host}`);
}

async function inaturalist(q, taxon, max) {
  const params = new URLSearchParams({ photo_license: 'cc0,cc-by,cc-by-sa', quality_grade: 'research', per_page: '15', order_by: 'votes', photos: 'true' });
  if (taxon) params.set('taxon_name', taxon); else params.set('q', q);
  const r = await getJson(`https://api.inaturalist.org/v1/observations?${params}`);
  const out = [];
  for (const o of r.results || []) {
    const p = o.photos?.find(p => FREE_INAT.has(p.license_code));
    if (!p) continue;
    out.push({
      url: p.url.replace('/square.', '/large.'), title: o.taxon?.name, credit: `${o.user?.name || o.user?.login} / iNaturalist`,
      license: p.license_code.toUpperCase().replace('CC-', 'CC '), page: `https://www.inaturalist.org/observations/${o.id}`,
    });
    if (out.length >= max) break;
  }
  return out;
}

async function gbif(q, taxon, max) {
  if (!taxon) return [];
  const r = await getJson(`https://api.gbif.org/v1/occurrence/search?mediaType=StillImage&limit=40&scientificName=${encodeURIComponent(taxon)}`);
  const out = [];
  for (const o of r.results || []) {
    const m = o.media?.find(m => m.identifier && FREE_URL.test(m.license || ''));
    if (!m || /inaturalist/.test(m.identifier)) continue; // iNaturalist-Fotos kommen schon aus der eigenen Quelle
    out.push({ url: m.identifier, title: o.scientificName, credit: `${m.rightsHolder || m.creator || o.institutionCode || 'GBIF'} / GBIF`, license: m.license, page: `https://www.gbif.org/occurrence/${o.key}` });
    if (out.length >= max) break;
  }
  return out;
}

async function nasa(q, taxon, max) {
  const r = await getJson(`https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(q)}`);
  const out = [];
  for (const item of r.collection?.items?.slice(0, 15) || []) {
    if (out.length >= max) break;
    const d = item.data?.[0];
    if (!d || /copyright|©/i.test(JSON.stringify(d))) continue; // Bilder mit fremdem Copyright überspringen
    const assets = await getJson(item.href);
    const url = assets.find(u => /~(large|medium)\.jpg$/i.test(u)) || assets.find(u => /~orig\.jpg$/i.test(u));
    if (url) out.push({ url: url.replace('http://', 'https://'), title: d.title, credit: `NASA${d.center ? '/' + d.center : ''}`, license: 'Public Domain (NASA)', page: `https://images.nasa.gov/details/${d.nasa_id}` });
  }
  return out;
}

async function commons(q, taxon, max) {
  const api = 'https://commons.wikimedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=6&gsrlimit=15' +
    '&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1600&gsrsearch=' + encodeURIComponent((taxon || q) + ' filetype:bitmap');
  const r = await getJson(api);
  const out = [];
  for (const p of Object.values(r.query?.pages || {}).sort((a, b) => a.index - b.index)) {
    if (out.length >= max) break;
    const ii = p.imageinfo?.[0], m = ii?.extmetadata || {};
    const lic = m.LicenseShortName?.value || '';
    if (ii?.mime !== 'image/jpeg' || !FREE_TEXT.test(lic)) continue;
    const artist = (m.Artist?.value || 'Unbekannt').replace(/<[^>]+>/g, '').trim().slice(0, 60);
    out.push({ url: ii.thumburl || ii.url, title: p.title, credit: `${artist} / Wikimedia Commons`, license: lic, page: ii.descriptionurl });
  }
  return out;
}

(async () => {
  const args = process.argv.slice(2);
  const ti = args.indexOf('--taxon');
  const taxon = ti >= 0 ? args.splice(ti, 2)[1] : null;
  const [q, id] = args;
  // Mit wissenschaftlichem Namen zuerst die Naturdatenbanken, sonst zuerst NASA und Wikimedia
  const sources = taxon ? [[inaturalist, 3], [gbif, 2], [commons, 2], [nasa, 1]] : [[nasa, 3], [commons, 3], [inaturalist, 2]];
  const found = [];
  for (const [src, max] of sources) {
    try { found.push(...await src(q, taxon, max)); } catch (e) { console.error(`${src.name}: ${e.message}`); }
  }
  fs.mkdirSync('images/candidates', { recursive: true });
  const result = [];
  for (const img of found) {
    const file = `images/candidates/${id}-${result.length + 1}.jpg`;
    try {
      const res = await fetch(img.url, { headers: UA });
      if (!res.ok || !/^image\//.test(res.headers.get('content-type') || '')) throw new Error(res.status);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      result.push({ file, ...img });
    } catch (e) { console.error(`Download fehlgeschlagen: ${img.url}`); }
  }
  console.log(JSON.stringify(result, null, 2));
})();
