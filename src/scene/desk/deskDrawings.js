import * as THREE from 'three';

// What is on the sheets is what makes the desk hers rather than a stock
// designer's desk. Architectural plans were the reference's subject, not
// Magadhi's: these are EEG traces, a chart and handwriting.
//
// Every drawing takes a `stage` in 0..1 and each pass has a threshold, so a
// sheet stepped through its stages reads as the drawing being made. The seeded
// rng is consumed in the same order at every stage, which is what stops the
// shapes reshuffling between passes.

const S = 512;
const X0 = 58;
const X1 = S - 46;

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t * 1664525 + 1013904223) >>> 0;
    return t / 4294967296;
  };
}

function sheet(ctx, stage) {
  ctx.clearRect(0, 0, S, S);
  if (stage >= 0.06) {
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let i = 16; i < S; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }
  }
  if (stage >= 0.12) {
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, S - 52, S - 52);
  }
}

/**
 * Six channels of EEG. The trace shape is fixed; what changes with `stage` is
 * how much noise rides on it, so scrolling takes the sheet from raw recording
 * to a filtered band with the window of interest marked. Her actual pipeline.
 */
function signal(ctx, r, stage) {
  const chans = 6;
  const top = 96;
  const gap = (S - 190) / (chans - 1);

  // consume the rng identically at every stage
  const rows = [];
  for (let c = 0; c < chans; c++) {
    const ph = r() * 6.283;
    const f = 0.8 + r() * 0.9;
    const row = [];
    for (let x = X0; x <= X1; x += 3) {
      const u = (x - X0) / (X1 - X0);
      row.push([x, Math.sin(u * 18.85 * f + ph) * 11 + Math.sin(u * 7.1 + ph) * 5, r() - 0.5]);
    }
    rows.push(row);
  }
  const markFrom = X0 + (X1 - X0) * 0.42;
  const markTo = X0 + (X1 - X0) * 0.68;

  if (stage < 0.16) return;
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  for (let c = 0; c < chans; c++) {
    const y = top + c * gap;
    ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.62)';
  ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(X0, top - 24); ctx.lineTo(X0, top + (chans - 1) * gap + 24); ctx.stroke();

  if (stage < 0.3) return;
  // noise falls away as the drawing advances: raw recording becoming filtered
  const noise = Math.max(0, 1 - (stage - 0.3) / 0.42);
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = 3.6;
  for (let c = 0; c < chans; c++) {
    const y = top + c * gap;
    ctx.beginPath();
    rows[c].forEach(([x, smooth, jit], i) => {
      const py = y + smooth * 0.85 + jit * 26 * noise;
      if (i === 0) ctx.moveTo(x, py); else ctx.lineTo(x, py);
    });
    ctx.stroke();
  }

  if (stage < 0.78) return;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([7, 6]);
  ctx.strokeRect(markFrom, top - 26, markTo - markFrom, (chans - 1) * gap + 52);
  ctx.setLineDash([]);

  if (stage < 0.92) return;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  for (let c = 0; c < chans; c++) {
    const y = top + c * gap;
    ctx.beginPath(); ctx.moveTo(X0 - 16, y); ctx.lineTo(X0 - 4, y); ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const x = X0 + (X1 - X0) * (i / 4);
    ctx.beginPath(); ctx.moveTo(x, S - 82); ctx.lineTo(x, S - 70); ctx.stroke();
  }
}

/** A results chart: axes, bars, a threshold line. */
function chart(ctx, r, stage) {
  const base = S - 110;
  const bars = [];
  for (let i = 0; i < 7; i++) bars.push(0.25 + r() * 0.7);

  if (stage < 0.16) return;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(X0, 90); ctx.lineTo(X0, base); ctx.lineTo(X1, base);
  ctx.stroke();

  if (stage < 0.36) return;
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  const w = (X1 - X0) / bars.length;
  bars.forEach((v, i) => {
    const h = v * (base - 120);
    ctx.strokeRect(X0 + i * w + w * 0.22, base - h, w * 0.56, h);
  });

  if (stage < 0.68) return;
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  const ty = base - 0.68 * (base - 120);
  ctx.beginPath(); ctx.moveTo(X0, ty); ctx.lineTo(X1, ty); ctx.stroke();
  ctx.setLineDash([]);
}

/** Handwriting: ruled lines with ragged ink, the way notes actually sit. */
function notes(ctx, r, stage) {
  const lines = [];
  let y = 92;
  while (y < S - 70) {
    const w = (0.35 + r() * 0.55) * (X1 - X0);
    const jitter = [];
    for (let x = X0; x < X0 + w; x += 18) jitter.push(r() - 0.5);
    lines.push([y, w, jitter]);
    y += 26 + r() * 12;
  }
  if (stage < 0.2) return;
  ctx.lineWidth = 3.8;
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  for (const [ly, w, jitter] of lines) {
    ctx.beginPath();
    ctx.moveTo(X0, ly);
    jitter.forEach((j, i) => ctx.lineTo(X0 + i * 18, ly + j * 3.5));
    ctx.stroke();
    if (X0 + w < X1) ctx.lineTo(X0 + w, ly);
  }
}

const KINDS = { signal, chart, notes };

const cache = new Map();

export function drawingTexture(kind, seed, stage = 1) {
  const key = `${kind}:${seed}:${stage}`;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  sheet(ctx, stage);
  (KINDS[kind] || notes)(ctx, rng(seed), stage);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** The stages the developing sheet steps through as the page scrolls. */
export const STAGE_COUNT = 6;
export function stageTextures(kind, seed) {
  return Array.from({ length: STAGE_COUNT }, (_, i) =>
    drawingTexture(kind, seed, i / (STAGE_COUNT - 1))
  );
}

/** 1x1 transparent stand-in so every material can bind a sampler. */
export const EMPTY_MAP = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
EMPTY_MAP.needsUpdate = true;
