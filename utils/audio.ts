
import { Character, Skill, SkillType } from '../types';

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

// 5 Extended Gothic Horror Tracks (Approx 2-3 mins loop)
const SONGS: Record<number, TrackData> = {
  // Track 1: The Awakening (Driving, Heroic)
  0: {
    lead: 
      "t140 o3 l8 a a a a a a a a a a a a a a a a " +
      "o4 a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c < b4 > c4 " +
      "a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c < b4 a4 " +
      "a a > e e d d c c < b b > d d c4 < a4 > f f a a g g f f e e g g f e d c " +
      "< a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c < b4 a4 " +
      "f f > c c < a a f f e e > c c < g g e e d d a a f f d d c c e e c4 r4 " +
      "f f > c c < a a f f g g > d d < b b g g a a > e e c c a a < b b > f f d4 r4 " +
      "o4 e e g# g# b b > d d c c < a a f f d d e e g# g# b b > d d e2. r4 " + 
      "l16 a b > c d e d c < b a > c e a g f e d c < b > c d e f e d c < b > c < b a g# a b > c d " +
      "e f e d c < b a g# a b > c d e f g a b > c < b a g f e d c < b a g# a4 r4 " +
      "l8 a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c < b4 a4 " +
      "a a > c c < b b a g f f a a g4 e4 a a > c c < b b a g f e d c < b4 a4",
    harmony:
      "t140 o3 l8 a a a a a a a a a a a a a a a a " +
      "f f a a g g f e d d f f e4 c4 f f a a g g f e d d f f e4 e4 " +
      "f f a a g g f e d d f f e4 c4 f f a a g g f e d d f f e4 e4 " +
      "f f > c c < b b a a g g b b a4 f4 d d f f e e d d c c e e d c < b a " +
      "f f a a g g f e d d f f e4 c4 f f a a g g f e d d f f e4 e4 " +
      "o3 a a > f f < c c a a g g > e e < c c g g f f > d d < a a f f e e g g e4 r4 " +
      "a a > f f < c c a a b b > g g < d d b b c c a a e e c c d d a a f4 r4 " +
      "g# g# b b > d d f f e e c c < a a f f g# g# b b > d d f f e2. r4 " +
      "c e a e c e a e d f a f d f a f e g b g e g b g a > c e c < a > c e c " +
      "d f a f d f a f e g b g e g b g a > c e c < a > c e c < a4 r4 " +
      "f f a a g g f e d d f f e4 c4 f f a a g g f e d d f f e4 e4 " +
      "f f a a g g f e d d f f e4 c4 f f a a g g f e d c < b a g# a",
    bass:
      "t140 o2 l8 a a a a a a a a a a a a a a a a " +
      "f f f f c c c c d d d d a a a a f f f f c c c c d d d d e e e e " +
      "f f f f c c c c d d d d a a a a f f f f c c c c d d d d e e e e " +
      "d d d d g g g g c c c c f f f f b b b b e e e e a a a a g g g g " +
      "f f f f c c c c d d d d a a a a f f f f c c c c d d d d e e e e " +
      "f f f f f f f f c c c c c c c c d d d d d d d d a a a a a a a a " +
      "f f f f f f f f g g g g g g g g a a a a a a a a d d d d d d d d " +
      "e e e e e e e e a a a a a a a a e e e e e e e e e e e e e e e e " +
      "a a a a a a a a d d d d d d d d e e e e e e e e a a a a a a a a " +
      "d d d d d d d d e e e e e e e e a a a a a a a a a a a a a a a a " +
      "f f f f c c c c d d d d a a a a f f f f c c c c d d d d e e e e " +
      "f f f f c c c c d d d d a a a a f f f f c c c c d d d d a a a a",
    drums:
      "t140 l4 k s k s k s k s" +
      "l4 k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s " +
      "k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s k s k s k8 k8 s k s"
  },
  // Track 2: Clockwork Tower (Mechanical, Baroque)
  1: {
    lead:
      "t125 o4 l16 c c r c c r c c c c r c c r c c d d r d d r d d d d r d d r d d " +
      "d f a > d < a f d f c e g > c < g e c e < b > d g > d < g d < b d a > c e a e c a c " +
      "d f a > d < a f d f c e g > c < g e c e < b > d g > d < g d < b d a > c e a e c a c " +
      "f a > c f c < a f a e g > c e c < g e g d f a > d < a f d f c e a > c < a e c e " +
      "f a > c f c < a f a e g > c e c < g e g d f a > d < a f d f e g# b > e < b g# e g# " +
      "a > c e a < g > b d g < f a > c f < e g b e d f a > d < c e g > c < b > d g b a > c e a " +
      "f a > d f < e g > c e < d f a d < c e a c < b > d g > d < a > c f c < g > b d b a > c e a " +
      "g# b > e g# < e b g# e a > c e a < e c a e f# a > d f# < d a f# d g b > d g < d b g d " +
      "d f a > d < a f d f c e g > c < g e c e < b > d g > d < g d < b d a > c e a e c a c " +
      "d f a > d < a f d f c e g > c < g e c e < b > d g > d < g d < b d a > c e a e c a c",
    harmony:
      "t125 o3 l8 r r r r r r r r r r r r r r r r " +
      "d f a f c e g e < b > d g d a > c e c " +
      "d f a f c e g e < b > d g d a > c e c " +
      "f a > c < a e g > c < g d f a f c e a e " +
      "f a > c < a e g > c < g d f a f e g# b g# " +
      "a > c e c g b d b f a c a e g b g d f a f c e g e < b > d g d a > c e c " +
      "f a > c < a e g > c < g d f a f c e a e < b > d g d a > c f c g b > d < b a > c e c " +
      "e g# b g# a > c e c d f# a f# g b > d < b " +
      "d f a f c e g e < b > d g d a > c e c " +
      "d f a f c e g e < b > d g d a > c e c",
    bass:
      "t125 o2 l4 d r d r d r d r " +
      "d d c c b b a a d d c c b b a a " +
      "f f e e d d c c f f e e d d e e " +
      "a a g g f f e e d d c c b b a a " +
      "d d c c b b a a e e f f g g a a " +
      "e e a a d d g g " +
      "d d c c b b a a d d c c b b a a",
    drums:
      "t125 l16 k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s " + 
      "k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k"  
  },
  // Track 3: Spectral Waltz (3/4 feel, Spooky)
  2: {
    lead:
      "t150 o4 l4 e r r e r r e r r e r r " +
      "e b8 a8 g2 f c8 < b8 > c2 < b g8 f8 e2 d a8 g8 a2 " +
      "e b8 a8 g2 f c8 < b8 > c2 < b > d8 c8 < b2 > c < a8 g8 a2 " + 
      "g > d8 c8 < b2 a > c8 < b8 a2 g b8 a8 g2 f a8 g8 f2 " +
      "e g8 f8 e2 d f8 e8 d2 c e8 d8 c2 < b > d8 c8 < b2 " +
      "o5 l8 e g b a c e g b d f a c e2 " +
      "e g b a c e g b d a c e2 " +
      "o3 l4 e b a g f c < b > c < b g f e d a g a " +
      "o4 e b8 a8 g2 f c8 < b8 > c2 < b > d8 c8 < b2 > c < a8 g8 a2",
    harmony:
      "t150 o3 l4 r r r r r r r r r r r r " +
      "e g b a c e g b d f a c " +
      "e g b a c e g b d a c e " + 
      "b > d < g a c f g b e f a d " +
      "e g b d f a c e g < b > d f " +
      "o4 e g b a c e g b d f a c e r " +
      "e g b a c e g b d a c e r " +
      "o3 e g b a c e g b d f a c " +
      "e g b a c e g b d a c e",
    bass:
      "t150 o2 l4 e e e e e e e e e e e e " +
      "e e e a a a g g g f f f " + 
      "e e e a a a g g g a a a " +
      "g g g f f f e e e d d d " +
      "c c c b b b a a a g g g " +
      "r r r r r r r r r r r r r r r r " +
      "e e e a a a g g g f f f " +
      "e e e a a a g g g a a a",
    drums:
      "t150 l4 k s s k s s k s s k s s " +
      "k s s k s s k s s k s s k s s k s s k s s k s s " +
      "k s s k s s k s s k s s k s s k s s k s s k s s " +
      "k s s k s s k s s k s s k s s k s s k s s k s s " +
      "k s s k s s k s s k s s k s s k s s k s s k s s " +
      "s s s s s s s s s s s s s s s s s s s s s s s s " +
      "k k s k k s k k s k k s k k s k k s k k s k k s " +
      "k s s k s s k s s k s s k s s k s s k s s k s s"
  },
  // Track 4: Blood Moon (Doom, Heavy, Slow)
  3: {
    lead:
      "t90 o3 l2 c g g# g f g c g " +
      "l8 c > c < g > c < c > c < g > c < c > c < g > c < c > c < g > c " +
      "< g# > c < g > c < g# > c < g > c < g# > c < g > c < g# > c < g > c " + 
      "< f > c < g# > c < f > c < g# > c < g > c < g > c < f > c < f > c " + 
      "< c > c < g > c < c > c < g > c < c > c < g > c < c4 > c4 " +
      "o4 l4 c g f d# d c < g > c " +
      "d# a# g# g f d# d g " +
      "c g f d# d c < g > c " +
      "g# g f d# d c < b > d " +
      "l16 c d# g > c < g d# c < g > c d# g > c < g d# c < g > " +
      "d f g# > d < g# f d < g# > d f g# > d < g# f d < g# > " +
      "d# g a# > d# < a# g d# a# > d# g a# > d# < a# g d# a# > " +
      "f g# > c f < c g# f c > f g# > c f < c g# f c > " +
      "l8 o3 c > c < g > c < c > c < g > c < c > c < g > c < c > c < g > c " +
      "< g# > c < g > c < g# > c < g > c < g# > c < g > c < g# > c < g > c " + 
      "< f > c < g# > c < f > c < g# > c < g > c < g > c < f > c < f > c " + 
      "< c > c < g > c < c > c < g > c < c > c < g > c < c4 r4",
    harmony:
      "t90 o3 l2 r r r r r r r r " +
      "l4 c c c c g# g# g# g# f f g g c c c c " +
      "c c c c g# g# g# g# f f g g c c c c " +
      "g# g# g# g# a# a# a# a# g# g# g# g# g g g g " +
      "c c c c d d d d d# d# d# d# f f f f " +
      "c c c c g# g# g# g# f f g g c c c c",
    bass:
      "t90 o1 l1 c g g# g f g c g " +
      "c g# f g c g# f g " +
      "g# a# g# g g# a# c g " +
      "c d d# f " +
      "c g# f g",
    drums:
      "t90 l4 k s k s k s k s k s k s k s k s " +
      "k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k s s s k s s s k s s s k s s s " +
      "k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s"
  },
  // Track 5: The Castle Keep (Fast, Neo-Classical)
  4: {
    lead:
      "t170 o4 l16 a > c e a < g > b d g < f a > c f < e g b e a > c e a < g > b d g < f a > c f < e4 " + 
      "a > c e a < g > b d g < f a > c f < e g b e c e a > c < b d g > b < a > c e a < g > b e g " +
      "f a > d f < e g > c e < d f a d < c e a c < b > d g b " +
      "a > c e a < g > b d g < f a > c f < e g b e a > c e a < g > b d g < f a > c f < e4 " +
      "c e g > c < g e c e < b > d g > d < g d < b d < a > c e a e c a c < g > b d b g d < b g " +
      "f a > c f c < a f a e g > c e c < g e g d f a > d < a f d f e g# b > e < b g# e g# " +
      "a b > c d e d c < b a > c e a g f e d c < b > c d e f e d c < b > c < b a g# a b > c d " +
      "e f e d c < b a g# a b > c d e f g a b > c < b a g f e d c < b a g# a4 r4 " +
      "a > c e a < g > b d g < f a > c f < e g b e a > c e a < g > b d g < f a > c f < e4",
    harmony:
      "t170 o3 l8 a > c e c g b d b f a c a e g b g a > c e c g b d b f a c a e g b g " +
      "a > c e c g b d b f a c a e g b g c e g e d f a f c e g e e g b g " + 
      "d f a f c e g e d f a f c e a e e g b g " +
      "a > c e c g b d b f a c a e g b g a > c e c g b d b f a c a e g b g " +
      "c e g e g b d b a > c e c < g b d b f a c a e g b g d f a f e g# b g# " +
      "a a a a a a a a f f f f f f f f d d d d d d d d e e e e e e e e " +
      "f f f f f f f f e e e e e e e e d d d d d d d d e e e e e e e e " +
      "a > c e c g b d b f a c a e g b g a > c e c g b d b f a c a e g b g",
    bass:
      "t170 o2 l8 a a a a g g g g f f f f e e e e a a a a g g g g f f f f e e e e " + 
      "a a a a g g g g f f f f e e e e c c c c b b b b a a a a g g g g " +
      "d d d d c c c c b b b b a a a a e e e e " +
      "a a a a g g g g f f f f e e e e a a a a g g g g f f f f e e a a " +
      "c c c c b b b b a a a a g g g g f f f f e e e e d d d d e e e e " +
      "a a g g f f e e d d c c b b e e a a g g f f e e d d c c b b e e " +
      "a a a a g g g g f f f f e e e e a a a a g g g g f f f f e e e e",
    drums:
      "t170 l8 k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " +
      "k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s k s " +
      "k k k k s k s k k k k k s k s k k k k k s k s k k k k k s k s k " +
      "k k k k s k s k k k k k s k s k k k k k s k s k k k k k s k s k " +
      "k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k"
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
  private masterVolume: number = 0.5;

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
    
    // Scale by SE Volume
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
