// Generates the app icon, adaptive icon, splash logo, store icon and the
// sound effects with no dependencies (PNG and WAV are encoded by hand).
//
//   node scripts/generate-assets.mjs
//
// The artwork is the Puzzaro logo — four outlined, tilted squares in the game
// colors. Replace the generated files with final artwork whenever you like.

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- Colors (match src/theme/colors.ts) ----------
const hex = h => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const INK = hex('#1D1A33');
const BG = hex('#F3F0FF');
const SQUARES = ['#3D5AF1', '#FFC530', '#34C38F', '#FF7AA2'].map(hex);

// ---------- PNG encoding ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Tiny SDF rasterizer ----------
// Signed distance to a rounded box centered at the origin.
function sdRoundBox(px, py, half, r) {
  const qx = Math.abs(px) - half + r;
  const qy = Math.abs(py) - half + r;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Draws the logo into an RGBA buffer.
 * @param size   canvas size in px (square)
 * @param logo   logo width as a fraction of the canvas
 * @param bg     background RGB or null for transparent
 */
function drawLogo(size, logo, bg) {
  const buf = Buffer.alloc(size * size * 4);
  const L = logo * size; // logo extent
  const gap = L * 0.06;
  const side = (L - gap) / 2;
  const border = side * 0.11;
  const radius = side * 0.26;
  const shadow = side * 0.1;
  const angle = (-8 * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const c = size / 2;
  const offs = side / 2 + gap / 2;
  const centers = [
    [-offs, -offs],
    [offs, -offs],
    [-offs, offs],
    [offs, offs],
  ];

  // Layers back to front: hard shadows, ink outlines, colored faces.
  const layers = [];
  for (const [x, y] of centers)
    layers.push({ x, y, dy: shadow, half: side / 2, r: radius, col: INK });
  for (const [x, y] of centers) layers.push({ x, y, dy: 0, half: side / 2, r: radius, col: INK });
  centers.forEach(([x, y], i) =>
    layers.push({ x, y, dy: 0, half: side / 2 - border, r: radius - border, col: SQUARES[i] }),
  );

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let [r, g, b] = bg ?? [0, 0, 0];
      let a = bg ? 1 : 0;
      for (const ly of layers) {
        // Shadow drops straight down in screen space; the logo is rotated.
        const sx = px + 0.5 - c;
        const sy = py + 0.5 - c - ly.dy;
        const lx = cos * sx + sin * sy - ly.x;
        const lyy = -sin * sx + cos * sy - ly.y;
        const d = sdRoundBox(lx, lyy, ly.half, ly.r);
        const cov = Math.min(1, Math.max(0, 0.5 - d));
        if (cov <= 0) continue;
        // "over" compositing
        const na = cov + a * (1 - cov);
        r = (ly.col[0] * cov + r * a * (1 - cov)) / na;
        g = (ly.col[1] * cov + g * a * (1 - cov)) / na;
        b = (ly.col[2] * cov + b * a * (1 - cov)) / na;
        a = na;
      }
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return encodePNG(size, size, buf);
}

// ---------- WAV synthesis ----------
const RATE = 44100;
function encodeWAV(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/** A note: soft "marimba-ish" tone with quick attack and exponential decay. */
function note(freq, dur, { vol = 0.35, decay = 6, wave = 'sine' } = {}) {
  const n = Math.floor(dur * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.004) * Math.exp(-decay * t);
    const ph = 2 * Math.PI * freq * t;
    const s =
      wave === 'square'
        ? Math.sign(Math.sin(ph)) * 0.5 + Math.sin(ph) * 0.5
        : Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph);
    out[i] = s * env * vol * 0.7;
  }
  return out;
}
const concat = (...parts) => Float32Array.from(parts.flatMap(p => Array.from(p)));

const SOUNDS = {
  tap: note(1400, 0.05, { vol: 0.25, decay: 70 }),
  correct: concat(note(1047, 0.09, { decay: 18 }), note(1319, 0.22, { decay: 12 })),
  wrong: concat(
    note(220, 0.12, { wave: 'square', vol: 0.22, decay: 14 }),
    note(165, 0.22, { wave: 'square', vol: 0.22, decay: 10 }),
  ),
  win: concat(
    note(523, 0.11, { decay: 14 }),
    note(659, 0.11, { decay: 14 }),
    note(784, 0.11, { decay: 14 }),
    note(1047, 0.5, { decay: 5 }),
  ),
  lose: concat(
    note(392, 0.18, { decay: 9 }),
    note(330, 0.18, { decay: 9 }),
    note(262, 0.45, { decay: 5 }),
  ),
};

// ---------- Write files ----------
function write(rel, data) {
  const path = join(ROOT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log('wrote', rel);
}

write('assets/icon.png', drawLogo(1024, 0.62, BG));
// Android adaptive icons are masked to the center ~66%, so keep the logo small.
write('assets/adaptive-icon.png', drawLogo(1024, 0.42, null));
write('assets/splash-icon.png', drawLogo(512, 0.9, null));
write('store/play-icon-512.png', drawLogo(512, 0.62, BG));
for (const [name, samples] of Object.entries(SOUNDS))
  write(`assets/sounds/${name}.wav`, encodeWAV(samples));
