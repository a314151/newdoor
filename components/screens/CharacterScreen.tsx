import React, { useState } from 'react';
import Header from '../ui/Header';
import { Hero } from '../../types';

interface CharacterScreenProps {
  heroes: Hero[];
  activeHeroId: string;
  setActiveHeroId: (id: string) => void;
  onDeleteHero: (id: string) => void;
  onBack: () => void;
}

const CharacterScreen: React.FC<CharacterScreenProps> = ({ heroes, activeHeroId, setActiveHeroId, onDeleteHero, onBack }) => {
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);

  const handleDeleteHero = (id: string) => {
    if (id !== activeHeroId) {
      onDeleteHero(id);
    }
  };

  const handleViewDetails = (hero: Hero) => {
    setSelectedHero(hero);
  };

  const closeDetails = () => {
    setSelectedHero(null);
  };

  return (
    <>
      <div className="z-20 w-full max-w-2xl h-[80vh] bg-slate-900 border-2 border-slate-600 rounded-lg p-4 flex flex-col animate-fade-in">
        <Header title="角色名册" onBack={onBack} />
        
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 pr-2">
            {heroes.map(hero => (
                <div 
                  key={hero.id} 
                  className={`p-3 rounded border relative transition-all cursor-pointer ${activeHeroId === hero.id ? 'border-green-500 bg-green-900/10' : 'border-slate-700 bg-slate-800 hover:bg-slate-750'}`}
                  onClick={() => handleViewDetails(hero)}
                >
                    <div className="flex gap-3">
                        <img src={hero.imageUrl} className="w-16 h-16 rounded bg-black object-cover border border-slate-600" alt={hero.name} />
                        <div className="flex-1">
                            <div className="font-bold text-white">{hero.name}</div>
                            <div className="text-[10px] text-slate-400 mb-1">{hero.title}</div>
                            {activeHeroId === hero.id && <span className="text-[10px] bg-green-800 px-2 py-0.5 rounded text-green-100">当前使用</span>}
                        </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                       {hero.skills.map((s, i) => (
                           <div key={i} className="text-[10px] bg-slate-900/50 p-1 rounded text-slate-300 border border-slate-700 truncate">
                               {s.name}
                           </div>
                       ))}
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      {activeHeroId !== hero.id && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveHeroId(hero.id);
                            }} 
                            className="px-3 py-1 bg-blue-700 text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                              出战
                          </button>
                      )}
                      {!hero.isDefault && activeHeroId !== hero.id && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHero(hero.id);
                            }} 
                            className="px-3 py-1 bg-red-700 text-xs rounded hover:bg-red-600 transition-colors"
                          >
                              删除
                          </button>
                      )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {selectedHero && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-600 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">英雄详情</h2>
              <button onClick={closeDetails} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img src={selectedHero.imageUrl} className="w-full max-w-[150px] h-auto rounded bg-black object-cover border border-slate-600 mx-auto" alt={selectedHero.name} />
                <div className="text-center mt-4">
                  <div className="font-bold text-white text-lg">{selectedHero.name}</div>
                  <div className="text-sm text-slate-400">{selectedHero.title}</div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-300 mb-2">背景故事</h3>
                  <div className="text-sm text-slate-400 bg-slate-800 p-3 rounded border border-slate-700">
                    {selectedHero.description}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-300 mb-2">技能介绍</h3>
                  <div className="space-y-3">
                    {selectedHero.skills.map((skill, index) => (
                      <div key={index} className="bg-slate-800 p-3 rounded border border-slate-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-sm">{skill.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${skill.type === 'ATTACK' ? 'bg-red-900/50 text-red-200' : skill.type === 'HEAL' ? 'bg-green-900/50 text-green-200' : skill.type === 'BUFF' ? 'bg-blue-900/50 text-blue-200' : 'bg-purple-900/50 text-purple-200'}`}>
                            {skill.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mb-1">{skill.description}</div>
                        <div className="text-xs text-slate-500">MP消耗: {skill.mpCost} | 威力: {skill.power}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CharacterScreen;