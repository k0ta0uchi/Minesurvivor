
import React from 'react';
import { GameState, PlayerStats, Language } from '../types';
import { Icons } from './Icons';
import { UI_TEXT } from '../data/locales';

interface GameOverlaysProps {
  gameState: GameState;
  stats: PlayerStats;
  lang: Language;
  onNextStage: () => void;
  onReturnToBase: () => void;
}

export const GameOverlays: React.FC<GameOverlaysProps> = ({ gameState, stats, lang, onNextStage, onReturnToBase }) => {
  if (gameState !== GameState.GAME_OVER && gameState !== GameState.STAGE_CLEAR) return null;

  return (
    <div className="absolute inset-0 z-20 bg-gray-950/90 flex items-center justify-center flex-col animate-fade-in backdrop-blur-md">
      {gameState === GameState.STAGE_CLEAR ? (
        <div className="text-center animate-slide-up p-8 border border-green-500/30 rounded-2xl bg-green-900/10 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
          <div className="mb-6 animate-float">
            <Icons.clover className="w-24 h-24 text-green-400 mx-auto drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
          </div>
          <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-600 mb-2">{UI_TEXT.cleared[lang]}</h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent my-4"></div>
          <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">{UI_TEXT.mission_success[lang]}</p>
          <p className="text-3xl text-white font-mono mb-8 text-green-100">{UI_TEXT.score[lang]}: {stats.score}</p>
          
          <button 
            onClick={onNextStage}
            className="group relative px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all hover:scale-105 shadow-lg shadow-green-900/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="flex items-center gap-2 uppercase tracking-widest">{UI_TEXT.next_stage[lang]} <Icons.wifi className="w-5 h-5" /></span>
          </button>
        </div>
      ) : (
        <div className="text-center animate-slide-up p-8 border border-red-500/30 rounded-2xl bg-red-900/10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="mb-6">
            <Icons.skull className="w-24 h-24 text-red-500 mx-auto animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </div>
          <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 mb-2">{UI_TEXT.wasted[lang]}</h2>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-4"></div>
          <p className="text-gray-300 mb-1 uppercase tracking-widest text-sm">{UI_TEXT.mission_failed[lang]}</p>
          <p className="text-xl text-gray-400 mb-8 font-mono">{UI_TEXT.stage[lang]} {stats.stage} · {UI_TEXT.score[lang]} {stats.score}</p>
          
          <button 
            onClick={onReturnToBase}
            className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
          >
            {UI_TEXT.return_base[lang]}
          </button>
        </div>
      )}
    </div>
  );
};
