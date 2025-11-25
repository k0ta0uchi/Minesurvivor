
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Cell, Character, Skill, SkillType, PlayerStats, MineType, ItemType, FloatingText } from './types';
import { GameBoard } from './components/GameBoard';
import { Sidebar } from './components/Sidebar';
import { LevelUpModal } from './components/LevelUpModal';
import { Icons, SkillIcon } from './components/Icons';
import { PixelCharacter } from './components/PixelCharacters';
import { audioManager } from './utils/audio';
import { CHARACTERS, AVAILABLE_SKILLS, LEVEL_BASE_XP, XP_SCALING_FACTOR } from './data/gameData';

// --- Constants ---
const BASE_WIDTH = 12;
const BASE_HEIGHT = 16;
const BASE_MINES = 30;

interface StageConfig {
  width: number;
  height: number;
  mines: number;
  name: string;
  description: string;
}

export default function App() {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [character, setCharacter] = useState<Character | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [boardConfig, setBoardConfig] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });
  const [stageName, setStageName] = useState<string>("");
  
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
  // We use refs to access the latest state inside intervals without resetting the interval
  const stateRef = useRef({ cells, stats, gameState, character, boardConfig, combo });
  useEffect(() => {
    stateRef.current = { cells, stats, gameState, character, boardConfig, combo };
  }, [cells, stats, gameState, character, boardConfig, combo]);

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
      return neighbors.reduce((acc, nIdx) => acc + (currentCells[nIdx].isMine ? 1 : 0), 0);
  };

  const addFloatingText = (x: number, y: number, text: string, color: string = 'text-white', icon?: string) => {
    const id = ftIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, icon }]);
    
    // Auto cleanup after animation
    setTimeout(() => {
        setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1500);
  };

  const generateStageConfig = (stage: number): StageConfig => {
    if (stage === 1) {
      return { width: 12, height: 16, mines: 25, name: "The Outskirts", description: "A safe place to start." };
    }

    const variations = [
      { name: "Wide Plains", width: 20, height: 12, density: 0.15, desc: "Wide open spaces." },
      { name: "The Deep Dark", width: 12, height: 20, density: 0.15, desc: "Narrow and deep." },
      { name: "Minefield", width: 14, height: 14, density: 0.20, desc: "Watch your step!" },
      { name: "The Hive", width: 16, height: 16, density: 0.18, desc: "Buzzing with danger." },
      { name: "Giganticus", width: 22, height: 22, density: 0.15, desc: "Massive territory." },
      { name: "Claustrophobia", width: 10, height: 10, density: 0.25, desc: "No room to breathe." }
    ];

    // Select random variation, but favor bigger maps at higher stages
    const allowedVariations = variations.filter(v => stage > 3 ? true : v.name !== 'Giganticus');
    const type = allowedVariations[Math.floor(Math.random() * allowedVariations.length)];
    
    // Scale difficulty slightly with stage
    const density = Math.min(0.25, type.density + (stage * 0.005));
    const mines = Math.floor(type.width * type.height * density);

    return {
      width: type.width,
      height: type.height,
      mines: mines,
      name: type.name,
      description: type.desc
    };
  };

  const startStage = (stageNum: number, currentStats: PlayerStats, char: Character) => {
    const config = generateStageConfig(stageNum);
    setBoardConfig({ width: config.width, height: config.height });
    setStageName(`${config.name} (${config.description})`);

    // Generate Board
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
      isLooted: false
    }));

    // Place Mines
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const idx = Math.floor(Math.random() * totalCells);
      if (!newCells[idx].isMine) {
        newCells[idx].isMine = true;
        // 20% Chance to be a monster
        if (Math.random() < 0.20) {
            newCells[idx].mineType = MineType.MONSTER;
        }
        minesPlaced++;
      }
    }

    // Place Items on Safe Cells
    // 5% chance per safe cell
    newCells.forEach(cell => {
        if (!cell.isMine) {
            const rand = Math.random();
            if (rand < 0.03) {
                cell.itemType = ItemType.POTION;
            } else if (rand < 0.05) {
                cell.itemType = ItemType.CHEST;
            }
        }
    });

    // Calculate Numbers
    newCells.forEach((cell, idx) => {
      if (cell.isMine) return;
      cell.neighborMines = countNeighborMines(idx, newCells, config.width);
    });

    setCells(newCells);
    setStats({...currentStats, stage: stageNum, limitGauge: Math.min(100, currentStats.limitGauge + 20)}); // Retain some gauge or bonus
    setGameState(GameState.PLAYING);
    setGameOverReason(null);
    setCombo(0);
    setFloatingTexts([]); // Clear old texts
    
    if (stageNum === 1) {
      audioManager.playLevelUp();
    }
  };

  const initializeGame = (char: Character) => {
    setCharacter(char);
    
    // Init skills
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
    // Add bonus score for clearing
    const stageBonus = stats.stage * 500;
    const newStats = { ...stats, score: stats.score + stageBonus };
    startStage(nextStageNum, newStats, character);
  };

  // --- Core Actions ---

  const gainXp = (amount: number) => {
    setStats(prev => {
      // Apply multipliers
      const xpMultSkill = prev.skills.find(s => s.type === SkillType.PASSIVE_XP);
      const charMult = character ? character.baseStats.xpMultiplier : 1;
      const skillMult = xpMultSkill ? xpMultSkill.value : 1;
      
      const realAmount = amount * charMult * skillMult;
      let newXp = prev.currentXp + realAmount;
      
      // Limit Gauge Gain
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
      }, 3000); // 3 seconds to keep combo
  };

  // Watch for XP overflow to trigger level up
  useEffect(() => {
    if ((gameState === GameState.PLAYING || gameState === GameState.STAGE_CLEAR) && stats.currentXp >= stats.neededXp) {
        prepareLevelUp();
    }
  }, [stats.currentXp, gameState, stats.neededXp]);


  // --- Active Items / Skills Logic ---

  const handleUseSkill = (skillId: string) => {
    if (gameState !== GameState.PLAYING) return;

    const skill = stats.skills.find(s => s.id === skillId);
    if (!skill) return;

    if (skill.type === SkillType.ITEM_SONAR) {
        if (skill.value <= 0) return; // No charges

        // Consume charge
        setStats(prev => ({
            ...prev,
            skills: prev.skills.map(s => s.id === skillId ? { ...s, value: s.value - 1 } : s)
        }));

        triggerSonar();
    }
  };

  // --- Ultimate Logic ---

  const handleUseUltimate = () => {
      if (gameState !== GameState.PLAYING) return;
      if (stats.limitGauge < 100) return;
      if (!character) return;

      audioManager.playUltimateCast();
      
      const { cells: currentCells, boardConfig } = stateRef.current;
      let newCells = [...currentCells];
      let xpGained = 0;

      // Reset Gauge
      setStats(prev => ({ ...prev, limitGauge: 0 }));

      if (character.id === 'miner') {
          // BUNKER BUSTER: 5x5 explosion centered on random safe hidden cell
          const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed);
          if (safeHidden.length > 0) {
              const target = safeHidden[Math.floor(Math.random() * safeHidden.length)];
              const targetIdx = parseInt(target.id.split('-')[1]);
              const tx = targetIdx % boardConfig.width;
              const ty = Math.floor(targetIdx / boardConfig.width);
              
              // 5x5 grid
              for (let dy = -2; dy <= 2; dy++) {
                  for (let dx = -2; dx <= 2; dx++) {
                      const nx = tx + dx;
                      const ny = ty + dy;
                      if (nx >= 0 && nx < boardConfig.width && ny >= 0 && ny < boardConfig.height) {
                          const idx = ny * boardConfig.width + nx;
                          if (newCells[idx].isMine) {
                             newCells[idx].isFlagged = true; // Mark mines
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
          // MIND'S EYE: Find 5 random mines and flag them
          const hiddenMines = newCells.filter(c => c.isMine && !c.isFlagged);
          const toFlag = hiddenMines.sort(() => 0.5 - Math.random()).slice(0, 5);
          toFlag.forEach(c => {
             const idx = parseInt(c.id.split('-')[1]);
             newCells[idx].isFlagged = true;
          });
          // Also reveal 5 safe
          const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed).sort(() => 0.5 - Math.random()).slice(0, 5);
          safeHidden.forEach(c => {
             const idx = parseInt(c.id.split('-')[1]);
             newCells[idx].isRevealed = true;
             xpGained += 20; // Bonus
             if (newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) {
                collectItem(newCells[idx]);
                newCells[idx].isLooted = true;
             }
          });
      } else if (character.id === 'gambler') {
          // LUCKY 7: Reveal 7 random safe cells
           const safeHidden = newCells.filter(c => !c.isMine && !c.isRevealed).sort(() => 0.5 - Math.random()).slice(0, 7);
           safeHidden.forEach(c => {
              const idx = parseInt(c.id.split('-')[1]);
              newCells[idx].isRevealed = true;
              xpGained += 50; // Massive Bonus
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
    
    // Find candidates (Safe, Hidden, Not Flagged)
    const candidates = currentCells.filter(c => !c.isMine && !c.isRevealed && !c.isFlagged);
    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const toRevealIds = new Set<string>();
    
    // Reveal target and its neighbors
    toRevealIds.add(target.id);
    const neighbors = getNeighbors(currentCells.indexOf(target), boardConfig.width, currentCells.length);
    neighbors.forEach(nIdx => {
      const n = currentCells[nIdx];
      // Only reveal neighbors if they are safe. Sonar avoids mines.
      if (!n.isMine && !n.isRevealed && !n.isFlagged) {
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

        // Apply Luck
        const luckSkill = currentStats.skills.find(s => s.type === SkillType.PASSIVE_LUCK);
        const baseLuck = character?.baseStats.luck || 0;
        if (Math.random() < baseLuck + (luckSkill?.value || 0)) {
            xpGained += 20;
        }
      }
    });

    setCells(newCells);
    
    // Update Score & XP
    setStats(prev => {
        const greed = prev.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
        const scoreAdd = Math.floor(xpGained * greed);
        
        // Calc XP
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
            // Upgrade
            const s = newSkills[existingIdx];
            newSkills[existingIdx] = {
                ...s,
                level: s.level + 1,
                value: s.value + s.valuePerLevel // For items, this adds charges
            };
            if (s.type === SkillType.PASSIVE_SHIELD) shieldAdd = 1;
        } else {
            // New
            const newSkill = {
                ...selectedSkill,
                level: 1,
                value: selectedSkill.value + selectedSkill.valuePerLevel // Initial Charges
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
    
    if (gameOverReason === 'win' && cells.filter(c => !c.isMine && !c.isRevealed).length === 0) {
       setGameState(GameState.STAGE_CLEAR);
    } else {
       setGameState(GameState.PLAYING);
    }
  };

  const collectItem = (cell: Cell) => {
      if (cell.itemType === ItemType.POTION) {
          audioManager.playItemPickup();
          setStats(prev => ({...prev, shields: prev.shields + 1 }));
          addFloatingText(cell.x, cell.y, "+1 SHIELD", "text-blue-400", "🛡️");
      } else if (cell.itemType === ItemType.CHEST) {
          audioManager.playChest();
          // Increased Rewards
          const scoreBonus = 1000;
          const xpBonus = 150;
          setStats(prev => ({...prev, score: prev.score + scoreBonus, currentXp: prev.currentXp + xpBonus }));
          addFloatingText(cell.x, cell.y, "TREASURE!", "text-yellow-300", "💎");
          // Add delayed text for stats
          setTimeout(() => addFloatingText(cell.x, cell.y, `+${scoreBonus} PTS`, "text-yellow-200"), 300);
          setTimeout(() => addFloatingText(cell.x, cell.y, `+${xpBonus} XP`, "text-purple-300"), 600);
      }
  };

  const handleCombat = (index: number) => {
      // Must have shields
      if (stats.shields <= 0) {
          // Die
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
      
      // Consume Shield
      setStats(prev => ({...prev, shields: prev.shields - 1, currentXp: prev.currentXp + 100})); // Big XP for killing monster
      addFloatingText(cell.x, cell.y, "-1 SHIELD", "text-red-400");
      setTimeout(() => addFloatingText(cell.x, cell.y, "+100 XP", "text-purple-400", "⚔️"), 200);

      // Transform cell
      cell.isMine = false;
      cell.mineType = MineType.NORMAL; // Reset type
      
      // Drop Loot?
      // 30% Potion, 10% Chest
      const rand = Math.random();
      if (rand < 0.1) {
          cell.itemType = ItemType.CHEST;
      } else if (rand < 0.4) {
          cell.itemType = ItemType.POTION;
      }

      // Important: We must update neighbor counts for the surrounding cells because a mine just vanished
      const neighbors = getNeighbors(index, boardConfig.width, newCells.length);
      neighbors.forEach(nIdx => {
         newCells[nIdx].neighborMines = countNeighborMines(nIdx, newCells, boardConfig.width);
      });
      // Also update self
      cell.neighborMines = countNeighborMines(index, newCells, boardConfig.width);

      setCells(newCells);
      
      // Now reveal it safely
      revealCell(index, newCells); 
      addCombo();
  };

  const handleCellClick = (id: string) => {
    if (gameState !== GameState.PLAYING) return;
    
    const index = parseInt(id.split('-')[1]);
    const cell = cells[index];

    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      if (cell.mineType === MineType.MONSTER) {
          handleCombat(index);
          return;
      }

      // Check Shield (Normal Mine)
      if (stats.shields > 0) {
        audioManager.playExplosion(); 
        setStats(prev => ({ ...prev, shields: prev.shields - 1 }));
        addFloatingText(cell.x, cell.y, "BLOCKED!", "text-gray-300", "🛡️");
        const newCells = [...cells];
        newCells[index].isFlagged = true; 
        setCells(newCells);
        setCombo(0);
        return;
      }

      // Game Over
      audioManager.playExplosion();
      const newCells = [...cells];
      newCells[index].isRevealed = true; 
      setCells(newCells);
      setGameState(GameState.GAME_OVER);
      setGameOverReason('lose');
      return;
    }

    // Reveal Safe
    revealCell(index, [...cells]);
    audioManager.playReveal();
    addCombo();
  };

  // Modified revealCell to accept cells array for atomic updates in combat
  const revealCell = (index: number, currentCells: Cell[]) => {
    const toReveal = [index];
    const newCells = currentCells; // Reference mutation is okay here as we clone before calling if needed, or we just rely on setCells at end
    const revealedIndices: number[] = [];
    let xpGained = 0;
    
    while (toReveal.length > 0) {
      const currIdx = toReveal.pop()!;
      if (newCells[currIdx].isRevealed) continue;

      newCells[currIdx].isRevealed = true;
      revealedIndices.push(currIdx);
      xpGained += 10; // Base XP

      // Check Item
      if (newCells[currIdx].itemType !== ItemType.NONE && !newCells[currIdx].isLooted) {
          collectItem(newCells[currIdx]);
          newCells[currIdx].isLooted = true;
      }

      // Check Lucky Charm (Bonus XP)
      const luckSkill = stats.skills.find(s => s.type === SkillType.PASSIVE_LUCK);
      const baseLuck = character?.baseStats.luck || 0;
      if (Math.random() < baseLuck + (luckSkill?.value || 0)) {
         xpGained += 20; 
         addFloatingText(newCells[currIdx].x, newCells[currIdx].y, "LUCKY!", "text-green-300", "🍀");
      }

      if (newCells[currIdx].neighborMines === 0) {
        const neighbors = getNeighbors(currIdx, boardConfig.width, newCells.length);
        neighbors.forEach(n => {
          if (!newCells[n].isRevealed && !newCells[n].isFlagged) {
            toReveal.push(n);
          }
        });
      }
    }

    setCells([...newCells]); // Create new ref for React trigger
    
    // Apply Combo Multiplier
    const currentCombo = stateRef.current.combo;
    let comboMult = 1;
    if (currentCombo > 5) comboMult = 1.2;
    if (currentCombo > 10) comboMult = 1.5;
    if (currentCombo > 20) comboMult = 2.0;

    // Update Score
    const greed = stats.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
    setStats(prev => ({...prev, score: prev.score + Math.floor(xpGained * greed * comboMult)}));
    
    // Add XP
    gainXp(xpGained * comboMult);

    checkWinCondition(newCells);
  };

  const checkWinCondition = (currentCells: Cell[]) => {
      const hiddenNonMines = currentCells.filter(c => !c.isMine && !c.isRevealed).length;
      if (hiddenNonMines === 0) {
        setGameState(GameState.STAGE_CLEAR);
        setGameOverReason('win');
        audioManager.playVictory();
      }
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    
    const index = parseInt(id.split('-')[1]);
    const newCells = [...cells];
    if (newCells[index].isRevealed) return;

    newCells[index].isFlagged = !newCells[index].isFlagged;
    setCells(newCells);
    audioManager.playFlag();
  };

  // --- Render ---

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-950 text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
      
      {/* Visual Effects Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-radial-fade opacity-80 pointer-events-none z-0"></div>
      <div className="scanlines z-50"></div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        
        {/* Header (Mobile) */}
        {gameState !== GameState.MENU && (
          <div className="md:hidden w-full flex justify-between items-center mb-4 bg-gray-900/90 backdrop-blur-md p-2 rounded border border-gray-700 shadow-xl">
               <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold text-xs">Stage {stats.stage}</span>
                  <span className="font-bold text-yellow-400">Lv.{stats.level}</span>
               </div>
               <div className="h-2 bg-gray-800 w-24 rounded-full overflow-hidden border border-gray-700">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width: `${Math.min(100, (stats.currentXp/stats.neededXp)*100)}%`}} />
               </div>
               <span className="font-mono text-cyan-300 shadow-cyan-500/50 drop-shadow-sm">{stats.score}</span>
          </div>
        )}

        {/* Stage Info Overlay (Top) */}
        {gameState === GameState.PLAYING && (
            <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-20">
                <div className="flex flex-col items-center">
                    <span className="bg-gray-900/80 backdrop-blur px-4 py-1 rounded-full text-xs text-gray-400 border border-gray-700 shadow-lg mb-2">
                        {stageName}
                    </span>
                    {/* Combo Indicator */}
                    {combo > 2 && (
                        <div className="animate-bounce-small">
                            <span className={`
                                font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]
                                ${combo > 10 ? 'text-4xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-red-600' : 'text-2xl text-yellow-400'}
                            `}>
                                {combo} COMBO!
                            </span>
                            {combo > 5 && <span className="block text-center text-xs text-yellow-200 font-bold uppercase tracking-widest">{combo > 10 ? 'x1.5 XP' : 'x1.2 XP'}</span>}
                        </div>
                    )}
                </div>
            </div>
        )}

        {gameState === GameState.MENU && (
          <div className="text-center z-10 max-w-4xl w-full animate-fade-in flex flex-col items-center">
            <div className="mb-12 relative">
                <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full animate-pulse-fast"></div>
                <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl relative z-10">
                  MINESURVIVOR
                </h1>
                <p className="text-purple-400 uppercase tracking-[0.5em] text-xs mt-2 font-bold opacity-80">Tactical Minesweeper RPG</p>
            </div>
            
            <p className="text-gray-400 mb-8 animate-slide-up" style={{animationDelay: '100ms'}}>Select your character to begin the simulation.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {CHARACTERS.map((char, idx) => (
                <button
                  key={char.id}
                  onClick={() => initializeGame(char)}
                  className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 p-8 rounded-2xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col items-center animate-slide-up overflow-hidden"
                  style={{animationDelay: `${150 + idx * 100}ms`}}
                >
                  {/* Card Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="w-24 h-24 mb-6 flex items-center justify-center relative">
                    {/* Character Glow */}
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <PixelCharacter id={char.id} className="w-full h-full filter drop-shadow-md group-hover:drop-shadow-xl transition-all relative z-10" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300 transition-colors">{char.name}</h3>
                  <div className="bg-gray-800/80 px-3 py-1 rounded text-xs uppercase tracking-widest text-blue-300 mb-4 border border-gray-700">{char.class}</div>
                  <p className="text-sm text-gray-400 text-center leading-relaxed mb-4">{char.description}</p>
                  
                  <div className="w-full pt-4 border-t border-gray-800">
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ultimate</p>
                     <p className="text-xs text-red-300 font-bold">{char.ultimateName}</p>
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
            
            {/* Game Over / Win Overlay */}
            {(gameState === GameState.GAME_OVER || gameState === GameState.STAGE_CLEAR) && (
              <div className="absolute inset-0 z-20 bg-gray-950/90 flex items-center justify-center flex-col animate-fade-in backdrop-blur-md">
                {gameState === GameState.STAGE_CLEAR ? (
                   <div className="text-center animate-slide-up p-8 border border-green-500/30 rounded-2xl bg-green-900/10 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                     <div className="mb-6 animate-float">
                        <Icons.clover className="w-24 h-24 text-green-400 mx-auto drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                     </div>
                     <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 mb-2">CLEARED</h2>
                     <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent my-4"></div>
                     <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">Mission Status: Success</p>
                     <p className="text-3xl text-white font-mono mb-8 text-green-100">Score: {stats.score}</p>
                     
                     <button 
                        onClick={advanceNextStage}
                        className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-900/50 overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="flex items-center gap-2 uppercase tracking-widest">Next Stage <Icons.wifi className="w-5 h-5" /></span>
                     </button>
                   </div>
                ) : (
                   <div className="text-center animate-slide-up p-8 border border-red-500/30 rounded-2xl bg-red-900/10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                     <div className="mb-6">
                        <Icons.skull className="w-24 h-24 text-red-500 mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                     </div>
                     <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 mb-2">WASTED</h2>
                     <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-4"></div>
                     <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">Mission Status: Failed</p>
                     <p className="text-xl text-gray-400 mb-8 font-mono">Stage {stats.stage} · Score {stats.score}</p>
                     
                     <button 
                        onClick={() => setGameState(GameState.MENU)}
                        className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
                     >
                        Return to Base
                     </button>
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar (Desktop) - Only rendered when NOT in MENU to allow centering */}
      {gameState !== GameState.MENU && (
        <div className="hidden md:block w-80 h-full flex-shrink-0 border-l border-gray-800 bg-gray-900/95 backdrop-blur shadow-2xl z-30 relative">
          <Sidebar 
            character={character} 
            stats={stats} 
            onUseSkill={handleUseSkill}
            onUseUltimate={handleUseUltimate}
          />
        </div>
      )}

      {/* Level Up Modal */}
      {gameState === GameState.LEVEL_UP && (
        <LevelUpModal 
          options={levelUpOptions} 
          onSelect={applySkillSelection} 
        />
      )}

    </div>
  );
}
