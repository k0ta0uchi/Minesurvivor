import React from 'react';
import { Skill, Language } from '../types';
import { SkillIcon } from './Icons';
import { UI_TEXT } from '../data/locales';

interface LevelUpModalProps {
  options: Skill[];
  onSelect: (skill: Skill) => void;
  lang: Language;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ options, onSelect, lang }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-500 mb-2 drop-shadow-sm animate-pulse-fast">
          {UI_TEXT.level_up[lang]}
        </h2>
        <p className="text-gray-300 mb-8 text-lg">{UI_TEXT.choose_upgrade[lang]}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {options.map((skill, index) => (
            <button
              key={skill.id}
              onClick={() => onSelect(skill)}
              className="bg-gray-800 border-2 border-gray-600 hover:border-yellow-400 hover:scale-105 hover:bg-gray-750 transition-all duration-200 rounded-xl p-6 flex flex-col items-center text-center group relative overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`p-4 rounded-full bg-gray-900 mb-4 ${skill.color} shadow-lg group-hover:shadow-yellow-500/20`}>
                <SkillIcon icon={skill.iconPath} className="w-12 h-12" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-300">{skill.name[lang]}</h3>
              
              {skill.level > 0 ? (
                 <span className="inline-block bg-blue-900/50 text-blue-200 text-xs px-2 py-1 rounded mb-2 border border-blue-800">
                   {UI_TEXT.upgrade_text[lang]} Lv.{skill.level} → Lv.{skill.level + 1}
                 </span>
              ) : (
                <span className="inline-block bg-green-900/50 text-green-200 text-xs px-2 py-1 rounded mb-2 border border-green-800">
                   {UI_TEXT.new_skill[lang]}
                 </span>
              )}

              <p className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
                {skill.description[lang]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};