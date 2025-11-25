
import { Character, Skill, SkillType } from '../types';

export const AVAILABLE_SKILLS: Skill[] = [
  {
    id: 'xp_boost',
    name: 'Wisdom',
    description: 'Increases experience gained from revealing tiles.',
    type: SkillType.PASSIVE_XP,
    level: 0,
    maxLevel: 10,
    iconPath: 'book',
    color: 'text-blue-400',
    value: 1.0, // Multiplier
    valuePerLevel: 0.2,
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Chance to find bonus XP in empty tiles.',
    type: SkillType.PASSIVE_LUCK,
    level: 0,
    maxLevel: 5,
    iconPath: 'clover',
    color: 'text-green-400',
    value: 0, // % Chance
    valuePerLevel: 0.05,
  },
  {
    id: 'shield_battery',
    name: 'Shield Battery',
    description: 'Protect against mine explosions. Recharges each level.',
    type: SkillType.PASSIVE_SHIELD,
    level: 0,
    maxLevel: 5,
    iconPath: 'shield',
    color: 'text-yellow-400',
    value: 0, // Max shields added
    valuePerLevel: 1,
  },
  {
    id: 'gold_rush',
    name: 'Greed',
    description: 'Increases score multiplier.',
    type: SkillType.PASSIVE_GREED,
    level: 0,
    maxLevel: 10,
    iconPath: 'coin',
    color: 'text-yellow-200',
    value: 1.0,
    valuePerLevel: 0.5,
  },
  {
    id: 'radar_ping',
    name: 'Sonar Device',
    description: 'Consumable. Reveals a safe cluster of cells. Click to use.',
    type: SkillType.ITEM_SONAR,
    level: 0,
    maxLevel: 50,
    iconPath: 'wifi',
    color: 'text-red-400',
    value: 0, // Current Charges
    valuePerLevel: 2, // Adds 2 charges per level
  },
  {
    id: 'safe_zone',
    name: 'Safety Net',
    description: 'Revealing a cell also checks its diagonal neighbors.',
    type: SkillType.PASSIVE_VISION,
    level: 0,
    maxLevel: 1, // One time upgrade
    iconPath: 'eye',
    color: 'text-purple-400',
    value: 0, 
    valuePerLevel: 1,
  },
];

export const CHARACTERS: Character[] = [
  {
    id: 'miner',
    name: 'The Sapper',
    class: 'Specialist',
    description: 'Balanced stats. Starts with a basic Shield.',
    baseStats: { maxShields: 1, xpMultiplier: 1.0, luck: 0.05 },
    startingSkills: ['shield_battery'],
    ultimateName: 'Bunker Buster',
    ultimateDesc: 'Detonates a 5x5 area safely, revealing all safe cells instantly.',
  },
  {
    id: 'scholar',
    name: 'The Scholar',
    class: 'Mage',
    description: 'Gains levels quickly but is fragile.',
    baseStats: { maxShields: 0, xpMultiplier: 1.3, luck: 0.1 },
    startingSkills: ['xp_boost'],
    ultimateName: "Mind's Eye",
    ultimateDesc: 'Divines the location of 5 hidden mines and flags them.',
  },
  {
    id: 'gambler',
    name: 'The Rogue',
    class: 'Scout',
    description: 'High luck. Can find massive treasures.',
    baseStats: { maxShields: 0, xpMultiplier: 0.9, luck: 0.25 },
    startingSkills: ['lucky_charm'],
    ultimateName: 'Lucky 7',
    ultimateDesc: 'Instantly reveals 7 random safe cells with bonus XP.',
  }
];

export const LEVEL_BASE_XP = 100;
export const XP_SCALING_FACTOR = 1.4;
