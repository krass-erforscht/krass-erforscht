// Rendert ein einzelnes Teil (Körper/Kopf/Gesicht) als SVG-String: node render.mjs <pfad-relativ-zu-build> [optionen-json]
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const [rel, opts] = process.argv.slice(2);
const mod = await import(`./node_modules/@opeepsfun/open-peeps/build/${rel}.js`);
const cfg = Object.values(mod).find(v => v && v.viewBox);
const el = React.createElement(mod.default, JSON.parse(opts || '{}'));
console.log(JSON.stringify({ viewBox: cfg.viewBox, inner: renderToStaticMarkup(el) }));
