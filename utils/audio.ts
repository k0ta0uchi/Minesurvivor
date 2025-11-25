
import { SONGS } from '../data/songs';

interface NoteEvent {
  freq: number;
  duration: number; // Seconds
  startTime: number; // Relative to sequence start
  volume: number;
}

class MusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerID: number | null = null;
  private currentTrack: { [key: string]: NoteEvent[] } = { lead: [], harmony: [], bass: [], drums: [] };
  private cursors: { [key: string]: number } = { lead: 0, harmony: 0, bass: 0, drums: 0 };
  private loopLength: number = 0;
  public startTimeOffset: number = 0;
  private masterVolume: number = 0.5;
  private currentStage: number = -1;
  private savedTimePosition: number = 0;

  constructor() {
    // Context is shared with audioManager or created lazily
  }

  public setContext(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public setVolume(v: number) {
      this.masterVolume = v;
  }

  // --- MML PARSER ---
  private parseMML(mml: string): NoteEvent[] {
    const events: NoteEvent[] = [];
    let currentTime = 0;
    let octave = 4;
    let length = 4; // 1/4 note default
    let tempo = 120;
    let volume = 0.1;

    const stream = mml.toLowerCase().replace(/\s+/g, '');
    let i = 0;

    while (i < stream.length) {
      const char = stream[i];

      if (char === 't') {
        i++;
        const num = parseInt(stream.substring(i));
        tempo = num;
        i += num.toString().length;
        continue;
      }
      if (char === 'o') {
        i++;
        const num = parseInt(stream.substring(i));
        octave = num;
        i += num.toString().length;
        continue;
      }
      if (char === '>') { octave++; i++; continue; }
      if (char === '<') { octave--; i++; continue; }
      if (char === 'l') {
        i++;
        const num = parseInt(stream.substring(i));
        length = num;
        i += num.toString().length;
        continue;
      }
      if (/[a-gkr]/.test(char)) {
        let noteName = char;
        i++;
        
        let accidental = 0;
        if (stream[i] === '#' || stream[i] === '+') { accidental = 1; i++; }
        else if (stream[i] === '-') { accidental = -1; i++; }

        let dur = length;
        if (/\d/.test(stream[i])) {
           dur = parseInt(stream.substring(i));
           i += dur.toString().length;
        }

        const durationSeconds = (60 / tempo) * (4 / dur);

        if (noteName !== 'r') {
            let freq = 0;
            if (noteName === 'k') freq = 50; 
            else if (noteName === 's') freq = 200; 
            else {
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
    // If resume requested for same stage, preserve state
    if (this.currentStage === stage) {
        return;
    }

    this.currentStage = stage;
    this.savedTimePosition = 0; // Reset position for new track

    const songId = (stage - 1) % 5;
    const trackData = SONGS[songId];
    if (!trackData) return;

    this.currentTrack.lead = this.parseMML(trackData.lead);
    this.currentTrack.harmony = this.parseMML(trackData.harmony);
    this.currentTrack.bass = this.parseMML(trackData.bass);
    this.currentTrack.drums = this.parseMML(trackData.drums);
    
    const times = [this.currentTrack.lead, this.currentTrack.harmony, this.currentTrack.bass, this.currentTrack.drums]
        .map(t => t.length > 0 ? t[t.length-1].startTime + t[t.length-1].duration : 0);
    
    this.loopLength = Math.max(...times);
    
    this.cursors = { lead: 0, harmony: 0, bass: 0, drums: 0 };
  }

  public start() {
    if (this.isPlaying || !this.ctx) return;
    this.isPlaying = true;
    
    // Resume from saved position relative to current audio context time
    this.startTimeOffset = this.ctx.currentTime - this.savedTimePosition;
    
    this.schedule();
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerID !== null) {
        window.clearTimeout(this.timerID);
        this.timerID = null;
    }
    
    // Save current position
    if (this.ctx) {
        this.savedTimePosition = this.ctx.currentTime - this.startTimeOffset;
    }
  }
  
  public reset() {
      this.stop();
      this.currentStage = -1;
      this.savedTimePosition = 0;
      this.cursors = { lead: 0, harmony: 0, bass: 0, drums: 0 };
  }

  private scheduleLoop() {
      if (!this.isPlaying || !this.ctx) return;
      
      const currentTime = this.ctx.currentTime;
      const lookahead = 0.1; 

      ['lead', 'harmony', 'bass', 'drums'].forEach(trackName => {
          const track = this.currentTrack[trackName];
          let index = this.cursors[trackName];
          
          while (index < track.length) {
              const event = track[index];
              const absoluteTime = this.startTimeOffset + event.startTime;
              
              if (absoluteTime > currentTime + lookahead) {
                  break; 
              }
              
              if (absoluteTime >= currentTime) {
                  this.playNote(trackName, event, absoluteTime);
              }
              
              index++;
          }
          this.cursors[trackName] = index;
      });

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
          if (event.freq < 100) { 
              osc.type = 'sine'; 
              osc.frequency.setValueAtTime(150, time);
              osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
              gain.gain.setValueAtTime(0.8 * this.masterVolume, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
          } else { 
             osc.type = 'square';
             osc.frequency.setValueAtTime(Math.random() * 1000 + 100, time); 
             gain.gain.setValueAtTime(0.2 * this.masterVolume, time);
             gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
          }
      } else {
          if (track === 'lead') {
              osc.type = 'square'; 
              gain.gain.setValueAtTime(0.1 * this.masterVolume, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + event.duration);
          } else if (track === 'harmony') {
              osc.type = 'sawtooth'; 
              gain.gain.setValueAtTime(0.08 * this.masterVolume, time);
              gain.gain.exponentialRampToValueAtTime(0.01, time + event.duration);
          } else if (track === 'bass') {
              osc.type = 'triangle'; 
              gain.gain.setValueAtTime(0.15 * this.masterVolume, time);
              gain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, time + event.duration * 0.9);
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
  private bgmVolume: number = 0.5;
  private seVolume: number = 0.5;
  public musicEngine: MusicEngine;

  constructor() {
    this.musicEngine = new MusicEngine();
    this.musicEngine.setVolume(this.bgmVolume);
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

  public setBgmVolume(volume: number) {
      this.bgmVolume = volume;
      this.musicEngine.setVolume(volume);
  }

  public setSeVolume(volume: number) {
      this.seVolume = volume;
  }

  public startMusic(stage: number) {
      if (!this.bgmEnabled) return;
      this.getContext();
      this.musicEngine.loadTrack(stage);
      this.musicEngine.start();
  }
  
  public stopMusic() {
      this.musicEngine.stop();
  }
  
  public resetMusic() {
      this.musicEngine.reset();
  }

  public playAlchemy() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    osc.frequency.linearRampToValueAtTime(400, now + 0.2);
    osc.frequency.linearRampToValueAtTime(800, now + 0.3);
    
    gain.gain.setValueAtTime(0.2 * this.seVolume, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playDodge() {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2 * this.seVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.seEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    const scaledVol = vol * this.seVolume;

    gain.gain.setValueAtTime(scaledVol, ctx.currentTime);
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
    gain.gain.linearRampToValueAtTime(0.2 * this.seVolume, now + 0.4);
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
    
    gain.gain.setValueAtTime(0.3 * this.seVolume, now);
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
    
    gain.gain.setValueAtTime(0.08 * this.seVolume, now);
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

    gain.gain.setValueAtTime(0.3 * this.seVolume, ctx.currentTime);
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
      gain.gain.setValueAtTime(0.1 * this.seVolume, now + i * 0.1);
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
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.2, 0.1);
    });
  }

  public playItemPickup() {
    if (!this.seEnabled) return;
    
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
    
    gain.gain.setValueAtTime(0.1 * this.seVolume, now);
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
    
    gain.gain.setValueAtTime(0.2 * this.seVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
}

export const audioManager = new AudioController();
