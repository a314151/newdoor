import React, { useState } from 'react';
import { UserProfile, PlayerStats, StoryCampaign } from '../../types';

// 版本号 - 与App.tsx中的DATA_VERSION保持同步
const VERSION = "2.0.4";

interface MenuScreenProps {
  userProfile: UserProfile;
  stats: PlayerStats;
  stories: StoryCampaign[];
  agentRank: number | null;
  userEmail: string | null;
  isSupabaseConfigured: boolean;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onStartAdventure: () => void;
  onNewStory: () => void;
  onOpenCharacters: () => void;
  onOpenShop: () => void;
  onOpenHandbook: () => void;
  onOpenHistory: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onOpenCreatorMode: () => void;
  onResumeStory: (story: StoryCampaign) => void;
  onOpenLeaderboard: () => void;
  onOpenFriends: () => void;
  onOpenEmail: () => void;
  unreadEmailCount?: number;
}

const MenuScreen: React.FC<MenuScreenProps> = ({
  userProfile,
  stats,
  stories,
  agentRank,
  userEmail,
  isSupabaseConfigured,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onStartAdventure,
  onNewStory,
  onOpenCharacters,
  onOpenShop,
  onOpenHandbook,
  onOpenHistory,
  onOpenInventory,
  onOpenSettings,
  onOpenCreatorMode,
  onResumeStory,
  onOpenLeaderboard,
  onOpenFriends,
  onOpenEmail,
  unreadEmailCount = 0
}) => {
  const [showFunctions, setShowFunctions] = useState(false);
  
  const handleFunctionClick = () => {
    console.log('Function button clicked, current state:', showFunctions);
    setShowFunctions(!showFunctions);
    console.log('New state:', !showFunctions);
  };
  
  return (
    <div className="z-40 relative text-center flex flex-col items-center w-full max-w-md px-4 animate-fade-in">
        <div className="w-full flex justify-center items-center mb-4">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 pixel-font select-none">
                无限之门
            </h1>
            <span className="ml-3 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
                v{VERSION}
            </span>
        </div>
        
        {/* PROFILE HEADER */}
        <div className="w-full mb-6 p-4 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center gap-4 relative group shadow-lg">
            <button 
                onClick={onOpenProfile}
                className="relative w-16 h-16 rounded-full border-2 border-slate-500 overflow-hidden bg-black hover:border-yellow-400 transition-colors"
            >
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </button>
            <div className="text-left flex-1 min-w-0">
                <div className="text-xs mb-1 flex items-center gap-2">
                    <span className={`${(() => {
                        switch (userProfile.title) {
                            case '造物者': return 'text-yellow-500 animate-pulse';
                            case '众山小': return 'text-yellow-400';
                            case '凌绝顶': return 'text-orange-400';
                            case '威震一方': return 'text-purple-400';
                            case '小有成就': return 'text-blue-400';
                            case '初出茅庐': return 'text-green-400';
                            case '新人': return 'text-red-400';
                            default: return 'text-slate-500';
                        }
                    })()}`}>
                        {userProfile.title}
                    </span>
                    {agentRank && (
                        <span className="text-[10px] text-yellow-500 bg-yellow-900/20 px-1.5 rounded border border-yellow-900/50 font-mono animate-pulse">
                            NO.{String(agentRank).padStart(4, '0')}
                        </span>
                    )}
                </div>
                <div className="font-bold text-lg text-white truncate">{userProfile.username}</div>
                <div className="text-[10px] text-slate-400 flex gap-2">
                    <span>LV.{stats.level}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-yellow-400">💎 {stats.summonStones}</span>
                </div>
            </div>
            <button 
               onClick={onOpenProfile}
               className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
            >
               ✎
            </button>
        </div>
        
        {/* AUTH / SYNC UI */}
        {isSupabaseConfigured && (
            <div className="w-full mb-4">
                {userEmail ? (
                     <div className="flex gap-2 justify-center items-center bg-slate-900/50 p-2 rounded border border-slate-800">
                         <div className="flex-1 text-left min-w-0">
                            <span className="text-[10px] text-slate-500 block">云端ID</span>
                            <span className="text-[10px] text-blue-400 truncate block">{userEmail}</span>
                         </div>
                         <button 
                            onClick={onLogout}
                            className="px-3 py-1 bg-red-900/20 border border-red-800 rounded text-[10px] text-red-400 hover:bg-red-900/50 transition-colors"
                         >
                             退出
                         </button>
                     </div>
                ) : (
                    <button 
                        onClick={onOpenAuth}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <span>☁️</span> 登录 / 注册 (启用云同步 & 排名)
                    </button>
                )}
            </div>
        )}
        
        <div className="grid gap-3 w-full">
            <button onClick={onStartAdventure} className="py-4 bg-blue-900/50 border border-blue-700 hover:bg-blue-800 rounded font-bold transition-transform hover:scale-105 active:scale-95 text-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                快速冒险
            </button>
            <button onClick={onNewStory} className="py-4 bg-purple-900/50 border border-purple-700 hover:bg-purple-800 rounded font-bold transition-transform hover:scale-105 active:scale-95 text-purple-100 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                开启新篇章
            </button>
            
            <div className="flex gap-2">
                <button onClick={onOpenCharacters} className="flex-1 py-3 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:scale-95 transition-colors">
                    👥 角色
                </button>
                <button onClick={onOpenShop} className="flex-1 py-3 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-500 hover:bg-yellow-900/40 active:scale-95 transition-colors">
                    🔮 召唤
                </button>
                <button onClick={onOpenHandbook} className="flex-1 py-3 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 active:scale-95 transition-colors">
                    📘 手册
                </button>
            </div>
            
            {stories.filter(s => !s.isCompleted).length > 0 && (
                <div className="text-xs text-slate-500 text-left mt-2 border-b border-slate-700 pb-1 mb-1">
                    进行中的故事:
                </div>
            )}
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stories.filter(s => !s.isCompleted).map(story => (
                  <button 
                    key={story.id} 
                    onClick={() => onResumeStory(story)} 
                    className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded text-left text-sm truncate hover:border-green-500 flex justify-between items-center group active:scale-95 transition-all"
                  >
                    <span className="truncate text-slate-300 group-hover:text-white">{story.worldTitle}</span>
                    <span className="text-xs text-slate-500 group-hover:text-green-400">
                        Lv.{story.currentLevel} {story.savedState ? '💾' : ''}
                    </span>
                  </button>
              ))}
            </div>
        </div>

        <div className="w-full grid grid-cols-4 gap-2 mt-8">
            {/* 功能按钮 - 上拉菜单 */}
            <div className="relative z-50">
                <button 
                    onClick={handleFunctionClick}
                    className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-800/50 transition-colors text-slate-500 hover:text-slate-300 w-full"
                >
                    <span className="text-lg">⚡</span>
                    <span className="text-[10px]">功能</span>
                </button>
                {showFunctions && (
                    <div className="absolute bottom-full left-0 mb-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-60">
                        <button onClick={onOpenHistory} className="w-full p-2 text-left hover:bg-slate-700 transition-colors text-sm">
                            📜 历史
                        </button>
                        <button onClick={onOpenInventory} className="w-full p-2 text-left hover:bg-slate-700 transition-colors text-sm">
                            🎒 背包
                        </button>
                        <button onClick={onOpenFriends} className="w-full p-2 text-left hover:bg-slate-700 transition-colors text-sm">
                            👥 好友
                        </button>
                    </div>
                )}
            </div>
            
            {/* 排名按钮 */}
            <button onClick={onOpenLeaderboard} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-800/50 transition-colors text-yellow-600 hover:text-yellow-400">
                <span className="text-lg">🏆</span>
                <span className="text-[10px] font-bold">排名</span>
            </button>
            
            {/* 系统通知按钮 */}
            <div className="relative">
                <button onClick={onOpenEmail} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-800/50 transition-colors text-blue-600 hover:text-blue-400">
                    <span className="text-lg">📧</span>
                    <span className="text-[10px]">通知</span>
                </button>
                {unreadEmailCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadEmailCount}
                    </span>
                )}
            </div>
            
            {/* 设置按钮 */}
            <button onClick={onOpenSettings} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-800/50 transition-colors text-slate-500 hover:text-slate-300">
                <span className="text-lg">⚙️</span>
                <span className="text-[10px]">设置</span>
            </button>
        </div>
        

            
        <button 
            onClick={onOpenCreatorMode} 
            className="absolute right-4 top-0 p-4 text-xl hover:text-green-500 text-slate-800 z-[60] transition-colors cursor-pointer opacity-50 hover:opacity-100" 
            title="创作者模式"
        >
            🛠️
        </button>
    </div>
  );
};

export default MenuScreen;