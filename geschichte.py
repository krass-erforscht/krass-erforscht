# Erzählte Geschichten-Videos im Stil einfacher, flacher Erklär-Animationen (Format „Geschichte“, ab 2026-11-23).
#   python3 geschichte.py geschichten/<id>/szenen.json
# Erwartet im selben Ordner: stimme.wav + stimme.json (aus stimme/sprechen.py, ein Satz pro Zeile in text.txt).
# Zeichnet alle Bilder selbst (keine fremden Motive, keine Lizenzfragen), legt Untertitel Wort für Wort darüber
# und mischt Stimme (Tempo 1,2) mit leiser, frei lizenzierter Musik.
#
# szenen.json: { "musik": "<datei>", "musikNachweis": "...", "szenen": [ { "ab": <Satznummer>, "els": [ {typ, ...}, ... ] }, ... ] }
# Jede Szene beginnt mit dem Satz „ab“ und läuft bis zur nächsten Szene. Elemente:
#   tisch, kind, erwachsene, marshmallow, tuer, zaehler, uhr, text, balken, gruppe, kreuz, haken, stifte, sticker, frage
#   gemeinsame Felder: x, y (Mitte, 1080×1920), s (Größe), rein (0–1: wann es in der Szene erscheint), nach [x, y] (Bewegung)
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, SPEED, LEAD, ZOOM = 1080, 1920, 30, 1.2, 0.15, 1.25
SUB_Y, SUB_TOP = 1660, 1560   # Untertitel-Bereich: Zeichnungen dürfen nicht unter SUB_TOP reichen
SHORT = len(sys.argv) > 2 and sys.argv[2] == 'short'   # YouTube: unten liegt die Beschreibung → alles höher und kleiner
if SHORT: ZOOM, SUB_Y, SUB_TOP = 1.0, 1300, 1235
BG, INK, WHITE = (38, 40, 43), (232, 232, 228), (255, 255, 255)
BLUE, PURPLE, ORANGE, RED, GREEN, SKIN = (90, 170, 235), (190, 110, 235), (240, 140, 60), (230, 80, 80), (90, 200, 120), (235, 200, 170)
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
font = lambda s: ImageFont.truetype(FB, int(s))
ease = lambda p: 1 - (1 - max(0, min(1, p))) ** 3

spec_path = sys.argv[1]
d = os.path.dirname(spec_path)
spec = json.load(open(spec_path))
times = json.load(open(os.path.join(d, 'stimme.json')))
for t in times: t['start'] = t['start'] / SPEED + LEAD; t['end'] = t['end'] / SPEED + LEAD
total = times[-1]['end'] + 1.6

scenes = spec['szenen']
for i, sc in enumerate(scenes):
    sc['t0'] = 0 if i == 0 else times[sc['ab']]['start'] - 0.15
for i, sc in enumerate(scenes):
    sc['t1'] = scenes[i + 1]['t0'] if i + 1 < len(scenes) else total

# ---------- Zeichen-Bausteine ----------
def kind(dr, x, y, s, e, p):
    c = tuple(e.get('farbe', ORANGE))
    dr.rounded_rectangle((x - 45 * s, y - 20 * s, x + 45 * s, y + 90 * s), 30 * s, fill=c)            # Körper
    dr.ellipse((x - 50 * s, y - 120 * s, x + 50 * s, y - 20 * s), fill=SKIN)                           # Kopf
    dr.chord((x - 52 * s, y - 125 * s, x + 52 * s, y - 50 * s), 180, 360, fill=(110, 75, 50))          # Haare
    ey = y - 70 * s
    for dx in (-18, 18): dr.ellipse((x + dx * s - 6 * s, ey - 6 * s, x + dx * s + 6 * s, ey + 6 * s), fill=(40, 40, 40))
    m = e.get('mund', 'neutral')
    if m == 'froh': dr.arc((x - 18 * s, y - 60 * s, x + 18 * s, y - 35 * s), 10, 170, fill=(60, 40, 40), width=int(4 * s))
    elif m == 'traurig': dr.arc((x - 18 * s, y - 50 * s, x + 18 * s, y - 30 * s), 190, 350, fill=(60, 40, 40), width=int(4 * s))
    else: dr.line((x - 12 * s, y - 45 * s, x + 12 * s, y - 45 * s), fill=(60, 40, 40), width=int(4 * s))

def erwachsene(dr, x, y, s, e, p):
    dr.rounded_rectangle((x - 60 * s, y - 40 * s, x + 60 * s, y + 170 * s), 25 * s, fill=WHITE)       # Kittel
    dr.line((x, y - 30 * s, x, y + 160 * s), fill=(200, 200, 200), width=int(3 * s))
    for dx in (-25, 25): dr.rectangle((x + dx * s - 10 * s, y + 170 * s, x + dx * s + 10 * s, y + 250 * s), fill=(60, 60, 70))
    dr.ellipse((x - 48 * s, y - 140 * s, x + 48 * s, y - 44 * s), fill=SKIN)
    dr.chord((x - 52 * s, y - 148 * s, x + 52 * s, y - 80 * s), 180, 360, fill=(70, 50, 40))
    for dx in (-17, 17): dr.ellipse((x + dx * s - 5 * s, y - 100 * s, x + dx * s + 5 * s, y - 90 * s), fill=(40, 40, 40))
    dr.arc((x - 15 * s, y - 85 * s, x + 15 * s, y - 62 * s), 10, 170, fill=(60, 40, 40), width=int(4 * s))
    if e.get('haende') == 'leer':
        for sx in (-1, 1): dr.ellipse((x + sx * 85 * s - 16 * s, y + 40 * s, x + sx * 85 * s + 16 * s, y + 72 * s), fill=SKIN)
        dr.line((x - 60 * s, y + 10 * s, x - 85 * s, y + 45 * s), fill=WHITE, width=int(22 * s))
        dr.line((x + 60 * s, y + 10 * s, x + 85 * s, y + 45 * s), fill=WHITE, width=int(22 * s))

def tisch(dr, x, y, s, e, p):
    w = e.get('w', 520) * s
    dr.rectangle((x - w / 2, y, x + w / 2, y + 22 * s), fill=(150, 105, 70))
    for dx in (-w / 2 + 30 * s, w / 2 - 30 * s): dr.rectangle((x + dx - 10 * s, y + 22 * s, x + dx + 10 * s, y + 220 * s), fill=(120, 85, 55))

def marshmallow(dr, x, y, s, e, p):
    n = e.get('n', 1)
    dr.ellipse((x - 90 * s, y + 18 * s, x + 90 * s, y + 46 * s), fill=(210, 210, 215))                # Teller
    for i in range(n):
        ox = (i - (n - 1) / 2) * 70 * s
        dr.rounded_rectangle((x + ox - 30 * s, y - 30 * s, x + ox + 30 * s, y + 25 * s), 18 * s, fill=(252, 250, 245), outline=(220, 215, 205), width=int(3 * s))

def tuer(dr, x, y, s, e, p):
    auf = e.get('auf', 0) * ease(p * 2)
    dr.rectangle((x - 90 * s, y - 230 * s, x + 90 * s, y + 230 * s), fill=(25, 25, 28))
    dr.polygon([(x - 90 * s, y - 230 * s), (x - 90 * s + 180 * s * (1 - auf * .7), y - 230 * s + 25 * s * auf),
                (x - 90 * s + 180 * s * (1 - auf * .7), y + 230 * s - 25 * s * auf), (x - 90 * s, y + 230 * s)], fill=(110, 80, 60))

def zaehler(dr, x, y, s, e, p):
    v = e['von'] + (e['bis'] - e['von']) * ease(p * e.get('tempo', 1.4))
    c = tuple(e.get('farbe', BLUE))
    dr.rounded_rectangle((x - 150 * s, y - 95 * s, x + 150 * s, y + 95 * s), 22 * s, fill=(28, 30, 34))
    dr.text((x, y - 50 * s), e['titel'], font=font(32 * s), fill=(200, 200, 200), anchor='mm')
    txt = (f"{v:.0f}" if e.get('fmt') != 'min' else f"{int(v)}:{int((v % 1) * 60):02d}") + e.get('einheit', '')
    dr.text((x, y + 30 * s), txt, font=font(62 * s), fill=c, anchor='mm')

def uhr(dr, x, y, s, e, p):
    r = 110 * s
    dr.ellipse((x - r, y - r, x + r, y + r), fill=(250, 250, 245), outline=(80, 80, 80), width=int(8 * s))
    m = e['von'] + (e['bis'] - e['von']) * ease(p * 1.3)
    a = math.radians(m * 6 - 90)
    dr.line((x, y, x + math.cos(a) * r * .8, y + math.sin(a) * r * .8), fill=RED, width=int(8 * s))
    dr.ellipse((x - 10 * s, y - 10 * s, x + 10 * s, y + 10 * s), fill=(40, 40, 40))

def text(dr, x, y, s, e, p):
    f = font(e.get('gr', 60) * s)
    dr.text((x, y), e['t'], font=f, fill=tuple(e.get('farbe', INK)), anchor='mm', align='center', spacing=int(e.get('gr', 60) * s * 0.35))

def balken(dr, x, y, s, e, p):
    hmax = e.get('h', 600) * s
    for i, (lab, val, col) in enumerate(e['werte']):
        bx = x + (i - (len(e['werte']) - 1) / 2) * 260 * s
        h = hmax * val / e['max'] * ease(p * 1.6 - i * 0.25)
        dr.rectangle((bx - 80 * s, y - h, bx + 80 * s, y), fill=tuple(col))
        dr.text((bx, y + 50 * s), lab, font=font(40 * s), fill=INK, anchor='mm')
        if h > 0: dr.text((bx, y - h - 45 * s), e['fmt'].format(val * min(1, ease(p * 1.6 - i * .25))), font=font(56 * s), fill=tuple(col), anchor='mm')

def gruppe(dr, x, y, s, e, p):
    n, c = e.get('n', 14), tuple(e.get('farbe', ORANGE))
    for i in range(n):
        if ease(p * 3) * n < i: break
        gx, gy = x + (i % 7 - 3) * 62 * s, y + (i // 7) * 110 * s
        dr.ellipse((gx - 22 * s, gy - 70 * s, gx + 22 * s, gy - 26 * s), fill=SKIN)
        dr.rounded_rectangle((gx - 22 * s, gy - 22 * s, gx + 22 * s, gy + 30 * s), 12 * s, fill=c)

def kreuz(dr, x, y, s, e, p):
    k = ease(p * 4) * 70 * s
    dr.line((x - k, y - k, x + k, y + k), fill=RED, width=int(18 * s)); dr.line((x - k, y + k, x + k, y - k), fill=RED, width=int(18 * s))

def haken(dr, x, y, s, e, p):
    k = ease(p * 4)
    dr.line([(x - 70 * s, y), (x - 20 * s, y + 50 * s * k), (x + 80 * s * k, y - 70 * s * k)], fill=GREEN, width=int(18 * s), joint='curve')

def stifte(dr, x, y, s, e, p):
    for i, c in enumerate([RED, BLUE, GREEN, ORANGE, PURPLE]):
        bx = x + (i - 2) * 34 * s
        dr.rectangle((bx - 12 * s, y - 90 * s, bx + 12 * s, y + 60 * s), fill=c)
        dr.polygon([(bx - 12 * s, y - 90 * s), (bx + 12 * s, y - 90 * s), (bx, y - 125 * s)], fill=SKIN)

def sticker(dr, x, y, s, e, p):
    for i, c in enumerate([ORANGE, BLUE, PURPLE]):
        cx = x + (i - 1) * 110 * s; r = 55 * s
        pts = [(cx + math.cos(math.radians(a)) * (r if a % 72 == 0 else r * .45), y + math.sin(math.radians(a)) * (r if a % 72 == 0 else r * .45)) for a in range(-90, 270, 36)]
        dr.polygon(pts, fill=c)

def frage(dr, x, y, s, e, p):
    dr.text((x, y), '?', font=font(260 * s), fill=tuple(e.get('farbe', ORANGE)), anchor='mm')

DRAW = {k: v for k, v in globals().items() if k in 'kind erwachsene tisch marshmallow tuer zaehler uhr text balken gruppe kreuz haken stifte sticker frage'.split()}

# ---------- Untertitel: 2–3 Wörter, mittig, Wort für Wort zeitlich verteilt ----------
chunks = []
for t in times:
    words = t['text'].split()
    groups, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) == 3 or w[-1] in '.,:?!': groups.append(cur); cur = []
    if cur: groups.append(cur)
    n = sum(len(g) for g in groups); pos = t['start']
    for g in groups:
        dur = (t['end'] - t['start']) * len(g) / n
        chunks.append((pos, pos + dur, ' '.join(g))); pos += dur

def subtitle(dr, now):
    for a, b, txt in chunks:
        if a <= now < b:
            f = font(74)
            dr.text((W / 2, SUB_Y), txt, font=f, fill=WHITE, anchor='mm', stroke_width=6, stroke_fill=(20, 20, 22))
            return

# ---------- Rendern ----------
out = os.path.join(d, 'bild-short.mp4' if SHORT else 'bild.mp4')
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
frames = int(total * FPS)
for fi in range(frames):
    now = fi / FPS
    sc = next(s for s in scenes if s['t0'] <= now < s['t1'] or s is scenes[-1])
    p_scene = (now - sc['t0']) / max(0.1, sc['t1'] - sc['t0'])
    im = Image.new('RGB', (W, H), tuple(sc.get('bg', BG)))
    dr = ImageDraw.Draw(im)
    for e in sc['els']:
        start = e.get('rein', 0)
        if p_scene < start: continue
        p = (p_scene - start) / max(0.05, 1 - start)
        x, y = e.get('x', W / 2), e.get('y', 900)
        if 'nach' in e: x, y = x + (e['nach'][0] - x) * ease(p * 1.5), y + (e['nach'][1] - y) * ease(p * 1.5)
        x, y = W / 2 + (x - W / 2) * ZOOM, (850 if SHORT else 950) + (y - 950) * ZOOM   # alles etwas größer, Bildmitte bleibt
        pop = ease((now - (sc['t0'] + start * (sc['t1'] - sc['t0']))) * 4)   # kurzes Hereinwachsen
        DRAW[e['typ']](dr, x, y + (1 - pop) * 30, e.get('s', 1) * ZOOM * (0.85 + 0.15 * pop), e, p)
    dr.rectangle((0, SUB_TOP, W, H), fill=tuple(sc.get('bg', BG)))
    subtitle(dr, now)
    proc.stdin.write(im.tobytes())
proc.stdin.close(); proc.wait()

# ---------- Ton ----------
# „Klare“ Stimme (Wunsch des Nutzers 23.11.): Dumpfes raus, Präsenz rein, Kompressor – wie bei Radio-/YouTube-Sprechern
KLAR = ('adeclick,highpass=f=90,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3000:t=q:w=1.5:g=3.5,'
        'acompressor=threshold=-18dB:ratio=2.5:attack=20:release=150:makeup=2,adeclick')   # sanft: schneller Kompressor erzeugte Knackser
final = os.path.join(d, 'video-short.mp4' if SHORT else 'video.mp4')
mus = spec['musik']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(d, 'stimme.wav'), '-af', f'atempo={SPEED}' + (',' + KLAR if spec.get('stimmeKlar', True) else ''), os.path.join(d, 'stimme-schnell.wav')], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-i', os.path.join(d, 'stimme-schnell.wav'), '-stream_loop', '-1', '-i', mus, '-filter_complex',
                f'[1:a]adelay={int(LEAD*1000)}|{int(LEAD*1000)},aresample=48000,pan=stereo|c0=c0|c1=c0,apad=pad_dur=3[v];'
                f'[2:a]aresample=48000,volume={spec.get("musikLautstaerke", 0.08)},afade=t=in:d=1.5,afade=t=out:st={total-2:.2f}:d=2[m];'
                f'[v][m]amix=inputs=2:duration=first:normalize=0,atrim=0:{total:.2f},loudnorm=I=-15[a]',
                '-map', '0:v', '-map', '[a]', '-t', f'{total:.2f}', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final], check=True)
print(f'Geschichte ({total:.1f} s) -> {final}')

# ---------- Für publish.js / youtube.js bereitlegen (out/<post>/video-reel.mp4 bzw. video-short.mp4) ----------
if spec.get('post'):
    import shutil
    o = os.path.join('out', spec['post']); os.makedirs(o, exist_ok=True)
    shutil.copy(final, os.path.join(o, 'video-short.mp4' if SHORT else 'video-reel.mp4'))
    json.dump({'version': 3, 'format': 'geschichte'}, open(os.path.join(o, 'video-layout.json'), 'w'))   # nicht von video-reel.js überschreiben lassen
    m = os.path.basename(spec['musik'])
    json.dump({'credit': spec['musikNachweis'], 'file': spec['musik']}, open(os.path.join(o, 'video-music.json'), 'w'), ensure_ascii=False)
    print(f'-> {o}/' + ('video-short.mp4' if SHORT else 'video-reel.mp4'))
