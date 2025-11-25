
import React, { useCallback, useMemo } from 'react';
import { Cell, MineType, ItemType, FloatingText } from '../types';
import { Icons } from './Icons';
import { PixelEnemy } from './PixelCharacters';

interface GameBoardProps {
  cells: Cell[];
  width: number;
  height: number;
  onCellClick: (id: string) => void;
  onCellRightClick: (e: React.MouseEvent, id: string) => void;
  gameOver: boolean;
  floatingTexts: FloatingText[];
}

const getCellColor = (neighborMines: number) => {
  switch (neighborMines) {
    case 1: return 'text-blue-400';
    case 2: return 'text-green-400';
    case 3: return 'text-red-400';
    case 4: return 'text-purple-400';
    case 5: return 'text-yellow-400';
    case 6: return 'text-pink-400';
    case 7: return 'text-teal-400';
    case 8: return 'text-gray-200';
    default: return 'text-white';
  }
};

const CellComponent = React.memo(({ cell, onClick, onRightClick, gameOver }: { cell: Cell, onClick: () => void, onRightClick: (e: React.MouseEvent) => void, gameOver: boolean }) => {
  
  // Render void cells as empty space
  if (cell.isVoid) {
      return <div className="w-8 h-8 sm:w-10 sm:h-10 opacity-0 pointer-events-none" />;
  }

  // Extract seed from ID (e.g. "cell-123" -> 123)
  const cellSeed = useMemo(() => parseInt(cell.id.split('-')[1]), [cell.id]);

  const content = useMemo(() => {
    if (cell.isFlagged && !cell.isRevealed) {
      return <Icons.flag className="w-5 h-5 text-red-500 drop-shadow-lg" />;
    }
    if (!cell.isRevealed) {
      return null;
    }
    if (cell.isMine) {
      // It's a mine/monster that was revealed (e.g. Game Over)
      if (cell.mineType === MineType.MONSTER) {
          return <PixelEnemy seed={cellSeed} className="w-8 h-8" />;
      }
      return <Icons.mine className="w-6 h-6 text-red-600 animate-pulse" />;
    }
    
    // Revealed Safe Cell
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Item Icon */}
            {cell.itemType === ItemType.POTION && (
                <Icons.potion className="absolute w-6 h-6 text-blue-500/30" />
            )}
            {cell.itemType === ItemType.CHEST && (
                <Icons.chest className="absolute w-6 h-6 text-yellow-400 opacity-80 animate-bounce-small drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            )}

            {/* Number */}
            {cell.neighborMines > 0 && (
                <span className={`font-bold text-xl relative z-10 ${getCellColor(cell.neighborMines)}`}>
                    {cell.neighborMines}
                </span>
            )}
        </div>
    );
  }, [cell.isFlagged, cell.isRevealed, cell.isMine, cell.neighborMines, cell.mineType, cell.itemType, cellSeed]);

  let bgClass = "bg-gray-750 cell-shadow hover:bg-gray-700";
  let animationClass = "";

  if (cell.isRevealed) {
    if (cell.isMine) {
        // Exploded Mine / Monster
        bgClass = cell.mineType === MineType.MONSTER 
            ? "bg-purple-900/50 cell-revealed border border-purple-800"
            : "bg-red-900/50 cell-revealed border border-red-800";
    } else {
        bgClass = "bg-gray-850 cell-revealed border border-gray-800";
        // Apply pop animation only to safe cells
        animationClass = "animate-reveal-pop";
        
        // Highlight collected items slightly
        if (cell.itemType === ItemType.POTION) bgClass += " shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]";
        if (cell.itemType === ItemType.CHEST) bgClass += " shadow-[inset_0_0_15px_rgba(234,179,8,0.2)]";
    }
  } else if (gameOver && cell.isMine) {
    bgClass = "bg-gray-800 opacity-60"; // Reveal mines on game over
  }

  // Override content for game over reveal
  const displayContent = (gameOver && cell.isMine && !cell.isRevealed && !cell.isFlagged) 
    ? (cell.mineType === MineType.MONSTER ? <PixelEnemy seed={cellSeed} className="w-8 h-8 opacity-70" /> : <Icons.mine className="w-5 h-5 text-gray-500" />)
    : content;

  return (
    <div
      onClick={onClick}
      onContextMenu={onRightClick}
      className={`
        w-8 h-8 sm:w-10 sm:h-10 
        flex items-center justify-center 
        cursor-pointer select-none transition-colors duration-100 rounded-sm
        ${bgClass} ${animationClass}
      `}
    >
      {displayContent}
    </div>
  );
});

export const GameBoard: React.FC<GameBoardProps> = ({ cells, width, height, onCellClick, onCellRightClick, gameOver, floatingTexts }) => {
  return (
    <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-2xl border border-gray-800">
      {/* Outer Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
      
      {/* Board Container */}
      <div className="relative bg-gray-950 rounded-[10px] p-2 sm:p-4 overflow-auto max-w-[95vw] max-h-[75vh] custom-scrollbar z-10">
         {/* Internal Texture */}
         <div className="absolute inset-0 bg-dots-dark opacity-40 pointer-events-none"></div>
         
         {/* The Grid */}
         <div 
          className="grid gap-1 relative z-10 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            width: 'fit-content'
          }}
        >
          {cells.map((cell) => (
            <CellComponent
              key={cell.id}
              cell={cell}
              onClick={() => onCellClick(cell.id)}
              onRightClick={(e) => onCellRightClick(e, cell.id)}
              gameOver={gameOver}
            />
          ))}
          
          {/* Floating Texts Overlay */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className="absolute pointer-events-none z-50 flex flex-col items-center justify-center animate-float-text whitespace-nowrap"
              style={{
                left: `calc((${ft.x} / ${width}) * 100%)`,
                top: `calc((${ft.y} / ${height}) * 100%)`,
                width: `calc(100% / ${width})`, // Center in cell
                height: `calc(100% / ${height})`,
              }}
            >
              <span 
                className={`font-black text-sm sm:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${ft.color}`}
                style={{ textShadow: '0px 0px 4px black' }}
              >
                {ft.icon && <span className="mr-1">{ft.icon}</span>}
                {ft.text}
              </span>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};