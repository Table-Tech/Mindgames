// Turns raw phone screenshots (store/raw) into 1080 × 1920 Play Store images:
// status bar cropped off, the screen in a chunky outlined "phone" with a hard
// shadow, on a background in the game's color with a few loose stickers.
//
//   node scripts/frame-screenshots.mjs

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const INK = hex('#1D1A33');
const COLORS = {
  lavender: hex('#F3F0FF'),
  blue: hex('#3D5AF1'),
  yellow: hex('#FFC530'),
  mint: hex('#34C38F'),
  pink: hex('#FF7AA2'),
  sun: hex('#FFD84D'),
  white: hex('#FFFFFF'),
};

// Raw file → output name, background, sticker colors (behind the phone).
const SHOTS = [
  ['WhatsApp Image 2026-10-09 at 21.59.58.jpeg', '01-home', 'lavender', ['blue', 'yellow', 'mint', 'pink']],
  ['WhatsApp Image 2026-10-09 at 21.59.58 (1).jpeg', '02-sudoku', 'blue', ['sun', 'white', 'pink', 'sun']],
  ['WhatsApp Image 2026-10-09 at 21.59.58 (2).jpeg', '03-word-guess', 'yellow', ['blue', 'white', 'pink', 'blue']],
  ['WhatsApp Image 2026-10-09 at 21.59.58 (3).jpeg', '04-mahjong', 'mint', ['white', 'sun', 'pink', 'white']],
  ['WhatsApp Image 2026-10-09 at 21.59.58 (4).jpeg', '05-solved', 'pink', ['sun', 'blue', 'white', 'mint']],
  ['WhatsApp Image 2026-10-09 at 21.59.59.jpeg', '06-stats', 'lavender', ['pink', 'blue', 'yellow', 'mint']],
];

const W = 1080;
const H = 1920;
const STATUS_BAR = 150; // px of the 2048-tall raw shots to crop off the top

function sdRoundBox(px, py, hw, hh, r) {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
const coverage = d => Math.min(1, Math.max(0, 0.5 - d));
const mix = (a, b, t) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);

async function frame([file, name, bgKey, stickerKeys]) {
  const shot = await Jimp.read(join(ROOT, 'store/raw', file));
  shot.crop(0, STATUS_BAR, shot.bitmap.width, shot.bitmap.height - STATUS_BAR);

  // Fit the screen inside the canvas with room for the frame and shadow.
  const screenH = 1700;
  const screenW = Math.round((shot.bitmap.width * screenH) / shot.bitmap.height);
  shot.resize(screenW, screenH, Jimp.RESIZE_BICUBIC);
  const sx0 = Math.round((W - screenW) / 2);
  const sy0 = 82;
  const border = 12;
  const radius = 64;
  const shadow = 30;
  const cx = sx0 + screenW / 2;
  const cy = sy0 + screenH / 2;

  const bg = COLORS[bgKey];
  const stickers = [
    { x: 70, y: 260, s: 150, a: 14 },
    { x: 1010, y: 640, s: 120, a: -12 },
    { x: 60, y: 1390, s: 110, a: -18 },
    { x: 1000, y: 1700, s: 170, a: 10 },
  ].map((st, i) => ({ ...st, col: COLORS[stickerKeys[i]] }));

  const out = new Jimp(W, H);
  const data = out.bitmap.data;
  const src = shot.bitmap.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = bg;
      // Loose stickers (behind the phone): shadow, outline, face.
      for (const st of stickers) {
        const r = (st.a * Math.PI) / 180;
        const local = dy => {
          const px = x + 0.5 - st.x;
          const py = y + 0.5 - st.y - dy;
          return [Math.cos(r) * px + Math.sin(r) * py, -Math.sin(r) * px + Math.cos(r) * py];
        };
        const h = st.s / 2;
        const rr = st.s * 0.26;
        const b = st.s * 0.11;
        c = mix(c, INK, coverage(sdRoundBox(...local(st.s * 0.1), h, h, rr)));
        c = mix(c, INK, coverage(sdRoundBox(...local(0), h, h, rr)));
        c = mix(c, st.col, coverage(sdRoundBox(...local(0), h - b, h - b, rr - b)));
      }
      // Phone: hard shadow, ink frame, then the screenshot clipped to the inner corner.
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const hw = screenW / 2 + border;
      const hh = screenH / 2 + border;
      c = mix(c, INK, coverage(sdRoundBox(px, py - shadow, hw, hh, radius + border)));
      c = mix(c, INK, coverage(sdRoundBox(px, py, hw, hh, radius + border)));
      const inner = coverage(sdRoundBox(px, py, screenW / 2, screenH / 2, radius));
      if (inner > 0) {
        const ix = Math.min(screenW - 1, Math.max(0, x - sx0));
        const iy = Math.min(screenH - 1, Math.max(0, y - sy0));
        const k = (iy * screenW + ix) * 4;
        c = mix(c, [src[k], src[k + 1], src[k + 2]], inner);
      }
      const o = (y * W + x) * 4;
      data[o] = Math.round(c[0]);
      data[o + 1] = Math.round(c[1]);
      data[o + 2] = Math.round(c[2]);
      data[o + 3] = 255;
    }
  }

  const path = join(ROOT, 'store/screenshots', `${name}.png`);
  mkdirSync(dirname(path), { recursive: true });
  await out.writeAsync(path);
  console.log('wrote', `store/screenshots/${name}.png`);
}

for (const s of SHOTS) await frame(s);
