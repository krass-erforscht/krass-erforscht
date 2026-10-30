// Baut das HTML für eine einzelne Folie (1080x1350, Instagram-Hochformat 4:5)
// Jede Folie bekommt ein Foto als Hintergrund: ihr eigenes ("image" in der Folie) oder sonst das Titelbild des Posts,
// dann mit wechselndem Bildausschnitt. Ohne Foto bleibt es beim Karopapier-Look mit blauer Titelfolie.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// **Wort** im Text wird als Textmarker dargestellt
const mark = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');

// Ausschnitte für wiederverwendete Fotos, damit nicht jede Folie gleich aussieht
const CROPS = ['30% center', '75% center', '50% 25%', '15% 70%', '85% 40%', '50% 80%', '40% 50%'];

const css = `
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1350px}
body{font-family:"DejaVu Sans",Arial,sans-serif;color:#141a2e}
.slide{position:relative;width:1080px;height:1350px;padding:100px 97px 150px;display:flex;flex-direction:column;justify-content:center;gap:44px;
 background-color:#f7f9fc;background-image:linear-gradient(rgba(27,44,193,.09) 2px,transparent 2px),linear-gradient(90deg,rgba(27,44,193,.09) 2px,transparent 2px);background-size:65px 65px}
.meta{position:absolute;top:54px;left:97px;right:97px;display:flex;justify-content:space-between;font-family:"DejaVu Sans Mono",monospace;font-size:32px;letter-spacing:.08em;text-transform:uppercase;color:#1b2cc1}
.foot{position:absolute;bottom:54px;left:97px;right:97px;font-family:"DejaVu Sans Mono",monospace;font-size:30px;color:#5b6380}
h2{font-weight:800;font-size:108px;line-height:1.04;margin:0;letter-spacing:-.02em}
p{font-size:62px;line-height:1.3;margin:0}
.big{font-weight:800;font-size:280px;line-height:.9;color:#1b2cc1}
.hl{background:linear-gradient(transparent 55%,#ffe14d 55%,#ffe14d 92%,transparent 92%);padding:0 .1em}
.cover{background-color:#1b2cc1;background-image:linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.07) 2px,transparent 2px);color:#fff}
.cover .meta{color:#ffe14d}.cover .foot{color:rgba(255,255,255,.75)}.cover .hl{background:none;color:#ffe14d;padding:0}
.swipe{font-family:"DejaVu Sans Mono",monospace;font-size:36px;color:#ffe14d}
.handle{font-weight:800;font-size:96px;color:#1b2cc1}
.credit{position:absolute;bottom:56px;right:97px;max-width:540px;text-align:right;font-size:24px;line-height:1.25;color:rgba(255,255,255,.75)}

/* Foto-Folien: Bild füllt die ganze Folie, ein dunkler Verlauf hält den Text lesbar */
.photo{background-size:cover;color:#fff;justify-content:flex-end}
.photo::before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(10,14,40,.12) 0%,rgba(10,14,40,.35) 35%,rgba(10,14,40,.88) 72%)}
.photo.cover::before{background:linear-gradient(rgba(10,14,40,.1) 30%,rgba(10,14,40,.9) 75%)}
.photo>*{position:relative}.photo .meta,.photo .foot,.photo .credit{position:absolute}
.photo .meta{color:#ffe14d;text-shadow:0 2px 8px rgba(0,0,0,.6)}.photo .foot{color:rgba(255,255,255,.8)}
.photo h2,.photo p{text-shadow:0 3px 18px rgba(0,0,0,.55)}
.photo .big{color:#ffe14d;text-shadow:0 4px 24px rgba(0,0,0,.5)}
.photo:not(.cover) .hl{background:#ffe14d;color:#141a2e;padding:0 .15em;box-decoration-break:clone;-webkit-box-decoration-break:clone;text-shadow:none}
.photo .handle{color:#ffe14d}
`;

function slideHtml(post, slide, i, n) {
  const handle = '@krass.erforscht';
  const img = slide.image || post.image;
  let cls = 'slide', body = '', foot = handle, style = '';
  if (img?.dataUri) {
    cls += ' photo';
    // Eigenes Foto der Folie: Ausschnitt aus "position"; Titelfolie: Ausschnitt des Titelbilds; sonst wechselnde Ausschnitte.
    // "size" vergrößert das Foto (z. B. "auto 200%"), um ein Motiv aus der unteren Hälfte nach oben zu holen.
    const own = slide.image || (slide.type === 'cover' ? post.image : null);
    const pos = own ? (own.position || 'center') : CROPS[i % CROPS.length];
    const size = own?.size ? `;background-size:${own.size}` : '';
    style = ` style="background-image:url('${img.dataUri}');background-position:${pos}${size}"`;
  }
  if (slide.type === 'cover') {
    cls += ' cover';
    body = `<h2>${mark(slide.title)}</h2><span class="swipe">wischen →</span>`;
  } else if (slide.type === 'cta') {
    body = `<h2>${mark(slide.title)}</h2><span class="handle">${handle}</span><p>Speichern, teilen, folgen.</p>`;
    foot = `Quelle: ${esc(post.source.name)}`;
  } else {
    if (slide.big) body += `<span class="big">${esc(slide.big)}</span>`;
    if (slide.title) body += `<h2>${mark(slide.title)}</h2>`;
    for (const t of slide.text || []) body += `<p>${mark(t)}</p>`;
  }
  // Bildnachweis auf jeder Foto-Folie; auf der letzten Folie steht unten links schon die Quelle
  if (img?.dataUri && slide.type !== 'cta') body += `<div class="credit">${esc(img.short || 'Foto: ' + img.credit)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="${cls}"${style}><div class="meta"><span>${esc(slide.label || post.category)}</span><span>${i + 1}/${n}</span></div>${body}<div class="foot">${foot}</div></section></body></html>`;
}
module.exports = { slideHtml };
