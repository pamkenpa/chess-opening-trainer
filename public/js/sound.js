// Tiny WebAudio sound effects — no asset files needed.
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise(duration, freq, gain) {
  const c = ac();
  if (!c) return;
  const len = c.sampleRate * duration;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

function tone(freq, duration, delay = 0, type = 'sine', gain = 0.12) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + delay;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + duration + 0.05);
}

export const sfx = {
  move() { noise(0.07, 1400, 0.35); },
  capture() { noise(0.09, 800, 0.5); tone(160, 0.08, 0, 'triangle', 0.1); },
  select() { tone(880, 0.04, 0, 'sine', 0.05); },
  wrong() { tone(180, 0.14, 0, 'square', 0.08); tone(140, 0.18, 0.12, 'square', 0.08); },
  success() { [523, 659, 784].forEach((f, i) => tone(f, 0.16, i * 0.09, 'triangle', 0.09)); },
  engineMove() { noise(0.07, 1100, 0.3); }
};
