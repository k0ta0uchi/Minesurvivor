
import { Language } from '../types';

const EN_PREFIXES = [
  "Iron", "Storm", "Shadow", "Light", "Dark", "Fire", "Ice", "Void", 
  "Star", "Moon", "Sun", "Night", "Day", "True", "Grim", "Pale", 
  "Red", "Blue", "Green", "Black", "White", "Silver", "Gold"
];

const EN_SUFFIXES = [
  "blade", "heart", "soul", "walker", "hunter", "smith", "bane", "fist",
  "shield", "wing", "claw", "eye", "whisper", "strike", "song", "guard",
  "fall", "rise", "born", "mancer"
];

const JP_PARTS = [
  "ゼ", "ノ", "ア", "ル", "シ", "オ", "ン", "ク", "ラ", "ウ", "ド", 
  "フ", "ァ", "リ", "ス", "ヴ", "ォ", "ル", "グ", "ナ", "ギ", "サ", 
  "レ", "イ", "ミ", "ラ", "ガ", "ン", "バ", "ザ", "キ", "ル", "ト"
];

const JP_TITLES = [
  "の騎士", "の勇者", "の魔導師", "の狩人", "の影", "の探索者", ""
];

export const generateRandomName = (lang: Language): string => {
  if (lang === 'en') {
    const prefix = EN_PREFIXES[Math.floor(Math.random() * EN_PREFIXES.length)];
    const suffix = EN_SUFFIXES[Math.floor(Math.random() * EN_SUFFIXES.length)];
    return `${prefix}${suffix}`;
  } else {
    // Generate 2-4 syllable Katakana name
    const length = 2 + Math.floor(Math.random() * 3);
    let name = "";
    for (let i = 0; i < length; i++) {
      name += JP_PARTS[Math.floor(Math.random() * JP_PARTS.length)];
    }
    // Occasionally add a 'ー' for style
    if (name.length > 2 && Math.random() < 0.3) {
       name = name.slice(0, 2) + "ー" + name.slice(2);
    }
    return name;
  }
};
