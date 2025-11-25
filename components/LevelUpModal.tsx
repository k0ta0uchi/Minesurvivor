
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
      <div className="max-w-4xl w-full flex flex-col items-center max-h-full">
        <h2 className="text-3xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-500 mb-2 drop-shadow-sm animate-pulse-fast flex-shrink-0">
          {UI_TEXT.level_up[lang]}
        </h2>
        <p className="text-gray-300 mb-4 md:mb-8 text-sm md:text-lg flex-shrink-0">{UI_TEXT.choose_upgrade[lang]}</p>
        
        <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6 w-full overflow-y-auto md:overflow-visible custom-scrollbar px-1 py-1">
          {options.map((skill, index) => (
            <button
              key={skill.id}
              onClick={() => onSelect(skill)}
              className="bg-gray-800 border-2 border-gray-600 hover:border-yellow-400 hover:scale-105 hover:bg-gray-750 transition-all duration-200 rounded-xl p-4 md:p-6 flex flex-row md:flex-col items-center text-left md:text-center group relative overflow-hidden animate-slide-up flex-shrink-0 min-h-[80px]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`p-3 md:p-4 rounded-full bg-gray-900 mr-4 md:mr-0 md:mb-4 ${skill.color} shadow-lg group-hover:shadow-yellow-500/20 flex-shrink-0`}>
                <SkillIcon icon={skill.iconPath} className="w-8 h-8 md:w-12 md:h-12" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:items-center">
                    <h3 className="text-base md:text-xl font-bold text-white mb-1 md:mb-2 group-hover:text-yellow-300 leading-tight truncate w-full">{skill.name[lang]}</h3>
                    
                    {skill.level > 0 ? (
                    <span className="inline-block bg-blue-900/50 text-blue-200 text-[10px] md:text-xs px-2 py-0.5 rounded mb-1 md:mb-2 border border-blue-800 w-fit">
                        {UI_TEXT.upgrade_text[lang]} Lv.{skill.level} → Lv.{skill.level + 1}
                    </span>
                    ) : (
                    <span className="inline-block bg-green-900/50 text-green-200 text-[10px] md:text-xs px-2 py-0.5 rounded mb-1 md:mb-2 border border-green-800 w-fit">
                        {UI_TEXT.new_skill[lang]}
                    </span>
                    )}
                </div>

                <p className="text-xs md:text-sm text-gray-400 group-hover:text-gray-200 transition-colors line-clamp-2 md:line-clamp-none">
                  {skill.description[lang]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
