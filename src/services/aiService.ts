import { ThemeConfig, GameAssets, SkillType } from '../../types';

export const generateTheme = async (prompt: string): Promise<ThemeConfig> => {
  // 这里应该调用真实的AI API来生成主题
  // 暂时返回模拟数据
  return {
    themeTitle: prompt,
    flavorText: `一个关于${prompt}的奇幻世界`,
    enemies: [
      { name: '怪物1', description: '危险的敌人' },
      { name: '怪物2', description: '更危险的敌人' }
    ],
    bossName: '最终Boss',
    keyItemName: '神秘钥匙',
    exitName: '传送门',
    itemNames: {
      hp: '治疗药水',
      mp: '法力药水',
      xp: '经验结晶'
    },
    skills: {
      attack: '攻击',
      defend: '防御',
      special: '特殊技能'
    },
    visualStyle: '奇幻风格'
  };
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
  // 这里应该调用真实的AI图像生成API
  // 暂时返回占位符图像
  return `https://placehold.co/800x600?text=${encodeURIComponent(prompt)}`;
};

export const generateStoryOptions = async (context: string): Promise<string[]> => {
  // 这里应该调用真实的AI API来生成故事选项
  // 暂时返回模拟数据
  return [
    '探索神秘洞穴',
    '与村民交谈',
    '前往下一个城镇',
    '休息恢复体力'
  ];
};

export const getPlaceholderImage = (type: string): string => {
  return `https://placehold.co/400x400?text=${type}`;
};

export const generateLevelNarrative = async (theme: string, level: number): Promise<string> => {
  // 这里应该调用真实的AI API来生成关卡叙事
  // 暂时返回模拟数据
  return `你来到了${theme}的第${level}层，这里充满了危险和机遇。`;
};

export const generateFullStory = async (theme: string, choices: string[]): Promise<string> => {
  // 这里应该调用真实的AI API来生成完整故事
  // 暂时返回模拟数据
  return `在${theme}的世界中，你做出了一系列选择：${choices.join('、')}，最终成为了传说中的英雄。`;
};

export const generateHero = async (prompt: string): Promise<any> => {
  // 这里应该调用真实的AI API来生成英雄
  // 暂时返回模拟数据
  return {
    id: `hero_${Date.now()}`,
    name: prompt,
    title: '传说中的英雄',
    description: `一个强大的${prompt}`,
    imageUrl: `https://placehold.co/512x512?text=${encodeURIComponent(prompt)}`,
    skills: [
      { name: '技能1', description: '强大的攻击技能', type: SkillType.ATTACK, mpCost: 5, power: 5 },
      { name: '技能2', description: '终极技能', type: SkillType.ULTIMATE, mpCost: 10, power: 10 }
    ]
  };
};

export const generateGameAssets = async (theme: ThemeConfig): Promise<GameAssets> => {
  // 这里应该调用真实的AI API来生成游戏资产
  // 暂时返回模拟数据
  const enemyImages: Record<string, string> = {};
  theme.enemies.forEach(enemy => {
    enemyImages[enemy.name] = `https://placehold.co/200x200?text=${enemy.name}`;
  });

  return {
    backgroundUrl: `https://placehold.co/1200x800?text=${theme.themeTitle}`,
    keyIconUrl: 'https://placehold.co/100x100?text=Key',
    enemyImages
  };
};