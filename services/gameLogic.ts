
import { PlayerStats, Enemy, ThemeConfig } from '../types';

interface TitleInfo {
  title: string;
  color: string;
  isCreator?: boolean;
}

const CREATOR_UID = '50af4084-52b3-4e50-9dc1-4a11c7311c78';

export const getTitleByLevel = (level: number, uid: string): TitleInfo => {
  // 检查是否是特定UID用户
  if (uid === CREATOR_UID) {
    return {
      title: '造物者',
      color: '#ffcc00',
      isCreator: true
    };
  }

  // 根据等级分配称号
  if (level >= 1 && level <= 10) {
    return {
      title: '见习',
      color: '#666666'
    };
  } else if (level >= 11 && level <= 20) {
    return {
      title: '初出茅庐',
      color: '#888888'
    };
  } else if (level >= 21 && level <= 30) {
    return {
      title: '小有成就',
      color: '#aaaaaa'
    };
  } else if (level >= 31 && level <= 40) {
    return {
      title: '威震一方',
      color: '#cccccc'
    };
  } else if (level >= 41 && level <= 50) {
    return {
      title: '凌绝顶',
      color: '#eeeeee'
    };
  } else if (level >= 51 && level <= 60) {
    return {
      title: '众山小',
      color: '#ffffff'
    };
  } else {
    // 61级以上
    return {
      title: '新人',
      color: '#999999'
    };
  }
};

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
