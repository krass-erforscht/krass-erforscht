// Feste Besetzung für die Geschichten-Videos: jede Figur mit allen Gesichtern
import { execFileSync } from 'child_process';
const out = process.argv[2];
const CAST = {
  forscherin: ['standing/Doc', 'LongHair', '#F2C9A5', '#5AAAEB'],
  forscher:   ['standing/Doc', 'ShortTwo', '#C68A62', '#5AAAEB'],
  person:     ['standing/WalkingColorTee', 'Bun', '#F2C9A5', '#5AAAEB'],
  mann:       ['standing/CrossArmColorTee', 'ShortOne', '#E8B48C', '#F08C3C'],
  zeigend:    ['standing/PointingFingerColorTee', 'Afro', '#B07650', '#F08C3C'],
  sitzend:    ['sitting/MidColorTee', 'LongCurly', '#F2C9A5', '#5AC878'],
  entspannt:  ['standing/RestingColorTee', 'MediumStraight', '#E8B48C', '#BE6EEB'],
};
const FACES = { neutral: 'Calm', spricht: 'Explaining', froh: 'BigSmile', traurig: 'Concerned', staunen: 'Awe', zu: 'EyesClosed' };
for (const [name, [body, head, skin, top]] of Object.entries(CAST))
  for (const [mood, face] of Object.entries(FACES)) {
    execFileSync('node', ['compose.mjs', `${out}/${name}-${mood}.png`, body, head, face, '900', skin, top], { stdio: 'inherit' });
    console.log(name, mood);
  }
