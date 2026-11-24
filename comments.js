// Kommentare unter den eigenen Posts lesen und beantworten.
//   node comments.js list                          → offene Kommentare der letzten 14 Tage als JSON
//   node comments.js reply <kommentar-id> "<text>" → Antwort veröffentlichen
//   node comments.js skip <kommentar-id>           → Kommentar bewusst nicht beantworten (Spam, Beleidigung …)
// In data/answered.json stehen nur die IDs erledigter Kommentare, keine Namen oder Texte (das Repo ist öffentlich).
const fs = require('fs');
const API = 'https://graph.instagram.com/v23.0';
const IG_TOKEN = process.env.KRASS_IG_TOKEN || process.env.IG_TOKEN;
const FILE = 'data/answered.json';
const MAX_AGE_DAYS = 14;

const done = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
const save = () => fs.writeFileSync(FILE, JSON.stringify(done, null, 2));

async function get(path) {
  const r = await (await fetch(`${API}/${path}${path.includes('?') ? '&' : '?'}access_token=${IG_TOKEN}`)).json();
  if (r.error) throw new Error(r.error.message);
  return r;
}

async function list() {
  const me = await get('me?fields=username');
  const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  const recent = posted.filter(p => Date.now() - new Date(p.postedAt) < MAX_AGE_DAYS * 864e5);
  const open = [];
  for (const p of recent) {
    const post = fs.existsSync(`posts/${p.id}.json`) ? JSON.parse(fs.readFileSync(`posts/${p.id}.json`)) : null;
    for (const [format, mediaId] of [['Karussell', p.mediaId], ['Reel', p.reelMediaId]]) {
      if (!mediaId) continue;
      // Gelöschte Posts (z. B. vom Nutzer entfernt) dürfen den ganzen Lauf nicht abbrechen
      let r;
      try { r = await get(`${mediaId}/comments?fields=id,text,username,timestamp,replies{username}&limit=50`); }
      catch (e) { console.error(`${p.id} (${format}) übersprungen: ${e.message.slice(0, 80)}`); continue; }
      for (const c of r.data || []) {
        if (done.includes(c.id) || c.username === me.username) continue;
        if (c.replies?.data?.some(x => x.username === me.username)) continue; // schon von Hand beantwortet
        open.push({ id: c.id, post: p.id, format, postTitle: post?.slides?.[0]?.title, username: c.username, text: c.text, timestamp: c.timestamp });
      }
    }
  }
  console.log(JSON.stringify(open, null, 2));
}

async function reply(id, text) {
  const res = await fetch(`${API}/${id}/replies`, { method: 'POST', body: new URLSearchParams({ message: text, access_token: IG_TOKEN }) });
  const r = await res.json();
  if (r.error) throw new Error(r.error.message);
  done.push(id); save();
  console.log(`Beantwortet: ${id}`);
}

// „Kommentiere QUELLE“: Wer nur das Stichwort kommentiert, bekommt die Originalquelle per Direktnachricht (private reply)
// und eine kurze öffentliche Antwort. Läuft bei jedem Lauf vor `list` (Wunsch des Nutzers 24.11.).
const KEYWORD = /^\W*quelle\W*$/i;
async function stichwort() {
  const me = await get('me?fields=username');
  const posted = fs.existsSync('data/posted.json') ? JSON.parse(fs.readFileSync('data/posted.json')) : [];
  let n = 0;
  for (const p of posted.filter(p => Date.now() - new Date(p.postedAt) < 7 * 864e5)) {   // Direktantwort nur 7 Tage möglich
    const post = fs.existsSync(`posts/${p.id}.json`) ? JSON.parse(fs.readFileSync(`posts/${p.id}.json`)) : null;
    if (!post?.source?.url) continue;
    for (const mediaId of [p.mediaId, p.reelMediaId].filter(Boolean)) {
      let r; try { r = await get(`${mediaId}/comments?fields=id,text,username&limit=50`); } catch { continue; }
      for (const c of r.data || []) {
        if (done.includes(c.id) || c.username === me.username || !KEYWORD.test(c.text || '')) continue;
        const msg = `Hi! Hier ist die Quelle zu deinem Kommentar 🔬\n${post.source.name}\n${post.source.url}\n\nDanke fürs Mitlesen – mehr verrückte Fakten jeden Tag bei @krass.erforscht!`;
        const dm = await (await fetch(`${API}/me/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: { comment_id: c.id }, message: { text: msg }, access_token: IG_TOKEN }) })).json();
        if (dm.error) { console.error(`DM an @${c.username} fehlgeschlagen: ${dm.error.message}`); continue; }
        await fetch(`${API}/${c.id}/replies`, { method: 'POST', body: new URLSearchParams({ message: `@${c.username} Ist unterwegs – schau in deine Nachrichten 📩`, access_token: IG_TOKEN }) });
        done.push(c.id); save(); n++;
        console.log(`Quelle per DM an @${c.username} (${p.id})`);
      }
    }
  }
  console.log(`${n} Stichwort-Kommentare beantwortet`);
}

(async () => {
  if (!IG_TOKEN) throw new Error('IG_TOKEN fehlt');
  await require('./ig-account').assertAccount(IG_TOKEN);
  const [cmd, id, text] = process.argv.slice(2);
  if (cmd === 'stichwort') await stichwort();
  else if (cmd === 'list') await list();
  else if (cmd === 'reply' && id && text) await reply(id, text);
  else if (cmd === 'skip' && id) { done.push(id); save(); console.log(`Übersprungen: ${id}`); }
  else throw new Error('Aufruf: stichwort | list | reply <id> "<text>" | skip <id>');
})().catch(e => { console.error(e.message); process.exit(1); });
