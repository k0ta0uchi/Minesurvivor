
import { useState, useRef, useCallback } from 'react';
import { 
  Cell, GameState, MineType, ItemType, ShapeType, 
  FloatingText, Particle, LocalizedText
} from '../types';

interface StageConfig {
  width: number;
  height: number;
  mines: number;
  name: LocalizedText;
  description: LocalizedText;
  shape: ShapeType;
}

// --- Helper Functions ---
const getNeighbors = (index: number, width: number, total: number) => {
  const x = index % width;
  const y = Math.floor(index / width);
  const neighbors: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < total / width) {
        neighbors.push(ny * width + nx);
      }
    }
  }
  return neighbors;
};

const countNeighborMines = (index: number, currentCells: Cell[], width: number) => {
  const neighbors = getNeighbors(index, width, currentCells.length);
  return neighbors.reduce((acc, nIdx) => acc + (currentCells[nIdx].isMine && !currentCells[nIdx].isVoid ? 1 : 0), 0);
};

export const useGameEngine = () => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [boardConfig, setBoardConfig] = useState({ width: 20, height: 20 });
  const [stageName, setStageName] = useState<LocalizedText>({ en: "", jp: "" });
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const ftIdCounter = useRef(0);
  const ptIdCounter = useRef(0);

  const addFloatingText = useCallback((x: number, y: number, text: string, color: string = 'text-white', icon?: string) => {
    const id = ftIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, icon }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1500);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: ptIdCounter.current++,
        x, y, color,
        dx: (Math.random() - 0.5) * 60,
        dy: (Math.random() - 0.5) * 60 
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 800);
  }, []);

  const generateStageConfig = (stage: number): StageConfig => {
    // Large maps for Google Maps style navigation
    const baseScale = Math.min(1.5, 1 + stage * 0.05);
    
    if (stage === 1) {
      return { 
        width: 30, height: 30, mines: 80, 
        name: { en: "The Outskirts", jp: "辺境" }, 
        description: { en: "A safe place to start.", jp: "まずは小手調べ。" }, 
        shape: ShapeType.ORGANIC
      };
    }

    const variations = [
      { name: { en: "Wide Plains", jp: "広大な平原" }, w: 50, h: 40, density: 0.15, desc: { en: "Wide open spaces.", jp: "視界は開けているが油断禁物。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Deep Dark", jp: "深淵" }, w: 35, h: 60, density: 0.16, desc: { en: "Narrow and deep.", jp: "深く、狭い道。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Archipelago", jp: "群島" }, w: 55, h: 55, density: 0.16, desc: { en: "Scattered islands.", jp: "散らばる島々。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Arena", jp: "闘技場" }, w: 45, h: 45, density: 0.18, desc: { en: "A circular battlefield.", jp: "円形の戦場。" }, shape: ShapeType.CIRCLE },
      { name: { en: "The Diamond", jp: "ダイヤの迷宮" }, w: 50, h: 50, density: 0.18, desc: { en: "Sharp corners.", jp: "角が鋭い。" }, shape: ShapeType.DIAMOND },
      { name: { en: "The Void", jp: "虚無" }, w: 45, h: 45, density: 0.16, desc: { en: "Don't fall in.", jp: "穴に落ちないように。" }, shape: ShapeType.DONUT },
      { name: { en: "Crossroads", jp: "十字路" }, w: 60, h: 60, density: 0.17, desc: { en: "Paths converge.", jp: "道が交差する。" }, shape: ShapeType.CROSS },
      { name: { en: "Giganticus", jp: "巨大要塞" }, w: 70, h: 70, density: 0.14, desc: { en: "Massive territory.", jp: "広大な領域。" }, shape: ShapeType.RECTANGLE },
    ];
    
    // Heavily favor Organic maps for the "free form" feel
    let allowed = variations;
    if (Math.random() < 0.7) {
        allowed = variations.filter(v => v.shape === ShapeType.ORGANIC);
    }

    const type = allowed[Math.floor(Math.random() * allowed.length)];
    const width = Math.floor(type.w * baseScale);
    const height = Math.floor(type.h * baseScale);

    const density = Math.min(0.25, type.density + (stage * 0.005));
    
    // Estimate playable area
    let areaFactor = 1;
    if (type.shape === ShapeType.CIRCLE) areaFactor = 0.78;
    if (type.shape === ShapeType.DIAMOND) areaFactor = 0.5;
    if (type.shape === ShapeType.DONUT) areaFactor = 0.6;
    if (type.shape === ShapeType.CROSS) areaFactor = 0.55;
    if (type.shape === ShapeType.ORGANIC) areaFactor = 0.60; 
    
    const playableCells = width * height * areaFactor;
    const mines = Math.floor(playableCells * density);
    
    return { width, height, mines, name: type.name, description: type.desc, shape: type.shape };
  };

  const generateOrganicShape = (width: number, height: number): boolean[] => {
      // Initialize with random noise
      let map = new Array(width * height).fill(false).map(() => Math.random() < 0.50);

      // Cellular Automata Smoothing (make it look like caves/terrain)
      const iterations = 4;
      for (let i = 0; i < iterations; i++) {
          const newMap = [...map];
          for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                  let neighbors = 0;
                  for (let dy = -1; dy <= 1; dy++) {
                      for (let dx = -1; dx <= 1; dx++) {
                          if (dx === 0 && dy === 0) continue;
                          const nx = x + dx;
                          const ny = y + dy;
                          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                              if (map[ny * width + nx]) neighbors++;
                          }
                      }
                  }
                  
                  const idx = y * width + x;
                  if (map[idx]) {
                      newMap[idx] = neighbors >= 4;
                  } else {
                      newMap[idx] = neighbors >= 5;
                  }
              }
          }
          map = newMap;
      }
      
      // Filter: Keep only the largest connected component to ensure playability
      const visited = new Set<number>();
      let maxRegion: number[] = [];
      
      for(let i=0; i<width*height; i++) {
          if(map[i] && !visited.has(i)) {
              const region: number[] = [];
              const stack = [i];
              visited.add(i);
              
              while(stack.length > 0) {
                  const curr = stack.pop()!;
                  region.push(curr);
                  
                  const cx = curr % width;
                  const cy = Math.floor(curr / width);
                  
                  // Orthogonal neighbors for flood fill
                  const neighbors = [
                      {x: cx+1, y: cy}, {x: cx-1, y: cy},
                      {x: cx, y: cy+1}, {x: cx, y: cy-1}
                  ];
                  
                  for(const n of neighbors) {
                      if(n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                          const nIdx = n.y * width + n.x;
                          if(map[nIdx] && !visited.has(nIdx)) {
                              visited.add(nIdx);
                              stack.push(nIdx);
                          }
                      }
                  }
              }
              
              if(region.length > maxRegion.length) {
                  maxRegion = region;
              }
          }
      }
      
      // Rebuild map with only largest region
      const finalMap = new Array(width*height).fill(false);
      for(const idx of maxRegion) finalMap[idx] = true;
      
      // Ensure it's not empty (fallback to center block if failed)
      if (maxRegion.length === 0) {
          const cx = Math.floor(width/2);
          const cy = Math.floor(height/2);
          for(let y=cy-5; y<=cy+5; y++)
            for(let x=cx-5; x<=cx+5; x++) 
                if(x>=0 && x<width && y>=0 && y<height) finalMap[y*width+x] = true;
      }

      return finalMap;
  };

  const applyShapeMask = (cells: Cell[], width: number, height: number, shape: ShapeType) => {
    const cx = (width - 1) / 2;
    const cy = (height - 1) / 2;
    const radius = Math.min(width, height) / 2;
    
    let organicMap: boolean[] = [];
    if (shape === ShapeType.ORGANIC) {
        organicMap = generateOrganicShape(width, height);
    }

    cells.forEach((cell, idx) => {
      let isVoid = false;
      const dx = Math.abs(cell.x - cx);
      const dy = Math.abs(cell.y - cy);
      const distSq = (cell.x - cx) ** 2 + (cell.y - cy) ** 2;

      switch (shape) {
        case ShapeType.CIRCLE: if (distSq > radius * radius) isVoid = true; break;
        case ShapeType.DIAMOND: if (dx + dy > radius) isVoid = true; break;
        case ShapeType.DONUT: if (distSq > radius * radius || distSq < (radius * 0.4) ** 2) isVoid = true; break;
        case ShapeType.CROSS: if (!(dx < width * 0.175) && !(dy < height * 0.175)) isVoid = true; break;
        case ShapeType.ORGANIC: isVoid = !organicMap[idx]; break;
        default: isVoid = false;
      }
      cell.isVoid = isVoid;
    });
  };

  const createBoard = (stage: number) => {
    const config = generateStageConfig(stage);
    setBoardConfig({ width: config.width, height: config.height });
    setStageName(config.name);
    
    const totalCells = config.width * config.height;
    const newCells: Cell[] = Array.from({ length: totalCells }, (_, i) => ({
      id: `cell-${i}`, x: i % config.width, y: Math.floor(i / config.width),
      isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0,
      mineType: MineType.NORMAL, itemType: ItemType.NONE, isLooted: false, isVoid: false
    }));

    applyShapeMask(newCells, config.width, config.height, config.shape);
    const validIndices = newCells.map((c, i) => c.isVoid ? -1 : i).filter(i => i !== -1);
    
    let minesPlaced = 0;
    while (minesPlaced < config.mines && validIndices.length > 0) {
      const r = Math.floor(Math.random() * validIndices.length);
      const idx = validIndices[r];
      if (!newCells[idx].isMine) {
        newCells[idx].isMine = true;
        if (Math.random() < 0.20) newCells[idx].mineType = MineType.MONSTER;
        minesPlaced++;
      }
    }

    newCells.forEach(cell => {
      if (!cell.isMine && !cell.isVoid) {
        const r = Math.random();
        if (r < 0.03) cell.itemType = ItemType.POTION;
        else if (r < 0.05) cell.itemType = ItemType.CHEST;
      }
    });

    newCells.forEach((cell, idx) => {
      if (cell.isMine || cell.isVoid) return;
      cell.neighborMines = countNeighborMines(idx, newCells, config.width);
    });

    setCells(newCells);
    setFloatingTexts([]);
    setParticles([]);
  };

  return {
    cells, setCells,
    boardConfig,
    stageName,
    floatingTexts, addFloatingText,
    particles, spawnParticles,
    createBoard,
    getNeighbors,
    countNeighborMines
  };
};
