
export enum GameState {
  MENU,
  PLAYING,
  LEVEL_UP,
  GAME_OVER,
  VICTORY,
  STAGE_CLEAR
}

export enum MineType {
  NORMAL = 'NORMAL',
  MONSTER = 'MONSTER'
}

export enum ItemType {
  NONE = 'NONE',
  POTION = 'POTION',
  CHEST = 'CHEST'
}

export enum ShapeType {
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  DIAMOND = 'DIAMOND',
  DONUT = 'DONUT',
  CROSS = 'CROSS',
  ORGANIC = 'ORGANIC'
}

export type Language = 'en' | 'jp';

export interface LocalizedText {
  en: string;
  jp: string;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  mineType: MineType;
  itemType: ItemType;
  isLooted: boolean;
  isVoid: boolean;
}

export enum SkillType {
  PASSIVE_XP = 'PASSIVE_XP',
  PASSIVE_VISION = 'PASSIVE_VISION',
  PASSIVE_LUCK = 'PASSIVE_LUCK',
  PASSIVE_SHIELD = 'PASSIVE_SHIELD',
  ITEM_SONAR = 'ITEM_SONAR',
  ITEM_ALCHEMY = 'ITEM_ALCHEMY',     // New
  ACTIVE_AUTOFLAG = 'ACTIVE_AUTOFLAG',
  PASSIVE_GREED = 'PASSIVE_GREED',
  PASSIVE_REGEN = 'PASSIVE_REGEN',
  PASSIVE_DODGE = 'PASSIVE_DODGE',   // New
  PASSIVE_COMBO = 'PASSIVE_COMBO',   // New
}

export interface Skill {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  type: SkillType;
  level: number;
  maxLevel: number;
  iconPath: string;
  color: string;
  value: number;
  valuePerLevel: number;
}

export interface Character {
  id: string;
  name: LocalizedText;
  class: LocalizedText;
  description: LocalizedText;
  baseStats: {
    maxShields: number;
    xpMultiplier: number;
    luck: number;
  };
  startingSkills: string[];
  ultimateName: LocalizedText;
  ultimateDesc: LocalizedText;
}

export interface PlayerStats {
  level: number;
  currentXp: number;
  neededXp: number;
  shields: number;
  score: number;
  skills: Skill[];
  stage: number;
  limitGauge: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  icon?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
}
