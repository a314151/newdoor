import { PlayerStats, Enemy } from '../../types';

export const calculateXpGain = (stats: PlayerStats, xp: number) => {
  let newStats = { ...stats };
  let levelsGained = 0;
  let hpGain = 0;
  let mpGain = 0;

  newStats.currentXp += xp;

  // 检查是否升级
  while (newStats.currentXp >= newStats.nextLevelXp) {
    levelsGained++;
    newStats.currentXp -= newStats.nextLevelXp;
    newStats.level++;
    newStats.nextLevelXp = Math.floor(newStats.nextLevelXp * 1.2);
    
    // 每级增加属性
    hpGain += 5;
    mpGain += 2;
  }

  return {
    newStats,
    levelsGained,
    hpGain,
    mpGain
  };
};

export const generateEnemyStats = (enemyName: string, playerLevel: number): Enemy => {
  const baseHp = 10 + (playerLevel * 3);
  const baseDamage = 2 + (playerLevel * 0.5);

  return {
    id: `enemy_${Date.now()}`,
    name: enemyName,
    description: `一个危险的敌人`,
    hp: baseHp,
    maxHp: baseHp,
    damage: Math.floor(baseDamage),
    imageUrl: `https://placehold.co/200x200?text=${enemyName}`
  };
};

export const calculateMaxStats = (level: number) => {
  const maxHp = 20 + (level * 5);
  const maxMp = 10 + (level * 2);
  const baseAtk = Math.floor(level * 0.5);

  return {
    maxHp,
    maxMp,
    baseAtk
  };
};

export const calculateDamage = (attackerAtk: number, defenderDef: number = 0) => {
  const damage = Math.max(1, attackerAtk - defenderDef);
  return Math.floor(damage * (0.8 + Math.random() * 0.4)); // 80%-120%的伤害浮动
};

export const calculateHitChance = (attackerLevel: number, defenderLevel: number) => {
  const levelDiff = defenderLevel - attackerLevel;
  let baseChance = 0.8;
  
  // 等级差影响命中率
  if (levelDiff > 0) {
    baseChance -= levelDiff * 0.05;
  } else if (levelDiff < 0) {
    baseChance += Math.abs(levelDiff) * 0.02;
  }
  
  return Math.max(0.3, Math.min(0.95, baseChance));
};