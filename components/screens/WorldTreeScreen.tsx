import React, { useState, useEffect, useRef } from 'react';
import Header from '../ui/Header';
import { WorldTreeProposal } from '../../types';

interface WorldTreeScreenProps {
  proposals: WorldTreeProposal[];
  onSubmitProposal: (content: string) => void;
  onBack: () => void;
}

const WorldTreeScreen: React.FC<WorldTreeScreenProps> = ({ proposals, onSubmitProposal, onBack }) => {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [proposalContent, setProposalContent] = useState('');
  const [treeGrowth, setTreeGrowth] = useState(0);
  const [isGrowing, setIsGrowing] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);

  // 模拟树的自然生长
  useEffect(() => {
    const growthInterval = setInterval(() => {
      setTreeGrowth(prev => {
        const newGrowth = prev + 0.1;
        return newGrowth > 100 ? 0 : newGrowth;
      });
    }, 5000);

    return () => clearInterval(growthInterval);
  }, []);

  const handleTreeClick = () => {
    setIsInputVisible(true);
  };

  const handleSubmitProposal = () => {
    if (proposalContent.trim()) {
      onSubmitProposal(proposalContent.trim());
      setProposalContent('');
      setIsInputVisible(false);
      // 触发树生长动画
      setIsGrowing(true);
      setTimeout(() => setIsGrowing(false), 2000);
    }
  };

  return (
    <div className="z-20 w-full max-w-4xl p-6 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl animate-fade-in">
      <Header title="世界树" onBack={onBack} className="text-green-500" />

      <div className="mt-6">
        {/* 世界树视觉效果 */}
        <div 
          ref={treeRef}
          onClick={handleTreeClick}
          className="relative h-[500px] flex justify-center items-end cursor-pointer mb-8"
        >
          {/* 树干 */}
          <div 
            className={`w-16 bg-gradient-to-b from-brown-700 to-brown-900 rounded-t-full transition-all duration-1000 ease-in-out ${isGrowing ? 'animate-grow' : ''}`}
            style={{ 
              height: `${300 + treeGrowth * 2}px`,
              boxShadow: '0 0 20px rgba(34,197,94,0.3)' 
            }}
          />

          {/* 树枝 */}
          <div className="absolute bottom-[300px] left-1/2 transform -translate-x-1/2 flex justify-between w-[300px]">
            <div className="w-12 h-2 bg-gradient-to-r from-green-800 to-green-900 rounded-full transform rotate-45 origin-right"></div>
            <div className="w-12 h-2 bg-gradient-to-l from-green-800 to-green-900 rounded-full transform -rotate-45 origin-left"></div>
          </div>

          <div className="absolute bottom-[350px] left-1/2 transform -translate-x-1/2 flex justify-between w-[250px]">
            <div className="w-10 h-2 bg-gradient-to-r from-green-800 to-green-900 rounded-full transform rotate-30 origin-right"></div>
            <div className="w-10 h-2 bg-gradient-to-l from-green-800 to-green-900 rounded-full transform -rotate-30 origin-left"></div>
          </div>

          {/* 树叶 */}
          <div className="absolute bottom-[380px] left-1/2 transform -translate-x-1/2 w-[350px] h-[200px]">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 rounded-full opacity-80"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-50 blur-xl"></div>
          </div>

          {/* 果实 */}
          {proposals.map((proposal, index) => (
            <div 
              key={proposal.id}
              className={`absolute rounded-full cursor-pointer transition-all duration-500 hover:scale-110 ${proposal.isCompleted ? 'animate-glow' : ''}`}
              style={{
                bottom: `${320 + (index % 3) * 50}px`,
                left: `calc(50% + ${(index % 3 - 1) * 100}px)`,
                width: '30px',
                height: '30px',
                backgroundColor: proposal.isCompleted ? '#fde047' : '#ef4444',
                boxShadow: proposal.isCompleted ? '0 0 15px #fde047' : '0 0 10px rgba(239, 68, 68, 0.5)'
              }}
              title={proposal.content}
            />
          ))}

          {/* 点击提示 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-900/80 text-green-200 px-4 py-2 rounded-full text-sm animate-pulse">
            点击树提交你的游戏更新想法
          </div>
        </div>

        {/* 提议输入表单 */}
        {isInputVisible && (
          <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-6">
            <h3 className="text-green-400 font-bold mb-4">提交游戏更新想法</h3>
            <textarea
              className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white h-32 resize-none"
              placeholder="请输入你的游戏更新想法..."
              value={proposalContent}
              onChange={(e) => setProposalContent(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setIsInputVisible(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
              >
                取消
              </button>
              <button
                onClick={handleSubmitProposal}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white"
              >
                提交
              </button>
            </div>
          </div>
        )}

        {/* 提议列表 */}
        <div className="mt-8">
          <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">最近的提议</h3>
          <div className="space-y-3">
            {proposals.slice(0, 5).map((proposal) => (
              <div 
                key={proposal.id}
                className={`p-3 bg-slate-800/50 rounded border ${proposal.isCompleted ? 'border-yellow-500' : 'border-slate-700'}`}
              >
                <div className="text-white mb-2">{proposal.content}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    {new Date(proposal.createdAt).toLocaleString()}
                  </div>
                  {proposal.isCompleted && (
                    <div className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-0.5 rounded-full">
                      已完成
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldTreeScreen;