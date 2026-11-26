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
import numpy as np, random
ROOT = os.path.dirname(os.path.abspath(__file__))

spec_path = sys.argv[1]
d = os.path.dirname(spec_path)
spec = json.load(open(spec_path))
times = json.load(open(os.path.join(d, 'stimme.json')))
for t in times: t['start'] = t['start'] / SPEED + LEAD; t['end'] = t['end'] / SPEED + LEAD
total = times[-1]['end'] + 1.6

scenes = spec['szenen']
HELL = spec.get('thema') == 'hell'          # helles Papier-Design (für die Open-Peeps-Figuren, ab 24.11.)
if HELL: BG, INK = (244, 239, 230), (38, 38, 44)
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
    bw = max(150 * s, dr.textlength(e['titel'], font=font(32 * s)) / 2 + 30 * s)
    dr.rounded_rectangle((x - bw, y - 95 * s, x + bw, y + 95 * s), 22 * s, fill=(28, 30, 34))
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

JAM = [(200, 40, 60), (240, 140, 60), (150, 60, 160), (230, 190, 60), (90, 160, 80), (120, 40, 40)]
def glaeser(dr, x, y, s, e, p):
    """Marmeladengläser: n Stück in Reihen (spalten), erscheinen nacheinander. Unterkante bei y."""
    n, sp = e.get('n', 6), e.get('spalten', 6)
    shown = int(n * min(1, ease(p * 3)) + 0.999)
    for i in range(shown):
        r, c = divmod(i, sp); gx = x + (c - (sp - 1) / 2) * 78 * s; gy = y - r * 110 * s
        col = JAM[i % len(JAM)]
        dr.rounded_rectangle((gx - 28 * s, gy - 80 * s, gx + 28 * s, gy), 10 * s, fill=col, outline=(40, 40, 44), width=int(4 * s))
        dr.rectangle((gx - 31 * s, gy - 98 * s, gx + 31 * s, gy - 80 * s), fill=(240, 235, 225), outline=(40, 40, 44), width=int(4 * s))
        dr.rectangle((gx - 18 * s, gy - 58 * s, gx + 18 * s, gy - 30 * s), fill=(250, 248, 240))

def bildschirm(dr, x, y, s, e, p):
    """Fernseher mit vielen Kacheln (Streaming-Auswahl), Kacheln laufen langsam durch."""
    w, h = 520 * s, 320 * s
    dr.rounded_rectangle((x - w / 2 - 16 * s, y - h / 2 - 16 * s, x + w / 2 + 16 * s, y + h / 2 + 16 * s), 18 * s, fill=(40, 40, 44))
    dr.rectangle((x - w / 2, y - h / 2, x + w / 2, y + h / 2), fill=(25, 28, 40))
    off = (p * 300 * s) % (110 * s)
    for r in range(3):
        for c in range(6):
            tx = x - w / 2 + 15 * s + c * 110 * s - off; ty = y - h / 2 + 20 * s + r * 100 * s
            if tx + 95 * s < x - w / 2 or tx > x + w / 2: continue
            col = JAM[(r * 6 + c) % len(JAM)]
            dr.rectangle((max(tx, x - w / 2), ty, min(tx + 95 * s, x + w / 2), ty + 80 * s), fill=col)
    dr.rectangle((x - 60 * s, y + h / 2 + 16 * s, x + 60 * s, y + h / 2 + 40 * s), fill=(40, 40, 44))

def kasse(dr, x, y, s, e, p):
    """Kasse (Unterkante bei y)."""
    dr.rounded_rectangle((x - 150 * s, y - 120 * s, x + 150 * s, y), 16 * s, fill=(90, 95, 110), outline=(40, 40, 44), width=int(5 * s))
    dr.rounded_rectangle((x - 110 * s, y - 230 * s, x + 110 * s, y - 130 * s), 12 * s, fill=(60, 64, 78), outline=(40, 40, 44), width=int(5 * s))
    dr.rectangle((x - 90 * s, y - 215 * s, x + 90 * s, y - 150 * s), fill=(140, 220, 160))
    dr.text((x, y - 183 * s), e.get('t', '1,99 €'), font=font(44 * s), fill=(30, 60, 40), anchor='mm')

def ball(dr, x, y, s, e, p):
    """Basketball; mit bahn [[x,y],…] fliegt er zwischen den Punkten hin und her (Bogen)."""
    pts = e.get('bahn')
    if pts:
        seg = p * e.get('paesse', 6); i = int(seg) % (len(pts) - 1 if len(pts) > 1 else 1); f = seg % 1
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        x = W / 2 + ((ax + (bx - ax) * f) - W / 2) * ZOOM; y = (850 if SHORT else 950) + ((ay + (by - ay) * f - math.sin(f * math.pi) * 120) - 950) * ZOOM
    r = 34 * s
    dr.ellipse((x - r, y - r, x + r, y + r), fill=(235, 130, 40), outline=(40, 40, 44), width=int(4 * s))
    dr.line((x - r, y, x + r, y), fill=(40, 40, 44), width=int(3 * s)); dr.line((x, y - r, x, y + r), fill=(40, 40, 44), width=int(3 * s))
    dr.arc((x - r * 1.6, y - r, x - r * 0.2, y + r), -60, 60, fill=(40, 40, 44), width=int(3 * s))
    dr.arc((x + r * 0.2, y - r, x + r * 1.6, y + r), 120, 240, fill=(40, 40, 44), width=int(3 * s))

def gorilla(dr, x, y, s, e, p):
    """Gorilla(kostüm), Füße bei (x, y); trommeln=true → Fäuste trommeln vor der Brust."""
    D, D2, F = (52, 52, 58), (38, 38, 44), (150, 135, 125)
    o = (40, 40, 44)
    # Beine (kurz, kräftig)
    for sx in (-1, 1): dr.rounded_rectangle((x + sx * 70 * s - 38 * s, y - 200 * s, x + sx * 70 * s + 38 * s, y), 30 * s, fill=D2)
    # Rumpf: breite Schultern, schmalere Hüfte
    dr.polygon([(x - 170 * s, y - 470 * s), (x + 170 * s, y - 470 * s), (x + 110 * s, y - 170 * s), (x - 110 * s, y - 170 * s)], fill=D)
    dr.ellipse((x - 175 * s, y - 520 * s, x + 175 * s, y - 400 * s), fill=D)
    dr.ellipse((x - 80 * s, y - 420 * s, x + 80 * s, y - 250 * s), fill=(80, 78, 84))   # Brust
    # Kopf
    dr.ellipse((x - 80 * s, y - 650 * s, x + 80 * s, y - 490 * s), fill=D)
    dr.ellipse((x - 58 * s, y - 600 * s, x + 58 * s, y - 505 * s), fill=F)
    dr.rounded_rectangle((x - 60 * s, y - 612 * s, x + 60 * s, y - 590 * s), 10 * s, fill=D2)   # Stirnwulst
    for dx in (-24, 24): dr.ellipse((x + dx * s - 9 * s, y - 588 * s, x + dx * s + 9 * s, y - 570 * s), fill=(20, 20, 20))
    dr.ellipse((x - 22 * s, y - 560 * s, x + 22 * s, y - 535 * s), fill=(95, 82, 78))
    dr.arc((x - 20 * s, y - 545 * s, x + 20 * s, y - 520 * s), 20, 160, fill=(40, 30, 30), width=int(4 * s))
    # Arme
    if e.get('trommeln'):
        hop = math.sin(NOW * 20) * 22 * s
        for sx in (-1, 1):
            hx, hy = x + sx * 45 * s, y - 360 * s + sx * hop
            dr.line([(x + sx * 160 * s, y - 470 * s), (x + sx * 175 * s, y - 330 * s), (hx, hy)], fill=D, width=int(62 * s), joint='curve')
            dr.ellipse((hx - 38 * s, hy - 34 * s, hx + 38 * s, hy + 34 * s), fill=D2, outline=o, width=int(3 * s))
    else:
        sw = math.sin(NOW * 6) * 12 * s if e.get('nach') else 0
        for sx in (-1, 1):
            hx, hy = x + sx * 195 * s + sx * sw, y - 150 * s
            dr.line([(x + sx * 160 * s, y - 470 * s), (x + sx * 200 * s, y - 300 * s), (hx, hy)], fill=D, width=int(62 * s), joint='curve')
            dr.ellipse((hx - 38 * s, hy - 32 * s, hx + 38 * s, hy + 32 * s), fill=D2, outline=o, width=int(3 * s))

def handy(dr, x, y, s, e, p):
    """Smartphone mit leuchtendem Bildschirm (Mitte x, y)."""
    dr.rounded_rectangle((x - 95 * s, y - 180 * s, x + 95 * s, y + 180 * s), 26 * s, fill=(40, 40, 44))
    dr.rounded_rectangle((x - 80 * s, y - 155 * s, x + 80 * s, y + 150 * s), 14 * s, fill=(110, 180, 245))
    for i in range(4): dr.rounded_rectangle((x - 60 * s, y - 130 * s + i * 70 * s, x + 60 * s, y - 80 * s + i * 70 * s), 8 * s, fill=(240, 245, 250))

# Open-Peeps-Figur (assets/figuren/<name>-<gesicht>.png, CC0): Füße bei (x, y), Höhe h; spricht=true → Mund bewegt sich,
# solange die Stimme spricht; blinzelt alle paar Sekunden. gesicht: neutral | froh | traurig | staunen; spiegeln=true
FIG = {}
def fig_img(name, mood, h, flip):
    key = (name, mood, int(h), flip)
    if key not in FIG:
        im = Image.open(os.path.join(ROOT, 'assets/figuren', f'{name}-{mood}.png')).convert('RGBA')
        im = im.crop(im.getbbox()); im = im.resize((max(1, int(im.width * h / im.height)), int(h)), Image.LANCZOS)
        FIG[key] = im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
    return FIG[key]
def speaking(now): return any(t['start'] <= now < t['end'] for t in times)
def figur(dr, x, y, s, e, p):
    mood = e.get('gesicht', 'neutral'); now = NOW
    seed = hash(e.get('name', '')) % 97
    if e.get('spricht') and speaking(now) and int(now * 7 + seed) % 2: mood = 'spricht'
    elif (now + seed * 0.37) % 3.3 < 0.12: mood = 'zu'
    im = fig_img(e['name'], mood, e.get('h', 700) * s, e.get('spiegeln', False))
    CANVAS.paste(im, (int(x - im.width / 2), int(y - im.height)), im)

DRAW = {k: v for k, v in globals().items() if k in 'kind erwachsene tisch marshmallow tuer zaehler uhr text balken gruppe kreuz haken stifte sticker frage figur glaeser bildschirm kasse ball gorilla handy'.split()}

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
            size = 74
            while size > 40 and dr.textlength(txt, font=font(size)) > W - 80: size -= 4
            f = font(size)
            dr.text((W / 2, SUB_Y), txt, font=f, fill=(30, 30, 34) if HELL else WHITE, anchor='mm', stroke_width=6, stroke_fill=WHITE if HELL else (20, 20, 22))
            return

# ---------- Rendern ----------
out = os.path.join(d, 'bild-short.mp4' if SHORT else 'bild.mp4')
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
frames = int(total * FPS)
prev_last, cur_scene, last_im = None, None, None
for fi in range(frames):
    now = fi / FPS; NOW = now
    sc = next(s for s in scenes if s['t0'] <= now < s['t1'] or s is scenes[-1])
    if sc is not cur_scene: prev_last, cur_scene = last_im, sc
    p_scene = (now - sc['t0']) / max(0.1, sc['t1'] - sc['t0'])
    im = Image.new('RGB', (W, H), tuple(sc.get('bg', BG)))
    CANVAS = im
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
    # langsamer Kamera-Zoom (bis 5 %) in jeder Szene – wirkt lebendiger als ein starres Bild
    z = 1 + 0.05 * ease(p_scene)
    if z > 1.001:
        cw, ch = W / z, SUB_TOP / z; cx, cy = W / 2, SUB_TOP * 0.5
        im.paste(im.crop((int(cx - cw / 2), int(cy - ch / 2), int(cx + cw / 2), int(cy + ch / 2))).resize((W, SUB_TOP), Image.BILINEAR), (0, 0))
    # weiche Überblendung in den ersten 0,25 s einer neuen Szene
    if prev_last is not None and now - sc['t0'] < 0.25:
        im = Image.blend(prev_last, im, (now - sc['t0']) / 0.25); dr = ImageDraw.Draw(im)
    last_im = im.copy()
    # Einstiegsfrage groß in der ersten Sekunde (Hook)
    if spec.get('hook') and now < 2.2:
        a = ease(now * 4); hy = 260 if not SHORT else 200
        dr.text((W / 2, hy + (1 - a) * 40), spec['hook'], font=font(76), fill=(30, 30, 34) if HELL else WHITE, anchor='mm', align='center',
                spacing=20, stroke_width=8, stroke_fill=WHITE if HELL else (20, 20, 22))
    dr.rectangle((0, SUB_TOP, W, H), fill=tuple(sc.get('bg', BG)))
    subtitle(dr, now)
    proc.stdin.write(im.tobytes())
proc.stdin.close(); proc.wait()

# ---------- Ton ----------
# „Klare“ Stimme (Wunsch des Nutzers 23.11.): Dumpfes raus, Präsenz rein, Kompressor – wie bei Radio-/YouTube-Sprechern
KLAR = ('adeclick,highpass=f=90,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3000:t=q:w=1.5:g=3.5,'
        'acompressor=threshold=-18dB:ratio=2.5:attack=20:release=150:makeup=2,adeclick')   # sanft: schneller Kompressor erzeugte Knackser
final = os.path.join(d, 'video-short.mp4' if SHORT else 'video.mp4')
# Soundeffekte (selbst erzeugt, assets/sfx): Wusch beim Szenenwechsel, Plopp beim Erscheinen, Ticken bei Zählern/Uhren,
# Ding beim Haken, Brummen beim Kreuz – leise unter der Stimme
def sfx(name):
    import wave
    w = wave.open(os.path.join(ROOT, 'assets/sfx', name + '.wav'))
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, w.getnchannels()).mean(1)
SR = 48000; track = np.zeros(int((total + 2) * SR), np.float32); last_pop = -1
def put(name, t, vol):
    a = sfx(name) * vol; i = int(t * SR); track[i:i + len(a)] += a[:max(0, len(track) - i)]
for k, sc in enumerate(scenes):
    if k: put('wusch', sc['t0'], 0.35)
    for e in sc['els']:
        t = sc['t0'] + e.get('rein', 0) * (sc['t1'] - sc['t0'])
        if e['typ'] == 'kreuz': put('falsch', t, 0.35)
        elif e['typ'] == 'haken': put('ding', t, 0.3)
        elif e['typ'] in ('zaehler', 'uhr'):
            for j in range(10): put('tick', t + j * 0.11, 0.25)
        elif e.get('rein', 0) > 0 and t - last_pop > 0.3: put('plopp', t, 0.3); last_pop = t
import wave
with wave.open(os.path.join(d, 'sfx.wav'), 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(track, -1, 1) * 32767).astype(np.int16).tobytes())
mus = spec['musik']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(d, 'stimme.wav'), '-af', f'atempo={SPEED}' + (',' + KLAR if spec.get('stimmeKlar', True) else ''), os.path.join(d, 'stimme-schnell.wav')], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-i', os.path.join(d, 'stimme-schnell.wav'), '-stream_loop', '-1', '-i', mus, '-i', os.path.join(d, 'sfx.wav'), '-filter_complex',
                f'[1:a]adelay={int(LEAD*1000)}|{int(LEAD*1000)},aresample=48000,pan=stereo|c0=c0|c1=c0,apad=pad_dur=3[v];'
                f'[2:a]aresample=48000,volume={spec.get("musikLautstaerke", 0.08)},afade=t=in:d=1.5,afade=t=out:st={total-2:.2f}:d=2[m];'
                f'[3:a]aresample=48000,pan=stereo|c0=c0|c1=c0[x];'
                f'[v][m][x]amix=inputs=3:duration=first:normalize=0,atrim=0:{total:.2f},loudnorm=I=-15[a]',
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
