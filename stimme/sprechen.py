# Doku-Sprecherstimme „C“ (vom Nutzer gewählt): Chatterbox Multilingual (MIT-Lizenz) mit der Klangfarbe
# der freien Thorsten-Stimme (CC0, Piper) als Vorlage in stimme/referenz.wav. Kostenlos, läuft auf der CPU.
# Einmalig einrichten (ca. 5 Minuten):
#   python3 -m venv /tmp/cb && /tmp/cb/bin/pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
#   /tmp/cb/bin/pip install -q chatterbox-tts
# Aufruf: /tmp/cb/bin/python stimme/sprechen.py <text.txt> <ziel.wav>
#   text.txt: ein Satz pro Zeile; Leerzeile = längere Pause (neuer Absatz). Zahlen am besten ausschreiben.
import sys, os, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

src, out = sys.argv[1], sys.argv[2]
ref = os.path.join(os.path.dirname(__file__), 'referenz.wav')
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
parts = []
for line in open(src, encoding='utf-8').read().split('\n'):
    line = line.strip()
    if not line:
        parts.append(torch.zeros(1, int(m.sr * 0.5)))
        continue
    parts.append(m.generate(line, language_id='de', audio_prompt_path=ref, exaggeration=0.4, cfg_weight=0.4))
    parts.append(torch.zeros(1, int(m.sr * 0.45)))
ta.save(out, torch.cat(parts, 1), m.sr)
print(f'Sprechertext ({torch.cat(parts, 1).shape[1] / m.sr:.1f} s) -> {out}')
