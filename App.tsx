
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Cell, Character, Skill, SkillType, PlayerStats, MineType, ItemType, Language, UltimateEffect, UltimateEffectType } from './types';
import { GameBoard } from './components/GameBoard';
import { Sidebar } from './components/Sidebar';
import { LevelUpModal } from './components/LevelUpModal';
import { TitleScreen } from './components/TitleScreen';
import { GameOverlays } from './components/GameOverlays';
import { Icons } from './components/Icons';
import { audioManager } from './utils/audio';
// import { rankingDB } from './utils/ranking'; // DEPRECATED
import { CHARACTERS, AVAILABLE_SKILLS, LEVEL_BASE_XP, XP_SCALING_FACTOR } from './data/gameData';
import { UI_TEXT } from './data/locales';
import { useGameEngine } from './hooks/useGameEngine';

const STORAGE_KEY = 'MINESURVIVOR_SETTINGS';

export default function App() {
  // Load settings from localStorage once on init
  const [savedSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Failed to load settings:', e);
      return {};
    }
  });

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [character, setCharacter] = useState<Character | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  
  // Initialize with saved settings, or detect browser language
  const [lang, setLang] = useState<Language>(() => {
    // 1. Priority: Use saved setting if available
    if (savedSettings.lang === 'jp' || savedSettings.lang === 'en') {
      return savedSettings.lang;
    }
    // 2. Priority: Detect browser language
    if (typeof navigator !== 'undefined' && navigator.language.startsWith('ja')) {
      return 'jp';
    }
    // 3. Fallback: English
    return 'en';
  });

  const [bgmEnabled, setBgmEnabled] = useState(savedSettings.bgmEnabled ?? true);
  const [seEnabled, setSeEnabled] = useState(savedSettings.seEnabled ?? true);
  const [bgmVolume, setBgmVolume] = useState(savedSettings.bgmVolume ?? 0.5);
  const [seVolume, setSeVolume] = useState(savedSettings.seVolume ?? 0.5);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [combo, setCombo] = useState(0);
  const comboTimerRef = useRef<number | null>(null);
  const [levelUpOptions, setLevelUpOptions] = useState<Skill[]>([]);
  const [ultimateEffect, setUltimateEffect] = useState<UltimateEffect | null>(null);
  
  const { 
    cells, setCells, boardConfig, stageName, floatingTexts, addFloatingText, particles, spawnParticles, 
    createBoard, getNeighbors, countNeighborMines 
  } = useGameEngine();

  const [stats, setStats] = useState<PlayerStats>({
    level: 1, currentXp: 0, neededXp: LEVEL_BASE_XP, shields: 0, score: 0, skills: [], stage: 1, limitGauge: 0
  });

  const stateRef = useRef({ cells, stats, gameState, character, boardConfig, combo, lang, isFlagMode });
  useEffect(() => { stateRef.current = { cells, stats, gameState, character, boardConfig, combo, lang, isFlagMode }; }, [cells, stats, gameState, character, boardConfig, combo, lang, isFlagMode]);

  // Persist Settings
  useEffect(() => {
    const settings = { lang, bgmEnabled, seEnabled, bgmVolume, seVolume };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [lang, bgmEnabled, seEnabled, bgmVolume, seVolume]);

  // Audio Sync
  useEffect(() => {
    audioManager.setBgmEnabled(bgmEnabled); audioManager.setSeEnabled(seEnabled);
    audioManager.setBgmVolume(bgmVolume); audioManager.setSeVolume(seVolume);
    if (gameState === GameState.PLAYING) audioManager.startMusic(stats.stage);
    else audioManager.stopMusic();
    return () => audioManager.stopMusic();
  }, [gameState, stats.stage, bgmEnabled, seEnabled]);
  useEffect(() => audioManager.setBgmVolume(bgmVolume), [bgmVolume]);
  useEffect(() => audioManager.setSeVolume(seVolume), [seVolume]);

  // XP Check
  useEffect(() => {
    if ((gameState === GameState.PLAYING || gameState === GameState.STAGE_CLEAR) && stats.currentXp >= stats.neededXp) prepareLevelUp();
  }, [stats.currentXp, gameState, stats.neededXp]);

  // Ranking Save on Game Over - DEPRECATED
  /*
  useEffect(() => {
    if (gameState === GameState.GAME_OVER && character) {
       rankingDB.insertScore(playerName, stats.score, stats.stage, character.id);
    }
  }, [gameState]);
  */

  // Actions
  const gainXp = (amount: number) => {
    setStats(prev => {
      const xpMult = (prev.skills.find(s => s.type === SkillType.PASSIVE_XP)?.value || 1) * (character?.baseStats.xpMultiplier || 1);
      const newLimit = Math.min(100, prev.limitGauge + (amount > 0 ? 2 : 0));
      if (prev.limitGauge < 100 && newLimit >= 100) audioManager.playUltimateReady();
      return { ...prev, currentXp: prev.currentXp + amount * xpMult, limitGauge: newLimit };
    });
  };

  const addCombo = () => {
    setCombo(prev => prev + 1);
    audioManager.playCombo(stateRef.current.combo);
    const duration = 3000 + (stateRef.current.stats.skills.find(s => s.type === SkillType.PASSIVE_COMBO)?.value || 0);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => setCombo(0), duration);
  };

  const startStage = (stageNum: number, currentStats: PlayerStats) => {
    createBoard(stageNum);
    setStats({ ...currentStats, stage: stageNum, limitGauge: Math.min(100, currentStats.limitGauge + 20) });
    setGameState(GameState.PLAYING);
    setCombo(0);
    if (stageNum === 1) audioManager.playLevelUp();
  };

  const initializeGame = (char: Character, name: string) => {
    audioManager.resetMusic();
    setCharacter(char);
    setPlayerName(name);
    const initialSkills = AVAILABLE_SKILLS.filter(s => char.startingSkills.includes(s.id)).map(s => ({ ...s, level: 1, value: s.value + s.valuePerLevel }));
    const initialStats = { level: 1, currentXp: 0, neededXp: LEVEL_BASE_XP, shields: char.baseStats.maxShields, score: 0, skills: initialSkills, stage: 1, limitGauge: 0 };
    setStats(initialStats);
    startStage(1, initialStats);
  };

  const handleUseSkill = (skillId: string) => {
    if (gameState !== GameState.PLAYING) return;
    const skill = stats.skills.find(s => s.id === skillId);
    if (!skill || skill.value <= 0) return;
    
    setStats(prev => ({ ...prev, skills: prev.skills.map(s => s.id === skillId ? { ...s, value: s.value - 1 } : s) }));
    if (skill.type === SkillType.ITEM_SONAR) triggerSonar();
    else if (skill.type === SkillType.ITEM_ALCHEMY) triggerAlchemy();
  };

  const triggerAlchemy = () => {
    const { cells: curr } = stateRef.current;
    const hidden = curr.filter(c => c.isMine && !c.isRevealed && !c.isVoid);
    if (hidden.length === 0) return;
    
    audioManager.playAlchemy();
    const target = hidden[Math.floor(Math.random() * hidden.length)];
    const idx = parseInt(target.id.split('-')[1]);
    const newCells = [...curr];
    newCells[idx] = { ...newCells[idx], isMine: false, mineType: MineType.NORMAL, itemType: Math.random() < 0.3 ? ItemType.CHEST : ItemType.POTION, isFlagged: false };
    
    getNeighbors(idx, boardConfig.width, newCells.length).forEach(n => newCells[n].neighborMines = countNeighborMines(n, newCells, boardConfig.width));
    newCells[idx].neighborMines = countNeighborMines(idx, newCells, boardConfig.width);
    setCells(newCells);
    addFloatingText(target.x, target.y, UI_TEXT.alchemy[lang], "text-pink-400", "⚗️");
    spawnParticles(target.x, target.y, "bg-pink-400");
  };

  const triggerSonar = () => {
    const { cells: curr, boardConfig: bc } = stateRef.current;
    const candidates = curr.filter(c => !c.isMine && !c.isRevealed && !c.isFlagged && !c.isVoid);
    if (candidates.length === 0) return;
    
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const toReveal = new Set<string>([target.id]);
    getNeighbors(curr.indexOf(target), bc.width, curr.length).forEach(n => { if (!curr[n].isMine && !curr[n].isRevealed) toReveal.add(curr[n].id); });
    if (toReveal.size === 0) return;

    audioManager.playSonar();
    const newCells = [...curr];
    let xp = 0;
    toReveal.forEach(id => {
      const idx = parseInt(id.split('-')[1]);
      if (!newCells[idx].isRevealed) {
        newCells[idx].isRevealed = true;
        xp += 10 + (Math.random() < (character?.baseStats.luck || 0) + (stats.skills.find(s => s.type === SkillType.PASSIVE_LUCK)?.value || 0) ? 20 : 0);
        if (newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) { collectItem(newCells[idx]); newCells[idx].isLooted = true; }
      }
    });
    setCells(newCells);
    const greed = stats.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
    setStats(prev => ({ ...prev, score: prev.score + Math.floor(xp * greed), currentXp: prev.currentXp + xp * (character?.baseStats.xpMultiplier || 1) }));
    addCombo();
    checkWin(newCells);
  };

  const handleUseUltimate = () => {
    if (gameState !== GameState.PLAYING || stats.limitGauge < 100 || !character) return;
    audioManager.playUltimateCast();
    
    const { cells: curr, boardConfig: bc } = stateRef.current;
    
    setStats(p => ({ ...p, limitGauge: 0 }));

    // 1. Determine Effect Target & Type
    let targetX = 0;
    let targetY = 0;
    let effectType: UltimateEffectType = 'EXPLOSION';
    
    // Determine the center of "unrevealed" mass to focus camera there for non-targeted skills
    const unrevealed = curr.filter(c => !c.isRevealed && !c.isVoid);
    const visualCenter = unrevealed.length > 0 ? unrevealed[Math.floor(unrevealed.length/2)] : curr[Math.floor(curr.length/2)];
    
    let minerTargetId: string | null = null;

    if (character.id === 'miner') {
        const safe = unrevealed.filter(c => !c.isMine);
        // Pick a target for the blast first
        const target = safe.length > 0 ? safe[Math.floor(Math.random() * safe.length)] : visualCenter;
        targetX = target.x;
        targetY = target.y;
        minerTargetId = target.id;
        effectType = 'EXPLOSION';
    } else {
        targetX = visualCenter.x;
        targetY = visualCenter.y;
        if (character.id === 'scholar') effectType = 'MAGIC';
        if (character.id === 'gambler') effectType = 'JACKPOT';
    }
    
    setUltimateEffect({ id: Date.now(), x: targetX, y: targetY, type: effectType });

    // 2. Execute Logic with Delay (Logic MUST match visual target)
    setTimeout(() => {
        const { cells: currentCells, boardConfig: currentConfig } = stateRef.current; // Get fresh state
        let newCells = [...currentCells];
        let xp = 0;
        
        if (character.id === 'miner') {
            // Use the SAME target we picked for the effect
            let centerIdx = -1;
            if (minerTargetId) {
                centerIdx = newCells.findIndex(c => c.id === minerTargetId);
            }
            // If target found, use it; otherwise fallback to recalculation (rare)
            if (centerIdx !== -1) {
                const tx = centerIdx % currentConfig.width;
                const ty = Math.floor(centerIdx / currentConfig.width);
                
                // Blast 5x5
                for(let dy=-2; dy<=2; dy++) for(let dx=-2; dx<=2; dx++) {
                    const nx = tx + dx;
                    const ny = ty + dy;
                    if(nx>=0 && nx<currentConfig.width && ny>=0 && ny<currentConfig.height) {
                        const idx = ny*currentConfig.width+nx;
                        if(newCells[idx].isVoid) continue;
                        if(newCells[idx].isMine) {
                            newCells[idx].isFlagged = true;
                        } else if(!newCells[idx].isRevealed) {
                            newCells[idx].isRevealed = true; 
                            xp += 10;
                            if(newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) { 
                                collectItem(newCells[idx]); 
                                newCells[idx].isLooted = true; 
                            }
                        }
                    }
                }
            }
        } else if (character.id === 'scholar') {
            // Scholar Logic (Random scatter is fine, effect was just "casting")
             newCells.filter(c => c.isMine && !c.isFlagged && !c.isVoid).sort(() => 0.5 - Math.random()).slice(0, 5).forEach(c => newCells[parseInt(c.id.split('-')[1])].isFlagged = true);
            newCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).sort(() => 0.5 - Math.random()).slice(0, 5).forEach(c => {
                const idx = parseInt(c.id.split('-')[1]); newCells[idx].isRevealed = true; xp += 20;
                if(newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) { collectItem(newCells[idx]); newCells[idx].isLooted=true; }
            });
        } else if (character.id === 'gambler') {
            // Gambler Logic
             newCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).sort(() => 0.5 - Math.random()).slice(0, 7).forEach(c => {
                const idx = parseInt(c.id.split('-')[1]); newCells[idx].isRevealed = true; xp += 50;
                if(newCells[idx].itemType !== ItemType.NONE && !newCells[idx].isLooted) { collectItem(newCells[idx]); newCells[idx].isLooted=true; }
            });
        }
        
        setCells(newCells);
        setUltimateEffect(null); // Stop visual effect loop
        gainXp(xp);
        checkWin(newCells);
    }, 600);
  };

  const collectItem = (cell: Cell) => {
    if (cell.itemType === ItemType.POTION) {
      audioManager.playItemPickup(); setStats(p => ({ ...p, shields: p.shields + 1 }));
      addFloatingText(cell.x, cell.y, lang === 'en' ? "+1 SHIELD" : "+1 シールド", "text-blue-400", "🛡️");
      spawnParticles(cell.x, cell.y, "bg-blue-400");
    } else if (cell.itemType === ItemType.CHEST) {
      audioManager.playChest();
      setStats(p => ({ ...p, score: p.score + 1000, currentXp: p.currentXp + 150 }));
      addFloatingText(cell.x, cell.y, UI_TEXT.treasure[lang], "text-yellow-300", "💎");
      setTimeout(() => addFloatingText(cell.x, cell.y, `+1000 PTS`, "text-yellow-200"), 300);
      spawnParticles(cell.x, cell.y, "bg-yellow-400", 8);
    }
  };

  const handleCombat = (index: number) => {
    if (stats.shields <= 0) {
      audioManager.playExplosion();
      const newCells = [...cells]; newCells[index].isRevealed = true; setCells(newCells);
      setGameState(GameState.GAME_OVER);
      return;
    }
    audioManager.playCombat();
    const newCells = [...cells];
    setStats(p => ({ ...p, shields: p.shields - 1, currentXp: p.currentXp + 100 }));
    addFloatingText(newCells[index].x, newCells[index].y, lang === 'en' ? "-1 SHIELD" : "-1 シールド", "text-red-400");
    spawnParticles(newCells[index].x, newCells[index].y, "bg-purple-500", 10);
    
    newCells[index] = { ...newCells[index], isMine: false, mineType: MineType.NORMAL, itemType: Math.random() < 0.1 ? ItemType.CHEST : (Math.random() < 0.4 ? ItemType.POTION : ItemType.NONE) };
    getNeighbors(index, boardConfig.width, newCells.length).forEach(n => newCells[n].neighborMines = countNeighborMines(n, newCells, boardConfig.width));
    newCells[index].neighborMines = countNeighborMines(index, newCells, boardConfig.width);
    
    setCells(newCells);
    revealCell(index, newCells);
    addCombo();
  };

  const handleCellClick = (id: string) => {
    if (gameState !== GameState.PLAYING) return;
    if (isFlagMode) { handleRightClick(id); return; }
    const index = parseInt(id.split('-')[1]);
    const cell = cells[index];
    if (cell.isRevealed || cell.isFlagged || cell.isVoid) return;

    if (cell.isMine) {
      if (cell.mineType === MineType.MONSTER) { handleCombat(index); return; }
      const dodge = stats.skills.find(s => s.type === SkillType.PASSIVE_DODGE)?.value || 0;
      if (Math.random() < dodge) {
        audioManager.playDodge();
        const newCells = [...cells]; newCells[index].isFlagged = true; setCells(newCells);
        addFloatingText(cell.x, cell.y, UI_TEXT.dodged[lang], "text-cyan-300", "💨");
        spawnParticles(cell.x, cell.y, "bg-cyan-400");
        return;
      }
      if (stats.shields > 0) {
        audioManager.playExplosion(); setStats(p => ({ ...p, shields: p.shields - 1 }));
        addFloatingText(cell.x, cell.y, UI_TEXT.blocked[lang], "text-gray-300", "🛡️");
        const newCells = [...cells]; newCells[index].isFlagged = true; setCells(newCells); setCombo(0);
        return;
      }
      audioManager.playExplosion();
      const newCells = [...cells]; newCells[index].isRevealed = true; setCells(newCells);
      setGameState(GameState.GAME_OVER);
      return;
    }
    revealCell(index, [...cells]);
    audioManager.playReveal();
    addCombo();
  };

  const revealCell = (index: number, currentCells: Cell[]) => {
    const toReveal = [index];
    const newCells = currentCells;
    let xp = 0;
    while (toReveal.length > 0) {
      const currIdx = toReveal.pop()!;
      if (newCells[currIdx].isRevealed || newCells[currIdx].isVoid) continue;
      newCells[currIdx].isRevealed = true;
      xp += 10;
      if (newCells[currIdx].itemType !== ItemType.NONE && !newCells[currIdx].isLooted) { collectItem(newCells[currIdx]); newCells[currIdx].isLooted = true; }
      else spawnParticles(newCells[currIdx].x, newCells[currIdx].y, "bg-gray-400", 3);

      const luck = (character?.baseStats.luck || 0) + (stats.skills.find(s => s.type === SkillType.PASSIVE_LUCK)?.value || 0);
      if (Math.random() < luck) { xp += 20; addFloatingText(newCells[currIdx].x, newCells[currIdx].y, UI_TEXT.lucky[lang], "text-green-300", "🍀"); }
      
      if (newCells[currIdx].neighborMines === 0) {
        getNeighbors(currIdx, boardConfig.width, newCells.length).forEach(n => { if (!newCells[n].isRevealed && !newCells[n].isFlagged && !newCells[n].isVoid) toReveal.push(n); });
      }
    }
    setCells([...newCells]);
    const comboMult = combo > 20 ? 2.0 : (combo > 10 ? 1.5 : (combo > 5 ? 1.2 : 1));
    const greed = stats.skills.find(s => s.type === SkillType.PASSIVE_GREED)?.value || 1;
    setStats(p => ({ ...p, score: p.score + Math.floor(xp * greed * comboMult) }));
    gainXp(xp * comboMult);
    checkWin(newCells);
  };

  const checkWin = (currentCells: Cell[]) => {
    if (currentCells.filter(c => !c.isMine && !c.isRevealed && !c.isVoid).length === 0) {
      // Save ranking on Stage Clear? Or just end of run? Usually just Game Over, but we can update score here too if we want "Highest Stage" records.
      // For now, save only on Game Over to keep "High Score" concept simple (accumulation).
      // Or we can save intermediate scores. Let's stick to Game Over for final submission.
      setGameState(GameState.STAGE_CLEAR); audioManager.playVictory(); audioManager.stopMusic();
    }
  };

  const handleRightClick = (id: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    const index = parseInt(id.split('-')[1]);
    const newCells = [...cells];
    if (!newCells[index].isRevealed && !newCells[index].isVoid) {
      newCells[index].isFlagged = !newCells[index].isFlagged;
      setCells(newCells);
      audioManager.playFlag();
    }
  };

  const prepareLevelUp = () => {
    audioManager.playLevelUp(); setGameState(GameState.LEVEL_UP);
    const owned = stats.skills.map(s => s.id);
    const pool = [...stats.skills.filter(s => s.level < s.maxLevel), ...AVAILABLE_SKILLS.filter(s => !owned.includes(s.id))];
    setLevelUpOptions(pool.sort(() => 0.5 - Math.random()).slice(0, 3));
  };

  const applySkill = (skill: Skill) => {
    setStats(p => {
      const idx = p.skills.findIndex(s => s.id === skill.id);
      let newSkills = [...p.skills], shieldAdd = 0;
      if (idx >= 0) { newSkills[idx] = { ...newSkills[idx], level: newSkills[idx].level + 1, value: newSkills[idx].value + newSkills[idx].valuePerLevel }; if (skill.type === SkillType.PASSIVE_SHIELD) shieldAdd = 1; }
      else { const ns = { ...skill, level: 1, value: skill.value + skill.valuePerLevel }; newSkills.push(ns); if (skill.type === SkillType.PASSIVE_SHIELD) shieldAdd = 1; }
      return { ...p, level: p.level + 1, neededXp: Math.floor(p.neededXp * XP_SCALING_FACTOR), currentXp: p.currentXp - p.neededXp, skills: newSkills, shields: p.shields + shieldAdd };
    });
    setGameState(prev => (prev === GameState.STAGE_CLEAR ? GameState.STAGE_CLEAR : GameState.PLAYING));
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-gray-950 text-white font-sans overflow-hidden relative selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-radial-fade opacity-80 pointer-events-none z-0"></div>
      <div className="scanlines z-50"></div>

      {gameState === GameState.MENU && (
        <div className="absolute top-6 right-6 z-[60]">
          <button onClick={() => setLang(l => l === 'en' ? 'jp' : 'en')} className="flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800 backdrop-blur border border-gray-700 hover:border-purple-500 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold font-mono transition-all shadow-lg group">
            <Icons.globe className="w-3 h-3 md:w-4 md:h-4 text-gray-400 group-hover:text-purple-400 transition-colors"/><span className="text-gray-300 group-hover:text-white">{lang === 'en' ? 'English' : '日本語'}</span>
          </button>
        </div>
      )}

      <div className="flex-1 relative z-10 flex flex-col min-w-0 h-full overflow-hidden">
        {gameState !== GameState.MENU && (
          <div className="md:hidden w-full flex-shrink-0 flex justify-between items-center mb-0 bg-gray-900/90 backdrop-blur-md p-2 border-b border-gray-700 shadow-xl z-20 relative">
            <div className="flex items-center gap-2 flex-1"><span className="text-purple-400 font-bold text-xs">{UI_TEXT.stage[lang]} {stats.stage}</span><span className="font-bold text-yellow-400">Lv.{stats.level}</span></div>
            <div className="flex items-center gap-3">
              <div className="h-2 bg-gray-800 w-16 rounded-full overflow-hidden border border-gray-700"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.min(100, (stats.currentXp / stats.neededXp) * 100)}%` }} /></div>
              <span className="font-mono text-cyan-300 shadow-cyan-500/50 drop-shadow-sm text-sm">{stats.score}</span>
              <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 ml-1 text-gray-300 hover:text-white border border-gray-700 rounded bg-gray-800/50"><Icons.menu className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="absolute top-12 md:top-4 left-0 right-0 flex justify-center pointer-events-none z-30">
            <div className="flex flex-col items-center">
              <span className="bg-gray-900/80 backdrop-blur px-4 py-1 rounded-full text-xs text-gray-400 border border-gray-700 shadow-lg mb-2">{stageName[lang]}</span>
              {combo > 2 && <div className="animate-bounce-small"><span className={`font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${combo > 10 ? 'text-4xl text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-red-600' : 'text-2xl text-yellow-400'}`}>{combo} {UI_TEXT.combo[lang]}</span></div>}
            </div>
          </div>
        )}

        {/* MAIN GAME AREA - Layout Logic */}
        {gameState === GameState.MENU ? (
          <div id="main-scroll-container" className="w-full h-full overflow-y-auto custom-scrollbar relative">
             <TitleScreen characters={CHARACTERS} lang={lang} onSelectCharacter={initializeGame} />
          </div>
        ) : (
          <div className="relative w-full h-full bg-gray-950 overflow-hidden">
             {/* Note: We no longer need to pass floatingTexts/particles to GameBoard if we handle them internally or if GameBoard renders them via Canvas.
                 However, to keep current logic working, we pass them. The new GameBoard renders them on Canvas. */}
             <GameBoard 
                cells={cells} 
                width={boardConfig.width} 
                height={boardConfig.height} 
                onCellClick={handleCellClick} 
                onCellRightClick={handleRightClick} 
                gameOver={gameState === GameState.GAME_OVER || gameState === GameState.STAGE_CLEAR} 
                floatingTexts={floatingTexts} 
                particles={particles}
                ultimateEffect={ultimateEffect}
             />
             
             {/* Overlays (Win/Loss) */}
             <GameOverlays gameState={gameState} stats={stats} lang={lang} onNextStage={() => { const ns = stats.stage + 1; const bonus = stats.stage * 500; setStats(p => ({ ...p, score: p.score + bonus })); startStage(ns, { ...stats, score: stats.score + bonus }); }} onReturnToBase={() => setGameState(GameState.MENU)} />

             {/* Mobile Flag Toggle Button */}
             <div className="md:hidden absolute bottom-6 right-24 z-40">
                <button onClick={() => setIsFlagMode(!isFlagMode)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform active:scale-95 border-4 ${isFlagMode ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>{isFlagMode ? <Icons.flag className="w-8 h-8" /> : <Icons.shovel className="w-8 h-8" />}</button>
             </div>
          </div>
        )}
      </div>

      {gameState !== GameState.MENU && (
        <div className="hidden md:block w-80 h-full flex-shrink-0 border-l border-gray-800 bg-gray-900/95 backdrop-blur shadow-2xl z-30 relative">
          <Sidebar character={character} stats={stats} onUseSkill={handleUseSkill} onUseUltimate={handleUseUltimate} lang={lang} bgmEnabled={bgmEnabled} seEnabled={seEnabled} onToggleBgm={() => setBgmEnabled(!bgmEnabled)} onToggleSe={() => setSeEnabled(!seEnabled)} onToggleLang={() => setLang(l => l === 'en' ? 'jp' : 'en')} bgmVolume={bgmVolume} seVolume={seVolume} onSetBgmVolume={setBgmVolume} onSetSeVolume={setSeVolume} />
        </div>
      )}

      {isSidebarOpen && gameState !== GameState.MENU && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative w-80 h-full bg-gray-900 shadow-2xl animate-slide-left border-l border-gray-700">
            <Sidebar character={character} stats={stats} onUseSkill={handleUseSkill} onUseUltimate={handleUseUltimate} lang={lang} bgmEnabled={bgmEnabled} seEnabled={seEnabled} onToggleBgm={() => setBgmEnabled(!bgmEnabled)} onToggleSe={() => setSeEnabled(!seEnabled)} onToggleLang={() => setLang(l => l === 'en' ? 'jp' : 'en')} onClose={() => setIsSidebarOpen(false)} bgmVolume={bgmVolume} seVolume={seVolume} onSetBgmVolume={setBgmVolume} onSetSeVolume={setSeVolume} />
          </div>
        </div>
      )}

      {gameState === GameState.LEVEL_UP && <LevelUpModal options={levelUpOptions} onSelect={applySkill} lang={lang} />}
    </div>
  );
}
