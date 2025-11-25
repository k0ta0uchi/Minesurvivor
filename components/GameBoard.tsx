
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Cell, MineType, ItemType, FloatingText, Particle } from '../types';
import { Icons } from './Icons';
import { PixelEnemy } from './PixelCharacters';
import { Particles } from './Particles';

interface GameBoardProps {
  cells: Cell[];
  width: number;
  height: number;
  onCellClick: (id: string) => void;
  onCellRightClick: (id: string, e?: React.MouseEvent | React.TouchEvent) => void;
  gameOver: boolean;
  floatingTexts: FloatingText[];
  particles: Particle[];
}

const getCellColor = (neighborMines: number, neighborFlags: number) => {
  if (neighborFlags > neighborMines) return 'text-red-500 scale-110'; 
  if (neighborFlags === neighborMines) return 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]'; 

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

const CellComponent = React.memo(({ cell, onClick, onRightClick, gameOver, neighborFlags }: { cell: Cell, onClick: () => void, onRightClick: (e: React.MouseEvent | React.TouchEvent) => void, gameOver: boolean, neighborFlags: number }) => {
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  const startPress = useCallback((e: React.TouchEvent) => {
      isLongPress.current = false;
      longPressTimer.current = window.setTimeout(() => {
          isLongPress.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
          onRightClick(e);
      }, 500);
  }, [onRightClick]);

  const cancelPress = useCallback(() => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      cancelPress();
      if (isLongPress.current) {
          e.preventDefault(); 
      }
  }, [cancelPress]);

  const cellSeed = useMemo(() => parseInt(cell.id.split('-')[1]), [cell.id]);

  const content = useMemo(() => {
    if (cell.isFlagged && !cell.isRevealed) {
      return <Icons.flag className="w-5 h-5 text-red-500 drop-shadow-lg" />;
    }
    if (!cell.isRevealed) {
      return null;
    }
    if (cell.isMine) {
      if (cell.mineType === MineType.MONSTER) {
          return <PixelEnemy seed={cellSeed} className="w-8 h-8" />;
      }
      return <Icons.mine className="w-6 h-6 text-red-600 animate-pulse" />;
    }
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {cell.itemType === ItemType.POTION && (
                <Icons.potion className="absolute w-6 h-6 text-blue-500/30" />
            )}
            {cell.itemType === ItemType.CHEST && (
                <Icons.chest className="absolute w-6 h-6 text-yellow-400 opacity-80 animate-bounce-small drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            )}

            {cell.neighborMines > 0 && (
                <span className={`font-bold text-xl relative z-10 transition-all duration-300 ${getCellColor(cell.neighborMines, neighborFlags)}`}>
                    {cell.neighborMines}
                </span>
            )}
        </div>
    );
  }, [cell.isFlagged, cell.isRevealed, cell.isMine, cell.neighborMines, cell.mineType, cell.itemType, cellSeed, neighborFlags]);

  if (cell.isVoid) {
      return <div className="w-8 h-8 sm:w-10 sm:h-10 opacity-0 pointer-events-none" />;
  }

  let bgClass = "bg-gray-750 cell-shadow hover:bg-gray-700";
  let animationClass = "";

  if (cell.isRevealed) {
    if (cell.isMine) {
        bgClass = cell.mineType === MineType.MONSTER 
            ? "bg-purple-900/50 cell-revealed border border-purple-800"
            : "bg-red-900/50 cell-revealed border border-red-800";
    } else {
        bgClass = "bg-gray-850 cell-revealed border border-gray-800";
        animationClass = "animate-reveal-pop";
        
        if (cell.itemType === ItemType.POTION) bgClass += " shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]";
        if (cell.itemType === ItemType.CHEST) bgClass += " shadow-[inset_0_0_15px_rgba(234,179,8,0.2)]";
    }
  } else if (gameOver && cell.isMine) {
    bgClass = "bg-gray-800 opacity-60"; 
  }

  const displayContent = (gameOver && cell.isMine && !cell.isRevealed && !cell.isFlagged) 
    ? (cell.mineType === MineType.MONSTER ? <PixelEnemy seed={cellSeed} className="w-8 h-8 opacity-70" /> : <Icons.mine className="w-5 h-5 text-gray-500" />)
    : content;

  return (
    <div
      onClick={onClick}
      onContextMenu={onRightClick}
      onTouchStart={startPress}
      onTouchEnd={handleTouchEnd}
      onTouchMove={cancelPress}
      className={`
        w-8 h-8 sm:w-10 sm:h-10 
        flex items-center justify-center 
        cursor-pointer select-none transition-colors duration-100 rounded-sm touch-manipulation
        ${bgClass} ${animationClass}
      `}
    >
      {displayContent}
    </div>
  );
});

export const GameBoard: React.FC<GameBoardProps> = ({ cells, width, height, onCellClick, onCellRightClick, gameOver, floatingTexts, particles }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startTransform = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  // Resize Observer to center board when container size is known
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
        if (!containerRef.current) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        
        // If container has 0 size, don't update yet
        if (cw === 0 || ch === 0) return;

        const gw = width * 40;
        const gh = height * 40;
        
        const scaleX = (cw - 40) / gw; // Padding
        const scaleY = (ch - 40) / gh;
        const fitScale = Math.min(scaleX, scaleY, 0.8);
        
        // Only if we haven't set a valid transform yet (or if it was 0/0)
        setTransform(prev => {
           if (prev.x === 0 && prev.y === 0 && prev.scale === 0.8) {
               return {
                   x: (cw - gw * fitScale) / 2,
                   y: (ch - gh * fitScale) / 2,
                   scale: Math.max(0.2, fitScale)
               };
           }
           return prev;
        });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    // Initial call
    updateSize();

    return () => resizeObserver.disconnect();
  }, [width, height]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaleFactor = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    let newScale = transform.scale + direction * scaleFactor;
    newScale = Math.min(Math.max(0.1, newScale), 5);

    const worldX = (mouseX - transform.x) / transform.scale;
    const worldY = (mouseY - transform.y) / transform.scale;
    
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;
    
    setTransform({ x: newX, y: newY, scale: newScale });
  };

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: clientX, y: clientY };
    startTransform.current = { x: transform.x, y: transform.y };
  };

  const onDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDragged.current = true;
    }

    setTransform(prev => ({
        ...prev,
        x: startTransform.current.x + dx,
        y: startTransform.current.y + dy
    }));
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleCellClickInternal = (id: string) => {
    if (!hasDragged.current) {
        onCellClick(id);
    }
  };
  
  const getNeighborFlags = (index: number) => {
      const x = index % width;
      const y = Math.floor(index / width);
      let flags = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (cells[nIdx].isFlagged) flags++;
          }
        }
      }
      return flags;
  };

  const zoomIn = () => setTransform(p => {
      const newScale = Math.min(p.scale * 1.2, 5);
      if (containerRef.current) {
         const cw = containerRef.current.clientWidth;
         const ch = containerRef.current.clientHeight;
         const cx = cw / 2;
         const cy = ch / 2;
         const wx = (cx - p.x) / p.scale;
         const wy = (cy - p.y) / p.scale;
         return { x: cx - wx * newScale, y: cy - wy * newScale, scale: newScale };
      }
      return { ...p, scale: newScale };
  });

  const zoomOut = () => setTransform(p => {
      const newScale = Math.max(p.scale / 1.2, 0.1);
      if (containerRef.current) {
         const cw = containerRef.current.clientWidth;
         const ch = containerRef.current.clientHeight;
         const cx = cw / 2;
         const cy = ch / 2;
         const wx = (cx - p.x) / p.scale;
         const wy = (cy - p.y) / p.scale;
         return { x: cx - wx * newScale, y: cy - wy * newScale, scale: newScale };
      }
      return { ...p, scale: newScale };
  });

  const resetView = () => {
      if (containerRef.current) {
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          const gw = width * 40;
          const gh = height * 40;
          const scaleX = (cw - 80) / gw;
          const scaleY = (ch - 80) / gh;
          const fitScale = Math.min(scaleX, scaleY, 0.8);
          
          setTransform({
              x: (cw - gw * fitScale) / 2,
              y: (ch - gh * fitScale) / 2,
              scale: Math.max(0.2, fitScale)
          });
      }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-950">
      {/* Background Effect for 'Void' */}
      <div className="absolute inset-0 bg-dots-dark opacity-30 pointer-events-none" 
           style={{ 
               backgroundPosition: `${transform.x}px ${transform.y}px`, 
               backgroundSize: `${20 * transform.scale}px` 
           }} 
      />

      {/* Viewport Container */}
      <div 
        ref={containerRef}
        className={`w-full h-full relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => onDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={stopDrag}
        onWheel={handleWheel}
      >
         <div 
            className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
            style={{ 
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                width: width * 40, 
                height: height * 40 
            }}
         >
             {/* Particles Layer (Scaled) */}
             <div className="absolute inset-0 z-0">
                 <Particles particles={particles} width={width} height={height} />
             </div>

             {/* Grid */}
             <div 
              className="grid gap-0.5 relative z-10"
              style={{
                gridTemplateColumns: `repeat(${width}, 40px)`,
                gridTemplateRows: `repeat(${height}, 40px)`,
                width: width * 40,
                height: height * 40
              }}
            >
              {cells.map((cell, index) => (
                <CellComponent
                  key={cell.id}
                  cell={cell}
                  onClick={() => handleCellClickInternal(cell.id)}
                  onRightClick={(e) => { 
                      if(!hasDragged.current) onCellRightClick(cell.id, e); 
                  }}
                  gameOver={gameOver}
                  neighborFlags={cell.isRevealed ? getNeighborFlags(index) : 0}
                />
              ))}
              
              {/* Floating Texts Layer */}
              {floatingTexts.map((ft) => (
                <div
                  key={ft.id}
                  className="absolute pointer-events-none z-50 flex flex-col items-center justify-center animate-float-text whitespace-nowrap"
                  style={{
                    left: ft.x * 40,
                    top: ft.y * 40,
                    width: 40, 
                    height: 40,
                  }}
                >
                  <span 
                    className={`font-black text-sm sm:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${ft.color}`}
                    style={{ textShadow: '0px 0px 4px black', fontSize: `${Math.max(12, 16 / transform.scale)}px` }}
                  >
                    {ft.icon && <span className="mr-1">{ft.icon}</span>}
                    {ft.text}
                  </span>
                </div>
              ))}
            </div>
         </div>
      </div>

      {/* HUD Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-40 md:right-8 md:bottom-8">
          <button onClick={zoomIn} className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-full text-white shadow-lg hover:bg-gray-700 flex items-center justify-center font-bold text-xl active:scale-95 transition-transform" aria-label="Zoom In">+</button>
          <button onClick={zoomOut} className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-full text-white shadow-lg hover:bg-gray-700 flex items-center justify-center font-bold text-xl active:scale-95 transition-transform" aria-label="Zoom Out">-</button>
          <button onClick={resetView} className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-full text-white shadow-lg hover:bg-gray-700 flex items-center justify-center p-2 active:scale-95 transition-transform" aria-label="Reset View">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
      </div>

    </div>
  );
};
