
import React, { useEffect, useState } from 'react';
import { RankingEntry, Language } from '../types';
import { rankingDB } from '../utils/ranking';
import { Icons } from './Icons';
import { PixelCharacter } from './PixelCharacters';

interface RankingBoardProps {
  lang: Language;
  onClose?: () => void;
  embedded?: boolean;
}

export const RankingBoard: React.FC<RankingBoardProps> = ({ lang, onClose, embedded = false }) => {
  const [scores, setScores] = useState<RankingEntry[]>([]);

  useEffect(() => {
    rankingDB.getTopScores(10).then(data => setScores(data));
  }, []);

  const content = (
    <div className={`w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${embedded ? 'h-auto min-h-[500px]' : 'max-h-[90vh]'}`}>
       {/* Header */}
       <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h2 className="text-xl md:text-2xl font-black text-yellow-400 flex items-center gap-2">
            <Icons.coin className="w-6 h-6" />
            {lang === 'en' ? 'LEADERBOARD' : 'ランキング'}
          </h2>
          {!embedded && onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                <Icons.x className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>
        
        {/* List */}
        <div className={`flex-1 overflow-y-auto p-2 custom-scrollbar`}>
          {scores.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {lang === 'en' ? 'No records yet.' : '記録はまだありません。'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/30 text-xs uppercase text-gray-400 sticky top-0 backdrop-blur">
                <tr>
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">{lang === 'en' ? 'Name' : '名前'}</th>
                  <th className="p-3 text-center">{lang === 'en' ? 'Char' : 'キャラ'}</th>
                  <th className="p-3 text-right">{lang === 'en' ? 'Stage' : '面'}</th>
                  <th className="p-3 text-right">{lang === 'en' ? 'Score' : 'スコア'}</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, idx) => (
                  <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 text-center font-mono text-gray-500 w-12">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="p-3 font-bold text-white truncate max-w-[120px]">
                      {entry.name}
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-8 h-8 mx-auto bg-gray-800 rounded border border-gray-700 overflow-hidden">
                        <PixelCharacter id={entry.characterId} className="w-full h-full" />
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-blue-300">
                      {entry.stage}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-yellow-400">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );

  if (embedded) {
      return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        {content}
    </div>
  );
};
