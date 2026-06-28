/**
 * Audio Service for Cinematic Sound Design
 * Synthesizes organic, realistic, and subtle page-flip sounds 
 * purely using the Web Audio API without requiring bulky external assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    // Standard and vendor prefixed AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

// Generate a buffer filled with white noise to use as a sound source
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;

  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink-tinted white noise for a softer, organic, paper-like friction
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise approximation formula (Paul Kellet's refined method)
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11; // Normalize gain
  }
  
  noiseBuffer = buffer;
  return noiseBuffer;
}

/**
 * Plays an organic and highly polished "page-flip" sound effect.
 * Uses an overlapping dual-filter bandpass sweep with a friction-like envelope
 * to capture the soft, airy brush and rapid rustle of luxurious heavy paper.
 */
export function playPageFlip() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay/user-interaction policies)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;

    // --- Channel 1: High Frequency Paper Friction ("Rustle") ---
    const rustleSource = ctx.createBufferSource();
    rustleSource.buffer = getNoiseBuffer(ctx);

    const rustleFilter = ctx.createBiquadFilter();
    rustleFilter.type = 'bandpass';
    // Sweep the bandpass frequency to emulate air resistance and slide speed
    rustleFilter.Q.setValueAtTime(3.0, now);
    rustleFilter.frequency.setValueAtTime(1400, now);
    rustleFilter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
    rustleFilter.frequency.exponentialRampToValueAtTime(800, now + 0.35);

    const rustleGain = ctx.createGain();
    rustleGain.gain.setValueAtTime(0.001, now);
    // Mimic the crisp peak of page lifting
    rustleGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    rustleGain.gain.exponentialRampToValueAtTime(0.06, now + 0.22);
    rustleGain.gain.linearRampToValueAtTime(0.001, now + 0.38);

    rustleSource.connect(rustleFilter);
    rustleFilter.connect(rustleGain);
    rustleGain.connect(ctx.destination);

    // --- Channel 2: Low-Mid Soft Body Sweep ("Whoosh") ---
    const whooshSource = ctx.createBufferSource();
    whooshSource.buffer = getNoiseBuffer(ctx);

    const whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = 'bandpass';
    whooshFilter.Q.setValueAtTime(1.5, now);
    whooshFilter.frequency.setValueAtTime(250, now);
    whooshFilter.frequency.exponentialRampToValueAtTime(650, now + 0.1);
    whooshFilter.frequency.linearRampToValueAtTime(180, now + 0.35);

    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.001, now);
    whooshGain.gain.linearRampToValueAtTime(0.24, now + 0.05);
    whooshGain.gain.exponentialRampToValueAtTime(0.04, now + 0.25);
    whooshGain.gain.linearRampToValueAtTime(0.001, now + 0.42);

    whooshSource.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(ctx.destination);

    // Play both sources with a tiny delay to simulate movement
    rustleSource.start(now);
    rustleSource.stop(now + 0.45);

    whooshSource.start(now + 0.02);
    whooshSource.stop(now + 0.45);

  } catch (error) {
    // Ignore
  }
}

/**
 * Plays a magical, shimmering "achievement unlock" chime sound effect.
 * Uses a crystal-clear FM synthesis approach with multiple sine oscillators and a glittering frequency sweep
 * to deliver a celebratory, high-grade anime-style unlock audio cue.
 */
export function playAchievementSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;
    
    // Fundamental note: C5 (523.25 Hz)
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord (C5, E5, G5, C6)
    
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08); // Staggered arpeggio effect!
      
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.5);
    });

    // Glitter noise for extra sparkle
    const sparkleSource = ctx.createBufferSource();
    sparkleSource.buffer = getNoiseBuffer(ctx);
    
    const sparkleFilter = ctx.createBiquadFilter();
    sparkleFilter.type = 'highpass';
    sparkleFilter.frequency.setValueAtTime(8000, now);
    
    const sparkleGain = ctx.createGain();
    sparkleGain.gain.setValueAtTime(0.001, now);
    sparkleGain.gain.linearRampToValueAtTime(0.03, now + 0.15);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    sparkleSource.connect(sparkleFilter);
    sparkleFilter.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    
    sparkleSource.start(now);
    sparkleSource.stop(now + 1.0);
  } catch (error) {
    // Ignore
  }
}

