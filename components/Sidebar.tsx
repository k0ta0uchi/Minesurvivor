import React from 'react';
import { PlayerStats, Character, SkillType, Language } from '../types';
import { SkillIcon, Icons } from './Icons';
import { PixelCharacter } from './PixelCharacters';
import { UI_TEXT } from '../data/locales';

interface SidebarProps {
  character: Character | null;
  stats: PlayerStats;
  className?: string;
  onUseSkill: (skillId: string) => void;
  onUseUltimate: () => void;
  lang: Language;
  bgmEnabled: boolean;
  seEnabled: boolean;
  onToggleBgm: () => void;
  onToggleSe: () => void;
  onToggleLang: () => void;
  onClose?: () => void;
  bgmVolume: number;
  seVolume: number;
  onSetBgmVolume: (v: number) => void;
  onSetSeVolume: (v: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  character, stats, className, onUseSkill, onUseUltimate, 
  lang, bgmEnabled, seEnabled, onToggleBgm, onToggleSe, onToggleLang, onClose,
  bgmVolume, seVolume, onSetBgmVolume, onSetSeVolume
}) => {
  if (!character) return null;

  const xpPercentage = Math.min(100, (stats.currentXp / stats.neededXp) * 100);
  const ultimatePercentage = Math.min(100, stats.limitGauge);
  const isUltimateReady = ultimatePercentage >= 100;

  const handleSkillClick = (id: string) => {
      if (onClose) onClose();
      onUseSkill(id);
  };

  const handleUltimateClick = () => {
      if (onClose) onClose();
      onUseUltimate();
  };

  return (
    <div className={`flex flex-col gap-6 bg-gray-900 p-4 border-l border-gray-800 h-full overflow-y-auto ${className}`}>
      
      {/* Mobile Close Button */}
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white">
          <Icons.x className="w-6 h-6" />
        </button>
      )}

      {/* Character Profile */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
        <div className="w-16 h-16 rounded-lg bg-gray-800 border-2 border-gray-700 shadow-lg overflow-hidden flex items-center justify-center p-1">
          <PixelCharacter id={character.id} className="w-full h-full" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{character.name[lang]}</h2>
          <p className="text-sm text-gray-400">{character.class[lang]} - Lv.{stats.level}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800 p-2 rounded flex flex-col items-center justify-center">
            <Icons.flag className="text-purple-400 mb-1 w-5 h-5" />
            <span className="text-xs text-gray-400 uppercase">{UI_TEXT.stage[lang]}</span>
            <span className="font-mono font-bold text-lg">{stats.stage}</span>
        </div>
        <div className="bg-gray-800 p-2 rounded flex flex-col items-center justify-center">
            <Icons.shield className="text-blue-400 mb-1 w-5 h-5" />
            <span className="text-xs text-gray-400 uppercase">{UI_TEXT.shields[lang]}</span>
            <span className="font-mono font-bold text-lg">{stats.shields}</span>
        </div>
        <div className="bg-gray-800 p-2 rounded flex flex-col items-center justify-center">
            <Icons.coin className="text-yellow-400 mb-1 w-5 h-5" />
            <span className="text-xs text-gray-400 uppercase">{UI_TEXT.score[lang]}</span>
            <span className="font-mono font-bold text-lg">{stats.score}</span>
        </div>
      </div>

      {/* Limit Break / Ultimate */}
      <div className="w-full">
         <div className="flex justify-between items-end mb-1">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest animate-pulse">{UI_TEXT.limit_break[lang]}</span>
            <span className="text-xs text-gray-500 font-mono">{Math.floor(ultimatePercentage)}%</span>
         </div>
         <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700 mb-2">
            <div 
              className={`h-full transition-all duration-300 ${isUltimateReady ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-white animate-pulse' : 'bg-red-900'}`}
              style={{ width: `${ultimatePercentage}%` }}
            />
         </div>
         
         <button
            onClick={handleUltimateClick}
            disabled={!isUltimateReady}
            className={`
                w-full py-3 rounded-lg font-black uppercase tracking-widest text-sm transition-all duration-200
                flex items-center justify-center gap-2 border-2
                ${isUltimateReady 
                    ? 'bg-red-600 text-white border-red-400 hover:bg-red-500 hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)] cursor-pointer' 
                    : 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'}
            `}
         >
            {isUltimateReady ? (
                <>
                    <Icons.mine className="w-4 h-4 animate-spin" />
                    {UI_TEXT.activate[lang]} {character.ultimateName[lang]}
                    <Icons.mine className="w-4 h-4 animate-spin" />
                </>
            ) : (
                <span className="opacity-50">{UI_TEXT.charging[lang]}</span>
            )}
         </button>
         <p className="text-[10px] text-gray-500 mt-1 text-center">{character.ultimateDesc[lang]}</p>
      </div>

      {/* XP Bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>EXP</span>
          <span>{Math.floor(stats.currentXp)} / {Math.floor(stats.neededXp)}</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{UI_TEXT.active_skills[lang]}</h3>
        <div className="space-y-3">
          {stats.skills.map((skill) => {
            const isConsumable = skill.type === SkillType.ITEM_SONAR;
            const canUse = isConsumable && skill.value > 0;
            
            return (
              <div 
                key={skill.id} 
                className={`
                  group relative bg-gray-800 rounded-lg p-3 transition-all border 
                  ${canUse ? 'border-red-500/50 hover:border-red-400 hover:bg-gray-750 cursor-pointer shadow-red-900/20 shadow-lg' : 'border-gray-700/50 hover:bg-gray-750'}
                `}
                onClick={() => canUse && handleSkillClick(skill.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md bg-gray-900 ${skill.color} relative`}>
                    <SkillIcon icon={skill.iconPath} className={`w-6 h-6 ${canUse ? 'animate-pulse' : ''}`} />
                    {isConsumable && (
                        <div className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {skill.value}
                        </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className={`font-bold text-sm ${canUse ? 'text-white' : 'text-gray-200'}`}>{skill.name[lang]}</h4>
                      <span className="text-xs font-mono text-gray-500">Lv.{skill.level}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-1">
                        {isConsumable ? (canUse ? UI_TEXT.click_activate[lang] : UI_TEXT.out_of_charges[lang]) : skill.description[lang]}
                    </p>
                  </div>
                  
                  {canUse && (
                    <div className="bg-red-600 hover:bg-red-500 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ml-1">
                        {UI_TEXT.use_btn[lang]}
                    </div>
                  )}
                </div>
                
                {/* Tooltip on Hover */}
                <div className="absolute left-0 bottom-full mb-2 w-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-black border border-gray-600 p-2 rounded shadow-xl text-xs text-gray-300">
                    <p className="font-bold text-white mb-1">{skill.name[lang]} (Lv.{skill.level})</p>
                    <p>{skill.description[lang]}</p>
                    <p className="mt-1 text-purple-300">
                        {isConsumable ? `${UI_TEXT.charges[lang]}: ${skill.value}` : `${UI_TEXT.effect[lang]}: ${skill.value.toFixed(2)}x`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {stats.skills.length === 0 && (
            <div className="text-center p-4 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded">
              {UI_TEXT.no_skills[lang]}
            </div>
          )}
        </div>
      </div>

      {/* Settings Footer */}
      <div className="mt-auto pt-4 border-t border-gray-800">
         <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{UI_TEXT.settings[lang]}</h3>
         <div className="flex flex-col gap-3">
             {/* BGM Controls */}
             <div className="flex items-center gap-2">
                 <button 
                    onClick={onToggleBgm}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded border transition-colors ${bgmEnabled ? 'bg-gray-800 border-green-900/50 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                >
                    {bgmEnabled ? <Icons.music className="w-4 h-4"/> : <Icons.musicOff className="w-4 h-4"/>}
                </button>
                <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] text-gray-500 font-bold mb-0.5">BGM</span>
                    <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={bgmVolume} 
                        onChange={(e) => onSetBgmVolume(parseFloat(e.target.value))}
                        disabled={!bgmEnabled}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
             </div>

             {/* SE Controls */}
             <div className="flex items-center gap-2">
                 <button 
                    onClick={onToggleSe}
                    className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded border transition-colors ${seEnabled ? 'bg-gray-800 border-green-900/50 text-green-400' : 'bg-gray-900 border-gray-700 text-gray-500'}`}
                >
                    {seEnabled ? <Icons.volume className="w-4 h-4"/> : <Icons.volumeX className="w-4 h-4"/>}
                </button>
                <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] text-gray-500 font-bold mb-0.5">SE</span>
                    <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={seVolume} 
                        onChange={(e) => onSetSeVolume(parseFloat(e.target.value))}
                        disabled={!seEnabled}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>
             </div>

             {/* Language Toggle */}
            <button 
                onClick={onToggleLang}
                className="w-full flex items-center justify-center gap-2 p-2 rounded border bg-gray-800 border-gray-700 hover:border-blue-500 text-blue-300 transition-colors mt-1"
            >
                <Icons.globe className="w-4 h-4"/>
                <span className="text-xs font-bold">{lang === 'en' ? 'English' : '日本語'}</span>
            </button>
         </div>
      </div>

    </div>
  );
};