
// Simple Web Audio API Synth for game sounds
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const ctx = new AudioContext();

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null) => {
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  }
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playJumpSound = () => {
  // Boing sound
  playTone(150, 'sine', 0.3, 600);
};

export const playCoinSound = () => {
  // High ping
  playTone(1200, 'square', 0.1, 1800);
  setTimeout(() => playTone(1800, 'square', 0.1), 50);
};

export const playCrashSound = () => {
  // Low noise/crash
  playTone(100, 'sawtooth', 0.5, 10);
};
