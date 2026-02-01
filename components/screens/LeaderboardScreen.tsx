
import React from 'react';
import Header from '../ui/Header';
import { LeaderboardEntry } from '../../types';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId: string | null;
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ entries, isLoading, currentUserId, onBack }) => {
  return (
    <div className="z-20 w-full max-w-lg p-6 bg-slate-900 border-2 border-yellow-600 rounded-lg h-[80vh] flex flex-col animate-fade-in shadow-2xl relative">
      <Header title="特工排行榜" onBack={onBack} />
      
      <div className="text-center text-xs text-slate-400 mb-4 border-b border-slate-800 pb-2">
         展示最近活跃的精英特工
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-yellow-500">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs animate-pulse">正在同步全球数据...</div>
            </div>
        ) : entries.length === 0 ? (
            <div className="text-center text-slate-500 mt-20">暂无数据</div>
        ) : (
            entries.map((entry, index) => {
                const isCurrentUser = currentUserId === entry.userId;
                let rankColor = "text-slate-400";
                let borderColor = "border-slate-700";
                
                if (index === 0) { rankColor = "text-yellow-400"; borderColor = "border-yellow-500"; }
                else if (index === 1) { rankColor = "text-slate-300"; borderColor = "border-slate-400"; }
                else if (index === 2) { rankColor = "text-orange-400"; borderColor = "border-orange-700"; }

                return (
                    <div 
                        key={entry.userId} 
                        className={`
                            flex items-center gap-3 p-3 rounded border 
                            ${borderColor} 
                            ${isCurrentUser ? 'bg-blue-900/30 ring-1 ring-blue-500' : 'bg-slate-800/50'}
                            hover:bg-slate-800 transition-colors
                        `}
                    >
                        {/* Rank Number */}
                        <div className={`font-bold text-xl w-8 text-center pixel-font ${rankColor}`}>
                            {index + 1}
                        </div>
                        
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded bg-black border border-slate-600 overflow-hidden flex-shrink-0">
                            <img src={entry.avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-bold truncate text-sm ${isCurrentUser ? 'text-blue-300' : 'text-slate-200'}`}>
                                    {entry.username}
                                </span>
                                {isCurrentUser && <span className="text-[10px] bg-blue-600 text-white px-1 rounded">ME</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{entry.title}</div>
                        </div>
                        
                        {/* Level Badge */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-yellow-500">Lv.{entry.level}</span>
                            <span className="text-[9px] text-slate-600">
                                {new Date(entry.updatedAt).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                            </span>
                        </div>
                    </div>
                );
            })
        )}
      </div>
      
      {!isLoading && (
        <div className="mt-4 text-[10px] text-slate-600 text-center">
            * 数据基于最近活跃的特工存档
        </div>
      )}
    </div>
  );
};

export default LeaderboardScreen;
