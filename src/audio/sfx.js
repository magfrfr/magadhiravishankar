// Tiny chiptune SFX synth. No audio files — everything is WebAudio oscillators.
// Muted until the user enables sound; preference persists in localStorage.

let ctx = null;
let master = null;
let enabled = localStorage.getItem('mg-sound') === 'on';

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function isSoundOn() {
  return enabled;
}

export function setSound(on) {
  enabled = on;
  localStorage.setItem('mg-sound', on ? 'on' : 'off');
  if (on) {
    ensureCtx();
    play('toggle');
  }
}

function blip({ freq = 440, to = null, dur = 0.09, type = 'square', gain = 1, when = 0 }) {
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  hop:        () => blip({ freq: 330, to: 660, dur: 0.08, type: 'square', gain: 0.5 }),
  pet:        () => { blip({ freq: 523, dur: 0.07, type: 'triangle' }); blip({ freq: 784, dur: 0.1, type: 'triangle', when: 0.07 }); },
  toggle:     () => blip({ freq: 880, dur: 0.06, type: 'sine' }),
  zip:        () => blip({ freq: 1200, to: 340, dur: 0.16, type: 'sawtooth', gain: 0.3 }),
};

export function play(name) {
  if (!enabled || !SOUNDS[name]) return;
  try {
    ensureCtx();
    SOUNDS[name]();
  } catch {
    /* audio is never worth crashing for */
  }
}
