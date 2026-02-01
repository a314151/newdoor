
import React from 'react';
import Header from '../ui/Header';
import GameGrid from '../GameGrid';
import { GridCell, Player, ThemeConfig, GameAssets, PlayerStats } from '../../types';

interface GameScreenProps {
  grid: GridCell[];
  player: Player;
  stats: PlayerStats;
  theme: ThemeConfig;
  assets: GameAssets;
  onMove: (x: number, y: number) => void;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ grid, player, stats, theme, assets, onMove, onBack }) => {
  return (
    <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-2xl px-4 pt-4 h-full min-h-[100dvh] overflow-hidden">
        {/* Note: BackButton is now rendered in App.tsx to ensure it sits above everything */}

        {/* Header without internal back button */}
        <Header title={theme.themeTitle} />
        
        {/* HUD Area */}
        <div className="w-full flex flex-col gap-2 border-b border-slate-700 pb-2 mb-2 px-2 bg-slate-900/50 rounded p-2 mt-2">
             {/* Level & XP Bar */}
             <div className="flex flex-col gap-1 w-full">
                <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                     <span className="text-yellow-400">LV.{stats.level} <span className="text-slate-500 text-[10px] font-normal">{player.name}</span></span>
                     <span className="text-[10px]">EXP {stats.currentXp}/{stats.nextLevelXp}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]" 
                        style={{ width: `${Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100)}%` }}
                    ></div>
                </div>
             </div>

             <div className="flex justify-between items-end mt-1">
                 <div className="text-[10px] text-slate-400 font-mono w-1/2 leading-tight">
                     {theme.flavorText}
                 </div>
                 <div className="text-right text-xs font-mono font-bold space-y-1">
                     <div className="text-green-400 drop-shadow-md bg-green-900/20 px-2 rounded">HP: {player.hp}/{player.maxHp}</div>
                     <div className="text-blue-400 drop-shadow-md bg-blue-900/20 px-2 rounded">MP: {player.mp}/{player.maxMp}</div>
                 </div>
             </div>
         </div>

         {/* Grid Container */}
         <div className="flex-1 flex items-center justify-center w-full pb-20">
            <GameGrid grid={grid} player={player} theme={theme} assets={assets} onMove={onMove} />
         </div>
    </div>
  );
};

export default GameScreen;
