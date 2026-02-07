import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, PlayerStats, Hero, AIConfig, AIProvider, SkillType } from '../../types';

interface UserContextType {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  heroes: Hero[];
  setHeroes: React.Dispatch<React.SetStateAction<Hero[]>>;
  activeHeroId: string;
  setActiveHeroId: React.Dispatch<React.SetStateAction<string>>;
  useAiImages: boolean;
  setUseAiImages: React.Dispatch<React.SetStateAction<boolean>>;
  aiConfig: AIConfig;
  setAiConfig: React.Dispatch<React.SetStateAction<AIConfig>>;
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  currentUserId: string | null;
  setCurrentUserId: React.Dispatch<React.SetStateAction<string | null>>;
  syncStatus: 'saved' | 'saving' | 'error' | 'offline';
  setSyncStatus: React.Dispatch<React.SetStateAction<'saved' | 'saving' | 'error' | 'offline'>>;
  lastCloudSaveTime: number;
  setLastCloudSaveTime: React.Dispatch<React.SetStateAction<number>>;
  agentRank: number | null;
  setAgentRank: React.Dispatch<React.SetStateAction<number | null>>;
  isDataLoaded: boolean;
  setIsDataLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const DEFAULT_PROFILE: UserProfile = {
  username: '神秘特工',
  avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=agent',
  title: '见习'
};

const INITIAL_STATS: PlayerStats = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  baseAtk: 0,
  savedHp: 20,
  savedMp: 10,
  summonStones: 0
};

const DEFAULT_HERO: Hero = {
  id: 'default_adventurer',
  name: '冒险家',
  title: '初出茅庐',
  description: '一位渴望未知的普通冒险者。',
  imageUrl: 'https://placehold.co/512x512/334155/e2e8f0?text=Adventurer',
  isDefault: true,
  skills: [
    { name: '重击', description: '用力挥舞武器', type: SkillType.ATTACK, mpCost: 3, power: 3 },
    { name: '孤注一掷', description: '消耗大量体力的强力一击', type: SkillType.ULTIMATE, mpCost: 8, power: 7 }
  ]
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [heroes, setHeroes] = useState<Hero[]>([DEFAULT_HERO]);
  const [activeHeroId, setActiveHeroId] = useState<string>(DEFAULT_HERO.id);
  const [useAiImages, setUseAiImages] = useState(true);
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: AIProvider.DEEPSEEK, apiKey: '' });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('offline');
  const [lastCloudSaveTime, setLastCloudSaveTime] = useState<number>(0);
  const [agentRank, setAgentRank] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const value = {
    userProfile,
    setUserProfile,
    stats,
    setStats,
    heroes,
    setHeroes,
    activeHeroId,
    setActiveHeroId,
    useAiImages,
    setUseAiImages,
    aiConfig,
    setAiConfig,
    userEmail,
    setUserEmail,
    currentUserId,
    setCurrentUserId,
    syncStatus,
    setSyncStatus,
    lastCloudSaveTime,
    setLastCloudSaveTime,
    agentRank,
    setAgentRank,
    isDataLoaded,
    setIsDataLoaded
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};