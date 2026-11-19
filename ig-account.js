// Sicherheitsprüfung: Gehört IG_TOKEN wirklich zu @krass.erforscht?
// Hintergrund (2026-11-19): In der Umgebung stand plötzlich der Token eines anderen Kontos (tagesbild.kompakt).
// Ohne diese Prüfung wäre der nächste Post auf dem falschen Konto gelandet.
const EXPECTED = 'krass.erforscht';
async function assertAccount(token = process.env.KRASS_IG_TOKEN || process.env.IG_TOKEN) {
  const r = await (await fetch(`https://graph.instagram.com/v23.0/me?fields=username&access_token=${token}`)).json();
  if (r.error) throw new Error(`Instagram-Token ungültig: ${r.error.message}`);
  if (r.username !== EXPECTED) throw new Error(`IG_TOKEN gehört zu @${r.username}, nicht zu @${EXPECTED} – abgebrochen, nichts gepostet`);
}
module.exports = { assertAccount };
