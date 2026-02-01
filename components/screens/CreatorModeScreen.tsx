
import React, { useState } from 'react';
import Header from '../ui/Header';
import { PlayerStats } from '../../types';
import { calculateMaxStats } from '../../services/gameLogic';

interface CreatorModeScreenProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onBack: () => void;
}

const CreatorModeScreen: React.FC<CreatorModeScreenProps> = ({ stats, setStats, onBack }) => {
  const maxStats = calculateMaxStats(stats.level);

  const handleChange = (field: keyof PlayerStats, value: number) => {
    setStats(prev => ({ ...prev, [field]: value }));
  };

  const handleFullHeal = () => {
    const newMax = calculateMaxStats(stats.level);
    setStats(prev => ({
        ...prev,
        savedHp: newMax.maxHp,
        savedMp: newMax.maxMp
    }));
    alert("已恢复至当前等级的最大状态！");
  };

  return (
    <div className="z-20 w-full max-w-lg p-6 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl animate-fade-in">
      <Header title="创作者模式 (DEBUG)" onBack={onBack} className="text-green-500" />
      
      <div className="space-y-6">
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">基础属性修改</h3>
            
            <div className="grid gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">等级 (Level) - 影响血量/蓝量上限</label>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="number" 
                            className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white"
                            value={stats.level}
                            onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                        />
                        <div className="text-xs text-slate-500 w-24">
                            HP: {maxStats.maxHp}<br/>MP: {maxStats.maxMp}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">基础攻击力 (Base ATK)</label>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={stats.baseAtk}
                        onChange={(e) => handleChange('baseAtk', parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>

        <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">资源修改</h3>
            <div>
                <label className="block text-xs text-slate-400 mb-1">召唤石 (Summon Stones)</label>
                <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                    value={stats.summonStones}
                    onChange={(e) => handleChange('summonStones', parseInt(e.target.value) || 0)}
                />
            </div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
                onClick={handleFullHeal}
                className="w-full py-3 bg-green-900/50 hover:bg-green-800 border border-green-600 rounded text-green-100 font-bold"
            >
                💉 一键满状态 (回血回蓝)
            </button>
            <p className="text-[10px] text-slate-500 text-center">修改等级后，请点击“一键满状态”以应用新的血量上限到当前血量。</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorModeScreen;
