import { useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { calculateXpGain } from '../../services/gameLogic';
import { generateEnemyStats } from '../../services/gameLogic';
import { ItemType, Enemy, CellType, GameState } from '../../types';

export const useGameLogic = () => {
  const { 
    player, setPlayer, 
    currentEnemy, setCurrentEnemy,
    grid, setGrid,
    gameState, setGameState
  } = useGame();
  const { stats, setStats, userProfile, setUserProfile } = useUser();
  const { addToast } = useUI();

  const handleGainXp = useCallback((xp: number) => {
    setStats(prevStats => {
      const { newStats, levelsGained, hpGain, mpGain } = calculateXpGain(prevStats, xp);
      
      if (levelsGained > 0) {
        addToast(`升级！Lv.${newStats.level} (HP+${hpGain}, MP+${mpGain})`, 'loot');
        setPlayer(prevPlayer => ({
          ...prevPlayer,
          maxHp: prevPlayer.maxHp + hpGain,
          maxMp: prevPlayer.maxMp + mpGain,
          hp: prevPlayer.hp + hpGain,
          mp: prevPlayer.mp + mpGain
        }));

        // 更新称号
        // const newTitle = getTitleByLevel(newStats.level);
        // if (userProfile.title !== newTitle) {
        //   setUserProfile(prev => ({ ...prev, title: newTitle }));
        // }
      }

      return newStats;
    });
  }, [setStats, setPlayer, addToast, userProfile, setUserProfile]);

  const addToInventory = useCallback((itemType: ItemType) => {
    // 这里需要实现添加物品到背包的逻辑
    // 暂时只添加toast提示
    const itemNames: Record<ItemType, string> = {
      [ItemType.XP_SMALL]: '经验书 (小)',
      [ItemType.XP_LARGE]: '经验书 (大)',
      [ItemType.HP_POTION]: '治疗药水',
      [ItemType.MP_POTION]: '法力药水',
      [ItemType.OMNI_KEY]: '万能钥匙'
    };
    
    addToast(`获得 ${itemNames[itemType]}`, 'loot');
  }, [addToast]);

  const startCombat = useCallback((enemyName: string, x: number, y: number) => {
    const enemy = generateEnemyStats({ name: enemyName, description: 'A fierce enemy' }, stats.level, false, x, y);
    setCurrentEnemy(enemy);
    setGameState(GameState.COMBAT);
  }, [setCurrentEnemy, setGameState, stats.level]);

  const handleAttack = useCallback(() => {
    if (!currentEnemy) return;

    const playerDamage = player.atk + Math.floor(Math.random() * 3);
    const enemyDamage = currentEnemy.damage;

    const newEnemyHp = currentEnemy.hp - playerDamage;
    const newPlayerHp = player.hp - enemyDamage;

    if (newEnemyHp <= 0) {
      // 敌人被击败
      addToast(`击败了 ${currentEnemy.name}！`, 'loot');
      handleGainXp(20); // 获得经验
      setCurrentEnemy(null);
      setGameState(GameState.EXPLORING);
    } else if (newPlayerHp <= 0) {
      // 玩家被击败
      addToast('你被击败了！', 'error');
      setGameState(GameState.GAME_OVER);
    } else {
      // 战斗继续
      setCurrentEnemy({ ...currentEnemy, hp: newEnemyHp });
      setPlayer({ ...player, hp: newPlayerHp });
    }
  }, [currentEnemy, player, setCurrentEnemy, setPlayer, setGameState, addToast, handleGainXp]);

  const movePlayer = useCallback((newX: number, newY: number) => {
    const cell = grid.find(cell => cell.x === newX && cell.y === newY);
    if (!cell) return;

    switch (cell.type) {
      case CellType.ENEMY:
        startCombat(cell.enemyId || '未知敌人', newX, newY);
        break;
      case CellType.KEY:
        setPlayer(prev => ({ ...prev, hasKey: true, x: newX, y: newY }));
        setGrid(prev => prev.map(c => 
          c.x === newX && c.y === newY ? { ...c, type: CellType.EMPTY } : c
        ));
        addToast('获得钥匙！', 'loot');
        break;
      case CellType.EXIT:
        if (player.hasKey) {
          addToast('通关！', 'loot');
          setGameState(GameState.VICTORY);
        } else {
          addToast('需要钥匙才能开启！', 'error');
        }
        break;
      case CellType.WALL:
        addToast('撞墙了！', 'error');
        break;
      default:
        setPlayer(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [grid, player.hasKey, setPlayer, setGrid, startCombat, setGameState, addToast]);

  return {
    handleGainXp,
    addToInventory,
    startCombat,
    handleAttack,
    movePlayer
  };
};

const getTitleByLevel = (level: number): string => {
  if (level >= 61) {
    return "威震一方";
  } else if (level >= 51) {
    return "凌绝顶";
  } else if (level >= 41) {
    return "众山小";
  } else if (level >= 31) {
    return "小有成就";
  } else if (level >= 21) {
    return "初出茅庐";
  } else if (level >= 11) {
    return "新人";
  } else {
    return "见习";
  }
};