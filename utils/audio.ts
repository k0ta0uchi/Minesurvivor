

interface NoteEvent {
  freq: number;
  duration: number; // Seconds
  startTime: number; // Relative to sequence start
  volume: number;
}

interface TrackData {
  lead: string;
  harmony: string;
  bass: string;
  drums: string;
}

// 5 Gothic Horror Tracks (Castlevania-style)
const SONGS: Record<number, TrackData> = {
  // Track 1: The Awakening (Driving, Heroic, Stage 1/6)
  0: {
    lead: "t150 o4 l8 a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c b4 < a4",
    harmony: "t150 o3 l8 f f a a g g f e d d f f e4 c4 f f a a g g f e d c < b a g#4 a4",
    bass: "t150 o2 l8 a a a a a a a a f f f f e e e e a a a a a a a a f f e e a4 a4",
    drums: "t150 l4 k s k s k8 k8 s k s"
  },
  // Track 2: Clockwork Tower (Mechanical, Arpeggios, Stage 2/7)
  1: {
    lead: "t130 o4 l16 c e g > c < g e c e > c < g e c < b > d g > d < g d < b d a c e a e c a c",
    harmony: "t130 o3 l8 e g > c4 < g4 e4 d g > b4 < g4 d4 c e a4 e4 c4",
    bass: "t130 o2 l4 c c > c < c g g > g < g a a > a < a",
    drums: "t130 l16 k k s k k k s k"
  },
  // Track 3: Spectral Waltz (3/4 feel in 4/4, Spooky, Stage 3/8)
  2: {
    lead: "t160 o4 l4 c e8 g8 > c2 < b a8 g8 a2 g f8 e8 f2 e d8 c8 d2",
    harmony: "t160 o3 l4 e g8 > c8 < e2 d f8 a8 d2 c e8 g8 c2 < b > d8 g8 < b2",
    bass: "t160 o2 l4 c > c < c g > g < g f > f < f g > g < g",
    drums: "t160 l4 k s s k s s"
  },
  // Track 4: Blood Moon (Heavy, Slow, Doom, Stage 4/9)
  3: {
    lead: "t100 o3 l8 a > c < a > c < a > c < a > c < b > d < b > d < b > d < b > d < g > b < g > b < g > b < g > b < a > c < a > c < a4 r4",
    harmony: "t100 o3 l4 a a a a g g g g f f f f e e e e",
    bass: "t100 o1 l2 a a g g f f e e",
    drums: "t100 l4 k s k s"
  },
  // Track 5: The Castle Keep (Fast, Neo-Classical, Final, Stage 5/10)
  4: {
    lead: "t170 o4 l16 a > c e a < g > b d g < f a > c f < e g b e a > c e a < g > b d g < f a > c f < e4",
    harmony: "t170 o4 l8 c e c e < b > d < b > d < a > c < a > c < g > b < g > b a > c e a",
    bass: "t170 o2 l8 a a a a g g g g f f f f e e e e a a a a",
    drums: "t170 l8 k k s k k k s k"
  }
};

class MusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerID: number | null = null;
  private currentTrack: { [key: string]: NoteEvent[] } = { lead: [], harmony: [], bass: [], drums: [] };
  private cursors: { [key: string]: number } = { lead: 0, harmony: 0, bass: 0, drums: 0 };
  private loopLength: number = 0;
  public startTimeOffset: number = 0;

  constructor() {
    // Context is shared with audioManager or created lazily
  }

  public setContext(ctx: AudioContext) {
    this.ctx = ctx;
  }

  // --- MML PARSER ---
  private parseMML(mml: string): NoteEvent[] {
    const events: NoteEvent[] = [];
    let currentTime = 0;
    let octave = 4;
    let length = 4; // 1/4 note default
    let tempo = 120;
    let volume = 0.1;

    // Normalize: remove spaces, lowercase
    const stream = mml.toLowerCase().replace(/\s+/g, '');
    let i = 0;

    while (i < stream.length) {
      const char = stream[i];

      // Tempo
      if (char === 't') {
        i++;
        const num = parseInt(stream.substring(i));
        tempo = num;
        i += num.toString().length;
        continue;
      }
      // Octave
      if (char === 'o') {
        i++;
        const num = parseInt(stream.substring(i));
        octave = num;
        i += num.toString().length;
        continue;
      }
      if (char === '>') { octave++; i++; continue; }
      if (char === '<') { octave--; i++; continue; }
      // Length
      if (char === 'l') {
        i++;
        const num = parseInt(stream.substring(i));
        length = num;
        i += num.toString().length;
        continue;
      }
      // Notes
      if (/[a-gkr]/.test(char)) { // k=kick, s=snare (mapped to notes for drums), r=rest
        let noteName = char;
        i++;
        
        // Sharp/Flat
        let accidental = 0;
        if (stream[i] === '#' || stream[i] === '+') { accidental = 1; i++; }
        else if (stream[i] === '-') { accidental = -1; i++; }

        // Duration override
        let dur = length;
        if (/\d/.test(stream[i])) {
           dur = parseInt(stream.substring(i));
           i += dur.toString().length;
        }

        // Calculate time
        const durationSeconds = (60 / tempo) * (4 / dur);

        if (noteName !== 'r') {
            let freq = 0;
            if (noteName === 'k') freq = 50; // Kick
            else if (noteName === 's') freq = 200; // Snare
            else {
                // Note to frequency
                const offsets: {[key:string]:number} = {c:0, d:2, e:4, f:5, g:7, a:9, b:11};
                const semi = offsets[noteName] + accidental + (octave - 4) * 12;
                freq = 440 * Math.pow(2, (semi - 9) / 12);
            }
            
            events.push({
                freq,
                duration: durationSeconds,
                startTime: currentTime,
                volume
            });
        }
        
        currentTime += durationSeconds;
        continue;
      }
      
      i++;
    }
    return events;
  }

  public loadTrack(stage: number) {
    const songId = (stage - 1) % 5;
    const trackData = SONGS[songId];
    if (!trackData) return;

    this.currentTrack.lead = this.parseMML(trackData.lead);
    this.currentTrack.harmony = this.parseMML(trackData.harmony);
    this.currentTrack.bass = this.parseMML(trackData.bass);
    this.currentTrack.drums = this.parseMML(trackData.drums);
    
    // Find loop length (max end time)
    const times = [this.currentTrack.lead, this.currentTrack.harmony, this.currentTrack.bass, this.currentTrack.drums]
        .map(t => t.length > 0 ? t[t.length-1].startTime + t[t.length-1].duration : 0);
    this.loopLength = Math.max(...times);
    
    this.cursors = { lead: 0, harmony: 0, bass: 0, drums: 0 };
  }

  public start() {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    this.schedule();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
        window.clearTimeout(this.timerID);
        this.timerID = null;
    }
  }

  private scheduleLoop() {
      if (!this.isPlaying || !this.ctx) return;
      
      const currentTime = this.ctx.currentTime;
      const lookahead = 0.1; // 100ms window

      ['lead', 'harmony', 'bass', 'drums'].forEach(trackName => {
          const track = this.currentTrack[trackName];
          let index = this.cursors[trackName];
          
          while (index < track.length) {
              const event = track[index];
              const absoluteTime = this.startTimeOffset + event.startTime;
              
              if (absoluteTime > currentTime + lookahead) {
                  break; // Too far in future
              }
              
              if (absoluteTime >= currentTime) {
                  this.playNote(trackName, event, absoluteTime);
              }
              
              index++;
          }
          this.cursors[trackName] = index;
      });

      // Loop check
      if (currentTime > this.startTimeOffset + this.loopLength) {
          this.startTimeOffset += this.loopLength;
          this.cursors = { lead: 0, harmony: 0, bass: 0, drums: 0 };
      }

      this.timerID = window.setTimeout(() => this.scheduleLoop(), 25);
  }

  private schedule() {
      this.timerID = window.setTimeout(() => this.scheduleLoop(), 25);
  }

  private playNote(track: string, event: NoteEvent, time: number) {
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      if (track === 'drums') {
          // Noise for drums
          if (event.freq < 100) { // Kick
              osc.type = 'sine'; // deeply pitched sine for kick
              osc.frequency.setValueAtTime(150, time);
              osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
              gain.gain.setValueAtTime(0.8, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          } else { // Snare/Hihat -> Noise
             osc.type = 'square';
             osc.frequency.setValueAtTime(Math.random() * 1000 + 100, time); 
             gain.gain.setValueAtTime(0.2, time);
             gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
          }
      } else {
          // Instruments
          if (track === 'lead') {
              osc.type = 'square'; // NES Pulse 50%
              gain.gain.setValueAtTime(0.1, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + event.duration);
          } else if (track === 'harmony') {
              osc.type = 'sawtooth'; // NES Saw
              gain.gain.setValueAtTime(0.08, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + event.duration);
          } else if (track === 'bass') {
              osc.type = 'triangle'; // NES Triangle
              gain.gain.setValueAtTime(0.15, time);
              gain.gain.linearRampToValueAtTime(0.1, time + event.duration * 0.9);
              gain.gain.linearRampToValueAtTime(0, time + event.duration);
          }
          
          osc.frequency.setValueAtTime(event.freq, time);
      }
      
      osc.start(time);
      osc.stop(time + event.duration);
  }
}

class AudioController {
  private ctx: AudioContext | null = null;
  private bgmEnabled: boolean = true;
  private seEnabled: boolean = true;
  public musicEngine: MusicEngine;

  constructor() {
    this.musicEngine = new MusicEngine();
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.ctx) {
        this.musicEngine.setContext(this.ctx);
      }
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private getContext() {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }
  
  public setBgmEnabled(enabled: boolean) {
      this.bgmEnabled = enabled;
      if (!enabled) {
          this.stopMusic();
      }
  }

  public setSeEnabled(enabled: boolean) {
      this.seEnabled = enabled;
  }

  public startMusic(stage: number) {
      if (!this.bgmEnabled) return;
      this.getContext(); // Ensure resume
      this.musicEngine.loadTrack(stage);
      // Reset start time anchor
      if (this.ctx) (this.musicEngine as any).startTimeOffset = this.ctx.currentTime;
      this.musicEngine.start();
  }
  
  public stopMusic() {
      this.musicEngine.stop();
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  public playReveal() {
    this.playTone(600, 'sine', 0.1, 0.05);
  }

  public playFlag() {
    this.playTone(300, 'square', 0.05, 0.05);
  }

  public playCombo(count: number) {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const baseFreq = 400;
    const pitch = Math.min(1000, baseFreq + (count * 50));
    
    this.playTone(pitch, 'triangle', 0.1, 0.05);
  }

  public playUltimateReady() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.5);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playUltimateCast() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.0);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.linearRampToValueAtTime(100, now + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  public playSonar() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playExplosion() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  public playLevelUp() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }

  public playVictory() {
    this.stopMusic();
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.2, 0.1);
    });
  }

  public playItemPickup() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    this.playTone(1200, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(1600, 'sine', 0.2, 0.05), 100);
  }

  public playChest() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.1);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    setTimeout(() => {
        this.playTone(1500, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(2000, 'sine', 0.1, 0.15), 100);
        setTimeout(() => this.playTone(2500, 'sine', 0.1, 0.2), 200);
    }, 200);
  }

  public playCombat() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
}

export const audioManager = new AudioController();
