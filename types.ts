
export enum GameState {
  MENU = 'MENU',
  STORY_SELECT = 'STORY_SELECT',
  GENERATING = 'GENERATING',
  EXPLORING = 'EXPLORING',
  COMBAT = 'COMBAT',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  HISTORY_VIEW = 'HISTORY_VIEW',
  SHOP = 'SHOP',           
  CHARACTERS = 'CHARACTERS', 
  HANDBOOK = 'HANDBOOK',   
  CREATOR_MODE = 'CREATOR_MODE',
  DISCUSSION = 'DISCUSSION',
  LUCK = 'LUCK',
  LEADERBOARD = 'LEADERBOARD'
}

export enum CellType {
  EMPTY = 'EMPTY',
  START = 'START',
  EXIT = 'EXIT',
  ENEMY = 'ENEMY',
  KEY = 'KEY',
  WALL = 'WALL',
  DISCUSSION = 'DISCUSSION',
  LUCK = 'LUCK'
}

export enum AIProvider {
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  ZHIPU = 'zhipu'
}

export enum ItemType {
  XP_SMALL = 'XP_SMALL',
  XP_LARGE = 'XP_LARGE',
  HP_POTION = 'HP_POTION',
  MP_POTION = 'MP_POTION',
  OMNI_KEY = 'OMNI_KEY'
}

export enum SkillType {
  ATTACK = 'ATTACK', 
  HEAL = 'HEAL',     
  BUFF = 'BUFF',     
  ULTIMATE = 'ULTIMATE' 
}

export interface HeroSkill {
  name: string;
  description: string;
  type: SkillType;
  mpCost: number;
  power: number;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  skills: HeroSkill[];
  isDefault?: boolean;
  visualStyle?: string;
}

export interface UserProfile {
  username: string;
  avatarUrl: string;
  title: string; // e.g. "见习特工"
}

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  count: number;
}

export interface PlayerStats {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  baseAtk: number;
  savedHp: number;
  savedMp: number;
  summonStones: number;
}

export interface StoryLog {
  id: string;
  storyId?: string;
  date: string;
  worldTitle: string;
  chapterTitle: string;
  summary: string;
}

export interface LevelState {
    grid: GridCell[];
    player: Player;
    theme: ThemeConfig;
    assets: GameAssets;
    enemy?: Enemy | null;
}

export interface StoryCampaign {
  id: string;
  worldTitle: string;
  currentLevel: number;
  totalLevels: number;
  narrativeContext: string;
  isCompleted: boolean;
  timestamp: number;
  fullStory?: string;
  savedState?: LevelState;
}

export interface SavedLevel {
  id: string;
  timestamp: number;
  theme: ThemeConfig;
  grid: GridCell[];
  assets: GameAssets;
  enemyName: string;
  storyId?: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string; 
  model?: string;   
}

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  visited: boolean;
  visible: boolean;
  enemyId?: string;
}

export interface ThemeConfig {
  themeTitle: string;
  flavorText: string;
  enemies: {
    name: string;
    description: string;
  }[];
  bossName: string;
  keyItemName: string;
  exitName: string;
  itemNames: {
    hp: string;
    mp: string;
    xp: string;
  };
  skills: {
    attack: string;
    defend: string;
    special: string;
  };
  visualStyle: string;
}

export interface GameAssets {
  backgroundUrl: string;
  keyIconUrl: string;
  enemyImages: Record<string, string>;
}

export interface Entity {
  hp: number;
  maxHp: number;
  name: string;
  imageUrl?: string;
}

export interface Player extends Entity {
  mp: number;
  maxMp: number;
  hasKey: boolean;
  x: number;
  y: number;
  atk: number;
  heroId: string;
}

export interface Enemy extends Entity {
  id: string;
  description: string;
  damage: number;
  isBoss?: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'loot' | 'error';
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  title: string;
  level: number;
  updatedAt: number;
}

export enum EmailContentType {
  TEXT = 'text',
  ITEM = 'item',
  LEVEL = 'level',
  XP = 'xp',
  STONES = 'stones'
}

export interface EmailAttachment {
  type: EmailContentType;
  itemType?: ItemType;
  amount?: number;
  level?: number;
  xp?: number;
  stones?: number;
}

export interface Email {
  id: string;
  subject: string;
  content: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  isClaimed: boolean;
  timestamp: number;
  sender?: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
