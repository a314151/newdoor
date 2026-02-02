
import { PlayerStats, Enemy, ThemeConfig } from '../types';

interface XpResult {
  newStats: PlayerStats;
  levelsGained: number;
  hpGain: number;
  mpGain: number;
}

export const calculateMaxStats = (level: number) => {
  return {
    maxHp: 20 + (level - 1) * 5,
    maxMp: 10 + (level - 1) * 2
  };
};

export const calculateXpGain = (stats: PlayerStats, amount: number): XpResult => {
  let { level, currentXp, nextLevelXp } = stats;
  let levelsGained = 0;
  let hpGain = 0;
  let mpGain = 0;

  let tempXp = currentXp + amount;
  let tempLevel = level;
  let tempNextXp = nextLevelXp;

  while (tempXp >= tempNextXp) {
    tempXp -= tempNextXp;
    tempLevel++;
    tempNextXp = Math.floor(tempNextXp * 1.2);
    levelsGained++;
    hpGain += 5; // +5 Max HP per level
    mpGain += 2; // +2 Max MP per level
  }

  return {
    newStats: {
      ...stats,
      level: tempLevel,
      currentXp: tempXp,
      nextLevelXp: tempNextXp
    },
    levelsGained,
    hpGain,
    mpGain
  };
};

/**
 * Generates consistent enemy stats ensuring current HP does not exceed Max HP.
 */
export const generateEnemyStats = (
    baseEnemy: { name: string; description: string }, 
    playerLevel: number, 
    isFinalBoss: boolean,
    x: number,
    y: number
): Enemy => {
    const levelScaling = Math.floor(playerLevel * 1.5);
    const bossMultiplier = isFinalBoss ? 1.5 : 1;
    
    // Calculate Max HP first to be the ceiling
    const baseMaxHp = 20 + Math.floor(Math.random() * 10);
    const maxHp = Math.floor((baseMaxHp + levelScaling) * bossMultiplier);
    
    // Current HP is maxHp (fresh enemy)
    const hp = maxHp;

    const damage = Math.floor((3 + Math.floor(playerLevel / 3)) * bossMultiplier);

    return {
        id: `${x}-${y}`,
        name: baseEnemy.name,
        description: baseEnemy.description,
        hp,
        maxHp,
        damage,
        isBoss: isFinalBoss
    };
};
