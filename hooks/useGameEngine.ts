
import { useState, useRef, useCallback } from 'react';
import { 
  Cell, PlayerStats, GameState, MineType, ItemType, ShapeType, 
  FloatingText, Particle, LocalizedText, SkillType 
} from '../types';
import { UI_TEXT } from '../data/locales';
import { LEVEL_BASE_XP } from '../data/gameData';
import { audioManager } from '../utils/audio';

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
  const [boardConfig, setBoardConfig] = useState({ width: 12, height: 16 });
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
    if (stage === 1) {
      return { 
        width: 12, height: 16, mines: 25, 
        name: { en: "The Outskirts", jp: "辺境" }, 
        description: { en: "A safe place to start.", jp: "まずは小手調べ。" }, 
        shape: ShapeType.RECTANGLE 
      };
    }
    const variations = [
      { name: { en: "Wide Plains", jp: "広大な平原" }, width: 20, height: 12, density: 0.15, desc: { en: "Wide open spaces.", jp: "視界は開けているが油断禁物。" }, shape: ShapeType.RECTANGLE },
      { name: { en: "The Deep Dark", jp: "深淵" }, width: 12, height: 20, density: 0.15, desc: { en: "Narrow and deep.", jp: "深く、狭い道。" }, shape: ShapeType.RECTANGLE },
      { name: { en: "Minefield", jp: "地雷原" }, width: 14, height: 14, density: 0.20, desc: { en: "Watch your step!", jp: "足元に注意しろ！" }, shape: ShapeType.RECTANGLE },
      { name: { en: "The Arena", jp: "闘技場" }, width: 17, height: 17, density: 0.18, desc: { en: "A circular battlefield.", jp: "円形の戦場。" }, shape: ShapeType.CIRCLE },
      { name: { en: "The Diamond", jp: "ダイヤの迷宮" }, width: 19, height: 19, density: 0.18, desc: { en: "Sharp corners.", jp: "角が鋭い。" }, shape: ShapeType.DIAMOND },
      { name: { en: "The Void", jp: "虚無" }, width: 17, height: 17, density: 0.15, desc: { en: "Don't fall in.", jp: "穴に落ちないように。" }, shape: ShapeType.DONUT },
      { name: { en: "Crossroads", jp: "十字路" }, width: 17, height: 17, density: 0.18, desc: { en: "Paths converge.", jp: "道が交差する。" }, shape: ShapeType.CROSS },
      { name: { en: "Giganticus", jp: "巨大要塞" }, width: 22, height: 22, density: 0.15, desc: { en: "Massive territory.", jp: "広大な領域。" }, shape: ShapeType.RECTANGLE },
    ];
    const allowed = variations.filter(v => stage > 3 ? true : v.name.en !== 'Giganticus');
    const type = allowed[Math.floor(Math.random() * allowed.length)];
    const density = Math.min(0.25, type.density + (stage * 0.005));
    let areaFactor = 1;
    if (type.shape === ShapeType.CIRCLE) areaFactor = 0.78;
    if (type.shape === ShapeType.DIAMOND) areaFactor = 0.5;
    if (type.shape === ShapeType.DONUT) areaFactor = 0.6;
    if (type.shape === ShapeType.CROSS) areaFactor = 0.55;
    const playableCells = type.width * type.height * areaFactor;
    const mines = Math.floor(playableCells * density);
    return { width: type.width, height: type.height, mines, name: type.name, description: type.desc, shape: type.shape };
  };

  const applyShapeMask = (cells: Cell[], width: number, height: number, shape: ShapeType) => {
    const cx = (width - 1) / 2;
    const cy = (height - 1) / 2;
    const radius = Math.min(width, height) / 2;
    cells.forEach(cell => {
      const dx = Math.abs(cell.x - cx);
      const dy = Math.abs(cell.y - cy);
      const distSq = (cell.x - cx) ** 2 + (cell.y - cy) ** 2;
      let isVoid = false;
      switch (shape) {
        case ShapeType.CIRCLE: if (distSq > radius * radius) isVoid = true; break;
        case ShapeType.DIAMOND: if (dx + dy > radius) isVoid = true; break;
        case ShapeType.DONUT: if (distSq > radius * radius || distSq < (radius * 0.4) ** 2) isVoid = true; break;
        case ShapeType.CROSS: if (!(dx < width * 0.175) && !(dy < height * 0.175)) isVoid = true; break;
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
