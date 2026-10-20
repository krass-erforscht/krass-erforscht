// Baut das HTML für eine einzelne Folie (1080x1350, Instagram-Hochformat 4:5)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// **Wort** im Text wird als Textmarker dargestellt
const mark = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');

const css = `
@font-face{font-family:x}
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
.cover.photo{justify-content:flex-end;background-size:cover;background-position:30% center}
.cover.photo::before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(14,20,60,.15) 30%,rgba(14,20,60,.92) 75%)}
.cover.photo>*{position:relative}.cover.photo .meta,.cover.photo .foot,.cover.photo .credit{position:absolute}
.swipe{font-family:"DejaVu Sans Mono",monospace;font-size:36px;color:#ffe14d}
.handle{font-weight:800;font-size:96px;color:#1b2cc1}
.credit{position:absolute;bottom:56px;right:97px;font-size:24px;color:rgba(255,255,255,.7)}
`;

function slideHtml(post, slide, i, n) {
  const handle = '@krass.erforscht';
  let cls = 'slide', body = '', foot = handle, bg = '';
  if (slide.type === 'cover') {
    cls += ' cover';
    if (post.image) { cls += ' photo'; bg = ` style="background-image:url('${post.image.dataUri}')"`; }
    body = `<h2>${mark(slide.title)}</h2><span class="swipe">wischen →</span>` +
      (post.image ? `<div class="credit">Foto: ${esc(post.image.credit)}</div>` : '');
  } else if (slide.type === 'cta') {
    body = `<h2>${mark(slide.title)}</h2><span class="handle">${handle}</span><p>Speichern, teilen, folgen.</p>`;
    foot = `Quelle: ${esc(post.source.name)}`;
  } else {
    if (slide.big) body += `<span class="big">${esc(slide.big)}</span>`;
    if (slide.title) body += `<h2>${mark(slide.title)}</h2>`;
    for (const t of slide.text || []) body += `<p>${mark(t)}</p>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="${cls}"${bg}><div class="meta"><span>${esc(slide.label || post.category)}</span><span>${i + 1}/${n}</span></div>${body}<div class="foot">${foot}</div></section></body></html>`;
}
module.exports = { slideHtml };
