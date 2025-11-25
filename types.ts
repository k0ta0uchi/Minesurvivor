
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
  CROSS = 'CROSS'
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
  isVoid: boolean; // Empty cell that is not part of the board
}

export enum SkillType {
  PASSIVE_XP = 'PASSIVE_XP', // Increase XP gain
  PASSIVE_VISION = 'PASSIVE_VISION', // Reveal radius
  PASSIVE_LUCK = 'PASSIVE_LUCK', // Chance for bonus XP
  PASSIVE_SHIELD = 'PASSIVE_SHIELD', // Survive a mine
  ITEM_SONAR = 'ITEM_SONAR', // Active consumable: Reveal safe cells
  ACTIVE_AUTOFLAG = 'ACTIVE_AUTOFLAG', // Flag mines automatically
  PASSIVE_GREED = 'PASSIVE_GREED', // Score multiplier
  PASSIVE_REGEN = 'PASSIVE_REGEN', // Shield regeneration over turns
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  level: number;
  maxLevel: number;
  iconPath: string; // Used to determine which SVG to render
  color: string;
  value: number; // The magnitude of the effect (e.g., 1.5x multiplier) OR Charge count
  valuePerLevel: number; // How much it increases per level
}

export interface Character {
  id: string;
  name: string;
  class: string;
  description: string;
  baseStats: {
    maxShields: number;
    xpMultiplier: number;
    luck: number;
  };
  startingSkills: string[]; // IDs of skills
  ultimateName: string;
  ultimateDesc: string;
}

export interface PlayerStats {
  level: number;
  currentXp: number;
  neededXp: number;
  shields: number;
  score: number;
  skills: Skill[];
  stage: number;
  limitGauge: number; // 0 to 100
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  icon?: string;
}