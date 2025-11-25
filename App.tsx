
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Cell, Character, Skill, SkillType, PlayerStats, MineType, ItemType, FloatingText, ShapeType, Language, LocalizedText } from './types';
import { GameBoard } from './components/GameBoard';
import { Sidebar } from './components/Sidebar';
import { LevelUpModal } from './components/LevelUpModal';
import { Icons } from './components/Icons';
import { PixelCharacter } from './components/PixelCharacters';
import { audioManager } from './utils/audio';
import { CHARACTERS, AVAILABLE_SKILLS, LEVEL_BASE_XP, XP_SCALING_FACTOR } from './data/gameData';
import { UI_TEXT } from './data/locales';

// --- Constants ---
const BASE_WIDTH = 12;
const BASE_HEIGHT = 16;

interface StageConfig {
  width: number;
  height: number;
  mines: number;
  name: LocalizedText;
  description: LocalizedText;
  shape: ShapeType;
}

export default function App() {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [character, setCharacter] = useState<Character | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [boardConfig, setBoardConfig] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });
  const [stageName, setStageName] = useState<LocalizedText>({ en: "", jp: "" });
  
  // Settings
  const [lang, setLang] = useState<Language>('en');
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [seEnabled, setSeEnabled] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    currentXp: 0,
    neededXp: LEVEL_BASE_XP,
    shields: 0,
    score: 0,
    skills: [],
    stage: 1,
    limitGauge: 0
  });
  const [levelUpOptions, setLevelUpOptions] = useState<Skill[]>([]);
  const [gameOverReason, setGameOverReason] = useState<'win' | 'lose' | null>(null);
  
  // Floating Texts
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const ftIdCounter = useRef(0);

  // Combo System
  const [combo, setCombo] = useState(0);
  const comboTimerRef = useRef<number | null>(null);

  // --- Refs for Game Loop Logic ---
  const stateRef = useRef({ cells, stats, gameState, character, boardConfig, combo, lang });
  useEffect(() => {
    stateRef.current = { cells, stats, gameState, character, boardConfig, combo, lang };
  }, [cells, stats, gameState, character, boardConfig, combo, lang]);

  // --- Music Control ---
  useEffect(() => {
    audioManager.setBgmEnabled(bgmEnabled);
    audioManager.setSeEnabled(seEnabled);

    if (gameState === GameState.PLAYING) {
      audioManager.startMusic(stats.stage);
    } else {
      audioManager.stopMusic();
    }
    
    return () => {
      audioManager.stopMusic();
    };
  }, [gameState, stats.stage, bgmEnabled, seEnabled]);

  // --- Helpers for Grid Logic ---

  const getNeighbors = useCallback((index: number, width: number, total: number) => {
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
  }, []);

  const countNeighborMines = (index: number, currentCells: Cell[], width: number) => {
      const neighbors = getNeighbors(index, width, currentCells.length);
      return neighbors.reduce((acc, nIdx) => acc + (currentCells[nIdx].isMine && !currentCells[nIdx].isVoid ? 1 : 0), 0);
  };

  const addFloatingText = (x: number, y: number, text: string, color: string = 'text-white', icon?: string) => {
    const id = ftIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, icon }]);
    setTimeout(() => {
        setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1500);
  };

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

    const allowedVariations = variations.filter(v => stage > 3 ? true : v.name.en !== 'Giganticus');
    const type = allowedVariations[Math.floor(Math.random() * allowedVariations.length)];
    
    const density = Math.min(0.25, type.density + (stage * 0.005));
    let areaFactor = 1;
    if (type.shape === ShapeType.CIRCLE) areaFactor = 0.78;
    if (type.shape === ShapeType.DIAMOND) areaFactor = 0.5;
    if (type.shape === ShapeType.DONUT) areaFactor = 0.6;
    if (type.shape === ShapeType.CROSS) areaFactor = 0.55;

    const playableCells = type.width * type.height * areaFactor;
    const mines = Math.floor(playableCells * density);

    return {
      width: type.width,
      height: type.height,
      mines: mines,
      name: type.name,
      description: type.desc,
      shape: type.shape
    };
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
              case ShapeType.CIRCLE:
                  if (distSq > radius * radius) isVoid = true;
                  break;
              case ShapeType.DIAMOND:
                  if (dx + dy > radius) isVoid = true;
                  break;
              case ShapeType.DONUT:
                  const outer = radius * radius;
                  const inner = (radius * 0.4) ** 2;
                  if (distSq > outer || distSq < inner) isVoid = true;
                  break;
              case ShapeType.CROSS:
                  const stripW = width * 0.35;
                  const stripH = height * 0.35;
                  const inV = dx < stripW / 2;
                  const inH = dy < stripH / 2;
                  if (!inV && !inH) isVoid = true;
                  break;
              case ShapeType.RECTANGLE:
              default:
                  isVoid = false;
                  break;
          }
          cell.isVoid = isVoid;
      });
  };

  const startStage = (stageNum: number, currentStats: PlayerStats, char: Character) => {
    const config = generateStageConfig(stageNum);
    setBoardConfig({ width: config.width, height: config.height });
    setStageName(config.name);

    const totalCells = config.width * config.height;
    const newCells: Cell[] = Array.from({ length: totalCells }, (_, i) => ({
      id: `cell-${i}`,
      x: i % config.width,
      y: Math.floor(i / config.width),
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
      mineType: MineType.NORMAL,
      itemType: ItemType.NONE,
      isLooted: false,
      isVoid: false
    }));

    applyShapeMask(newCells, config.width, config.height, config.shape);

    const validCellIndices = newCells
        .map((c, i) => c.isVoid ? -1 : i)
        .filter(i => i !== -1);

    let minesPlaced = 0;
    while (minesPlaced < config.mines && validCellIndices.length > 0) {
      const r = Math.floor(Math.random() * validCellIndices.length);
      const idx = validCellIndices[r];
      
      if (!newCells[idx].isMine) {
        newCells[idx].isMine = true;
        if (Math.random() < 0.20) {
            newCells[idx].mineType = MineType.MONSTER;
        }
        minesPlaced++;
      }
    }

    newCells.forEach(cell => {
        if (!cell.isMine && !cell.isVoid) {
            const rand = Math.random();
            if (rand < 0.03) {
                cell.itemType = ItemType.POTION;
            } else if (rand < 0.05) {
                cell.itemType = ItemType.CHEST;
            }
        }
    });

    newCells.forEach((cell, idx) => {
      if (cell.isMine || cell.isVoid) return;
      cell.neighborMines = countNeighborMines(idx, newCells, config.width);
    });

    setCells(newCells);
    setStats({...currentStats, stage: stageNum, limitGauge: Math.min(100, currentStats.limitGauge + 20)}); 
    setGameState(GameState.PLAYING);
    setGameOverReason(null);
    setCombo(0);
    setFloatingTexts([]); 
    
    if (stageNum === 1) {
      audioManager.playLevelUp();
    }
  };

  const initializeGame = (char: Character) => {
    setCharacter(char);
    const initialSkills = AVAILABLE_SKILLS.filter(s => char.startingSkills.includes(s.id)).map(s => ({...s, level: 1, value: s.value + s.valuePerLevel}));
    
    const initialStats: PlayerStats = {
      level: 1,
      currentXp: 0,
      neededXp: LEVEL_BASE_XP,
      shields: char.baseStats.maxShields,
      score: 0,
      skills: initialSkills,
      stage: 1,
      limitGauge: 0
    };

    setStats(initialStats);
    startStage(1, initialStats, char);
  };

  const advanceNextStage = () => {
    if (!character) return;
    const nextStageNum = stats.stage + 1;
    const stageBonus = stats.stage * 500;
    const newStats = { ...stats, score: stats.score + stageBonus };
    startStage(nextStageNum, newStats, character);
  };

  // --- Core Actions ---

  const gainXp = (amount: number) => {
    setStats(prev => {
      const xpMultSkill = prev.skills.find(s => s.type === SkillType.PASSIVE_XP);
      const charMult = character ? character.baseStats.xpMultiplier : 1;
      const skillMult = xpMultSkill ? xpMultSkill.value : 1;
      
      const realAmount = amount * charMult * skillMult;
      let newXp = prev.currentXp + realAmount;
      
      const newLimit = Math.min(100, prev.limitGauge + (amount > 0 ? 2 : 0));
      if (prev.limitGauge < 100 && newLimit >= 100) {
        audioManager.playUltimateReady();
      }

      return { ...prev, currentXp: newXp, limitGauge: newLimit };
    });
  };
  
  const addCombo = () => {
      setCombo(prev => prev + 1);
      audioManager.playCombo(stateRef.current.combo);
      
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => {
          setCombo(0);
      }, 3000); 
  };

  useEffect(() => {
    if ((gameState === GameState.PLAYING || gameState === GameState.STAGE_CLEAR) && stats.currentXp >= stats.neededXp) {
        prepareLevelUp();
    }
  }, [stats.currentXp, gameState, stats.neededXp]);


  const handleUseSkill = (skillId: string) => {
    if (gameState !== GameState.PLAYING) return;

    const skill = stats.skills.find(s => s.id === skillId);
    if (!skill) return;

    if (skill.type === SkillType.ITEM_SONAR) {
        if (skill.value <= 0) return;
        setStats(prev => ({
            ...prev,
            skills: prev.skills.map(s => s.id === skillId ? { ...s, value: s.value - 1 } : s)
        }));
        triggerSonar();
    }
  };

  const handleUseUltimate = () => {
      if (gameState !== GameState.PLAYING) return;
      if (stats.limitGauge < 100) return;
      if (!character) return;

      audioManager.playUltimateCast();
      
      const { cells: currentCells, boardConfig } = stateRef.current;
      let newCells = [...currentCells];
      let xpGained = 0;

      setStats(prev => ({ ...prev, limitGauge: 0 }));

      if (character.id === 'miner') {
          const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid);
          if (safeHidden.length > 0) {
              const target = safeHidden[Math.floor(Math.random() * safeHidden.length)];
              const targetIdx = parseInt(target.id.split('-')[1]);
              const tx = targetIdx % boardConfig.width;
              const ty = Math.floor(targetIdx / boardConfig.width);
              
              for (let dy = -2; dy <= 2; dy++) {
                  for (let dx = -2; dx <= 2; dx++) {
                      const nx = tx + dx;
                      const ny = ty + dy;
                      if (nx >= 0 && nx < boardConfig.width && ny >= 0 && ny < boardConfig.height) {
                          const idx = ny * boardConfig.width + nx;
                          if (newCells[idx].isVoid) continue;
                          
                          if (newCells[idx].isMine) {
                             newCells[idx].isFlagged = true; 
                          } else if (!newCells[idx].isRevealed) {
                             newCells[idx].isRevealed = true;
                             xpGained += 10;
                             if (newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) {
                                collectItem(newCells[idx]);
                                newCells[idx].isLooted = true;
                             }
                          }
                      }
                  }
              }
          }
      } else if (character.id === 'scholar') {
          const hiddenMines = newCells.filter(c => c.isMine && !c.isFlagged && !c.isVoid);
          const toFlag = hiddenMines.sort(() => 0.5 - Math.random()).slice(0, 5);
          toFlag.forEach(c => {
             const idx = parseInt(c.id.split('-')[1]);
             newCells[idx].isFlagged = true;
          });
          const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).sort(() => 0.5 - Math.random()).slice(0, 5);
          safeHidden.forEach(c => {
             const idx = parseInt(c.id.split('-')[1]);
             newCells[idx].isRevealed = true;
             xpGained += 20; 
             if (newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) {
                collectItem(newCells[idx]);
                newCells[idx].isLooted = true;
             }
          });
      } else if (character.id === 'gambler') {
           const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).sort(() => 0.5 - Math.random()).slice(0, 7);
           safeHidden.forEach(c => {
              const idx = parseInt(c.id.split('-')[1]);
              newCells[idx].isRevealed = true;
              xpGained += 50; 
              if (newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) {
                collectItem(newCells[idx]);
                newCells[idx].isLooted = true;
             }
           });
      }

      setCells(newCells);
      gainXp(xpGained);
      checkWinCondition(newCells);
  };

  const triggerSonar = () => {
    const { cells: currentCells, stats: currentStats, character, boardConfig } = stateRef.current;
    
    const candidates = currentCells.filter(c => !c.isMine && !c.isRevealed && !c.isFlagged && !c.isVoid);
    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const toRevealIds = new Set<string>();
    
    toRevealIds.add(target.id);
    const neighbors = getNeighbors(currentCells.indexOf(target), boardConfig.width, currentCells.length);
    neighbors.forEach(nIdx => {
      const n = currentCells[nIdx];
      if (!n.isMine && !n.isRevealed && !n.isFlagged && !n.isVoid) {
        toRevealIds.add(n.id);
      }
    });

    if (toRevealIds.size === 0) return;

    audioManager.playSonar();

    const newCells = [...currentCells];
    let xpGained = 0;

    toRevealIds.forEach(id => {
      const idx = parseInt(id.split('-')[1]);
      const cell = newCells[idx];
      if (!cell.isRevealed) {
        cell.isRevealed = true;
        xpGained += 10;
        
        if (cell.itemType !== ItemType.NONE && !cell.isLooted) {
            collectItem(cell);
            cell.isLooted = true;
        }

        const luckSkill = currentStats.skills.find(s => s.type === SkillType.PASSIVE_LUCK);
        const baseLuck = character?.baseStats.luck || 0;
        if (Math.random() < baseLuck + (luckSkill?.value || 0)) {
            xpGained += 20;
        }
      }
    });

    setCells(newCells);
    
    setStats(prev => {
        const greed = prev.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
        const scoreAdd = Math.floor(xpGained * greed);
        
        const charMult = character ? character.baseStats.xpMultiplier : 1;
        const xpMultSkill = prev.skills.find(s => s.type === SkillType.PASSIVE_XP);
        const skillMult = xpMultSkill ? xpMultSkill.value : 1;
        const realXp = xpGained * charMult * skillMult;
        
        return {
          ...prev,
          score: prev.score + scoreAdd,
          currentXp: prev.currentXp + realXp
        };
    });
    
    addCombo();
    checkWinCondition(newCells);
  };

  const prepareLevelUp = () => {
    audioManager.playLevelUp();
    setGameState(GameState.LEVEL_UP);
    
    const currentSkillIds = stats.skills.map(s => s.id);
    
    const pool = [
        ...stats.skills.filter(s => s.level < s.maxLevel), // Upgrades
        ...AVAILABLE_SKILLS.filter(s => !currentSkillIds.includes(s.id)) // New
    ];

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const options = shuffled.slice(0, 3);
    
    setLevelUpOptions(options);
  };

  const applySkillSelection = (selectedSkill: Skill) => {
    setStats(prev => {
        const existingIdx = prev.skills.findIndex(s => s.id === selectedSkill.id);
        let newSkills = [...prev.skills];
        let shieldAdd = 0;

        if (existingIdx >= 0) {
            const s = newSkills[existingIdx];
            newSkills[existingIdx] = {
                ...s,
                level: s.level + 1,
                value: s.value + s.valuePerLevel 
            };
            if (s.type === SkillType.PASSIVE_SHIELD) shieldAdd = 1;
        } else {
            const newSkill = {
                ...selectedSkill,
                level: 1,
                value: selectedSkill.value + selectedSkill.valuePerLevel 
            };
            newSkills.push(newSkill);
            if (newSkill.type === SkillType.PASSIVE_SHIELD) shieldAdd = 1;
        }
        
        return {
            ...prev,
            level: prev.level + 1,
            neededXp: Math.floor(prev.neededXp * XP_SCALING_FACTOR),
            currentXp: prev.currentXp - prev.neededXp,
            skills: newSkills,
            shields: prev.shields + shieldAdd
        };
    });
    
    if (gameOverReason === 'win' && cells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).length === 0) {
       setGameState(GameState.STAGE_CLEAR);
    } else {
       setGameState(GameState.PLAYING);
    }
  };

  const collectItem = (cell: Cell) => {
      const currentLang = stateRef.current.lang;
      if (cell.itemType === ItemType.POTION) {
          audioManager.playItemPickup();
          setStats(prev => ({...prev, shields: prev.shields + 1 }));
          const text = currentLang === 'en' ? "+1 SHIELD" : "+1 シールド";
          addFloatingText(cell.x, cell.y, text, "text-blue-400", "🛡️");
      } else if (cell.itemType === ItemType.CHEST) {
          audioManager.playChest();
          const scoreBonus = 1000;
          const xpBonus = 150;
          setStats(prev => ({...prev, score: prev.score + scoreBonus, currentXp: prev.currentXp + xpBonus }));
          addFloatingText(cell.x, cell.y, UI_TEXT.treasure[currentLang], "text-yellow-300", "💎");
          setTimeout(() => addFloatingText(cell.x, cell.y, `+${scoreBonus} PTS`, "text-yellow-200"), 300);
          setTimeout(() => addFloatingText(cell.x, cell.y, `+${xpBonus} XP`, "text-purple-300"), 600);
      }
  };

  const handleCombat = (index: number) => {
      const currentLang = stateRef.current.lang;
      if (stats.shields <= 0) {
          audioManager.playExplosion();
          const newCells = [...cells];
          newCells[index].isRevealed = true; 
          setCells(newCells);
          setGameState(GameState.GAME_OVER);
          setGameOverReason('lose');
          return;
      }

      audioManager.playCombat();
      
      const newCells = [...cells];
      const cell = newCells[index];
      
      setStats(prev => ({...prev, shields: prev.shields - 1, currentXp: prev.currentXp + 100})); 
      const text = currentLang === 'en' ? "-1 SHIELD" : "-1 シールド";
      addFloatingText(cell.x, cell.y, text, "text-red-400");
      setTimeout(() => addFloatingText(cell.x, cell.y, "+100 XP", "text-purple-400", "⚔️"), 200);

      cell.isMine = false;
      cell.mineType = MineType.NORMAL; 
      
      const rand = Math.random();
      if (rand < 0.1) {
          cell.itemType = ItemType.CHEST;
      } else if (rand < 0.4) {
          cell.itemType = ItemType.POTION;
      }

      const neighbors = getNeighbors(index, boardConfig.width, newCells.length);
      neighbors.forEach(nIdx => {
         if (!newCells[nIdx].isVoid) {
             newCells[nIdx].neighborMines = countNeighborMines(nIdx, newCells, boardConfig.width);
         }
      });
      cell.neighborMines = countNeighborMines(index, newCells, boardConfig.width);

      setCells(newCells);
      revealCell(index, newCells); 
      addCombo();
  };

  const handleCellClick = (id: string) => {
    if (gameState !== GameState.PLAYING) return;
    const currentLang = stateRef.current.lang;
    
    const index = parseInt(id.split('-')[1]);
    const cell = cells[index];

    if (cell.isRevealed || cell.isFlagged || cell.isVoid) return;

    if (cell.isMine) {
      if (cell.mineType === MineType.MONSTER) {
          handleCombat(index);
          return;
      }

      if (stats.shields > 0) {
        audioManager.playExplosion(); 
        setStats(prev => ({ ...prev, shields: prev.shields - 1 }));
        addFloatingText(cell.x, cell.y, UI_TEXT.blocked[currentLang], "text-gray-300", "🛡️");
        const newCells = [...cells];
        newCells[index].isFlagged = true; 
        setCells(newCells);
        setCombo(0);
        return;
      }

      audioManager.playExplosion();
      const newCells = [...cells];
      newCells[index].isRevealed = true; 
      setCells(newCells);
      setGameState(GameState.GAME_OVER);
      setGameOverReason('lose');
      return;
    }

    revealCell(index, [...cells]);
    audioManager.playReveal();
    addCombo();
  };

  const revealCell = (index: number, currentCells: Cell[]) => {
    const toReveal = [index];
    const newCells = currentCells; 
    const revealedIndices: number[] = [];
    let xpGained = 0;
    const currentLang = stateRef.current.lang;
    
    while (toReveal.length > 0) {
      const currIdx = toReveal.pop()!;
      if (newCells[currIdx].isRevealed || newCells[currIdx].isVoid) continue;

      newCells[currIdx].isRevealed = true;
      revealedIndices.push(currIdx);
      xpGained += 10; 

      if (newCells[currIdx].itemType !== ItemType.NONE && !newCells[currIdx].isLooted) {
          collectItem(newCells[currIdx]);
          newCells[currIdx].isLooted = true;
      }

      const luckSkill = stats.skills.find(s => s.type === SkillType.PASSIVE_LUCK);
      const baseLuck = character?.baseStats.luck || 0;
      if (Math.random() < baseLuck + (luckSkill?.value || 0)) {
         xpGained += 20; 
         addFloatingText(newCells[currIdx].x, newCells[currIdx].y, UI_TEXT.lucky[currentLang], "text-green-300", "🍀");
      }

      if (newCells[currIdx].neighborMines === 0) {
        const neighbors = getNeighbors(currIdx, boardConfig.width, newCells.length);
        neighbors.forEach(n => {
          if (!newCells[n].isRevealed && !newCells[n].isFlagged && !newCells[n].isVoid) {
            toReveal.push(n);
          }
        });
      }
    }

    setCells([...newCells]); 
    
    const currentCombo = stateRef.current.combo;
    let comboMult = 1;
    if (currentCombo > 5) comboMult = 1.2;
    if (currentCombo > 10) comboMult = 1.5;
    if (currentCombo > 20) comboMult = 2.0;

    const greed = stats.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
    setStats(prev => ({...prev, score: prev.score + Math.floor(xpGained * greed * comboMult)}));
    
    gainXp(xpGained * comboMult);

    checkWinCondition(newCells);
  };

  const checkWinCondition = (currentCells: Cell[]) => {
      const hiddenNonMines = currentCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).length;
      if (hiddenNonMines === 0) {
        setGameState(GameState.STAGE_CLEAR);
        setGameOverReason('win');
        audioManager.playVictory();
        audioManager.stopMusic();
      }
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    
    const index = parseInt(id.split('-')[1]);
    const newCells = [...cells];
    if (newCells[index].isRevealed || newCells[index].isVoid) return;

    newCells[index].isFlagged = !newCells[index].isFlagged;
    setCells(newCells);
    audioManager.playFlag();
  };

  // --- Render ---

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-950 text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
      
      {/* Visual Effects Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-radial-fade opacity-80 pointer-events-none z-0"></div>
      <div className="scanlines z-50"></div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col min-w-0">
        
        {/* Header (Mobile) */}
        {gameState !== GameState.MENU && (
          <div className="md:hidden w-full flex-shrink-0 flex justify-between items-center mb-0 bg-gray-900/90 backdrop-blur-md p-2 border-b border-gray-700 shadow-xl z-20 relative">
               <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-2 text-gray-300 hover:text-white">
                  <Icons.menu className="w-6 h-6" />
               </button>
               <div className="flex items-center gap-2 flex-1">
                  <span className="text-purple-400 font-bold text-xs">{UI_TEXT.stage[lang]} {stats.stage}</span>
                  <span className="font-bold text-yellow-400">Lv.{stats.level}</span>
               </div>
               <div className="h-2 bg-gray-800 w-16 rounded-full overflow-hidden border border-gray-700 mx-2">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width: `${Math.min(100, (stats.currentXp/stats.neededXp)*100)}%`}} />
               </div>
               <span className="font-mono text-cyan-300 shadow-cyan-500/50 drop-shadow-sm text-sm">{stats.score}</span>
          </div>
        )}

        {/* Stage Info Overlay (Top) */}
        {gameState === GameState.PLAYING && (
            <div className="absolute top-12 md:top-4 left-0 right-0 flex justify-center pointer-events-none z-20">
                <div className="flex flex-col items-center">
                    <span className="bg-gray-900/80 backdrop-blur px-4 py-1 rounded-full text-xs text-gray-400 border border-gray-700 shadow-lg mb-2">
                        {stageName[lang]}
                    </span>
                    {combo > 2 && (
                        <div className="animate-bounce-small">
                            <span className={`
                                font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]
                                ${combo > 10 ? 'text-4xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-red-600' : 'text-2xl text-yellow-400'}
                            `}>
                                {combo} {UI_TEXT.combo[lang]}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar w-full">
            {gameState === GameState.MENU && (
              <div className="flex flex-col items-center justify-center w-full min-h-full py-10 animate-fade-in">
                <div className="mb-12 relative text-center">
                    <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full animate-pulse-fast"></div>
                    <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl relative z-10">
                      MINESURVIVOR
                    </h1>
                    <p className="text-purple-400 uppercase tracking-[0.5em] text-xs mt-2 font-bold opacity-80">{UI_TEXT.subtitle[lang]}</p>
                    
                    {/* Settings Toggles for Menu */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={() => setLang(l => l === 'en' ? 'jp' : 'en')} className="text-xs bg-gray-800 px-3 py-1 rounded border border-gray-700 hover:border-white">{lang === 'en' ? 'EN' : 'JP'}</button>
                    </div>
                </div>
                
                <p className="text-gray-400 mb-8 animate-slide-up text-center" style={{animationDelay: '100ms'}}>{UI_TEXT.select_char[lang]}</p>
                
                <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl px-4 justify-center items-stretch">
                  {CHARACTERS.map((char, idx) => (
                    <button
                      key={char.id}
                      onClick={() => initializeGame(char)}
                      className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 p-6 md:p-8 rounded-2xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col items-center animate-slide-up overflow-hidden flex-1 min-w-[280px] max-w-sm mx-auto"
                      style={{animationDelay: `${150 + idx * 100}ms`}}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="w-24 h-24 mb-6 flex items-center justify-center relative flex-shrink-0">
                        <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <PixelCharacter id={char.id} className="w-full h-full filter drop-shadow-md group-hover:drop-shadow-xl transition-all relative z-10" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300 transition-colors">{char.name[lang]}</h3>
                      <div className="bg-gray-800/80 px-3 py-1 rounded text-xs uppercase tracking-widest text-blue-300 mb-4 border border-gray-700">{char.class[lang]}</div>
                      <p className="text-sm text-gray-400 text-center leading-relaxed mb-4 flex-grow">{char.description[lang]}</p>
                      
                      <div className="w-full pt-4 border-t border-gray-800 mt-auto">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 text-center">{UI_TEXT.ultimate[lang]}</p>
                        <p className="text-xs text-red-300 font-bold text-center">{char.ultimateName[lang]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(gameState === GameState.PLAYING || gameState === GameState.LEVEL_UP || gameState === GameState.GAME_OVER || gameState === GameState.STAGE_CLEAR) && (
              <>
                <GameBoard 
                  cells={cells} 
                  width={boardConfig.width} 
                  height={boardConfig.height} 
                  onCellClick={handleCellClick}
                  onCellRightClick={handleRightClick}
                  gameOver={gameState === GameState.GAME_OVER || gameState === GameState.STAGE_CLEAR}
                  floatingTexts={floatingTexts}
                />
                
                {(gameState === GameState.GAME_OVER || gameState === GameState.STAGE_CLEAR) && (
                  <div className="absolute inset-0 z-20 bg-gray-950/90 flex items-center justify-center flex-col animate-fade-in backdrop-blur-md">
                    {gameState === GameState.STAGE_CLEAR ? (
                      <div className="text-center animate-slide-up p-8 border border-green-500/30 rounded-2xl bg-green-900/10 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                        <div className="mb-6 animate-float">
                            <Icons.clover className="w-24 h-24 text-green-400 mx-auto drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                        </div>
                        <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 mb-2">{UI_TEXT.cleared[lang]}</h2>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent my-4"></div>
                        <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">{UI_TEXT.mission_success[lang]}</p>
                        <p className="text-3xl text-white font-mono mb-8 text-green-100">{UI_TEXT.score[lang]}: {stats.score}</p>
                        
                        <button 
                            onClick={advanceNextStage}
                            className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-900/50 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="flex items-center gap-2 uppercase tracking-widest">{UI_TEXT.next_stage[lang]} <Icons.wifi className="w-5 h-5" /></span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center animate-slide-up p-8 border border-red-500/30 rounded-2xl bg-red-900/10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <div className="mb-6">
                            <Icons.skull className="w-24 h-24 text-red-500 mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        </div>
                        <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 mb-2">{UI_TEXT.wasted[lang]}</h2>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-4"></div>
                        <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">{UI_TEXT.mission_failed[lang]}</p>
                        <p className="text-xl text-gray-400 mb-8 font-mono">{UI_TEXT.stage[lang]} {stats.stage} · {UI_TEXT.score[lang]} {stats.score}</p>
                        
                        <button 
                            onClick={() => setGameState(GameState.MENU)}
                            className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
                        >
                            {UI_TEXT.return_base[lang]}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      {/* Right Sidebar (Desktop) */}
      {gameState !== GameState.MENU && (
        <div className="hidden md:block w-80 h-full flex-shrink-0 border-l border-gray-800 bg-gray-900/95 backdrop-blur shadow-2xl z-30 relative">
          <Sidebar 
            character={character} 
            stats={stats} 
            onUseSkill={handleUseSkill}
            onUseUltimate={handleUseUltimate}
            lang={lang}
            bgmEnabled={bgmEnabled}
            seEnabled={seEnabled}
            onToggleBgm={() => setBgmEnabled(!bgmEnabled)}
            onToggleSe={() => setSeEnabled(!seEnabled)}
            onToggleLang={() => setLang(l => l === 'en' ? 'jp' : 'en')}
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && gameState !== GameState.MENU && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative w-80 h-full bg-gray-900 shadow-2xl animate-slide-left border-l border-gray-700">
                 <Sidebar 
                    character={character} 
                    stats={stats} 
                    onUseSkill={handleUseSkill}
                    onUseUltimate={handleUseUltimate}
                    lang={lang}
                    bgmEnabled={bgmEnabled}
                    seEnabled={seEnabled}
                    onToggleBgm={() => setBgmEnabled(!bgmEnabled)}
                    onToggleSe={() => setSeEnabled(!seEnabled)}
                    onToggleLang={() => setLang(l => l === 'en' ? 'jp' : 'en')}
                    onClose={() => setIsSidebarOpen(false)}
                  />
            </div>
        </div>
      )}

      {/* Level Up Modal */}
      {gameState === GameState.LEVEL_UP && (
        <LevelUpModal 
          options={levelUpOptions} 
          onSelect={applySkillSelection} 
          lang={lang}
        />
      )}

    </div>
  );
}
