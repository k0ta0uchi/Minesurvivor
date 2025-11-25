
import React, { useMemo } from 'react';

// 16x16 Pixel Art Grids
// . = transparent
// K = Black (Outline/Shadow)
// S = Skin
// W = White (Eye/Highlight)
// R = Red
// B = Blue (Miner primary)
// C = Cyan (Miner accent)
// O = Orange (Miner light)
// P = Purple (Scholar primary)
// M = Magenta (Scholar accent)
// Y = Yellow (Scholar gold)
// G = Green (Rogue primary)
// D = Dark Green (Rogue shadow)
// L = Leather/Brown
// V = Violet (Enemy)
// E = Emerald (Enemy)
// Z = Zinc (Enemy Gray)

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  'K': '#1a1a1a', // Almost black
  'S': '#fca5a5', // Skin
  'W': '#ffffff',
  'R': '#ef4444',
  'B': '#2563eb', // Blue
  'C': '#60a5fa', // Light Blue
  'O': '#fbbf24', // Orange/Gold
  'P': '#7e22ce', // Purple
  'M': '#c084fc', // Light Purple
  'Y': '#fde047', // Yellow
  'G': '#16a34a', // Green
  'D': '#14532d', // Dark Green
  'L': '#78350f', // Brown
  'H': '#9ca3af', // Grey/Silver
  'V': '#8b5cf6', // Violet
  'E': '#10b981', // Emerald
  'Z': '#52525b', // Zinc
};

const SPRITES: Record<string, string[]> = {
  // The Sapper: Mining helmet with light, beard, sturdy look
  miner: [
    "......KKKK......",
    ".....KCCCCK.....",
    "....KCCCCCCK....",
    "...KCCCOOOCK....",
    "...KCCCOOOCK....",
    "...KCCCCCCK.....",
    "...KKKKKKKK.....",
    "..KSSSKKKSSK....",
    "..KWSKSSKSWK....",
    "..KSSKSSKSSK....",
    "..KLLLLLLLLK....",
    "..KLLLLLLLLK....",
    "..KLLLLLLLLK....",
    "..KBBBBBBBBK....",
    "..KBBBBBBBBK....",
    "...KK....KK.....",
  ],
  // The Scholar: Wizard hat, white beard, mystical robes
  scholar: [
    ".......KK.......",
    "......KMMK......",
    ".....KMMMMK.....",
    "....KMMMMMMK....",
    "...KMMMMMMMMK...",
    "..KYYKKKKKKYYK..",
    "..KSSSKKKSSSK...",
    "..KSWSKSSKWSK...",
    "..KSSSKSSKSSK...",
    "..KWWWWWWWWWK...",
    "..KWWWWWWWWWK...",
    "..KPPPPPPPPPK...",
    ".KPPPPYYYPPPPK..",
    ".KPPPPYYYPPPPK..",
    ".KPPPPPPPPPPPK..",
    "..KKK.....KKK...",
  ],
  // The Rogue: Hooded, masked, mysterious
  gambler: [
    "......KKKK......",
    ".....KGGGGK.....",
    "....KGGGGGGK....",
    "...KGGGGGGGGK...",
    "...KGGKKKKGGK...",
    "..KGGKSSSSKGGK..",
    "..KGGKWSWSKGGK..",
    "..KGGKSSSSKGGK..",
    "..KGGKKKKKKGGK..",
    "..KGGGGGGGGGGK..",
    "..KGDGGGGGGDGK..",
    ".KGGDGGGGGGDGGK.",
    ".KGGDDGGGDDGGGK.",
    ".KGGGGDDDGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    "..KKK.....KKK...",
  ],
  // Enemies
  enemy_slime: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "......K..K......",
    ".....K....K.....",
    "....K..GG..K....", // Changed to Green
    "...K.G.GG.G.K...",
    "...K.GGGGGG.K...",
    "..KG.KWWGWWK.GK.",
    ".KGGGGGGGGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    ".KGGGGGGGGGGGGK.",
    "..KKKKKKKKKKKK..",
    "................",
  ],
  enemy_bat: [
    "................",
    ".K............K.",
    ".KK..........KK.",
    ".KVK........KVK.",
    ".KVVK......KVVK.",
    ".KVVVK....KVVVK.",
    ".KVVVVKKKKVVVVK.",
    "..KVVVVVVVVVVK..",
    "..KVVWVWWVWVVK..",
    "...KVVVVVVVVK...",
    "...KVVVVVVVVK...",
    "....KVVKKVVK....",
    ".....KV..VK.....",
    "......K..K......",
    "................",
    "................",
  ],
  enemy_eye: [
    "................",
    "......KKKK......",
    ".....KEEEEK.....",
    "....KEEEEEEK....",
    "...KEEEEEEEEK...",
    "..KEEEEEEEEEEK..",
    "..KEEEWWWWEEEK..",
    "..KEEWKRRKWEEK..",
    "..KEEWKRRKWEEK..",
    "..KEEEWWWWEEEK..",
    "..KEEEEEEEEEEK..",
    "..KKEEEEEEEEKK..",
    ".K..KEEEEEEK..K.",
    "K....KKKKKK....K",
    "................",
    "................",
  ],
  enemy_ghost: [
    "................",
    "......KKKK......",
    ".....KZZZZK.....",
    "....KZZZZZZK....",
    "...KZZZZZZZZK...",
    "..KZZZZZZZZZZK..",
    "..KZZZZZZZZZZK..",
    "..KZZKZZZZKZZK..",
    "..KZZKZZZZKZZK..",
    "..KZZZZZZZZZZK..",
    "..KZZZZZZZZZZK..",
    "..KZZZZZZZZZZK..",
    "..KZZZZZZZZZZK..",
    "...KZ.KZZ.KZ.K..",
    "...K..K..K..K...",
    "................",
  ]
};

interface PixelCharacterProps {
  id: string;
  className?: string;
  scale?: number;
}

const PixelSprite: React.FC<{ spriteData: string[], className?: string }> = ({ spriteData, className }) => {
  const pixelSize = 100 / 16;
  const pixels = useMemo(() => {
    const rects = [];
    for (let y = 0; y < 16; y++) {
      const row = spriteData[y];
      for (let x = 0; x < 16; x++) {
        const char = row[x];
        if (char !== '.') {
          rects.push(
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize + 0.1}
              height={pixelSize + 0.1}
              fill={PALETTE[char] || '#000'}
            />
          );
        }
      }
    }
    return rects;
  }, [spriteData, pixelSize]);

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="w-full h-full drop-shadow-lg"
      >
        {pixels}
      </svg>
    </div>
  );
};

export const PixelCharacter: React.FC<PixelCharacterProps> = ({ id, className }) => {
  const spriteData = SPRITES[id] || SPRITES['miner'];
  return <PixelSprite spriteData={spriteData} className={className} />;
};

export const PixelEnemy: React.FC<{ seed: number, className?: string }> = ({ seed, className }) => {
  const variants = ['enemy_slime', 'enemy_bat', 'enemy_eye', 'enemy_ghost'];
  // Deterministic random based on seed (e.g. cell index)
  const variantId = variants[seed % variants.length];
  
  // Add animation class based on type
  let animClass = "";

  switch (variantId) {
      case 'enemy_slime': 
          animClass = "animate-slime-squish"; 
          break;
      case 'enemy_bat': 
          animClass = "animate-bat-flap"; 
          break;
      case 'enemy_eye': 
          animClass = "animate-eye-pulse"; 
          break;
      case 'enemy_ghost': 
          animClass = "animate-ghost-float"; 
          break;
      default:
          animClass = "animate-bounce-small";
  }

  return (
    <div className={`${animClass} ${className} flex items-center justify-center`}>
        <PixelSprite spriteData={SPRITES[variantId]} className="w-full h-full" />
    </div>
  );
};
