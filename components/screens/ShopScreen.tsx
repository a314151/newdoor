import React from 'react';
import Header from '../ui/Header';
import { Hero, PlayerStats } from '../../types';

interface ShopScreenProps {
  stats: PlayerStats;
  summonInput: string;
  setSummonInput: (val: string) => void;
  isSummoning: boolean;
  handleSummonHero: () => void;
  lastSummonedHero: Hero | null;
  setLastSummonedHero: (hero: Hero | null) => void;
  onBack: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({
  stats,
  summonInput,
  setSummonInput,
  isSummoning,
  handleSummonHero,
  lastSummonedHero,
  setLastSummonedHero,
  onBack
}) => {
  return (
    <div className="z-20 w-full max-w-lg p-6 bg-slate-900 border-2 border-yellow-700 rounded-lg text-center shadow-2xl animate-fade-in">
      <Header title="英灵召唤" onBack={onBack} />
      
      <div className="text-sm text-slate-400 mb-6">消耗 1 召唤石，从虚空中召唤一位英雄。</div>
      <div className="text-xl mb-6">当前拥有: <span className="text-yellow-400">{stats.summonStones}</span> 💎</div>
      
      {!lastSummonedHero ? (
        <>
            <input 
                type="text" 
                value={summonInput}
                onChange={(e) => setSummonInput(e.target.value)}
                placeholder="输入英雄名称 (如: 孙悟空, 钢铁侠)"
                className="w-full p-3 bg-black border border-slate-600 rounded mb-4 text-white text-center"
            />
            <button 
                onClick={handleSummonHero}
                disabled={isSummoning || stats.summonStones < 1}
                className="w-full py-4 bg-yellow-800 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold text-lg border border-yellow-500 transition-colors"
            >
                {isSummoning ? "召唤仪式进行中..." : "开始召唤"}
            </button>
        </>
      ) : (
        <div className="animate-fade-in">
            <img src={lastSummonedHero.imageUrl} className="w-32 h-32 mx-auto rounded border-2 border-yellow-500 mb-4" alt="Hero" />
            <h3 className="text-xl font-bold text-yellow-400">{lastSummonedHero.name}</h3>
            <p className="text-sm text-slate-400 mb-2">{lastSummonedHero.title}</p>
            <p className="text-xs text-slate-500 mb-4 italic">{lastSummonedHero.description}</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
                {lastSummonedHero.skills.map((s,i) => (
                    <div key={i} className="bg-slate-800 p-2 rounded text-xs border border-slate-700">
                        <div className="font-bold text-blue-300">{s.name}</div>
                        <div className="scale-75 text-slate-400">{s.description}</div>
                    </div>
                ))}
            </div>
            <button onClick={() => setLastSummonedHero(null)} className="px-6 py-2 bg-slate-700 rounded hover:bg-slate-600">继续召唤</button>
        </div>
      )}
    </div>
  );
};

export default ShopScreen;