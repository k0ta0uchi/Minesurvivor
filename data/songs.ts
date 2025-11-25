
// MML Data for Audio Engine
// Intro -> A -> B -> Bridge -> Solo -> Loop

interface TrackData {
  lead: string;
  harmony: string;
  bass: string;
  drums: string;
}

export const SONGS: Record<number, TrackData> = {
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
  // Track 2: Clockwork Tower
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
      "t125 l16 k k s k k k s k k k s k k k s k k k s k k k s k k k s k k k s k " + 
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
  // Track 3: Spectral Waltz
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
  // Track 4: Blood Moon
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
      "c g# f g " +
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
  // Track 5: The Castle Keep
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
