# Figuren (Open Peeps, CC0)

Handgezeichnete Figuren von Pablo Stanley („Open Peeps“, CC0 – frei nutzbar ohne Nachweis), über das npm-Paket @opeepsfun/open-peeps (MIT).
Erzeugt die PNGs in `assets/figuren/<figur>-<gesicht>.png`, die `geschichte.py` als Element `figur` verwendet.

Neu erzeugen (nur nötig für neue Figuren):
    cd <arbeitsordner> && npm init -y && npm install react@18.3.1 react-dom@18.3.1 @opeepsfun/open-peeps@1.0.6
    cp <repo>/werkzeuge/figuren/*.mjs . && node besetzung.mjs <repo>/assets/figuren
