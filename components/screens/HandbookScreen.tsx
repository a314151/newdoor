
import React from 'react';
import Header from '../ui/Header';

interface HandbookScreenProps {
  onBack: () => void;
}

const HandbookScreen: React.FC<HandbookScreenProps> = ({ onBack }) => {
  return (
    <div className="z-20 w-full max-w-lg p-6 bg-slate-900 border-2 border-blue-500 rounded-lg h-[80vh] overflow-y-auto animate-fade-in">
      <Header title="冒险者手册" onBack={onBack} />
      
      <div className="space-y-6 text-sm text-slate-300">
          <section>
              <h3 className="font-bold text-white mb-2 text-lg">多元宇宙机制</h3>
              <p>每次进入大门，AI 都会生成一个全新的世界。没有两个世界是相同的。环境、敌人和战利品都会发生变化。</p>
          </section>
          
          <section>
              <h3 className="font-bold text-white mb-2 text-lg">探索区域</h3>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                  <li><span className="text-red-400 font-bold">战斗区域 (👾)</span>: 遭遇敌人，通过战斗获得经验和战利品。</li>
                  <li><span className="text-blue-400 font-bold">初心讨论区 (💬)</span>: 这里的怪物并非都充满敌意。与它们进行深度的对话，探讨当前世界的哲学与意义。对话成功可和平通关并获得奖励。</li>
                  <li><span className="text-purple-400 font-bold">运气区 (🎲)</span>: 命运的抉择。三张卡牌，可能隐藏着宝藏，也可能隐藏着诅咒。</li>
              </ul>
          </section>

          <section>
              <h3 className="font-bold text-white mb-2 text-lg">英雄与技能</h3>
              <p>初始你只有一名普通冒险家。通关章节可获得<span className="text-yellow-400">召唤石</span>。</p>
              <p>在“召唤”界面输入任何名字（如神话人物、动漫角色），AI 将为你生成该角色的专属技能和形象。</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><span className="text-red-400">攻击 (ATTACK)</span>: 造成物理伤害。</li>
                <li><span className="text-green-400">治疗 (HEAL)</span>: 恢复生命值 (HP)。</li>
                <li><span className="text-blue-400">增益 (BUFF)</span>: 恢复法力值 (MP) 或提供状态。</li>
                <li><span className="text-purple-400">终极 (ULTIMATE)</span>: 消耗大量 MP 造成的强力效果。</li>
              </ul>
          </section>
          <section>
              <h3 className="font-bold text-white mb-2 text-lg">历史记录</h3>
              <p>当你完成一个完整的战役（通常9-11层），所有的冒险日记会被AI重写成一篇连贯的微小说，永久保存在历史记录中。</p>
          </section>
      </div>
    </div>
  );
};

export default HandbookScreen;
