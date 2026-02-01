import React from 'react';
import Header from '../ui/Header';
import { Hero } from '../../types';

interface CharacterScreenProps {
  heroes: Hero[];
  activeHeroId: string;
  setActiveHeroId: (id: string) => void;
  onBack: () => void;
}

const CharacterScreen: React.FC<CharacterScreenProps> = ({ heroes, activeHeroId, setActiveHeroId, onBack }) => {
  return (
    <div className="z-20 w-full max-w-2xl h-[80vh] bg-slate-900 border-2 border-slate-600 rounded-lg p-4 flex flex-col animate-fade-in">
      <Header title="角色名册" onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 pr-2">
          {heroes.map(hero => (
              <div key={hero.id} className={`p-3 rounded border relative transition-all ${activeHeroId === hero.id ? 'border-green-500 bg-green-900/10' : 'border-slate-700 bg-slate-800 hover:bg-slate-750'}`}>
                  <div className="flex gap-3">
                      <img src={hero.imageUrl} className="w-16 h-16 rounded bg-black object-cover border border-slate-600" alt={hero.name} />
                      <div>
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
                  {activeHeroId !== hero.id && (
                      <button onClick={() => setActiveHeroId(hero.id)} className="absolute bottom-2 right-2 px-3 py-1 bg-blue-700 text-xs rounded hover:bg-blue-600 transition-colors">
                          出战
                      </button>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
};

export default CharacterScreen;