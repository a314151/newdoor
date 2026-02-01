import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GridCell, Player, ThemeConfig, GameAssets, CellType, Enemy, AIProvider, AIConfig, PlayerStats, Item, ItemType, StoryLog, SavedLevel, StoryCampaign, ToastMessage, Hero, SkillType, UserProfile, LeaderboardEntry } from './types';
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
import InventoryModal from './components/modals/InventoryModal';
import SettingsModal from './components/modals/SettingsModal';
import PasswordModal from './components/modals/PasswordModal';
import ProfileModal from './components/modals/ProfileModal';
import BackButton from './components/ui/BackButton';
import AuthModal from './components/modals/AuthModal';

// --- Constants ---
const DATA_VERSION = "1.7.7"; 

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
        if (savedStats) setStats(JSON.parse(savedStats));
        const savedProfile = localStorage.getItem('inf_profile');
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        const savedInv = localStorage.getItem('inf_inv');
        if (savedInv) setInventory(JSON.parse(savedInv));
        const savedHist = localStorage.getItem('inf_hist');
        if (savedHist) setHistory(JSON.parse(savedHist));
        const savedFail = localStorage.getItem('inf_fail');
        if (savedFail) setFailedLevels(JSON.parse(savedFail));
        const savedStories = localStorage.getItem('inf_stories');
        if (savedStories) setStories(JSON.parse(savedStories));
        const savedImageSetting = localStorage.getItem('inf_use_ai_images');
        if (savedImageSetting !== null) setUseAiImages(JSON.parse(savedImageSetting));
        const savedHeroes = localStorage.getItem('inf_heroes');
        if (savedHeroes) setHeroes(JSON.parse(savedHeroes));
        const savedActiveHero = localStorage.getItem('inf_active_hero');
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

  useEffect(() => { localStorage.setItem('inf_stats', JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem('inf_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('inf_inv', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('inf_hist', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('inf_fail', JSON.stringify(failedLevels)); }, [failedLevels]);
  useEffect(() => { localStorage.setItem('inf_stories', JSON.stringify(stories)); }, [stories]);
  useEffect(() => { localStorage.setItem('inf_use_ai_images', JSON.stringify(useAiImages)); }, [useAiImages]);
  useEffect(() => { localStorage.setItem('inf_heroes', JSON.stringify(heroes)); }, [heroes]);
  useEffect(() => { localStorage.setItem('inf_active_hero', activeHeroId); }, [activeHeroId]);

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
        // Since we can't easily order by JSONB fields without schema changes,
        // we fetch the latest 50 updated saves and sort them client-side by level.
        const { data, error } = await supabase
            .from('game_saves')
            .select('user_id, save_data, updated_at')
            .order('updated_at', { ascending: false })
            .limit(50);
            
        if (error) throw error;
        
        if (data) {
            const entries: LeaderboardEntry[] = data.map(item => {
                const s = item.save_data;
                // Safe checks for potentially partial data
                return {
                    userId: item.user_id,
                    username: s.profile?.username || 'Unknown Agent',
                    avatarUrl: s.profile?.avatarUrl || 'https://placehold.co/100x100?text=?',
                    title: s.profile?.title || 'Unknown',
                    level: s.stats?.level || 1,
                    updatedAt: new Date(item.updated_at).getTime()
                };
            }).sort((a, b) => b.level - a.level); // Client-side sort by level
            
            setLeaderboardData(entries);
        }
    } catch (e) {
        console.error("Leaderboard Fetch Error", e);
        addToast("获取排行榜失败", "error");
    } finally {
        setIsLeaderboardLoading(false);
    }
  };

  const fetchFromCloud = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('game_saves').select('save_data, updated_at').eq('user_id', userId).single();
          if (error && error.code !== 'PGRST116') throw error; 
          if (data?.save_data) {
              const d = data.save_data;
              if (d.stats) setStats(d.stats);
              if (d.profile) setUserProfile(d.profile);
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
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message: msg, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const logEvent = (msg: string) => setEventLog(prev => [...prev, msg]);

  const handleGainXp = (amount: number) => {
      setStats(prevStats => {
          const { newStats, levelsGained, hpGain, mpGain } = calculateXpGain(prevStats, amount);
          if (levelsGained > 0) {
              addToast(`升级！Lv.${newStats.level} (HP+${hpGain}, MP+${mpGain})`, 'loot');
              setPlayer(prevPlayer => ({ ...prevPlayer, maxHp: prevPlayer.maxHp + hpGain, maxMp: prevPlayer.maxMp + mpGain, hp: prevPlayer.hp + hpGain, mp: prevPlayer.mp + mpGain }));
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
      if (item.type === ItemType.HP_POTION) { if (player.hp < player.maxHp) { setPlayer(p => ({...p, hp: Math.min(p.maxHp, p.hp+10)})); consumed=true; } } 
      else if (item.type === ItemType.MP_POTION) { if (player.mp < player.maxMp) { setPlayer(p => ({...p, mp: Math.min(p.maxMp, p.mp+5)})); consumed=true; } } 
      else if (item.type.includes('XP')) { const amount = item.type === ItemType.XP_LARGE ? 100 : 30; addToast(`经验 +${amount}`, 'info'); handleGainXp(amount); consumed = true; } 
      else if (item.type === ItemType.OMNI_KEY && !player.hasKey) { setPlayer(p=>({...p, hasKey:true})); consumed=true; }
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
        />
      )}

      {/* --- OTHER SCREENS --- */}
      {gameState === GameState.CREATOR_MODE && <CreatorModeScreen stats={stats} setStats={setStats} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.SHOP && <ShopScreen stats={stats} summonInput={summonInput} setSummonInput={setSummonInput} isSummoning={isSummoning} handleSummonHero={handleSummonHero} lastSummonedHero={lastSummonedHero} setLastSummonedHero={setLastSummonedHero} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.CHARACTERS && <CharacterScreen heroes={heroes} activeHeroId={activeHeroId} setActiveHeroId={setActiveHeroId} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.HANDBOOK && <HandbookScreen onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.HISTORY_VIEW && <HistoryScreen stories={stories} history={history} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.STORY_SELECT && <StorySelectScreen storyOptions={storyOptions} isRefreshing={isRefreshing} onSelectStory={handleSelectStory} onRefresh={() => handleStartStory(true)} onBack={() => setGameState(GameState.MENU)} />}
      {gameState === GameState.LEADERBOARD && <LeaderboardScreen entries={leaderboardData} isLoading={isLeaderboardLoading} currentUserId={currentUserId} onBack={() => setGameState(GameState.MENU)} />}
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