
import React, { useEffect, useRef } from 'react';
import { GridCell, Player, CellType, ThemeConfig, GameAssets } from '../types';

interface GameGridProps {
  grid: GridCell[];
  player: Player;
  theme: ThemeConfig;
  assets: GameAssets;
  onMove: (x: number, y: number) => void;
}

const GameGrid: React.FC<GameGridProps> = ({ grid, player, theme, assets, onMove }) => {
  const GRID_SIZE = 5;

  // Use refs to keep track of the latest props/state without triggering effect re-runs
  // This solves the "Stale Closure" problem where event listeners use old state.
  const onMoveRef = useRef(onMove);
  const playerRef = useRef(player);

  useEffect(() => {
    onMoveRef.current = onMove;
    playerRef.current = player;
  }, [onMove, player]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const currentPlayer = playerRef.current;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

        if (dx !== 0 || dy !== 0) {
            onMoveRef.current(currentPlayer.x + dx, currentPlayer.y + dy);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array = listener attached once, uses refs for latest data

  return (
    <div className="relative p-1 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-2xl z-20">
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: 'min(100vw - 40px, 500px)',
          height: 'min(100vw - 40px, 500px)'
        }}
      >
        {grid.map((cell) => {
            const isPlayerHere = cell.x === player.x && cell.y === player.y;
            const isVisible = cell.visible;
            
            // Fog of war styling
            if (!isVisible) {
                return (
                    <div key={`${cell.x}-${cell.y}`} className="bg-slate-950 rounded border border-slate-800 flex items-center justify-center">
                        <span className="text-slate-800 text-xs">?</span>
                    </div>
                );
            }

            return (
                <div 
                  key={`${cell.x}-${cell.y}`} 
                  className={`
                    relative rounded flex items-center justify-center overflow-hidden cursor-pointer
                    ${cell.type === CellType.EXIT ? 'bg-indigo-900/50' : 'bg-slate-800'}
                    border ${isPlayerHere ? 'border-yellow-400' : 'border-slate-700'}
                    transition-all duration-200 active:scale-95
                  `}
                  onClick={() => {
                     // Check adjacency for click-to-move
                     if (Math.abs(cell.x - player.x) + Math.abs(cell.y - player.y) === 1) {
                         onMove(cell.x, cell.y);
                     }
                  }}
                >
                    {/* Background decoration for visited cells */}
                    {cell.visited && cell.type === CellType.EMPTY && (
                        <div className="absolute w-2 h-2 bg-slate-700 rounded-full opacity-20"></div>
                    )}

                    {/* Objects */}
                    {cell.type === CellType.KEY && !player.hasKey && (
                        <div className="animate-bounce z-10">
                            {assets.keyIconUrl.startsWith('data') ? (
                                <img src={assets.keyIconUrl} alt="Key" className="w-10 h-10 object-contain pixelated" />
                            ) : (
                                <span className="text-2xl">🔑</span>
                            )}
                        </div>
                    )}

                    {cell.type === CellType.EXIT && (
                         <div className="z-10 text-center">
                             <span className="text-2xl block">🚪</span>
                             <span className="text-[8px] uppercase">{theme.exitName}</span>
                         </div>
                    )}

                    {cell.type === CellType.ENEMY && (
                        <div className="z-10">
                           <span className="text-3xl filter drop-shadow-md">👾</span>
                        </div>
                    )}

                    {cell.type === CellType.DISCUSSION && (
                        <div className="z-10">
                           <span className="text-2xl filter drop-shadow-md">💬</span>
                        </div>
                    )}

                    {cell.type === CellType.LUCK && (
                        <div className="z-10">
                           <span className="text-2xl filter drop-shadow-md">🎲</span>
                        </div>
                    )}

                    {/* Player */}
                    {isPlayerHere && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-500/20 animate-pulse border-2 border-blue-400 rounded pointer-events-none">
                            <span className="text-2xl">👤</span>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      {/* HUD overlay inside grid container */}
      <div className="absolute -bottom-16 left-0 right-0 flex justify-between text-xs text-slate-400 px-2">
         <div>使用方向键移动</div>
         <div className={player.hasKey ? "text-yellow-400 font-bold" : "text-slate-600"}>
            {player.hasKey ? `持有: ${theme?.keyItemName || '钥匙'}` : `寻找: ${theme?.keyItemName || '钥匙'}`}
         </div>
      </div>
    </div>
  );
};

export default GameGrid;
