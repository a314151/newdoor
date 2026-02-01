
import React, { useState, useEffect } from 'react';
import { Enemy, Player, ThemeConfig, GameAssets, Hero, SkillType } from '../types';

interface CombatScreenProps {
  player: Player;
  enemy: Enemy;
  hero: Hero;
  theme: ThemeConfig;
  assets: GameAssets;
  onWin: (remainingHp: number, remainingMp: number) => void;
  onLose: () => void;
}

const CombatScreen: React.FC<CombatScreenProps> = ({ player, enemy, hero, theme, assets, onWin, onLose }) => {
  const [playerHp, setPlayerHp] = useState(player.hp);
  const [playerMp, setPlayerMp] = useState(player.mp);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [animating, setAnimating] = useState(false);

  const enemyImage = assets.enemyImages[enemy.name] || 'https://picsum.photos/200';

  // Sync with parent player state (e.g., if potions are used in inventory modal)
  useEffect(() => {
    setPlayerHp(player.hp);
    setPlayerMp(player.mp);
  }, [player.hp, player.mp]);

  const pushLog = (text: string) => {
    setCombatLog(prev => [text, ...prev].slice(0, 4));
  };

  const enemyTurn = () => {
    setTimeout(() => {
      if (enemyHp > 0) {
          const dmg = Math.max(1, enemy.damage + Math.floor(Math.random() * 3) - 1);
          setPlayerHp(h => h - dmg);
          pushLog(`${enemy.name} 造成了 ${dmg} 点伤害！`);
      }
      setAnimating(false);
      setIsPlayerTurn(true);
    }, 1000);
  };

  useEffect(() => {
    if (playerHp <= 0) setTimeout(onLose, 500);
  }, [playerHp]);

  useEffect(() => {
    if (enemyHp <= 0) setTimeout(() => onWin(playerHp, playerMp), 1000);
    else if (!isPlayerTurn && !animating) {
      setAnimating(true);
      enemyTurn();
    }
  }, [enemyHp, isPlayerTurn, animating]); 

  const handleAction = (type: 'BASIC_ATTACK' | 'BASIC_DEFEND' | 'HERO_SKILL_1' | 'HERO_SKILL_2') => {
    if (!isPlayerTurn || animating) return;

    let skillName = "";
    let mpCost = 0;
    const skills = hero.skills ?? [];

    // Check costs first
    if (type === 'HERO_SKILL_1' && skills[0]) {
        mpCost = skills[0].mpCost;
    } else if (type === 'HERO_SKILL_2' && skills[1]) {
        mpCost = skills[1].mpCost;
    }

    if (playerMp < mpCost) {
        pushLog(`MP 不足！需要 ${mpCost} MP。`);
        return;
    }

    setIsPlayerTurn(false);
    setPlayerMp(m => m - mpCost);

    if (type === 'BASIC_ATTACK') {
        const dmg = 4 + Math.floor(player.atk / 2) + Math.floor(Math.random() * 2);
        setEnemyHp(h => h - dmg);
        pushLog(`你发起攻击，造成 ${dmg} 点伤害！`);
    } else if (type === 'BASIC_DEFEND') {
        const heal = 3;
        const mpRec = 2;
        setPlayerHp(h => Math.min(player.maxHp, h + heal));
        setPlayerMp(m => Math.min(player.maxMp, m + mpRec));
        pushLog(`你进行防御，恢复了状态。`);
    } else {
        const skillIndex = type === 'HERO_SKILL_1' ? 0 : 1;
        const skill = skills[skillIndex];
        if (!skill) return;
        const powerScale = skill.power || 5;
        
        if (skill.type === SkillType.HEAL) {
            const healAmount = Math.floor(powerScale * 2.5);
            setPlayerHp(h => Math.min(player.maxHp, h + healAmount));
            pushLog(`你使用了 [${skill.name}]，恢复 ${healAmount} HP！`);
        } else if (skill.type === SkillType.BUFF) {
             const mpRecover = Math.floor(powerScale * 1.5);
             setPlayerMp(m => Math.min(player.maxMp, m + mpRecover + mpCost)); // Refund cost + gain
             pushLog(`你使用了 [${skill.name}]，大口喘息恢复了能量！`);
        } else {
            // ATTACK or ULTIMATE
            const multiplier = skill.type === SkillType.ULTIMATE ? 2.5 : 1.5;
            const dmg = Math.floor((player.atk + powerScale) * multiplier) + Math.floor(Math.random() * 3);
            setEnemyHp(h => h - dmg);
            pushLog(`你使用了 [${skill.name}]！！造成 ${dmg} 点伤害！`);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="bg-red-900/50 p-3 flex justify-between items-center border-b border-red-800">
          <div className="flex items-center gap-2">
              <img src={hero.imageUrl || 'https://placehold.co/50x50'} className="w-8 h-8 rounded border border-slate-500" alt={hero.name} />
              <span className="text-white font-bold">{hero.name}</span>
          </div>
          <span className="text-red-300 font-bold tracking-wider">VS {enemy.name}</span>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
            {/* Battlefield */}
            <div className="flex w-full justify-between items-end gap-4 h-48 relative">
                {/* Player Stats */}
                <div className="w-1/3 flex flex-col gap-2">
                    <div className="text-blue-300 font-bold text-sm">HP</div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-600">
                        <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${player.maxHp ? (playerHp / player.maxHp) * 100 : 0}%`}}></div>
                    </div>
                    <div className="text-xs text-slate-400">{playerHp}/{player.maxHp}</div>

                    <div className="text-blue-300 font-bold text-sm mt-1">MP</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-600">
                        <div className="bg-blue-500 h-full transition-all duration-300" style={{width: `${player.maxMp ? (playerMp / player.maxMp) * 100 : 0}%`}}></div>
                    </div>
                    <div className="text-xs text-slate-400">{playerMp}/{player.maxMp}</div>
                </div>

                {/* Enemy Visual */}
                <div className="w-1/3 flex flex-col items-center justify-center">
                    <div className={`relative w-32 h-32 ${animating && !isPlayerTurn ? 'animate-bounce' : ''}`}>
                         <img 
                            src={enemyImage} 
                            alt={enemy.name} 
                            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                         />
                    </div>
                </div>

                {/* Enemy Stats */}
                <div className="w-1/3 flex flex-col gap-2 items-end">
                    <div className="text-red-300 font-bold text-sm">HP</div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-600">
                         <div className="bg-red-500 h-full transition-all duration-300" style={{width: `${enemy.maxHp ? Math.min(100, (enemyHp / enemy.maxHp) * 100) : 0}%`}}></div>
                    </div>
                    <div className="text-xs text-slate-400">{enemyHp}/{enemy.maxHp}</div>
                </div>
            </div>

            {/* Combat Log */}
            <div className="w-full h-24 bg-black/40 rounded p-2 overflow-hidden border border-slate-700 font-mono text-xs text-green-400">
                {combatLog.map((log, i) => (
                    <div key={i} className="opacity-80">{'>'} {log}</div>
                ))}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2 w-full">
                <button 
                    onClick={() => handleAction('BASIC_ATTACK')}
                    disabled={!isPlayerTurn}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-2 rounded flex items-center justify-center gap-2"
                >
                    <span>⚔️</span> <span className="text-xs font-bold">普攻</span>
                </button>
                <button 
                    onClick={() => handleAction('BASIC_DEFEND')}
                    disabled={!isPlayerTurn}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 p-2 rounded flex items-center justify-center gap-2"
                >
                    <span>🛡️</span> <span className="text-xs font-bold">防御</span>
                </button>

                {/* Dynamic Skills */}
                {(hero.skills ?? []).map((skill, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleAction(idx === 0 ? 'HERO_SKILL_1' : 'HERO_SKILL_2')}
                        disabled={!isPlayerTurn || playerMp < skill.mpCost}
                        className={`
                            relative p-2 rounded border flex flex-col items-start
                            ${skill.type === SkillType.ULTIMATE ? 'border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/40' : 'border-purple-600 bg-purple-900/20 hover:bg-purple-900/40'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <div className="flex justify-between w-full">
                            <span className="text-xs font-bold text-white truncate">{skill.name}</span>
                            <span className="text-[10px] text-blue-300">{skill.mpCost} MP</span>
                        </div>
                        <span className="text-[9px] text-slate-400 truncate w-full text-left">{skill.description}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CombatScreen;