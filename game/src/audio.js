// Tiny synthesised sound effects (WebAudio, no audio files): a blip for
// picking up, a thock for chopping, a ding when a fry finishes, a little
// arpeggio for coins and a buzz for a wrong serve. Silent until the first
// user gesture creates the audio context, so screenshot runs stay quiet.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  function tone(frequency, seconds, type, volume, when = 0) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime + when);
      oscillator.stop(ctx.currentTime + when + seconds);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    /** Call on the first gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },
    take() {
      tone(660, 0.08, 'sine', 0.12);
    },
    chop() {
      tone(180, 0.07, 'square', 0.1);
      tone(90, 0.09, 'triangle', 0.12);
    },
    place() {
      tone(420, 0.08, 'sine', 0.1);
    },
    ding() {
      tone(880, 0.25, 'sine', 0.12);
      tone(1318, 0.3, 'sine', 0.08, 0.08);
    },
    coin() {
      tone(1046, 0.1, 'square', 0.08);
      tone(1318, 0.12, 'square', 0.08, 0.09);
      tone(1568, 0.18, 'square', 0.08, 0.18);
    },
    error() {
      tone(160, 0.22, 'sawtooth', 0.1);
    },
    serve() {
      tone(523, 0.1, 'sine', 0.12);
      tone(659, 0.1, 'sine', 0.12, 0.09);
      tone(784, 0.2, 'sine', 0.12, 0.18);
    },
  };
}
