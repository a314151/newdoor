import React, { useState } from 'react';
import Header from '../ui/Header';
import { StoryCampaign, StoryLog } from '../../types';

interface HistoryScreenProps {
  stories: StoryCampaign[];
  history: StoryLog[];
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ stories, history, onBack }) => {
  // Local state for selecting a story to view details
  const [selectedStory, setSelectedStory] = useState<StoryCampaign | null>(null);

  if (selectedStory) {
    return (
      <div className="z-20 w-full max-w-2xl px-4 h-full overflow-y-auto py-10 animate-fade-in no-scrollbar">
        <Header title={selectedStory.worldTitle} onBack={() => setSelectedStory(null)} />
        
        {selectedStory.fullStory && (
          <div className="bg-slate-900 border border-yellow-900/50 p-6 rounded-lg mb-8 shadow-2xl">
            <h3 className="text-center text-yellow-200 font-bold mb-4 decoration-double underline">史诗全集</h3>
            <p className="text-sm text-slate-300 leading-loose whitespace-pre-wrap">{selectedStory.fullStory}</p>
          </div>
        )}
        
        <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-widest">冒险日志</h3>
        <div className="space-y-6 relative border-l border-slate-800 ml-4 pl-6">
            {history.filter(h => h.storyId === selectedStory.id).map(log => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-900"></div>
                  <div className="text-xs text-purple-400 mb-1">{log.chapterTitle}</div>
                  <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
                    <p className="text-sm text-slate-300 leading-relaxed italic">{'"'}{log.summary}{'"'}</p>
                  </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="z-20 w-full max-w-2xl px-4 h-full overflow-y-auto py-10 no-scrollbar animate-fade-in">
        <Header title="传奇编年史" onBack={onBack} />
        
        {stories.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">暂无历史记录</div>
        ) : (
          <div className="space-y-4">
              {stories.map(story => (
                  <button key={story.id} onClick={() => setSelectedStory(story)} className="w-full bg-slate-900/80 border border-slate-700 hover:border-yellow-600 transition-colors p-4 rounded text-left relative overflow-hidden group">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{new Date(story.timestamp).toLocaleDateString()}</span>
                        <span className={story.isCompleted ? "text-green-400" : "text-yellow-400"}>{story.isCompleted ? "已完结" : "进行中"}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">{story.worldTitle}</h3>
                  </button>
              ))}
          </div>
        )}
    </div>
  );
};

export default HistoryScreen;