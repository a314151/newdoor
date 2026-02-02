import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GridCell, Player, ThemeConfig, GameAssets, CellType, Enemy, AIProvider, AIConfig, PlayerStats, Item, ItemType, StoryLog, SavedLevel, StoryCampaign, ToastMessage, Hero, SkillType, UserProfile, LeaderboardEntry, Friend, FriendRequest, ChatMessage, Email, EmailContentType } from './types';
import { generateTheme, generateImage, generateStoryOptions, getPlaceholderImage, generateLevelNarrative, generateFullStory, generateHero } from './services/aiService';
import { calculateXpGain, generateEnemyStats, calculateMaxStats } from './services/gameLogic';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

// Modular Component Imports
import GameGrid from './components/GameGrid';
import CombatScreen from './components/CombatScreen';
import ToastNotification from './components/ToastNotification';
import ShopScreen from './components/screens/ShopScreen';
import CharacterScreen from './components/screens/CharacterScreen';
import HandbookScreen from './components/screens/HandbookScreen';
import HistoryScreen from './components/screens/HistoryScreen';
import StorySelectScreen from './components/screens/StorySelectScreen';
import GameScreen from './components/screens/GameScreen';
import CreatorModeScreen from './components/screens/CreatorModeScreen';
import DiscussionScreen from './components/screens/DiscussionScreen';
import LuckScreen from './components/screens/LuckScreen';
import MenuScreen from './components/screens/MenuScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen'; // Imported LeaderboardScreen
import FriendsScreen from './components/screens/FriendsScreen';
import ChatScreen from './components/screens/ChatScreen';
import EmailScreen from './components/screens/EmailScreen';
import InventoryModal from './components/modals/InventoryModal';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';
import ProfileModal from './components/modals/ProfileModal';
import BackButton from './components/ui/BackButton';
import AuthModal from './components/modals/AuthModal';

// --- Constants ---
const DATA_VERSION = "2.0.3"; 

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

const BASE_ITEM_DESC: Record<ItemType, string> = {
  [ItemType.XP_SMALL]: '+30 经验',
  [ItemType.XP_LARGE]: '+100 经验',
  [ItemType.HP_POTION]: '+10 HP',
  [ItemType.MP_POTION]: '+5 MP',
  [ItemType.OMNI_KEY]: '直接通关当前关卡'
};

const ITEMS_DB: Record<ItemType, { name: string }> = {
  [ItemType.XP_SMALL]: { name: '经验书 (小)' },
  [ItemType.XP_LARGE]: { name: '经验书 (大)' },
  [ItemType.HP_POTION]: { name: '治疗药水' },
  [ItemType.MP_POTION]: { name: '法力药水' },
  [ItemType.OMNI_KEY]: { name: '万能钥匙' }
};

const LOADING_MESSAGES = [
  "正在编织命运...",
  "正在构建平行宇宙...",
  "AI正在学习新的魔法...",
  "正在唤醒沉睡的Boss...",
  "正在编写掉落物品的说明书..."
];

// 特殊UID - 造物者
const CREATOR_UID = "50af4084-52b3-4e50-9dc1-4a11c7311c78";

// 根据等级获取称号
const getTitleByLevel = (level: number, userId?: string): string => {
  // 检查是否是造物者
  if (userId === CREATOR_UID) {
    return "造物者";
  }
  
  // 根据等级分配称号
  if (level >= 61) {
    return "新人";
  } else if (level >= 51) {
    return "众山小";
  } else if (level >= 41) {
    return "凌绝顶";
  } else if (level >= 31) {
    return "威震一方";
  } else if (level >= 21) {
    return "小有成就";
  } else if (level >= 11) {
    return "初出茅庐";
  } else {
    return "见习";
  }
};

const getSafeEnv = (key: string): string | undefined => {
  try {
    // 1. Check Vite/Modern Browser Environment
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
    // 2. Check Standard Node Environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`VITE_${key}`] || process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

const App: React.FC = () => {
  // --- Persistent State ---
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [history, setHistory] = useState<StoryLog[]>([]);
  const [failedLevels, setFailedLevels] = useState<SavedLevel[]>([]);
  const [stories, setStories] = useState<StoryCampaign[]>([]);
  const [useAiImages, setUseAiImages] = useState(true);
  const [heroes, setHeroes] = useState<Hero[]>([DEFAULT_HERO]);
  const [activeHeroId, setActiveHeroId] = useState<string>(DEFAULT_HERO.id);
  
  // --- Session State ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [player, setPlayer] = useState<Player>({ 
    hp: 20, maxHp: 20, mp: 10, maxMp: 10, 
    atk: 0, hasKey: false, x: 0, y: 0, name: '冒险者', heroId: DEFAULT_HERO.id
  });
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);

  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storyOptions, setStoryOptions] = useState<string[]>([]);
  
  // Shop State
  const [summonInput, setSummonInput] = useState("");
  const [isSummoning, setIsSummoning] = useState(false);
  const [lastSummonedHero, setLastSummonedHero] = useState<Hero | null>(null);
  
  // Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<'registerTime' | 'level'>('registerTime');

  // Friends System State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [currentChatFriend, setCurrentChatFriend] = useState<Friend | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Email System State
  const [emails, setEmails] = useState<Email[]>([]);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);

  // UI Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Auth & Sync State
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('offline');
  const [lastCloudSaveTime, setLastCloudSaveTime] = useState<number>(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  const [agentRank, setAgentRank] = useState<number | null>(null);

  // Default to DeepSeek for public release
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: AIProvider.DEEPSEEK, apiKey: '' });
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Initialization & Local Storage ---
  useEffect(() => {
    const currentVersion = localStorage.getItem('inf_version');
    if (currentVersion !== DATA_VERSION) {
        const savedProvider = localStorage.getItem('ai_provider');
        const savedKey = localStorage.getItem('ai_key');
        localStorage.clear();
        localStorage.setItem('inf_version', DATA_VERSION);
        if (savedProvider) localStorage.setItem('ai_provider', savedProvider);
        if (savedKey) localStorage.setItem('ai_key', savedKey);
    }

    const loadLocal = () => {
        const savedStats = localStorage.getItem('inf_stats');
        const savedProfile = localStorage.getItem('inf_profile');
        const savedInv = localStorage.getItem('inf_inv');
        const savedHist = localStorage.getItem('inf_hist');
        const savedFail = localStorage.getItem('inf_fail');
        const savedStories = localStorage.getItem('inf_stories');
        const savedImageSetting = localStorage.getItem('inf_use_ai_images');
        const savedHeroes = localStorage.getItem('inf_heroes');
        const savedActiveHero = localStorage.getItem('inf_active_hero');
        
        if (savedStats) setStats(JSON.parse(savedStats));
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            // 确保称号正确
            const currentLevel = savedStats ? JSON.parse(savedStats).level : 1;
            const correctTitle = getTitleByLevel(currentLevel, currentUserId);
            setUserProfile({ ...profile, title: correctTitle });
        }
        if (savedInv) setInventory(JSON.parse(savedInv));
        if (savedHist) setHistory(JSON.parse(savedHist));
        if (savedFail) setFailedLevels(JSON.parse(savedFail));
        if (savedStories) setStories(JSON.parse(savedStories));
        if (savedImageSetting !== null) setUseAiImages(JSON.parse(savedImageSetting));
        if (savedHeroes) setHeroes(JSON.parse(savedHeroes));
        if (savedActiveHero) setActiveHeroId(savedActiveHero);
        
        setIsDataLoaded(true); 
    };
    loadLocal();

    const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
    const savedKey = localStorage.getItem('ai_key');
    const savedBaseUrl = localStorage.getItem('ai_base_url');
    const savedModel = localStorage.getItem('ai_model');

    const envApiKey = getSafeEnv('API_KEY');

    if (savedProvider && savedKey) {
      setAiConfig({ 
        provider: savedProvider, apiKey: savedKey, baseUrl: savedBaseUrl || undefined, model: savedModel || undefined 
      });
    } else if (envApiKey) {
      // If environment variable is present, we assume it matches the previous default (Gemini)
      // or the user can configure it manually in settings.
      // But now we prefer DeepSeek default, so if they have an API_KEY env var,
      // we need to guess which provider it is. For simplicity, if env key is present,
      // we check if it starts with 'sk-' (often DeepSeek/OpenAI) or just assume DeepSeek based on your request.
      setAiConfig({ provider: AIProvider.DEEPSEEK, apiKey: envApiKey });
    }

    if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email) {
                setUserEmail(session.user.email);
                setCurrentUserId(session.user.id);
                setSyncStatus('saved');
                fetchFromCloud(session.user.id);
                fetchAgentRank(session.user.created_at);
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.email) {
                setUserEmail(session.user.email);
                setCurrentUserId(session.user.id);
                setSyncStatus('saved');
                fetchFromCloud(session.user.id);
                fetchAgentRank(session.user.created_at);
            } else {
                setUserEmail(null);
                setCurrentUserId(null);
                setSyncStatus('offline');
                setAgentRank(null);
            }
        });
        return () => subscription.unsubscribe();
    }
  }, []);

  // 当currentUserId变化时，重新初始化邮件系统
  useEffect(() => {
    // 确保只有在currentUserId或isDataLoaded变化时才运行
    if (isDataLoaded) {
      initEmailSystem();
    }
  }, [currentUserId, isDataLoaded]);

  useEffect(() => { localStorage.setItem('inf_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('inf_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('inf_inv', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('inf_hist', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('inf_fail', JSON.stringify(failedLevels)); }, [failedLevels]);
  useEffect(() => { localStorage.setItem('inf_stories', JSON.stringify(stories)); }, [stories]);
  useEffect(() => { localStorage.setItem('inf_use_ai_images', JSON.stringify(useAiImages)); }, [useAiImages]);
  useEffect(() => { localStorage.setItem('inf_heroes', JSON.stringify(heroes)); }, [heroes]);
  useEffect(() => { localStorage.setItem('inf_active_hero', activeHeroId); }, [activeHeroId]);
  
  // 保存邮件状态到localStorage
  useEffect(() => {
    const userId = currentUserId || 'guest';
    const emailsKey = `inf_emails_${userId}`;
    localStorage.setItem(emailsKey, JSON.stringify(emails));
  }, [emails, currentUserId]);

  useEffect(() => {
    if (!userEmail || !isDataLoaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSyncStatus('saving');
    saveTimeoutRef.current = setTimeout(() => { saveToCloudSilent(); }, 4000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [stats, userProfile, inventory, history, stories, heroes, activeHeroId]);

  const saveConfig = (provider: AIProvider, key: string, baseUrl?: string, model?: string) => {
    setAiConfig({ provider, apiKey: key, baseUrl, model });
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_key', key);
    if (baseUrl) localStorage.setItem('ai_base_url', baseUrl); else localStorage.removeItem('ai_base_url');
    if (model) localStorage.setItem('ai_model', model); else localStorage.removeItem('ai_model');
    setShowSettings(false);
  };

  const hardReset = (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      if (confirm("确定要删除所有存档和记录吗？(API Key 会保留)")) {
        const savedProvider = localStorage.getItem('ai_provider');
        const savedKey = localStorage.getItem('ai_key');
        const savedBaseUrl = localStorage.getItem('ai_base_url');
        const savedModel = localStorage.getItem('ai_model');
        localStorage.clear();
        localStorage.setItem('inf_version', DATA_VERSION);
        if (savedProvider) localStorage.setItem('ai_provider', savedProvider);
        if (savedKey) localStorage.setItem('ai_key', savedKey);
        if (savedBaseUrl) localStorage.setItem('ai_base_url', savedBaseUrl);
        if (savedModel) localStorage.setItem('ai_model', savedModel);
        window.location.reload();
      }
  };

  const fetchAgentRank = async (userCreatedAt: string) => {
      try {
          const { count, error } = await supabase
            .from('game_saves')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', userCreatedAt);
          if (!error && count !== null) {
              setAgentRank(count + 1);
          }
      } catch (e) {
          console.error("Failed to fetch agent rank", e);
      }
  };

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured()) {
        addToast("请先连接云服务", "error");
        return;
    }
    setIsLeaderboardLoading(true);
    setGameState(GameState.LEADERBOARD);
    
    try {
        console.log("开始获取排行榜数据...");
        
        // 1. 检查当前用户状态
        console.log("检查当前用户状态...");
        let user = null;
        try {
            const { data } = await supabase.auth.getUser();
            user = data.user;
            console.log("当前用户:", user);
        } catch (e) {
            console.error("获取用户状态失败:", e);
            addToast("请先登录", "error");
            setLeaderboardData([]);
            setIsLeaderboardLoading(false);
            return;
        }
        
        if (!user) {
            console.error("用户未登录");
            addToast("请先登录", "error");
            setLeaderboardData([]);
            setIsLeaderboardLoading(false);
            return;
        }
        
        // 2. 测试Supabase连接
        console.log("测试Supabase连接...");
        const { data: testData, error: testError } = await supabase
            .from('game_saves')
            .select('user_id')
            .limit(1);
        
        if (testError) {
            console.error("Supabase连接测试失败:", testError);
            addToast(`连接失败: ${testError.message}`, "error");
            setLeaderboardData([]);
            return;
        }
        console.log("Supabase连接测试成功");
        console.log("测试数据:", testData);
        
        // 3. 尝试获取所有用户的信息
        console.log("获取所有用户信息...");
        let allUsers: any[] = [];
        try {
            // 从profiles表获取用户信息，包含created_at
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, email, created_at');
            
            if (!profilesError && profilesData) {
                console.log("从profiles表获取到用户数据:", profilesData);
                allUsers = profilesData;
            } else {
                console.log("无法从profiles表获取数据，使用其他方法:", profilesError);
                // 从users表获取用户信息
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, email, created_at');
                
                if (!usersError && usersData) {
                    console.log("从users表获取到用户数据:", usersData);
                    allUsers = usersData;
                } else {
                    console.log("无法从users表获取数据:", usersError);
                }
            }
        } catch (e) {
            console.log("获取用户信息失败:", e);
        }

        
        console.log("获取到的用户数量:", allUsers.length);
        console.log("用户数据:", allUsers);
        
        // 检查用户数据是否包含created_at字段
        if (allUsers.length > 0) {
            console.log("第一个用户的数据结构:", JSON.stringify(allUsers[0], null, 2));
            console.log("第一个用户的created_at:", allUsers[0].created_at);
        } else {
            console.log("警告：没有获取到任何用户数据！");
        }
        
        // 4. 获取所有游戏存档数据
        console.log("获取游戏存档数据...");
        let saves: any[] = [];
        try {
            // 尝试使用不同的查询方式
            const { data, error } = await supabase
                .from('game_saves')
                .select('*');
            
            if (error) {
                console.error("获取存档数据失败:", error);
                // 尝试另一种查询方式
                try {
                    const { data: altData, error: altError } = await supabase
                        .from('game_saves')
                        .select();
                    
                    if (!altError && altData) {
                        console.log("使用替代查询方式获取到存档数据");
                        saves = altData;
                    } else {
                        console.error("替代查询方式也失败:", altError);
                    }
                } catch (e) {
                    console.error("替代查询方式出错:", e);
                }
            } else {
                saves = data || [];
            }
        } catch (e) {
            console.error("获取存档数据时出错:", e);
        }
        
        console.log("获取到的存档数量:", saves.length);
        console.log("存档数据:", saves);
        
        // 从游戏存档中提取用户ID，确保我们能获取到所有用户的信息
        const userIdsFromSaves = saves.map(save => save.user_id).filter((id, index, self) => self.indexOf(id) === index);
        console.log("从存档中提取的用户ID:", userIdsFromSaves);
        
        // 5. 创建存档数据映射
        const saveMap: Record<string, any> = {};
        saves.forEach(save => {
            saveMap[save.user_id] = save;
        });
        
        // 6. 为每个用户创建排行榜条目
        console.log("创建排行榜条目...");
        const entries: LeaderboardEntry[] = [];
        
        // 创建用户数据映射，方便快速查找用户的注册时间
        const userMap: Record<string, any> = {};
        allUsers.forEach(userData => {
            const userId = userData.id || userData.user_id;
            userMap[userId] = userData;
            console.log(`用户 ${userId} 的注册时间（来自profiles表）:`, userData.created_at);
        });
        
        // 首先处理有存档的用户
        saves.forEach(save => {
            const saveData = save.save_data || {};
            
            console.log(`处理用户 ${save.user_id}:`);
            
            // 只能使用从profiles表获取的created_at作为注册时间，失败就报错
            const userData = userMap[save.user_id];
            if (!userData) {
                throw new Error(`用户 ${save.user_id} 在profiles表中不存在，无法确定注册时间`);
            }
            
            if (!userData.created_at) {
                throw new Error(`用户 ${save.user_id} 在profiles表中没有created_at字段，无法确定注册时间`);
            }
            
            const createdTime = new Date(userData.created_at);
            if (isNaN(createdTime.getTime())) {
                throw new Error(`用户 ${save.user_id} 的created_at字段值无效: ${userData.created_at}`);
            }
            
            const createdAt = createdTime.getTime();
            console.log(`用户 ${save.user_id} 的注册时间（来自profiles表）:`, createdTime.toISOString());
            
            // 改进在线状态检测：基于最近活动时间
            // 如果用户有存档，使用updated_at判断是否在线
            // 如果用户没有存档，使用created_at判断是否在线（新用户）
            let isOnline = false;
            
            if (save.updated_at) {
                const lastActiveTime = new Date(save.updated_at).getTime();
                // 最近5分钟内有活动视为在线
                isOnline = lastActiveTime > Date.now() - 5 * 60 * 1000;
                console.log(`用户 ${save.user_id} 最后活动时间:`, new Date(lastActiveTime).toISOString(), '在线:', isOnline);
            } else if (userData.created_at) {
                const createdTime = new Date(userData.created_at).getTime();
                // 如果是新用户（注册时间在5分钟内），视为在线
                isOnline = createdTime > Date.now() - 5 * 60 * 1000;
                console.log(`用户 ${save.user_id} 是新用户，注册时间:`, new Date(createdTime).toISOString(), '在线:', isOnline);
            }
            
            const currentLevel = saveData.stats?.level || 1;
            const correctTitle = getTitleByLevel(currentLevel, save.user_id);
            
            const entry = {
                userId: save.user_id,
                username: saveData.profile?.username || `Agent ${save.user_id.substring(0, 8)}`,
                avatarUrl: saveData.profile?.avatarUrl || 'https://placehold.co/100x100?text=?',
                title: correctTitle,
                level: currentLevel,
                updatedAt: new Date(save.updated_at).getTime(),
                createdAt,
                isOnline
            };
            
            console.log(`创建的排行榜条目:`, entry);
            entries.push(entry);
        });
        
        // 然后处理没有存档的用户
        allUsers.forEach(userData => {
            const userId = userData.id || userData.user_id;
            if (!saveMap[userId]) {
                // 只能使用created_at作为注册时间，失败就报错
                if (!userData.created_at) {
                    throw new Error(`用户 ${userId} 没有created_at字段，无法确定注册时间`);
                }
                
                const createdTime = new Date(userData.created_at);
                if (isNaN(createdTime.getTime())) {
                    throw new Error(`用户 ${userId} 的created_at字段值无效: ${userData.created_at}`);
                }
                
                const createdAt = createdTime.getTime();
                console.log(`用户 ${userId} 的注册时间（没有存档）:`, createdTime.toISOString());
                
                const currentLevel = 1;
                const correctTitle = getTitleByLevel(currentLevel, userId);
                
                entries.push({
                    userId,
                    username: userData.email || `Agent ${userId.substring(0, 8)}`,
                    avatarUrl: 'https://placehold.co/100x100?text=?',
                    title: correctTitle,
                    level: currentLevel,
                    updatedAt: createdAt,
                    createdAt,
                    isOnline: false
                });
            }
        });
        
        // 首先将造物者排在第一位
        const creatorEntry = entries.find(entry => entry.userId === CREATOR_UID);
        const otherEntries = entries.filter(entry => entry.userId !== CREATOR_UID);
        
        // 根据选择的排序方式对其他用户排序
        if (leaderboardSortBy === 'registerTime') {
            // 按注册时间排序，越早注册排名越高
            otherEntries.sort((a, b) => a.createdAt - b.createdAt);
        } else {
            // 按等级排序，等级高的排在前面
            otherEntries.sort((a, b) => b.level - a.level);
        }
        
        // 组合排序结果，造物者始终在第一位
        const sortedEntries = creatorEntry ? [creatorEntry, ...otherEntries] : otherEntries;
        
        console.log("生成的排行榜条目:", sortedEntries);
        console.log("排行榜条目数量:", sortedEntries.length);
        
        if (sortedEntries.length > 0) {
            setLeaderboardData(sortedEntries);
            addToast(`成功获取 ${sortedEntries.length} 个用户的排行榜数据`, "info");
        } else {
            // 如果没有任何数据，显示空排行榜
            console.log("没有找到任何用户数据");
            setLeaderboardData([]);
            addToast("没有找到任何用户数据", "info");
        }
    } catch (e: any) {
        console.error("Leaderboard Fetch Error", e);
        addToast(`获取排行榜失败: ${e.message}`, "error");
        // 即使出错，也设置空数据，避免界面卡住
        setLeaderboardData([]);
    } finally {
        setIsLeaderboardLoading(false);
        console.log("排行榜数据获取完成");
    }
  };

  // Friends System Functions
  const fetchFriends = async () => {
    if (!currentUserId) return;
    
    try {
      // 获取好友列表
      const { data: friendsData, error } = await supabase
        .from('friend_relationships')
        .select(`
          id, status, created_at, updated_at,
          friend:profiles!friend_relationships_friend_id_fkey(id, email, created_at)
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'accepted');
      
      if (!error && friendsData) {
        const friendsList: Friend[] = friendsData.map(rel => ({
          id: rel.friend.id,
          email: rel.friend.email,
          username: rel.friend.email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${rel.friend.id}`,
          lastActive: new Date(rel.updated_at).getTime(),
          isOnline: false,
          unreadCount: 0
        }));
        setFriends(friendsList);
      }
      
      // 获取待处理的好友请求
      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_relationships')
        .select(`
          id, created_at,
          user:profiles!friend_relationships_user_id_fkey(id, email, created_at)
        `)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending');
      
      if (!requestsError && requestsData) {
        const requestsList: FriendRequest[] = requestsData.map(rel => ({
          id: rel.id,
          userId: rel.user.id,
          username: rel.user.email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${rel.user.id}`,
          createdAt: new Date(rel.created_at).getTime()
        }));
        setPendingRequests(requestsList);
      }
    } catch (error) {
      console.error('获取好友数据失败:', error);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) {
      addToast('请先登录', 'error');
      return false;
    }
    
    try {
      // 检查是否已经是好友
      const { data: existingFriends, error: checkError } = await supabase
        .from('friend_relationships')
        .select('id, status')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
      
      if (existingFriends && existingFriends.length > 0) {
        const isFriend = existingFriends.some(rel => rel.status === 'accepted');
        if (isFriend) {
          addToast('你们已经是好友了', 'info');
          return false;
        }
      }
      
      // 插入好友申请
      const { error } = await supabase
        .from('friend_relationships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) {
        if (error.code === '23505') {
          addToast('好友申请已发送，对方将收到邮件通知', 'info');
        } else {
          addToast('发送好友申请失败', 'error');
          return false;
        }
      }
      
      // 获取当前用户信息
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', currentUserId)
        .single();
      
      if (currentUserData) {
        // 获取对方用户信息
        const { data: friendUserData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', friendId)
          .single();
        
        if (friendUserData) {
          // 向对方发送邮件通知
          const newEmail: Email = {
            id: Date.now().toString(),
            subject: '好友申请通知',
            content: `亲爱的冒险者，\n\n${currentUserData.email.split('@')[0]} 向你发送了好友申请。\n\n请点击下方按钮处理申请。`,
            attachments: [
              {
                type: EmailContentType.ITEM,
                itemType: ItemType.XP_SMALL
              }
            ],
            isRead: false,
            isClaimed: false,
            timestamp: Date.now(),
            sender: '系统',
            friendRequest: {
              requestId: Date.now().toString(),
              senderId: currentUserId,
              senderName: currentUserData.email.split('@')[0]
            }
          };
          
          // 模拟本地发送：将邮件保存到对方的 localStorage 中
          const friendEmailsKey = `inf_emails_${friendId}`;
          const friendSavedEmails = localStorage.getItem(friendEmailsKey);
          let friendEmails: Email[] = [];
          
          if (friendSavedEmails) {
            try {
              friendEmails = JSON.parse(friendSavedEmails);
            } catch (e) {
              console.error('Failed to load friend saved emails:', e);
            }
          }
          
          // 添加新邮件到对方的邮件列表
          friendEmails.unshift(newEmail);
          localStorage.setItem(friendEmailsKey, JSON.stringify(friendEmails));
          
          console.log('向用户', friendUserData.email, '发送好友申请邮件');
          addToast('好友申请已发送，对方将收到邮件通知', 'success');
        }
      }
      
      return true;
    } catch (error) {
      console.error('发送好友申请失败:', error);
      addToast('发送好友申请失败', 'error');
      return false;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_relationships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      
      if (error) {
        addToast('接受好友申请失败', 'error');
        return false;
      }
      
      addToast('好友申请已接受', 'success');
      await fetchFriends(); // 刷新好友列表
      return true;
    } catch (error) {
      console.error('接受好友申请失败:', error);
      addToast('接受好友申请失败', 'error');
      return false;
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_relationships')
        .delete()
        .eq('id', requestId);
      
      if (error) {
        addToast('拒绝好友申请失败', 'error');
        return false;
      }
      
      addToast('好友申请已拒绝', 'success');
      await fetchFriends(); // 刷新好友列表
      return true;
    } catch (error) {
      console.error('拒绝好友申请失败:', error);
      addToast('拒绝好友申请失败', 'error');
      return false;
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUserId) return false;
    
    try {
      const { error } = await supabase
        .from('friend_relationships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
      
      if (error) {
        addToast('删除好友失败', 'error');
        return false;
      }
      
      addToast('好友已删除', 'success');
      await fetchFriends(); // 刷新好友列表
      return true;
    } catch (error) {
      console.error('删除好友失败:', error);
      addToast('删除好友失败', 'error');
      return false;
    }
  };

  const openChat = async (friend: Friend) => {
    setCurrentChatFriend(friend);
    setGameState(GameState.CHAT);
    
    // 获取聊天记录
    if (currentUserId) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          const messages: ChatMessage[] = data.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            timestamp: new Date(msg.created_at).getTime(),
            isRead: msg.is_read
          }));
          setChatMessages(messages);
        }
      } catch (error) {
        console.error('获取聊天记录失败:', error);
      }
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentUserId || !currentChatFriend) return false;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: currentChatFriend.id,
          content: content
        });
      
      if (error) {
        addToast('发送消息失败', 'error');
        return false;
      }
      
      // 添加新消息到本地状态
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUserId,
        receiverId: currentChatFriend.id,
        content: content,
        timestamp: Date.now(),
        isRead: false
      };
      setChatMessages(prev => [...prev, newMessage]);
      
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      addToast('发送消息失败', 'error');
      return false;
    }
  };

  const closeChat = () => {
    setCurrentChatFriend(null);
    setChatMessages([]);
    setGameState(GameState.FRIENDS);
  };

  const openFriendsScreen = () => {
    setGameState(GameState.FRIENDS);
    if (currentUserId) {
      fetchFriends();
    }
  };
  
  const toggleLeaderboardSort = () => {
    setLeaderboardSortBy(prev => prev === 'registerTime' ? 'level' : 'registerTime');
    // 重新获取排行榜数据以应用新的排序方式
    fetchLeaderboard();
  };

  // Email System Functions
  const openEmailScreen = () => {
    setGameState(GameState.EMAIL);
    // 这里可以添加获取最新邮件的逻辑
  };

  const readEmail = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isRead: true } : email
    ));
    // 更新未读邮件数量
    const count = emails.filter(email => !email.isRead && email.id !== emailId).length;
    setUnreadEmailCount(count);
  };

  const claimEmail = (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email || email.isClaimed) return;

    // 处理邮件附件奖励
    email.attachments.forEach(attachment => {
      switch (attachment.type) {
        case EmailContentType.ITEM:
          // 添加物品到背包
          if (attachment.itemType) {
            addToInventory(attachment.itemType);
          }
          break;
        case EmailContentType.LEVEL:
          // 提升等级
          if (attachment.level) {
            setStats(prev => ({
              ...prev,
              level: prev.level + (attachment.level || 0)
            }));
            addToast(`等级提升 +${attachment.level}`, 'loot');
          }
          break;
        case EmailContentType.XP:
          // 增加经验
          if (attachment.xp) {
            handleGainXp(attachment.xp);
          }
          break;
        case EmailContentType.STONES:
          // 增加召唤石
          if (attachment.stones) {
            setStats(prev => ({
              ...prev,
              summonStones: prev.summonStones + (attachment.stones || 0)
            }));
            addToast(`召唤石 +${attachment.stones}`, 'loot');
          }
          break;
      }
    });

    // 标记邮件为已领取
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, isClaimed: true } : email
    ));

    // 如果是初始邮件，确保用户不会再次收到
    if (email.isInitialEmail) {
      const userId = currentUserId || 'guest';
      const hasInitialEmailsKey = `inf_has_initial_emails_${userId}`;
      localStorage.setItem(hasInitialEmailsKey, 'true');
    }

    addToast('邮件奖励已领取', 'success');
  };

  const sendNotification = (data: {
    subject: string;
    content: string;
    attachments: Array<{
      type: EmailContentType;
      itemType?: ItemType;
      amount?: number;
      level?: number;
      xp?: number;
      stones?: number;
    }>;
    sendToAll: boolean;
    specificUserId?: string;
  }) => {
    // 这里可以添加发送通知到服务器的逻辑
    // 现在我们先实现本地模拟

    // 创建新邮件
    const newEmail: Email = {
      id: Date.now().toString(),
      subject: data.subject,
      content: data.content,
      attachments: data.attachments,
      isRead: false,
      isClaimed: false,
      timestamp: Date.now(),
      sender: '系统'
    };

    // 添加到邮件列表
    setEmails(prev => [newEmail, ...prev]);
    setUnreadEmailCount(prev => prev + 1);

    addToast('通知已发送', 'success');
  };

  const deleteEmail = (emailId: string) => {
    setEmails(prev => prev.filter(email => email.id !== emailId));
    // 更新未读邮件数量
    const count = emails.filter(email => !email.isRead && email.id !== emailId).length;
    setUnreadEmailCount(count);
    addToast('邮件已删除', 'info');
  };
  
  const handleAcceptFriendRequest = async (senderId: string, emailId: string) => {
    try {
      // 检查是否已经是好友
      const { data: existingFriends, error: checkError } = await supabase
        .from('friend_relationships')
        .select('id, status')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${senderId}),and(user_id.eq.${senderId},friend_id.eq.${currentUserId})`);
      
      if (existingFriends && existingFriends.length > 0) {
        const isFriend = existingFriends.some(rel => rel.status === 'accepted');
        if (isFriend) {
          addToast('你们已经是好友了', 'info');
          deleteEmail(emailId);
          return;
        }
      }
      
      // 创建好友关系
      const { error } = await supabase
        .from('friend_relationships')
        .insert({
          user_id: currentUserId,
          friend_id: senderId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        addToast('接受好友申请失败', 'error');
        return;
      }
      
      // 向发送方发送邮件通知
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', currentUserId)
        .single();
      
      if (currentUserData) {
        const { data: senderUserData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', senderId)
          .single();
        
        if (senderUserData) {
          // 向发送方发送邮件通知
          const newEmail: Email = {
            id: Date.now().toString(),
            subject: '好友申请已接受',
            content: `亲爱的冒险者，\n\n${currentUserData.email.split('@')[0]} 已接受了你的好友申请。\n\n现在你们已经成为好友，可以开始聊天了！`,
            attachments: [
              {
                type: EmailContentType.ITEM,
                itemType: ItemType.XP_SMALL
              }
            ],
            isRead: false,
            isClaimed: false,
            timestamp: Date.now(),
            sender: '系统'
          };
          
          // 模拟本地发送：将邮件保存到发送方的 localStorage 中
          const senderEmailsKey = `inf_emails_${senderId}`;
          const senderSavedEmails = localStorage.getItem(senderEmailsKey);
          let senderEmails: Email[] = [];
          
          if (senderSavedEmails) {
            try {
              senderEmails = JSON.parse(senderSavedEmails);
            } catch (e) {
              console.error('Failed to load sender saved emails:', e);
            }
          }
          
          // 添加新邮件到发送方的邮件列表
          senderEmails.unshift(newEmail);
          localStorage.setItem(senderEmailsKey, JSON.stringify(senderEmails));
          
          console.log('向用户', senderUserData.email, '发送好友申请接受邮件');
          addToast('好友申请已接受，对方将收到邮件通知', 'success');
        }
      }
      
      // 删除邮件
      deleteEmail(emailId);
      // 刷新好友列表
      fetchFriends();
    } catch (error) {
      console.error('接受好友申请失败:', error);
      addToast('接受好友申请失败', 'error');
    }
  };
  
  const handleRejectFriendRequest = async (senderId: string, emailId: string) => {
    try {
      // 向发送方发送邮件通知
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', currentUserId)
        .single();
      
      if (currentUserData) {
        const { data: senderUserData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', senderId)
          .single();
        
        if (senderUserData) {
          // 向发送方发送邮件通知
          const newEmail: Email = {
            id: Date.now().toString(),
            subject: '好友申请已拒绝',
            content: `亲爱的冒险者，\n\n${currentUserData.email.split('@')[0]} 已拒绝了你的好友申请。\n\n不要灰心，继续寻找其他冒险者一起冒险吧！`,
            attachments: [],
            isRead: false,
            isClaimed: false,
            timestamp: Date.now(),
            sender: '系统'
          };
          
          // 模拟本地发送：将邮件保存到发送方的 localStorage 中
          const senderEmailsKey = `inf_emails_${senderId}`;
          const senderSavedEmails = localStorage.getItem(senderEmailsKey);
          let senderEmails: Email[] = [];
          
          if (senderSavedEmails) {
            try {
              senderEmails = JSON.parse(senderSavedEmails);
            } catch (e) {
              console.error('Failed to load sender saved emails:', e);
            }
          }
          
          // 添加新邮件到发送方的邮件列表
          senderEmails.unshift(newEmail);
          localStorage.setItem(senderEmailsKey, JSON.stringify(senderEmails));
          
          console.log('向用户', senderUserData.email, '发送好友申请拒绝邮件');
          addToast('好友申请已拒绝，对方将收到邮件通知', 'success');
        }
      }
      
      // 删除邮件
      deleteEmail(emailId);
    } catch (error) {
      console.error('拒绝好友申请失败:', error);
      addToast('拒绝好友申请失败', 'error');
    }
  };

  const initEmailSystem = () => {
    // 获取当前用户ID
    const userId = currentUserId || 'guest';
    
    // 为每个用户创建独立的localStorage键
    const hasInitialEmailsKey = `inf_has_initial_emails_${userId}`;
    const emailsKey = `inf_emails_${userId}`;
    
    // 检查用户是否已经收到过初始邮件
    const hasReceivedInitialEmails = localStorage.getItem(hasInitialEmailsKey);
    
    // 从localStorage加载邮件
    const savedEmails = localStorage.getItem(emailsKey);
    if (savedEmails) {
      try {
        const emails = JSON.parse(savedEmails);
        setEmails(emails);
        setUnreadEmailCount(emails.filter((email: Email) => !email.isRead).length);
        return;
      } catch (e) {
        console.error('Failed to load saved emails:', e);
      }
    }
    
    // 只有第一次登录的用户才会收到初始邮件
    if (!hasReceivedInitialEmails) {
      // 初始化邮件系统，添加一些示例邮件
      const sampleEmails: Email[] = [
        {
          id: '1',
          subject: '欢迎来到无限之门',
          content: '亲爱的冒险者，欢迎加入无限之门的世界！这里充满了未知的挑战和机遇，希望你能在这里度过一段美好的冒险时光。',
          attachments: [
            {
              type: EmailContentType.STONES,
              stones: 5
            },
            {
              type: EmailContentType.ITEM,
              itemType: ItemType.XP_LARGE
            }
          ],
          isRead: false,
          isClaimed: false,
          timestamp: Date.now() - 86400000,
          sender: '系统',
          isInitialEmail: true
        },
        {
          id: '2',
          subject: '等级提升奖励',
          content: '恭喜你成功提升到10级！这是你的等级奖励，请查收。',
          attachments: [
            {
              type: EmailContentType.XP,
              xp: 500
            }
          ],
          isRead: true,
          isClaimed: false,
          timestamp: Date.now() - 43200000,
          sender: '系统',
          isInitialEmail: true
        }
      ];

      setEmails(sampleEmails);
      setUnreadEmailCount(sampleEmails.filter(email => !email.isRead).length);
      
      // 标记用户已经收到过初始邮件
      localStorage.setItem(hasInitialEmailsKey, 'true');
      // 保存邮件到localStorage
      localStorage.setItem(emailsKey, JSON.stringify(sampleEmails));
    } else {
      // 如果用户已经收到过初始邮件，但没有保存的邮件，设置为空数组
      setEmails([]);
      setUnreadEmailCount(0);
      localStorage.setItem(emailsKey, JSON.stringify([]));
    }
  };

  const fetchFromCloud = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('game_saves').select('save_data, updated_at').eq('user_id', userId).single();
          if (error && error.code !== 'PGRST116') throw error; 
          if (data?.save_data) {
              const d = data.save_data;
              if (d.stats) setStats(d.stats);
              if (d.profile) {
                  // 更新用户资料，并确保称号正确
                  const currentLevel = d.stats?.level || 1;
                  const correctTitle = getTitleByLevel(currentLevel, userId);
                  setUserProfile({ ...d.profile, title: correctTitle });
              }
              if (d.inventory) setInventory(d.inventory);
              if (d.history) setHistory(d.history);
              if (d.stories) setStories(d.stories);
              if (d.heroes) setHeroes(d.heroes);
              if (d.activeHeroId) setActiveHeroId(d.activeHeroId);
              setLastCloudSaveTime(new Date(data.updated_at).getTime());
              addToast("云端存档已同步", 'info');
          }
      } catch (e) {
          console.error("Auto Load Failed", e);
          addToast("无法从云端读取存档", 'error');
          setSyncStatus('error');
      }
  };

  const saveToCloudSilent = async () => {
    if (!isSupabaseConfigured() || !userEmail) return;
    try {
        const saveData = { version: DATA_VERSION, timestamp: Date.now(), stats, profile: userProfile, inventory, history, stories, heroes, activeHeroId };
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from('game_saves').upsert({ user_id: user.id, save_data: saveData, updated_at: new Date().toISOString(), version: DATA_VERSION });
        if (error) throw error;
        setSyncStatus('saved');
        setLastCloudSaveTime(Date.now());
    } catch (e: any) { console.error("Auto Save Failed", e); setSyncStatus('error'); }
  };
  
  const handleLogout = async () => {
      await supabase.auth.signOut();
      setUserEmail(null);
      setCurrentUserId(null);
      setSyncStatus('offline');
      setAgentRank(null);
      addToast("已退出登录", 'info');
  };

  const checkApiKey = async () => {
    let currentApiKey = aiConfig.apiKey;
    const envApiKey = getSafeEnv('API_KEY');

    if (aiConfig.provider === AIProvider.GEMINI && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) await window.aistudio.openSelectKey();
        currentApiKey = envApiKey || '';
        setAiConfig(prev => ({ ...prev, apiKey: currentApiKey }));
    }
    if (!currentApiKey && aiConfig.provider !== AIProvider.GEMINI) { setShowSettings(true); return null; }
    if (aiConfig.provider === AIProvider.GEMINI && !currentApiKey) {
        if (!envApiKey) { alert("API Key not found."); return null; }
        currentApiKey = envApiKey;
    }
    return currentApiKey;
  };

  const addToast = (msg: string, type: 'info' | 'loot' | 'error' = 'info') => {
    // 检查是否已经存在相同的提示，防止重复显示
    // 注意：使用函数式更新来获取最新的toasts状态
    setToasts(prevToasts => {
      const existingToast = prevToasts.find(toast => toast.message === msg && toast.type === type);
      if (existingToast) {
        return prevToasts; // 如果已经存在相同的提示，就不再添加
      }
      
      const id = Date.now().toString() + Math.random();
      return [...prevToasts, { id, message: msg, type }];
    });
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const logEvent = (msg: string) => setEventLog(prev => [...prev, msg]);

  const handleGainXp = (amount: number) => {
      setStats(prevStats => {
          const { newStats, levelsGained, hpGain, mpGain } = calculateXpGain(prevStats, amount);
          if (levelsGained > 0) {
              addToast(`升级！Lv.${newStats.level} (HP+${hpGain}, MP+${mpGain})`, 'loot');
              setPlayer(prevPlayer => ({ ...prevPlayer, maxHp: prevPlayer.maxHp + hpGain, maxMp: prevPlayer.maxMp + mpGain, hp: prevPlayer.hp + hpGain, mp: prevPlayer.mp + mpGain }));
              
              // 更新称号
              const newTitle = getTitleByLevel(newStats.level, currentUserId);
              if (userProfile.title !== newTitle) {
                  setUserProfile(prev => ({ ...prev, title: newTitle }));
              }
          }
          return newStats;
      });
  };

  const saveStoryProgress = useCallback((storyId: string) => {
    if (!theme || !assets || grid.length === 0) return;
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, savedState: { theme, assets, grid, player, enemy: currentEnemy } } : s));
  }, [theme, assets, grid, player, currentEnemy]);

  const clearSession = () => { setTheme(null); setAssets(null); setGrid([]); setCurrentEnemy(null); setCurrentStoryId(null); };

  const handleGameBack = useCallback(() => {
    if (currentStoryId) { saveStoryProgress(currentStoryId); addToast("进度已保存", 'info'); clearSession(); setGameState(GameState.MENU); return; } 
    setShowQuitModal(true);
  }, [currentStoryId, saveStoryProgress]);

  const confirmQuit = () => { clearSession(); setGameState(GameState.MENU); setShowQuitModal(false); };

  const handleResumeStory = (story: StoryCampaign) => {
      if (story.savedState) {
          setTheme(story.savedState.theme); setAssets(story.savedState.assets); setGrid(story.savedState.grid); setPlayer(story.savedState.player); setCurrentEnemy(story.savedState.enemy || null); setCurrentStoryId(story.id); setGameState(GameState.EXPLORING);
      } else { setCurrentStoryId(story.id); handleOpenDoor(story); }
  };

  const handleSummonHero = async () => {
      if (stats.summonStones < 1) { addToast("召唤石不足！", 'error'); return; }
      if (!summonInput.trim()) return;
      const key = await checkApiKey(); if (!key) return;
      setIsSummoning(true); setStats(s => ({ ...s, summonStones: s.summonStones - 1 }));
      try {
          const config = { ...aiConfig, apiKey: key };
          const newHero = await generateHero(config, summonInput);
          if (useAiImages) { const imgUrl = await generateImage(config, `${newHero.visualStyle}, pixel art portrait`, true); newHero.imageUrl = imgUrl; }
          setHeroes(prev => [...prev, newHero]); setLastSummonedHero(newHero); addToast(`召唤成功: ${newHero.name}`, 'loot');
      } catch (e) { addToast("召唤失败，请重试", 'error'); setStats(s => ({ ...s, summonStones: s.summonStones + 1 })); } finally { setIsSummoning(false); setSummonInput(""); }
  };

  const rollLoot = (source: 'combat' | 'explore'): { type: ItemType, name: string } | null => {
    const chance = source === 'combat' ? 0.6 : 0.20; if (Math.random() > chance) return null;
    const roll = Math.random(); let type = ItemType.XP_SMALL; let name = "Item";
    if (roll < 0.5) { type = ItemType.HP_POTION; name = theme?.itemNames?.hp || "治疗药水"; } 
    else if (roll < 0.7) { type = ItemType.MP_POTION; name = theme?.itemNames?.mp || "法力药水"; } 
    else if (roll < 0.95) { type = ItemType.XP_SMALL; name = theme?.itemNames?.xp || "经验书"; } 
    else { type = ItemType.OMNI_KEY; name = "万能钥匙"; }
    addToInventory(type, name); return { type, name };
  };

  const generateGrid = useCallback((themeData: ThemeConfig, size: number = 5) => {
    const newGrid: GridCell[] = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) newGrid.push({ x, y, type: CellType.EMPTY, visited: false, visible: false });
    const getRandomEmpty = () => { const empty = newGrid.filter(c => c.type === CellType.EMPTY && !(c.x === 0 && c.y === 0)); return empty[Math.floor(Math.random() * empty.length)]; };
    const exitCell = getRandomEmpty(); if(exitCell) exitCell.type = CellType.EXIT;
    const keyCell = getRandomEmpty(); if(keyCell) keyCell.type = CellType.KEY;
    const eventCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < eventCount; i++) {
      const cell = getRandomEmpty();
      if (cell) {
        const roll = Math.random();
        if (roll < 0.6) { cell.type = CellType.ENEMY; const randomEnemyType = themeData.enemies && themeData.enemies.length > 0 ? themeData.enemies[Math.floor(Math.random() * themeData.enemies.length)] : { name: 'Shadow', description: 'Unknown entity' }; cell.enemyId = randomEnemyType.name; } 
        else if (roll < 0.8) { cell.type = CellType.DISCUSSION; } else { cell.type = CellType.LUCK; }
      }
    }
    const startIdx = newGrid.findIndex(c => c.x === 0 && c.y === 0);
    if (startIdx !== -1) {
      newGrid[startIdx].visited = true;
      newGrid[startIdx].visible = true;
      newGrid[startIdx].type = CellType.START;
    }
    [[0,1], [1,0], [0,0]].forEach(([dx, dy]) => { const idx = newGrid.findIndex(c => c.x === dx && c.y === dy); if(idx > -1) newGrid[idx].visible = true; });
    return newGrid;
  }, []);

  const handleStartStory = async (refresh: boolean = false) => {
    const key = await checkApiKey(); if (!key) return;
    if (refresh) { setIsRefreshing(true); setStoryOptions([]); } else { setGameState(GameState.GENERATING); setLoadingMsg("正在探测多元宇宙的时间线..."); }
    try { const options = await generateStoryOptions({...aiConfig, apiKey: key}); setStoryOptions(options); if (!refresh) setGameState(GameState.STORY_SELECT); } catch (e) { addToast("生成失败: " + (e instanceof Error ? e.message : String(e)), 'error'); if (!refresh) setGameState(GameState.MENU); } finally { setIsRefreshing(false); }
  };

  const handleSelectStory = (worldTitle: string) => {
    const newStory: StoryCampaign = { id: Date.now().toString(), worldTitle, currentLevel: 1, totalLevels: 9 + Math.floor(Math.random() * 3), narrativeContext: `故事开始于${worldTitle}。`, isCompleted: false, timestamp: Date.now() };
    setStories(prev => [newStory, ...prev]); setCurrentStoryId(newStory.id); handleOpenDoor(newStory);
  };

  const handleOpenDoor = async (targetStory?: StoryCampaign) => {
    const key = await checkApiKey(); if (!key) return;
    setTheme(null); setAssets(null); setGrid([]); setGameState(GameState.GENERATING);
    const msgInterval = setInterval(() => setLoadingMsg(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]), 2000);
    const isFinalLevel = targetStory ? targetStory.currentLevel === targetStory.totalLevels : false;
    try {
      const newTheme = await generateTheme({ ...aiConfig, apiKey: key }, targetStory?.narrativeContext, isFinalLevel);
      if (!newTheme || !newTheme.themeTitle) throw new Error("AI returned invalid theme data");
      let keyImg, bgImg; const enemyMap: Record<string, string> = {};
      if (useAiImages) {
        const keyPromise = generateImage({ ...aiConfig, apiKey: key }, `Pixel art icon of ${newTheme.keyItemName}`, true);
        const bgPromise = generateImage({ ...aiConfig, apiKey: key }, `Background scenery of ${newTheme.visualStyle}, dark, atmospheric`, false);
        const enemyPromises = (newTheme.enemies || []).map(async (e) => { const img = await generateImage({ ...aiConfig, apiKey: key }, `${e.name}, ${e.description}, ${newTheme.visualStyle}`, true); return { name: e.name, img }; });
        const [k, b, ...eData] = await Promise.all([keyPromise, bgPromise, ...enemyPromises]);
        keyImg = k; bgImg = b; eData.forEach(e => { enemyMap[e.name] = e.img; });
      } else {
        keyImg = getPlaceholderImage(newTheme.keyItemName, 'eab308'); bgImg = ""; (newTheme.enemies || []).forEach(e => { enemyMap[e.name] = getPlaceholderImage(e.name, '991b1b'); });
      }
      setTheme(newTheme); setAssets({ backgroundUrl: bgImg, keyIconUrl: keyImg, enemyImages: enemyMap }); setGrid(generateGrid(newTheme));
      const activeHero = heroes.find(h => h.id === activeHeroId) || heroes[0]; const maxStats = calculateMaxStats(stats.level);
      setPlayer({ hp: stats.savedHp <= 0 ? maxStats.maxHp : stats.savedHp, maxHp: maxStats.maxHp, mp: stats.savedMp <= 0 ? maxStats.maxMp : stats.savedMp, maxMp: maxStats.maxMp, atk: stats.baseAtk + Math.floor(stats.level / 2), hasKey: false, x: 0, y: 0, name: activeHero.name, heroId: activeHeroId });
      setEventLog([`进入了 ${newTheme.themeTitle}。目标：找到 ${newTheme.keyItemName}。`]); clearInterval(msgInterval); setGameState(GameState.EXPLORING);
    } catch (error) { console.error(error); const errMsg = error instanceof Error ? error.message : String(error); addToast(`生成失败: ${errMsg.substring(0, 30)}...`, 'error'); clearInterval(msgInterval); setGameState(GameState.MENU); }
  };

  const handleLevelComplete = async () => {
    setStats(prev => ({ ...prev, savedHp: player.hp, savedMp: player.mp }));
    if (currentStoryId) {
        setStats(prev => ({ ...prev, summonStones: prev.summonStones + 1 })); addToast("获得 1 个召唤石", 'loot');
        const storyIndex = stories.findIndex(s => s.id === currentStoryId);
        if (storyIndex !== -1) {
             const currentStory = stories[storyIndex]; const isFinal = currentStory.currentLevel === currentStory.totalLevels; const worldTitle = currentStory.worldTitle; const chapterTitle = isFinal ? `[终章] ${theme?.themeTitle}` : `[第${currentStory.currentLevel}章] ${theme?.themeTitle}`; const logsSnapshot = [...eventLog];
             const updatedStory = { ...currentStory, currentLevel: currentStory.currentLevel + 1, isCompleted: isFinal, savedState: undefined };
             const newStories = [...stories]; newStories[storyIndex] = updatedStory; setStories(newStories);
             if (isFinal) {
                 setGameState(GameState.GENERATING); setLoadingMsg("正在撰写史诗篇章...");
                 const narrativeSummary = await generateLevelNarrative({ ...aiConfig, apiKey: await checkApiKey() || '' }, worldTitle, chapterTitle, logsSnapshot);
                 const newLog: StoryLog = { id: Date.now().toString(), storyId: currentStory.id, date: new Date().toLocaleDateString(), worldTitle, chapterTitle, summary: narrativeSummary };
                 setHistory(prev => [newLog, ...prev]);
                 const allLogs = [newLog, ...history.filter(h => h.storyId === currentStoryId)]; const fullNovel = await generateFullStory({ ...aiConfig, apiKey: await checkApiKey() || '' }, worldTitle, [...allLogs].reverse().map(l => l.summary));
                 setStories(prev => prev.map(s => s.id === currentStoryId ? { ...s, fullStory: fullNovel } : s));
                 setGameState(GameState.VICTORY); setCurrentStoryId(null); clearSession();
             } else {
                 (async () => {
                    const narrativeSummary = await generateLevelNarrative({ ...aiConfig, apiKey: await checkApiKey() || '' }, worldTitle, chapterTitle, logsSnapshot);
                    setHistory(prev => [{ id: Date.now().toString(), storyId: currentStoryId, date: new Date().toLocaleDateString(), worldTitle, chapterTitle, summary: narrativeSummary }, ...prev]);
                    setStories(prev => prev.map(s => s.id === currentStory.id ? { ...s, narrativeContext: `${s.narrativeContext} ${narrativeSummary}` } : s));
                 })();
                 addToast("关卡完成！", 'info'); handleOpenDoor(updatedStory); 
             }
             return;
        }
    }
    addToast("关卡完成！", 'info'); handleOpenDoor(); 
  };

  const handleMove = (x: number, y: number) => {
    if (!theme) return;
    const cellIndex = grid.findIndex(c => c.x === x && c.y === y);
    if (cellIndex === -1) return;
    const targetCell = grid[cellIndex];
    if (!targetCell) return;
    if (!targetCell.visited && targetCell.type === CellType.EMPTY) { const loot = rollLoot('explore'); if (loot) { addToast(`探索发现: ${loot.name}`, 'loot'); logEvent(`在角落里发现了 ${loot.name}。`); } }
    if (targetCell.type === CellType.ENEMY) {
      const firstEnemy = theme.enemies?.[0] ?? { name: 'Unknown', description: '未知实体' };
      const enemyName = targetCell.enemyId || firstEnemy.name; const enemyData = theme.enemies?.find(e => e.name === enemyName) || firstEnemy;
      const isFinal = stories.find(s => s.id === currentStoryId)?.currentLevel === stories.find(s => s.id === currentStoryId)?.totalLevels;
      const newEnemy = generateEnemyStats(enemyData, stats.level, !!isFinal, x, y);
      setCurrentEnemy(newEnemy); setGameState(GameState.COMBAT); logEvent(`遭遇了敌人：${enemyName}！`); return; 
    }
    if (targetCell.type === CellType.DISCUSSION) { setGameState(GameState.DISCUSSION); logEvent("进入了初心讨论区。"); }
    if (targetCell.type === CellType.LUCK) { setGameState(GameState.LUCK); logEvent("发现了一个命运轮盘。"); }
    if (targetCell.type === CellType.EXIT) { if (player.hasKey) handleLevelComplete(); else { addToast(`需要物品: ${theme.keyItemName}`, 'error'); logEvent(`找到了出口，但被锁住了。`); } }
    if (targetCell.type === CellType.KEY) { setPlayer(p => ({ ...p, hasKey: true })); const newGrid = [...grid]; newGrid[cellIndex].type = CellType.EMPTY; setGrid(newGrid); addToast(`获得: ${theme.keyItemName}`, 'info'); logEvent(`找到了关键物品：${theme.keyItemName}！`); }
    setPlayer(p => ({ ...p, x, y })); setGrid(prev => prev.map(c => { if (c.x === x && c.y === y) return { ...c, visited: true, visible: true }; if (Math.abs(c.x - x) + Math.abs(c.y - y) <= 1) return { ...c, visible: true }; return c; }));
  };

  const addToInventory = (type: ItemType, nameOverride?: string) => {
    setInventory(prev => {
        const name = nameOverride || ITEMS_DB[type]?.name || "Item"; const stackId = `${type}_${name}`; const existing = prev.find(i => i.id === stackId);
        if (existing) return prev.map(i => i.id === stackId ? { ...i, count: i.count + 1 } : i);
        return [...prev, { id: stackId, type, name, description: BASE_ITEM_DESC[type], count: 1 }];
    });
  };

  const handleUseItem = (item: Item) => {
      let consumed = false;
      if (item.type === ItemType.HP_POTION) { 
        if (player.hp < player.maxHp) { 
          setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp+10)})); 
          addToast(`HP +10`, 'info');
          consumed=true; 
        } else {
          addToast(`HP 已满`, 'error');
        }
      } 
      else if (item.type === ItemType.MP_POTION) { 
        if (player.mp < player.maxMp) { 
          setPlayer(p => ({...p, mp: Math.min(p.maxMp, p.mp+5)})); 
          addToast(`MP +5`, 'info');
          consumed=true; 
        } else {
          addToast(`MP 已满`, 'error');
        }
      } 
      else if (item.type.includes('XP')) { 
        const amount = item.type === ItemType.XP_LARGE ? 100 : 30; 
        addToast(`经验 +${amount}`, 'info'); 
        handleGainXp(amount); 
        consumed = true; 
      } 
      else if (item.type === ItemType.OMNI_KEY && !player.hasKey) { 
        setPlayer(p=>({...p, hasKey:true})); 
        addToast(`获得万能钥匙`, 'info');
        consumed=true; 
      } else if (item.type === ItemType.OMNI_KEY && player.hasKey) {
        addToast(`已经有万能钥匙了`, 'error');
      }
      if(consumed) setInventory(prev => prev.map(i => i.id === item.id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0));
  };

  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-200 flex flex-col items-center justify-center overflow-hidden font-mono relative">
      <ToastNotification toasts={toasts} removeToast={removeToast} />
      <div className="absolute top-2 left-2 z-[60] text-[10px] flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full border border-slate-800">
          {syncStatus === 'offline' && <span className="text-slate-500">⚪ 离线模式</span>}
          {syncStatus === 'saving' && <span className="text-yellow-400 animate-pulse">🟡 正在同步...</span>}
          {syncStatus === 'saved' && <span className="text-green-400">🟢 云端已同步</span>}
          {syncStatus === 'error' && <span className="text-red-400">🔴 同步失败</span>}
      </div>
      {assets?.backgroundUrl && gameState !== GameState.MENU && gameState !== GameState.SHOP && gameState !== GameState.CHARACTERS && gameState !== GameState.CREATOR_MODE && (<div className="absolute inset-0 opacity-20 z-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${assets.backgroundUrl})` }} />)}

      {/* --- MENU SCREEN --- */}
      {gameState === GameState.MENU && (
        <MenuScreen 
            userProfile={userProfile}
            stats={stats}
            stories={stories}
            agentRank={agentRank}
            userEmail={userEmail}
            isSupabaseConfigured={isSupabaseConfigured()}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            onStartAdventure={() => { clearSession(); handleOpenDoor(); }}
            onNewStory={() => handleStartStory(false)}
            onOpenCharacters={() => setGameState(GameState.CHARACTERS)}
            onOpenShop={() => setGameState(GameState.SHOP)}
            onOpenHandbook={() => setGameState(GameState.HANDBOOK)}
            onOpenHistory={() => setGameState(GameState.HISTORY_VIEW)}
            onOpenInventory={() => setShowInventory(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenCreatorMode={() => setShowPasswordModal(true)}
            onResumeStory={handleResumeStory}
            onOpenLeaderboard={fetchLeaderboard}
            onOpenFriends={openFriendsScreen}
            onOpenEmail={openEmailScreen}
            unreadEmailCount={unreadEmailCount}
        />
      )}

      {/* --- OTHER SCREENS --- */}
      {gameState === GameState.CREATOR_MODE && <CreatorModeScreen stats={stats} setStats={setStats} onBack={() => setGameState(GameState.MENU)} onSendNotification={sendNotification} />}
      {gameState === GameState.EMAIL && <EmailScreen emails={emails} onBack={() => setGameState(GameState.MENU)} onReadEmail={readEmail} onClaimEmail={claimEmail} onDeleteEmail={deleteEmail} onAcceptFriendRequest={handleAcceptFriendRequest} onRejectFriendRequest={handleRejectFriendRequest} />}
      {gameState === GameState.SHOP && <ShopScreen stats={stats} summonInput={summonInput} setSummonInput={setSummonInput} isSummoning={isSummoning} handleSummonHero={handleSummonHero} lastSummonedHero={lastSummonedHero} setLastSummonedHero={setLastSummonedHero} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.CHARACTERS && <CharacterScreen heroes={heroes} activeHeroId={activeHeroId} setActiveHeroId={setActiveHeroId} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.HANDBOOK && <HandbookScreen onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.HISTORY_VIEW && <HistoryScreen stories={stories} history={history} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.STORY_SELECT && <StorySelectScreen storyOptions={storyOptions} isRefreshing={isRefreshing} onSelectStory={handleSelectStory} onRefresh={() => handleStartStory(true)} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.LEADERBOARD && <LeaderboardScreen entries={leaderboardData} isLoading={isLeaderboardLoading} sortBy={leaderboardSortBy} currentUserId={currentUserId} onBack={() => setGameState(GameState.MENU)} onToggleSort={toggleLeaderboardSort} onAddFriend={sendFriendRequest} />}
      {gameState === GameState.FRIENDS && <FriendsScreen friends={friends} pendingRequests={pendingRequests} onBack={() => setGameState(GameState.MENU)} onOpenChat={openChat} onAcceptRequest={acceptFriendRequest} onRejectRequest={rejectFriendRequest} onRemoveFriend={removeFriend} />}
      {gameState === GameState.CHAT && <ChatScreen friend={currentChatFriend} messages={chatMessages} currentUserId={currentUserId} onBack={closeChat} onSendMessage={sendMessage} />}
      {gameState === GameState.EXPLORING && <BackButton onBack={handleGameBack} label="撤退" />}
      {gameState === GameState.EXPLORING && theme && assets && <GameScreen grid={grid} player={player} theme={theme} assets={assets} onMove={handleMove} onBack={handleGameBack} stats={stats} />}
      {gameState === GameState.COMBAT && currentEnemy && theme && assets && (<CombatScreen player={player} enemy={currentEnemy} theme={theme} assets={assets} hero={heroes.find(h => h.id === activeHeroId) || DEFAULT_HERO} onWin={(hp, mp) => { setPlayer(p => ({...p, hp, mp})); setGrid(prev => { const [tx, ty] = currentEnemy.id.split('-').map(Number); return prev.map(c => (c.x === tx && c.y === ty) ? { ...c, type: CellType.EMPTY, visited: true } : c); }); setGameState(GameState.EXPLORING); setCurrentEnemy(null); handleGainXp(20); addToast("战斗胜利！", 'info'); }} onLose={() => { setFailedLevels(prev => [{ id: Date.now().toString(), timestamp: Date.now(), theme, assets, grid, enemyName: currentEnemy.name, storyId: currentStoryId }, ...prev]); if (currentStoryId) { setStories(prev => prev.map(s => s.id === currentStoryId ? { ...s, savedState: undefined } : s)); clearSession(); } setGameState(GameState.GAME_OVER); }} />)}
      {gameState === GameState.DISCUSSION && theme && <DiscussionScreen hero={heroes.find(h => h.id === activeHeroId) || DEFAULT_HERO} theme={theme} aiConfig={aiConfig} onComplete={() => { setGrid(prev => prev.map(c => (c.x === player.x && c.y === player.y) ? { ...c, type: CellType.EMPTY, visited: true } : c)); setGameState(GameState.EXPLORING); handleGainXp(40); addToast("心灵得到了升华", 'loot'); }} />}
      {gameState === GameState.LUCK && <LuckScreen onComplete={(effect) => { setGrid(prev => prev.map(c => (c.x === player.x && c.y === player.y) ? { ...c, type: CellType.EMPTY, visited: true } : c)); setGameState(GameState.EXPLORING); if (effect.hp !== 0 || effect.mp !== 0) { setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, Math.max(0, p.hp + effect.hp)), mp: Math.min(p.maxMp, Math.max(0, p.mp + effect.mp)) })); } if (effect.xp > 0) handleGainXp(effect.xp); if (effect.stones > 0) setStats(s => ({ ...s, summonStones: s.summonStones + effect.stones })); addToast(effect.msg, effect.type === 'bad' ? 'error' : 'loot'); }} />}
      {gameState === GameState.GENERATING && (<div className="z-10 text-center space-y-4"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div><h2 className="text-xl font-mono blink">{loadingMsg}</h2></div>)}
      {(gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (<div className="z-20 fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 animate-fade-in"><h1 className={`text-6xl font-bold mb-4 pixel-font ${gameState === GameState.VICTORY ? 'text-yellow-400' : 'text-red-600'}`}>{gameState === GameState.VICTORY ? '征服' : '死亡'}</h1><button onClick={() => { clearSession(); setGameState(GameState.MENU); }} className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded hover:scale-105 transition-transform">返回基地</button></div>)}

      {/* --- MODALS --- */}
      <div className="relative z-[80]">
        {showSettings && <SettingsModal useAiImages={useAiImages} setUseAiImages={setUseAiImages} aiConfig={aiConfig} setAiConfig={setAiConfig} onSave={saveConfig} onReset={hardReset} onClose={() => setShowSettings(false)} />}
        {showInventory && <InventoryModal inventory={inventory} onUse={handleUseItem} onClose={() => setShowInventory(false)} />}
        {showPasswordModal && <PasswordModal onSuccess={() => { setGameState(GameState.CREATOR_MODE); addToast("进入创作者模式", 'loot'); }} onClose={() => setShowPasswordModal(false)} />}
        {showProfileModal && <ProfileModal userProfile={userProfile} aiConfig={aiConfig} checkApiKey={checkApiKey} onSave={(newProfile) => setUserProfile(newProfile)} onClose={() => setShowProfileModal(false)} />}
        {showQuitModal && (<div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in"><div className="bg-slate-900 border-2 border-red-500 rounded p-6 max-w-sm w-full text-center shadow-2xl"><h3 className="text-xl font-bold text-red-400 mb-4 pixel-font">⚠ 撤退警告</h3><p className="text-slate-300 mb-6 text-sm leading-relaxed">快速冒险模式的数据处于"量子叠加态"。<br/><br/>现在撤退将导致<span className="text-red-400 font-bold">观测坍缩</span>，当前关卡的所有进度（包括经验和战利品）将永久丢失。</p><div className="flex gap-4 justify-center"><button onClick={() => setShowQuitModal(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors">取消</button><button onClick={confirmQuit} className="px-6 py-2 bg-red-800 hover:bg-red-700 rounded text-white font-bold transition-colors">确定放弃</button></div></div></div>)}
        {showAuthModal && <AuthModal onLoginSuccess={(email) => { setUserEmail(email); setShowAuthModal(false); addToast("登录成功！云同步已连接。", 'loot'); }} onClose={() => setShowAuthModal(false)} />}
      </div>
    </div>
  );
};
export default App;