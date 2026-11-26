# Doku-Sprecherstimme „C“ (vom Nutzer gewählt): Chatterbox Multilingual (MIT-Lizenz) mit der Klangfarbe
# der freien Thorsten-Stimme (CC0, Piper) als Vorlage in stimme/referenz.wav. Kostenlos, läuft auf der CPU.
# Jeder Satz wird nach dem Sprechen automatisch abgehört (Whisper, MIT-Lizenz): Hat die Stimme Silben dazuerfunden
# oder Wörter verschluckt, wird der Satz neu gesprochen (bis zu 5 Versuche, der beste wird genommen),
# und Geräusche nach dem letzten Wort werden abgeschnitten.
# Einmalig einrichten (ca. 5 Minuten):
#   python3 -m venv /tmp/cb && /tmp/cb/bin/pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
#   /tmp/cb/bin/pip install -q chatterbox-tts faster-whisper
# Aufruf: /tmp/cb/bin/python stimme/sprechen.py <text.txt> <ziel.wav>   (legt <ziel>.json mit den Satz-Zeiten daneben)
#   text.txt: ein Satz pro Zeile; Leerzeile = längere Pause (neuer Absatz). Zahlen ausschreiben, sehr kurze Sätze vermeiden.
import sys, os, re, json, difflib, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

TRIES, GOOD = 6, 0.95   # 0.85 ließ einzelne falsche Wörter durch („jiegt“ statt „liegt“)
src, out = sys.argv[1], sys.argv[2]
ref = os.path.join(os.path.dirname(__file__), 'referenz.wav')
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
ear = WhisperModel('small', device='cpu', compute_type='int8')
# Zahlwörter schreibt Whisper oft als Ziffern – die werden beim Vergleich ignoriert
NUM = re.compile(r'^(und|ein|eins|zwei|drei|vier|fünf|sechs|sech|sieben|sieb|acht|neun|zehn|elf|zwölf|zwan|zig|ßig|hundert|tausend|millionen?|milliarden?|komma)+$')

def words(s):
    s = s.replace(' -', '').replace('- ', '').replace('-', '')   # „Gorilla -Kostüm“ = „Gorillakostüm“
    s = re.sub(r'\bkm\b', 'kilometer', s, flags=re.I)
    return [x for x in re.findall(r'[a-zäöüß]+|\d+', s.lower()) if not x.isdigit() and not NUM.match(x)]

def check(line, wav):
    a = ta.functional.resample(wav, m.sr, 16000)[0].numpy()
    segs, _ = ear.transcribe(a, language='de', word_timestamps=True, beam_size=5)   # genauer, weniger Fehlalarme
    ws = [w for s in segs for w in (s.words or [])]
    heard = ' '.join(w.word for w in ws)
    exp, hyp = words(line), words(heard)
    score = difflib.SequenceMatcher(None, exp, hyp).ratio() if exp else 1.0
    # Wörter mit Umlaut/ß müssen genau so gehört werden (sonst z. B. „laiser“ statt „leiser“) – Wunsch des Nutzers 22.11.
    missing = [x for x in exp if re.search('[äöüß]', x) and x not in hyp]
    if missing: score = min(score, GOOD - 0.01); heard += f'   [Umlaut falsch: {", ".join(missing)}]'
    if len(hyp) > len(exp) + 1: score = min(score, GOOD - 0.01); heard += '   [Wiederholung]'
    # Ende: nicht nach Whisper-Wortzeit schneiden (beim letzten Wort oft zu früh), sondern nach dem echten Ausklingen
    x = wav[0]; fr = int(m.sr * 0.02); n = x.shape[0] // fr
    rms = x[:n * fr].reshape(n, fr).pow(2).mean(1).sqrt()
    loud = (rms > rms.max() * 0.04).nonzero()
    end = (int(loud[-1]) + 1) * fr / m.sr + 0.25 if len(loud) else wav.shape[1] / m.sr
    if ws: end = max(end, ws[-1].end + 0.45)
    return score, heard, min(end, wav.shape[1] / m.sr)

# NUR=3,10: nur diese Sätze (Zählung ab 0, ohne Leerzeilen) neu sprechen, alle anderen aus der vorhandenen Aufnahme übernehmen
NUR = {int(x) for x in os.environ.get('NUR', '').split(',') if x.strip()}
old_w = old_t = None
if NUR:
    old_w, _sr = ta.load(out); old_t = json.load(open(out.rsplit('.', 1)[0] + '.json'))
parts, times, pos, k = [], [], 0.0, -1
for line in open(src, encoding='utf-8').read().split('\n'):
    line = line.strip()
    if not line:
        parts.append(torch.zeros(1, int(m.sr * 0.5))); pos += 0.5
        continue
    k += 1
    if NUR and k not in NUR:
        o = old_t[k]; w = old_w[:, int(o['start'] * m.sr):int(o['end'] * m.sr)]
        times.append({**o, 'start': round(pos, 2), 'end': round(pos + w.shape[1] / m.sr, 2)})
        pos += w.shape[1] / m.sr + 0.45; parts += [w, torch.zeros(1, int(m.sr * 0.45))]
        continue
    best = None
    for i in range(TRIES):
        w = m.generate(line, language_id='de', audio_prompt_path=ref, exaggeration=float(os.environ.get('CB_EXAG', 0.4)), cfg_weight=float(os.environ.get('CB_CFG', 0.4)))
        score, heard, end = check(line, w)
        if not best or score > best[0]: best = (score, w, heard, end)
        if score >= GOOD: break
        print(f'  Versuch {i + 1} ({score:.2f}): „{heard.strip()}“', file=sys.stderr)
    score, w, heard, end = best
    w = w[:, :min(w.shape[1], int(end * m.sr))]  # Geräusche nach dem letzten Wort abschneiden
    if score < GOOD: print(f'WARNUNG ({score:.2f}): „{line}“ klingt wie „{heard.strip()}“', file=sys.stderr)
    times.append({'text': line, 'start': round(pos, 2), 'end': round(pos + w.shape[1] / m.sr, 2), 'score': round(score, 2)})
    pos += w.shape[1] / m.sr + 0.45
    # 15 ms ein-/ausblenden: harte Schnitte zwischen Sätzen knacken sonst hörbar (Hinweis des Nutzers 23.11.)
    f = int(m.sr * 0.015); ramp = torch.linspace(0, 1, f)
    w = w.clone(); w[:, :f] *= ramp; w[:, -f:] *= ramp.flip(0)
    parts += [w, torch.zeros(1, int(m.sr * 0.45))]
ta.save(out, torch.cat(parts, 1), m.sr)
# Zeitpunkte der Sätze für Untertitel
json.dump(times, open(out.rsplit('.', 1)[0] + '.json', 'w'), ensure_ascii=False, indent=1)
print(f'Sprechertext ({pos:.1f} s) -> {out}')
