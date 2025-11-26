
import React from 'react';
import { Character, Language } from '../types';
import { PixelCharacter } from './PixelCharacters';
import { UI_TEXT } from '../data/locales';

interface TitleScreenProps {
  characters: Character[];
  lang: Language;
  onSelectCharacter: (char: Character, playerName: string) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ characters, lang, onSelectCharacter }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex-shrink-0 text-center mb-6 relative mt-10 md:mt-0 z-20">
        <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full animate-pulse-fast"></div>
        <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl relative z-10">
        MINESURVIVOR
        </h1>
        <p className="text-purple-400 uppercase tracking-[0.5em] text-[10px] md:text-xs mt-2 font-bold opacity-80">{UI_TEXT.subtitle[lang]}</p>
      </div>

      {/* Main Controls Container */}
      <div className="flex-1 w-full max-w-5xl flex flex-col items-center justify-center min-h-0 relative z-20">
        
        <p className="text-gray-400 mb-4 text-xs md:text-base animate-slide-up" style={{ animationDelay: '100ms' }}>{UI_TEXT.select_char[lang]}</p>

        {/* Character Selection */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 md:gap-6 md:overflow-visible px-2 w-full">
        {characters.map((char, idx) => (
            <button
            key={char.id}
            onClick={() => onSelectCharacter(char, "Survivor")} // Default name since input is deprecated
            className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 transition-all hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 
                        flex-shrink-1 w-full md:w-auto md:flex-1 md:min-w-[280px] max-w-sm mx-auto
                        flex flex-row md:flex-col items-center text-left md:text-center p-2 md:p-8 rounded-xl md:rounded-2xl h-auto animate-slide-up"
            style={{ animationDelay: `${150 + idx * 100}ms` }}
            >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="w-12 h-12 md:w-24 md:h-24 mr-3 md:mr-0 md:mb-6 flex items-center justify-center relative flex-shrink-0">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <PixelCharacter id={char.id} className="w-full h-full filter drop-shadow-md group-hover:drop-shadow-xl transition-all relative z-10" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex flex-col md:items-center">
                <div className="flex items-center gap-2 mb-1 md:flex-col md:gap-0 md:mb-2">
                    <h3 className="text-base md:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{char.name[lang]}</h3>
                    <div className="bg-gray-800/80 px-2 py-0.5 md:px-3 md:py-1 rounded text-[10px] md:text-xs uppercase tracking-widest text-blue-300 border border-gray-700 w-fit">{char.class[lang]}</div>
                </div>
                </div>
                
                <p className="text-[10px] md:text-sm text-gray-400 leading-tight md:mb-4 text-left md:text-center line-clamp-1 md:line-clamp-none">{char.description[lang]}</p>
                
                <div className="mt-1 md:mt-auto md:w-full md:pt-4 md:border-t md:border-gray-800">
                <div className="flex flex-row md:flex-col gap-1 items-baseline md:items-center">
                    <span className="text-[10px] text-red-400 font-bold uppercase">{UI_TEXT.ultimate[lang]}:</span>
                    <span className="text-[10px] md:text-xs text-gray-300 md:text-red-300 md:font-bold truncate">{char.ultimateName[lang]}</span>
                </div>
                </div>
            </div>
            </button>
        ))}
        </div>
      </div>
    </div>
  );
};
