export const playWhooshSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    // We try to resume if it was suspended (browser autoplay policy)
    const audioCtx = new AudioContextClass();
    
    // Create white noise
    const bufferSize = audioCtx.sampleRate * 0.4; // 0.4 seconds length
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // white noise between -1.0 and 1.0
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    // Filter to sweep frequencies (creates the air/whoosh motion)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.15);
    filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.35);

    // Volume envelope (fade in, fade out)
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.15); // max volume 0.4
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.35);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start();
  } catch (err) {
    console.error("Audio playback failed", err);
  }
};

export const playPopSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    
    // Frequency pop: start high, drop low quickly
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    
    // Volume pop: quick attack, fast decay
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (err) {}
};
