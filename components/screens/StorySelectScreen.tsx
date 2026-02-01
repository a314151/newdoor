import React from 'react';
import Header from '../ui/Header';

interface StorySelectScreenProps {
  storyOptions: string[];
  isRefreshing: boolean;
  onSelectStory: (title: string) => void;
  onRefresh: () => void;
  onBack: () => void;
}

const StorySelectScreen: React.FC<StorySelectScreenProps> = ({ 
  storyOptions, 
  isRefreshing, 
  onSelectStory, 
  onRefresh, 
  onBack 
}) => {
  const safeOptions = Array.isArray(storyOptions) ? storyOptions : [];

  return (
    <div className="z-20 w-full max-w-lg px-4 text-center animate-fade-in">
        <Header title="选择你的命运" onBack={onBack} />
        
        {isRefreshing ? (
            <div className="py-12 animate-pulse text-yellow-500 border border-slate-800 rounded bg-slate-900/50">
              正在搜寻新的平行宇宙...
            </div>
        ) : (
            <div className="grid gap-4 mb-6">
                {safeOptions.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => onSelectStory(opt)} 
                      className="p-4 bg-slate-900 border border-slate-700 hover:border-purple-500 hover:bg-slate-800 rounded text-left transition-all"
                    >
                      {opt}
                    </button>
                ))}
            </div>
        )}
        
        <div className="flex justify-center gap-4 mt-6">
           <button 
             onClick={onRefresh} 
             disabled={isRefreshing} 
             className="text-yellow-400 text-sm border border-yellow-800 px-6 py-2 rounded bg-yellow-900/20 hover:bg-yellow-900/40 disabled:opacity-50"
            >
             换一批
           </button>
        </div>
    </div>
  );
};

export default StorySelectScreen;