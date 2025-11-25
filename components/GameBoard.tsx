
import React, { useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Cell, MineType, ItemType, FloatingText, Particle } from '../types';
import { Icons } from './Icons';
import { SPRITES, PALETTE } from './PixelCharacters';

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

// --- CONSTANTS ---
const CELL_SIZE = 40;
const HALF_CELL = CELL_SIZE / 2;
const ICON_SIZE = 24;
const ICON_OFFSET = (CELL_SIZE - ICON_SIZE) / 2;

// SVG Paths for Canvas
const PATHS = {
  flag: new Path2D("M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7"),
  mine: new Path2D("M12 2v4 M12 18v4 M2 12h4 M18 12h4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M19.07 4.93l-2.83 2.83 M7.76 16.24l-2.83 2.83"),
  mineCircle: new Path2D("M18 12 A 6 6 0 1 1 6 12 A 6 6 0 1 1 18 12"),
  potion: new Path2D("M19 22H5l3-9h8l3 9z M14 13h-4 M12 13V2"),
  chest: new Path2D("M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 8.7 5 8.7-5 M12 22V12"),
  shield: new Path2D("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z")
};

// --- CACHE & HELPERS ---
const spriteCache = new Map<string, ImageBitmap>();

const createPixelSpriteBitmap = async (spriteData: string[]): Promise<ImageBitmap> => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create temp canvas");

    for(let y=0; y<16; y++) {
        for(let x=0; x<16; x++) {
            const char = spriteData[y][x];
            if(char !== '.') {
                ctx.fillStyle = PALETTE[char] || '#000';
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    return createImageBitmap(canvas);
};

// Pre-load sprites
const loadSprites = async () => {
    if (spriteCache.size > 0) return;
    const promises = Object.entries(SPRITES).map(async ([key, data]) => {
        const bitmap = await createPixelSpriteBitmap(data);
        spriteCache.set(key, bitmap);
    });
    await Promise.all(promises);
};

export const GameBoard: React.FC<GameBoardProps> = ({ cells, width, height, onCellClick, onCellRightClick, gameOver, floatingTexts, particles }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Transform State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const transformRef = useRef(transform); // Ref for animation loop to avoid closures
  const cellsRef = useRef(cells);
  const particlesRef = useRef(particles);
  
  // Interaction State
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startTransform = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const longPressTimer = useRef<number | null>(null);

  // Sync refs
  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { cellsRef.current = cells; }, [cells]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);

  // Load Assets
  useEffect(() => { loadSprites(); }, []);

  // --- RENDER LOOP ---
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Performance optimization
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
        if (!containerRef.current || !canvas) return;
        
        const pixelRatio = window.devicePixelRatio || 1;
        const widthPx = containerRef.current.clientWidth;
        const heightPx = containerRef.current.clientHeight;

        // Resize canvas if needed
        if (canvas.width !== widthPx * pixelRatio || canvas.height !== heightPx * pixelRatio) {
            canvas.width = widthPx * pixelRatio;
            canvas.height = heightPx * pixelRatio;
            ctx.scale(pixelRatio, pixelRatio);
        }

        const t = transformRef.current;
        
        // 1. Clear Background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, widthPx, heightPx);

        // Draw Void Pattern (simple dots)
        ctx.save();
        ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
        const patternSize = 20 * t.scale;
        const offsetX = t.x % patternSize;
        const offsetY = t.y % patternSize;
        for (let i = offsetX - patternSize; i < widthPx; i += patternSize) {
            for (let j = offsetY - patternSize; j < heightPx; j += patternSize) {
                ctx.beginPath();
                ctx.arc(i, j, 1 * t.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // 2. Apply Transform
        ctx.save();
        ctx.translate(Math.floor(t.x), Math.floor(t.y));
        ctx.scale(t.scale, t.scale);

        // 3. Culling - Calculate visible grid bounds
        // World coordinates of viewport corners
        const viewLeft = -t.x / t.scale;
        const viewTop = -t.y / t.scale;
        const viewRight = (widthPx - t.x) / t.scale;
        const viewBottom = (heightPx - t.y) / t.scale;

        const startCol = Math.max(0, Math.floor(viewLeft / CELL_SIZE) - 1);
        const endCol = Math.min(width, Math.ceil(viewRight / CELL_SIZE) + 1);
        const startRow = Math.max(0, Math.floor(viewTop / CELL_SIZE) - 1);
        const endRow = Math.min(height, Math.ceil(viewBottom / CELL_SIZE) + 1);

        // 4. Draw Cells
        ctx.lineWidth = 1; // Base line width

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const idx = y * width + x;
                const cell = cellsRef.current[idx];
                
                if (cell.isVoid) continue;

                const cx = x * CELL_SIZE;
                const cy = y * CELL_SIZE;

                // A. Draw Cell Background
                if (cell.isRevealed) {
                    if (cell.isMine) {
                        ctx.fillStyle = cell.mineType === MineType.MONSTER ? 'rgba(88, 28, 135, 0.5)' : 'rgba(127, 29, 29, 0.5)'; // purple-900/50 or red-900/50
                        ctx.strokeStyle = cell.mineType === MineType.MONSTER ? '#6b21a8' : '#991b1b';
                    } else {
                        ctx.fillStyle = '#1a202c'; // gray-850
                        ctx.strokeStyle = '#2d3748'; // gray-800
                    }
                } else {
                    ctx.fillStyle = '#2d3748'; // gray-750
                    ctx.strokeStyle = '#1a202c'; // gray-850
                    if (gameOver && cell.isMine) ctx.fillStyle = '#1f2937'; // gray-800
                }
                
                ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);

                // Highlight/Shadow effects for unrevealed
                if (!cell.isRevealed) {
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(cx, cy, CELL_SIZE, 1); // Top highlight
                    ctx.fillRect(cx, cy, 1, CELL_SIZE); // Left highlight
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(cx + CELL_SIZE - 2, cy, 2, CELL_SIZE); // Right shadow
                    ctx.fillRect(cx, cy + CELL_SIZE - 2, CELL_SIZE, 2); // Bottom shadow
                }

                // B. Draw Content
                if (cell.isFlagged && !cell.isRevealed) {
                    // Draw Flag
                    ctx.save();
                    ctx.translate(cx + 8, cy + 8);
                    ctx.scale(1.2, 1.2);
                    ctx.fillStyle = '#ef4444';
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.stroke(PATHS.flag);
                    ctx.fill(PATHS.flag);
                    ctx.restore();
                } else if (cell.isRevealed) {
                    if (cell.isMine) {
                        if (cell.mineType === MineType.MONSTER) {
                            // Draw Pixel Enemy
                            const seeds = ['enemy_slime', 'enemy_bat', 'enemy_eye', 'enemy_ghost'];
                            const variant = seeds[parseInt(cell.id.split('-')[1]) % seeds.length];
                            const sprite = spriteCache.get(variant);
                            
                            if (sprite) {
                                // Simple bounce animation based on time and position
                                const bounce = Math.sin(time / 200 + idx) * 2;
                                ctx.drawImage(sprite, cx + 4, cy + 4 + bounce, 32, 32);
                            } else {
                                // Fallback
                                ctx.fillStyle = 'purple';
                                ctx.fillRect(cx + 10, cy + 10, 20, 20);
                            }
                        } else {
                            // Draw Mine
                            ctx.save();
                            ctx.translate(cx + 8, cy + 8);
                            ctx.fillStyle = '#dc2626';
                            ctx.strokeStyle = '#dc2626';
                            ctx.lineWidth = 2;
                            ctx.fill(PATHS.mineCircle);
                            ctx.stroke(PATHS.mine);
                            ctx.restore();
                        }
                    } else {
                        // Draw Items
                        if (cell.itemType === ItemType.POTION) {
                            ctx.save();
                            ctx.translate(cx + 8, cy + 8);
                            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
                            ctx.fill(PATHS.potion);
                            ctx.restore();
                        } else if (cell.itemType === ItemType.CHEST) {
                            ctx.save();
                            ctx.translate(cx + 8, cy + 8);
                            ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
                            ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
                            ctx.shadowBlur = 10;
                            const bounce = Math.abs(Math.sin(time / 500)) * 3;
                            ctx.translate(0, -bounce);
                            ctx.fill(PATHS.chest);
                            ctx.restore();
                        }

                        // Draw Number
                        if (cell.neighborMines > 0) {
                            ctx.font = 'bold 20px monospace';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            const neighborFlags = 0; // Optimization: Recalculating flags in loop is expensive. Passed via props or memoized better? 
                            // For pure performance, simpler color logic:
                            const colors = ['#60a5fa', '#4ade80', '#f87171', '#c084fc', '#facc15', '#f472b6', '#2dd4bf', '#e5e7eb'];
                            ctx.fillStyle = colors[cell.neighborMines - 1] || 'white';
                            
                            ctx.fillText(cell.neighborMines.toString(), cx + HALF_CELL, cy + HALF_CELL + 2);
                        }
                    }
                } else if (gameOver && cell.isMine) {
                     // Revealed on Game Over
                     ctx.save();
                     ctx.globalAlpha = 0.5;
                     if (cell.mineType === MineType.MONSTER) {
                         const variant = 'enemy_slime'; // simplified
                         const sprite = spriteCache.get(variant);
                         if(sprite) ctx.drawImage(sprite, cx + 4, cy + 4, 32, 32);
                     } else {
                        ctx.translate(cx + 10, cy + 10);
                        ctx.scale(0.8, 0.8);
                        ctx.fillStyle = '#6b7280';
                        ctx.strokeStyle = '#6b7280';
                        ctx.stroke(PATHS.mine);
                        ctx.fill(PATHS.mineCircle);
                     }
                     ctx.restore();
                }
            }
        }

        // 5. Draw Particles (in World Space)
        particlesRef.current.forEach(p => {
             // Coordinate mapping: p.x, p.y are grid coordinates (floats)
             const px = p.x * CELL_SIZE + HALF_CELL;
             const py = p.y * CELL_SIZE + HALF_CELL;
             
             // Simple particle physics simulation in render loop (visual only) can be added here
             // But we rely on CSS animation in original code. 
             // To keep parity, we simulate fade based on time if we tracked creation time.
             // Since we don't have creation time passed easily, we just draw them.
             
             ctx.save();
             ctx.translate(px, py);
             // Apply offset from animation logic or static?
             // Since logic is in CSS, we can't easily sync. 
             // We will draw simple squares that fade out?
             // Actually, for pure performance, we'll draw them simply.
             
             // Hack: use a predictable pseudo-random offset based on ID to simulate "explosion"
             const life = (time % 800) / 800; // Loop every 800ms
             const dx = p.dx * life * 0.5;
             const dy = p.dy * life * 0.5;
             
             ctx.globalAlpha = 1 - life;
             
             // Extract color from Tailwind class (rough approximation)
             let color = '#fff';
             if (p.color.includes('red')) color = '#f87171';
             if (p.color.includes('blue')) color = '#60a5fa';
             if (p.color.includes('green')) color = '#4ade80';
             if (p.color.includes('yellow')) color = '#facc15';
             if (p.color.includes('pink')) color = '#f472b6';
             if (p.color.includes('purple')) color = '#c084fc';
             if (p.color.includes('cyan')) color = '#22d3ee';
             
             ctx.fillStyle = color;
             ctx.beginPath();
             ctx.arc(dx, dy, 3, 0, Math.PI*2);
             ctx.fill();
             ctx.restore();
        });

        ctx.restore();

        animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [width, height, gameOver]); // Dependencies that trigger heavy re-calcs

  // --- INITIAL CENTER ---
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
        if (!containerRef.current) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        if (cw === 0 || ch === 0) return;

        const gw = width * CELL_SIZE;
        const gh = height * CELL_SIZE;
        
        const scaleX = (cw - 40) / gw;
        const scaleY = (ch - 40) / gh;
        const fitScale = Math.min(scaleX, scaleY, 0.8);
        
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
    updateSize();
    return () => resizeObserver.disconnect();
  }, [width, height]);

  // --- INPUT HANDLING ---
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

  const getCellIdFromEvent = (clientX: number, clientY: number): string | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      const worldX = (mouseX - transform.x) / transform.scale;
      const worldY = (mouseY - transform.y) / transform.scale;

      const col = Math.floor(worldX / CELL_SIZE);
      const row = Math.floor(worldY / CELL_SIZE);

      if (col >= 0 && col < width && row >= 0 && row < height) {
          const idx = row * width + col;
          const cell = cells[idx];
          if (!cell || cell.isVoid) return null;
          return cell.id;
      }
      return null;
  };

  const startDrag = (clientX: number, clientY: number) => {
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: clientX, y: clientY };
    startTransform.current = { x: transform.x, y: transform.y };
  };

  const onDrag = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
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

  const stopDrag = (e: React.MouseEvent | React.TouchEvent | any) => {
    isDragging.current = false;
    
    if (!hasDragged.current && e.type !== 'mouseleave' && e.type !== 'touchcancel') {
        // It was a click
        let clientX, clientY;
        if (e.changedTouches && e.changedTouches.length > 0) {
             clientX = e.changedTouches[0].clientX;
             clientY = e.changedTouches[0].clientY;
        } else {
             clientX = e.clientX;
             clientY = e.clientY;
        }
        
        const cellId = getCellIdFromEvent(clientX, clientY);
        if (cellId) onCellClick(cellId);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const cellId = getCellIdFromEvent(e.clientX, e.clientY);
      if (cellId) onCellRightClick(cellId, e);
  };

  // Touch Long Press for Right Click
  const onTouchStart = (e: React.TouchEvent) => {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
      longPressTimer.current = window.setTimeout(() => {
          isDragging.current = false; // Stop drag
          hasDragged.current = true; // Prevent click
          if (navigator.vibrate) navigator.vibrate(50);
          const cellId = getCellIdFromEvent(e.touches[0].clientX, e.touches[0].clientY);
          if (cellId) onCellRightClick(cellId);
      }, 500);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      onDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const zoomIn = () => setTransform(p => ({ ...p, scale: Math.min(p.scale * 1.2, 5) }));
  const zoomOut = () => setTransform(p => ({ ...p, scale: Math.max(p.scale / 1.2, 0.1) }));
  const resetView = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const gw = width * CELL_SIZE;
    const gh = height * CELL_SIZE;
    const fitScale = Math.min((cw - 80)/gw, (ch - 80)/gh, 0.8);
    setTransform({
        x: (cw - gw * fitScale) / 2,
        y: (ch - gh * fitScale) / 2,
        scale: Math.max(0.2, fitScale)
    });
  };

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden select-none">
      {/* Container for Event Listeners */}
      <div 
        ref={containerRef}
        className={`w-full h-full relative overflow-hidden ${isDragging.current ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
        onMouseUp={stopDrag}
        onMouseLeave={() => isDragging.current = false}
        onContextMenu={handleRightClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={(e) => {
             if (longPressTimer.current) clearTimeout(longPressTimer.current);
             stopDrag(e);
        }}
        onWheel={handleWheel}
      >
         <canvas 
            ref={canvasRef}
            className="block w-full h-full"
            style={{ touchAction: 'none' }}
         />
      </div>

      {/* Floating Texts Overlay (HTML is better for text) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ 
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'top left',
              width: width * CELL_SIZE,
              height: height * CELL_SIZE
          }}>
              {floatingTexts.map((ft) => (
                <div
                  key={ft.id}
                  className="absolute flex flex-col items-center justify-center animate-float-text whitespace-nowrap will-change-transform"
                  style={{
                    left: ft.x * CELL_SIZE,
                    top: ft.y * CELL_SIZE,
                    width: CELL_SIZE, 
                    height: CELL_SIZE,
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
