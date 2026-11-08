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

TRIES, GOOD = 5, 0.9
src, out = sys.argv[1], sys.argv[2]
ref = os.path.join(os.path.dirname(__file__), 'referenz.wav')
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
ear = WhisperModel('small', device='cpu', compute_type='int8')
# Zahlwörter schreibt Whisper oft als Ziffern – die werden beim Vergleich ignoriert
NUM = re.compile(r'(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zig|ßig|hundert|tausend|million|milliard)', re.I)

def words(s, expected=False):
    w = re.findall(r'[a-zäöüß]+|\d+', s.lower())
    return [x for x in w if not x.isdigit() and not (expected and NUM.search(x))]

def check(line, wav):
    a = ta.functional.resample(wav, m.sr, 16000)[0].numpy()
    segs, _ = ear.transcribe(a, language='de', word_timestamps=True)
    ws = [w for s in segs for w in (s.words or [])]
    heard = ' '.join(w.word for w in ws)
    exp, hyp = words(line, True), [x for x in words(heard) if not NUM.search(x) or x in exp]
    score = difflib.SequenceMatcher(None, exp, hyp).ratio() if exp else 1.0
    end = ws[-1].end + 0.2 if ws else wav.shape[1] / m.sr
    return score, heard, end

parts, times, pos = [], [], 0.0
for line in open(src, encoding='utf-8').read().split('\n'):
    line = line.strip()
    if not line:
        parts.append(torch.zeros(1, int(m.sr * 0.5))); pos += 0.5
        continue
    best = None
    for i in range(TRIES):
        w = m.generate(line, language_id='de', audio_prompt_path=ref, exaggeration=0.4, cfg_weight=0.4)
        score, heard, end = check(line, w)
        if not best or score > best[0]: best = (score, w, heard, end)
        if score >= GOOD: break
        print(f'  Versuch {i + 1} ({score:.2f}): „{heard.strip()}“', file=sys.stderr)
    score, w, heard, end = best
    w = w[:, :min(w.shape[1], int(end * m.sr))]  # Geräusche nach dem letzten Wort abschneiden
    if score < GOOD: print(f'WARNUNG ({score:.2f}): „{line}“ klingt wie „{heard.strip()}“', file=sys.stderr)
    times.append({'text': line, 'start': round(pos, 2), 'end': round(pos + w.shape[1] / m.sr, 2), 'score': round(score, 2)})
    pos += w.shape[1] / m.sr + 0.45
    parts += [w, torch.zeros(1, int(m.sr * 0.45))]
ta.save(out, torch.cat(parts, 1), m.sr)
# Zeitpunkte der Sätze für Untertitel
json.dump(times, open(out.rsplit('.', 1)[0] + '.json', 'w'), ensure_ascii=False, indent=1)
print(f'Sprechertext ({pos:.1f} s) -> {out}')
