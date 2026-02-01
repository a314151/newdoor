
import React, { useState } from 'react';

interface LuckScreenProps {
  onComplete: (effect: { hp: number, mp: number, xp: number, stones: number, msg: string, type: string }) => void;
}

const LuckScreen: React.FC<LuckScreenProps> = ({ onComplete }) => {
  const [revealed, setRevealed] = useState<number | null>(null);

  // Generate 3 random outcomes
  const generateOutcome = () => {
    const r = Math.random();
    if (r < 0.2) return { hp: -5, mp: 0, xp: 0, stones: 0, msg: "厄运！被不知名的力量诅咒了 (-5 HP)", type: 'bad' };
    if (r < 0.4) return { hp: 0, mp: -5, xp: 0, stones: 0, msg: "精神受到了干扰 (-5 MP)", type: 'bad' };
    if (r < 0.6) return { hp: 0, mp: 0, xp: 0, stones: 0, msg: "什么也没发生...", type: 'neutral' };
    if (r < 0.8) return { hp: 10, mp: 0, xp: 50, stones: 0, msg: "吉兆！伤口愈合了 (+10 HP, +50 XP)", type: 'good' };
    return { hp: 0, mp: 0, xp: 0, stones: 1, msg: "大吉！捡到了珍贵的石头 (+1 召唤石)", type: 'good' };
  };

  // We generate them once but don't show user until click
  // Using state initialization function to ensure stability
  const [cards] = useState(() => [generateOutcome(), generateOutcome(), generateOutcome()]);

  const handleCardClick = (index: number) => {
    if (revealed !== null) return;
    setRevealed(index);
    
    // Auto close after delay
    setTimeout(() => {
        onComplete(cards[index]);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg p-8 bg-slate-900 border-2 border-purple-500 rounded-lg shadow-2xl text-center">
         <h2 className="text-3xl mb-2 text-purple-400 pixel-font">命运轮盘</h2>
         <p className="text-slate-400 mb-8 text-sm">这就是所谓的运气... 请选择一张卡牌。</p>

         <div className="flex justify-center gap-4 h-48">
             {cards.map((card, idx) => {
                 const isRevealed = revealed === idx;
                 const isOther = revealed !== null && revealed !== idx;
                 
                 let cardColor = "bg-slate-800 border-slate-600";
                 if (isRevealed) {
                     if (card.type === 'good') cardColor = "bg-yellow-900 border-yellow-500";
                     else if (card.type === 'bad') cardColor = "bg-red-900 border-red-500";
                     else cardColor = "bg-slate-700 border-slate-500";
                 }

                 return (
                     <button
                        key={idx}
                        onClick={() => handleCardClick(idx)}
                        disabled={revealed !== null}
                        className={`
                            flex-1 rounded-lg border-2 transition-all duration-500 transform
                            ${cardColor}
                            ${!isRevealed && !isOther ? 'hover:-translate-y-2 hover:border-purple-400 cursor-pointer' : ''}
                            ${isOther ? 'opacity-30 scale-90' : 'opacity-100'}
                            ${isRevealed ? 'rotate-y-180 scale-105' : ''}
                            flex items-center justify-center p-2
                        `}
                     >
                         {isRevealed ? (
                             <div className="text-xs font-bold animate-fade-in">
                                 <div className="text-2xl mb-2">
                                     {card.type === 'good' ? '🎉' : card.type === 'bad' ? '💀' : '💨'}
                                 </div>
                                 {card.msg}
                             </div>
                         ) : (
                             <span className="text-4xl">?</span>
                         )}
                     </button>
                 );
             })}
         </div>
      </div>
    </div>
  );
};

export default LuckScreen;
