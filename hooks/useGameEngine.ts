
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
  fixedMap?: boolean[]; // Optional pre-calculated map mask
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

  // --- MAP GENERATION LOGIC ---

  const generateDesignedMap = (stage: number): { width: number, height: number, map: boolean[], name: LocalizedText, desc: LocalizedText, density: number } => {
    // Helper to initialize map
    const init = (w: number, h: number) => ({ w, h, data: new Array(w * h).fill(false) });
    const set = (m: {w:number, h:number, data: boolean[]}, x: number, y: number) => {
        if(x>=0 && x<m.w && y>=0 && y<m.h) m.data[y*m.w+x] = true;
    };
    
    // Shape primitives
    const drawRect = (m: any, x: number, y: number, w: number, h: number) => {
        for(let iy=y; iy<y+h; iy++) for(let ix=x; ix<x+w; ix++) set(m, ix, iy);
    };
    const drawCircle = (m: any, cx: number, cy: number, r: number) => {
        for(let y=0; y<m.h; y++) for(let x=0; x<m.w; x++) {
            if ((x-cx)**2 + (y-cy)**2 <= r**2) set(m, x, y);
        }
    };
    const drawLine = (m: any, x1: number, y1: number, x2: number, y2: number, thickness: number) => {
        const dist = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        for(let i=0; i<=dist; i++) {
            const t = i/dist;
            const x = x1 + (x2-x1)*t;
            const y = y1 + (y2-y1)*t;
            drawCircle(m, x, y, thickness/2);
        }
    };

    // --- STAGE DESIGNS ---
    let m;
    let name = { en: "Unknown", jp: "不明" };
    let desc = { en: "Explore carefully.", jp: "慎重に進め。" };
    let density = 0.15;

    // Progression: 
    // 1-5: Basics
    // 6-10: Shapes & Corners
    // 11-20: Rooms & Corridors
    // 21-30: Organic & Islands
    // 31-40: Mazes & Spirals
    // 41-50: Massive Complex

    if (stage === 1) {
        // Basic Rectangle
        m = init(20, 20); drawRect(m, 0, 0, 20, 20);
        name = { en: "Training Ground", jp: "訓練場" };
        desc = { en: "A simple square field.", jp: "基本的な四角形のフィールド。" };
        density = 0.12;
    } else if (stage === 2) {
        // Circle
        m = init(25, 25); drawCircle(m, 12.5, 12.5, 11);
        name = { en: "The Pond", jp: "円形の池" };
        desc = { en: "No corners to hide in.", jp: "角のない円形のエリア。" };
    } else if (stage === 3) {
        // Diamond
        m = init(25, 25);
        for(let y=0; y<25; y++) for(let x=0; x<25; x++) if(Math.abs(x-12)+Math.abs(y-12) <= 11) set(m, x, y);
        name = { en: "Diamond Cut", jp: "ダイヤモンド" };
        desc = { en: "Watch the sharp edges.", jp: "鋭い角に注意。" };
    } else if (stage === 4) {
        // Cross
        m = init(27, 27);
        drawRect(m, 9, 0, 9, 27); drawRect(m, 0, 9, 27, 9);
        name = { en: "Crossroads", jp: "十字路" };
        desc = { en: "Paths intersect.", jp: "道が交差する場所。" };
    } else if (stage === 5) {
        // Donut
        m = init(27, 27);
        drawCircle(m, 13.5, 13.5, 12);
        const hole = init(27,27); drawCircle(hole, 13.5, 13.5, 5);
        for(let i=0; i<m.data.length; i++) if(hole.data[i]) m.data[i] = false;
        name = { en: "The Arena", jp: "闘技場" };
        desc = { en: "Avoid the center void.", jp: "中央の虚無を避けろ。" };
    } else if (stage === 6) {
        // The Bridge (H shape basically)
        m = init(30, 20);
        drawRect(m, 0, 0, 10, 20); drawRect(m, 20, 0, 10, 20); drawRect(m, 10, 7, 10, 6);
        name = { en: "Twin Forts", jp: "双子の砦" };
        desc = { en: "Connected by a bridge.", jp: "橋で繋がれた二つのエリア。" };
    } else if (stage === 7) {
        // Hourglass
        m = init(25, 35);
        for(let y=0; y<35; y++) for(let x=0; x<25; x++) {
            const w = Math.abs(y-17.5) * 0.8 + 2;
            if (Math.abs(x-12.5) < w) set(m, x, y);
        }
        name = { en: "Hourglass", jp: "砂時計" };
        desc = { en: "Time is running out.", jp: "くびれた通路。" };
    } else if (stage === 8) {
        // The X
        m = init(30, 30);
        for(let y=0; y<30; y++) for(let x=0; x<30; x++) {
            if (Math.abs(x-y) < 4 || Math.abs(x-(29-y)) < 4) set(m, x, y);
        }
        name = { en: "The X", jp: "交差地点" };
    } else if (stage === 9) {
        // The Snake (S shape)
        m = init(30, 25);
        drawRect(m, 0, 0, 30, 7); drawRect(m, 0, 18, 30, 7);
        drawRect(m, 0, 0, 7, 15); drawRect(m, 23, 10, 7, 15);
        drawRect(m, 0, 9, 30, 7);
        name = { en: "The Snake", jp: "大蛇の道" };
        desc = { en: "A winding path.", jp: "曲がりくねった道。" };
    } else if (stage === 10) {
        // Spiral
        m = init(31, 31);
        const center = 15;
        for(let i=0; i<400; i++) {
            const angle = i * 0.1;
            const r = 2 + i * 0.04;
            set(m, Math.floor(center + Math.cos(angle)*r), Math.floor(center + Math.sin(angle)*r));
            set(m, Math.floor(center + Math.cos(angle)*(r+1)), Math.floor(center + Math.sin(angle)*(r+1)));
            set(m, Math.floor(center + Math.cos(angle)*(r-1)), Math.floor(center + Math.sin(angle)*(r-1)));
        }
        name = { en: "The Spiral", jp: "螺旋" };
        desc = { en: "Dizzying depths.", jp: "目が回るような深淵。" };
    } else if (stage >= 11 && stage <= 20) {
        // Dungeons: Connected Rooms
        const size = 30 + (stage - 10) * 2;
        m = init(size, size);
        const rooms = 4 + Math.floor((stage - 10)/2);
        const roomList = [];
        for(let i=0; i<rooms; i++) {
            const w = 6 + Math.floor(Math.random()*6);
            const h = 6 + Math.floor(Math.random()*6);
            const x = Math.floor(Math.random()*(size-w));
            const y = Math.floor(Math.random()*(size-h));
            drawRect(m, x, y, w, h);
            roomList.push({x: x+w/2, y: y+h/2});
        }
        // Connect rooms
        for(let i=0; i<roomList.length-1; i++) {
            drawLine(m, roomList[i].x, roomList[i].y, roomList[i+1].x, roomList[i+1].y, 3);
        }
        name = { en: "Dungeon Floor " + (stage-10), jp: "地下迷宮 " + (stage-10) + "層" };
        desc = { en: "Clear the rooms.", jp: "部屋を制圧せよ。" };
    } else if (stage >= 21 && stage <= 30) {
        // Islands / Organic Blobs
        const size = 35 + (stage - 20) * 2;
        m = init(size, size);
        const numBlobs = 3 + Math.floor((stage-20)/3);
        const centers = [];
        for(let k=0; k<numBlobs; k++) {
            const cx = Math.random() * size;
            const cy = Math.random() * size;
            centers.push({x:cx, y:cy});
            const rBase = 5 + Math.random()*5;
            for(let y=0; y<size; y++) for(let x=0; x<size; x++) {
                // Noisy circle
                const angle = Math.atan2(y-cy, x-cx);
                const r = rBase + Math.sin(angle*5)*1.5 + Math.cos(angle*3)*1.5;
                if ((x-cx)**2 + (y-cy)**2 < r**2) set(m, x, y);
            }
        }
        // Bridges
        for(let i=0; i<centers.length-1; i++) {
            drawLine(m, centers[i].x, centers[i].y, centers[i+1].x, centers[i+1].y, 2);
        }
        name = { en: "Archipelago " + (stage-20), jp: "群島エリア " + (stage-20) };
        desc = { en: "Islands in the void.", jp: "虚空に浮かぶ島々。" };
    } else if (stage >= 31 && stage <= 40) {
        // Mazes / Labyrinths
        const w = 40 + (stage - 30);
        const h = 40 + (stage - 30);
        m = init(w, h);
        // Simple Maze Algo (Recursive Division-ish aesthetic)
        // Fill all
        drawRect(m, 1, 1, w-2, h-2);
        // Cut holes
        for(let y=2; y<h-2; y+=2) for(let x=2; x<w-2; x+=2) {
             if (Math.random() < 0.3) {
                 // Leave pillar
                 m.data[y*w+x] = false;
                 // Randomly extend wall
                 const dir = Math.floor(Math.random()*4);
                 let dx=0, dy=0;
                 if(dir===0) dx=1; else if(dir===1) dx=-1; else if(dir===2) dy=1; else dy=-1;
                 m.data[(y+dy)*w+(x+dx)] = false;
             }
        }
        // Ensure connectivity (brute force center path)
        drawLine(m, 2, 2, w-3, h-3, 2);
        drawLine(m, 2, h-3, w-3, 2, 2);
        
        name = { en: "Labyrinth " + (stage-30), jp: "迷宮 " + (stage-30) };
        desc = { en: "Don't get lost.", jp: "迷わないように。" };
        density = 0.13; // Lower density for narrow paths
    } else if (stage >= 41 && stage <= 49) {
        // Giant Geometrics
        const s = 50 + (stage-40)*2;
        m = init(s, s);
        // Base shape
        if (stage % 3 === 0) drawCircle(m, s/2, s/2, s/2-2);
        else if (stage % 3 === 1) drawRect(m, 2, 2, s-4, s-4);
        else {
            // Triangle
            for(let y=0; y<s; y++) for(let x=0; x<s; x++) {
                if (y > Math.abs(x-s/2)*1.5 + 5 && y < s-5) set(m, x, y);
            }
        }
        // Cutouts
        const holes = 5 + Math.floor(Math.random()*5);
        for(let k=0; k<holes; k++) {
            const hx = Math.random()*s;
            const hy = Math.random()*s;
            const hr = 3 + Math.random()*5;
            // Erase circle
            for(let y=0; y<s; y++) for(let x=0; x<s; x++) {
                if ((x-hx)**2 + (y-hy)**2 < hr**2) {
                    if(x>=0 && x<s && y>=0 && y<s) m.data[y*s+x] = false;
                }
            }
        }
        name = { en: "Sector " + (stage), jp: "第" + stage + "セクター" };
        desc = { en: "A massive structure.", jp: "巨大建造物。" };
    } else {
        // Stage 50: The Final Boss Arena (Skull-ish)
        m = init(60, 60);
        // Cranium
        drawCircle(m, 30, 25, 22);
        // Jaw
        drawRect(m, 18, 40, 24, 15);
        // Eyes (Holes)
        const eraseRect = (mx:number, my:number, mw:number, mh:number) => {
            for(let y=my; y<my+mh; y++) for(let x=mx; x<mx+mw; x++) 
                 if(x>=0 && x<60 && y>=0 && y<60) m.data[y*60+x] = false;
        };
        eraseRect(20, 20, 8, 8);
        eraseRect(32, 20, 8, 8);
        // Nose
        eraseRect(28, 35, 4, 6);
        
        name = { en: "The Core", jp: "最深部" };
        desc = { en: "The end of the line.", jp: "全ての終わり。" };
        density = 0.20;
    }

    return { width: m.w, height: m.h, map: m.data, name, desc, density };
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

  const generateStageConfig = (stage: number): StageConfig => {
    // 1-50: Designed Stages
    if (stage <= 50) {
        const design = generateDesignedMap(stage);
        const mines = Math.floor(design.map.filter(b => b).length * design.density);
        return {
            width: design.width,
            height: design.height,
            mines,
            name: design.name,
            description: design.desc,
            shape: ShapeType.ORGANIC, // Placeholder, mask is used directly
            fixedMap: design.map
        };
    }

    // 51+: Random Generation
    const baseScale = Math.min(1.5, 1 + (stage - 50) * 0.05);
    const variations = [
      { name: { en: "Wide Plains", jp: "広大な平原" }, w: 50, h: 40, density: 0.15, desc: { en: "Wide open spaces.", jp: "視界は開けているが油断禁物。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Deep Dark", jp: "深淵" }, w: 35, h: 60, density: 0.16, desc: { en: "Narrow and deep.", jp: "深く、狭い道。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Archipelago", jp: "群島" }, w: 55, h: 55, density: 0.16, desc: { en: "Scattered islands.", jp: "散らばる島々。" }, shape: ShapeType.ORGANIC },
      { name: { en: "The Void", jp: "虚無" }, w: 45, h: 45, density: 0.16, desc: { en: "Don't fall in.", jp: "穴に落ちないように。" }, shape: ShapeType.ORGANIC },
    ];
    
    const type = variations[Math.floor(Math.random() * variations.length)];
    const width = Math.floor(type.w * baseScale);
    const height = Math.floor(type.h * baseScale);
    const density = Math.min(0.25, type.density + ((stage - 50) * 0.005));
    
    // Roughly estimate playable area for mine count
    const playableCells = width * height * 0.60;
    const mines = Math.floor(playableCells * density);
    
    return { width, height, mines, name: type.name, description: type.desc, shape: type.shape };
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

    if (config.fixedMap) {
        // Use pre-calculated map
        newCells.forEach((cell, idx) => {
            cell.isVoid = !config.fixedMap![idx];
        });
    } else {
        // Use random organic generation
        const organicMap = generateOrganicShape(config.width, config.height);
        newCells.forEach((cell, idx) => {
             cell.isVoid = !organicMap[idx];
        });
    }

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
