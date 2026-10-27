// Kommentare unter den eigenen Posts lesen und beantworten.
//   node comments.js list                          → offene Kommentare der letzten 14 Tage als JSON
//   node comments.js reply <kommentar-id> "<text>" → Antwort veröffentlichen
//   node comments.js skip <kommentar-id>           → Kommentar bewusst nicht beantworten (Spam, Beleidigung …)
// In data/answered.json stehen nur die IDs erledigter Kommentare, keine Namen oder Texte (das Repo ist öffentlich).
const fs = require('fs');
const API = 'https://graph.instagram.com/v23.0';
const { IG_TOKEN } = process.env;
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
    const r = await get(`${p.mediaId}/comments?fields=id,text,username,timestamp,replies{username}&limit=50`);
    for (const c of r.data || []) {
      if (done.includes(c.id) || c.username === me.username) continue;
      if (c.replies?.data?.some(x => x.username === me.username)) continue; // schon von Hand beantwortet
      open.push({ id: c.id, post: p.id, postTitle: post?.slides?.[0]?.title, username: c.username, text: c.text, timestamp: c.timestamp });
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

(async () => {
  if (!IG_TOKEN) throw new Error('IG_TOKEN fehlt');
  const [cmd, id, text] = process.argv.slice(2);
  if (cmd === 'list') await list();
  else if (cmd === 'reply' && id && text) await reply(id, text);
  else if (cmd === 'skip' && id) { done.push(id); save(); console.log(`Übersprungen: ${id}`); }
  else throw new Error('Aufruf: list | reply <id> "<text>" | skip <id>');
})().catch(e => { console.error(e.message); process.exit(1); });
