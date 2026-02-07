import { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { loadLocalData, saveLocalData, resetLocalData, loadAiConfig, saveAiConfig } from '../utils/storageUtils';
import { fetchFromCloud, saveToCloud, fetchAgentRank } from '../utils/cloudSyncUtils';
import { AIProvider } from '../../types';

export const useUserManagement = () => {
  const {
    userEmail, setUserEmail,
    currentUserId, setCurrentUserId,
    syncStatus, setSyncStatus,
    lastCloudSaveTime, setLastCloudSaveTime,
    agentRank, setAgentRank,
    isDataLoaded, setIsDataLoaded,
    stats, setStats,
    userProfile, setUserProfile,
    heroes, setHeroes,
    activeHeroId, setActiveHeroId,
    useAiImages, setUseAiImages,
    aiConfig, setAiConfig
  } = useUser();

  const { addToast } = useUI();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rankFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化数据
  useEffect(() => {
    // 检查数据版本并清理旧数据
    const currentVersion = localStorage.getItem('inf_version');
    if (currentVersion !== "3.0.0") {
      const savedProvider = localStorage.getItem('ai_provider');
      const savedKey = localStorage.getItem('ai_key');
      const savedBaseUrl = localStorage.getItem('ai_base_url');
      const savedModel = localStorage.getItem('ai_model');
      localStorage.clear();
      localStorage.setItem('inf_version', "3.0.0");
      if (savedProvider) localStorage.setItem('ai_provider', savedProvider);
      if (savedKey) localStorage.setItem('ai_key', savedKey);
      if (savedBaseUrl) localStorage.setItem('ai_base_url', savedBaseUrl);
      if (savedModel) localStorage.setItem('ai_model', savedModel);
    }

    // 加载本地数据
    const localData = loadLocalData();
    if (localData.stats) setStats(localData.stats);
    if (localData.profile) setUserProfile(localData.profile);
    if (localData.inventory) {/* 处理背包数据 */}
    if (localData.history) {/* 处理历史数据 */}
    if (localData.failedLevels) {/* 处理失败关卡 */}
    if (localData.stories) {/* 处理故事数据 */}
    if (localData.useAiImages !== null) setUseAiImages(localData.useAiImages);
    if (localData.heroes) setHeroes(localData.heroes);
    if (localData.activeHeroId) setActiveHeroId(localData.activeHeroId);

    // 加载AI配置
    const aiConfigData = loadAiConfig();
    if (aiConfigData.provider && aiConfigData.apiKey) {
      setAiConfig({
        provider: aiConfigData.provider as AIProvider,
        apiKey: aiConfigData.apiKey,
        baseUrl: aiConfigData.baseUrl || undefined,
        model: aiConfigData.model || undefined
      });
    } else {
      // 默认使用DeepSeek
      setAiConfig({ provider: AIProvider.DEEPSEEK, apiKey: '' });
    }

    setIsDataLoaded(true);
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setCurrentUserId(session.user.id);
        setSyncStatus('saved');
        handleFetchFromCloud(session.user.id);
        if (session.user.created_at) {
          handleFetchAgentRank(session.user.created_at);
        }
      }
    });

    // 订阅认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setCurrentUserId(session.user.id);
        setSyncStatus('saved');
        handleFetchFromCloud(session.user.id);
        if (session.user.created_at) {
          handleFetchAgentRank(session.user.created_at);
        }
      } else {
        setUserEmail(null);
        setCurrentUserId(null);
        setSyncStatus('offline');
        setAgentRank(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 自动保存到本地存储
  useEffect(() => {
    if (!isDataLoaded) return;

    saveLocalData({
      stats,
      profile: userProfile,
      heroes,
      activeHeroId,
      useAiImages
    });
  }, [stats, userProfile, heroes, activeHeroId, useAiImages, isDataLoaded]);

  // 自动保存到云端
  useEffect(() => {
    if (!userEmail || !isDataLoaded || !currentUserId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveToCloud();
    }, 4000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [stats, userProfile, heroes, activeHeroId, userEmail, currentUserId, isDataLoaded]);

  const handleFetchFromCloud = async (userId: string) => {
    try {
      const result = await fetchFromCloud(userId);
      if (result.success && result.data) {
        if (result.data.stats) setStats(result.data.stats);
        if (result.data.profile) setUserProfile(result.data.profile);
        if (result.data.heroes) setHeroes(result.data.heroes);
        if (result.data.activeHeroId) setActiveHeroId(result.data.activeHeroId);
        if (result.data.updatedAt) {
          setLastCloudSaveTime(new Date(result.data.updatedAt).getTime());
        }
        addToast("云端存档已同步", 'info');
      }
    } catch (error) {
      console.error('Failed to fetch from cloud:', error);
      addToast("无法从云端读取存档", 'error');
      setSyncStatus('error');
    }
  };

  const handleSaveToCloud = async () => {
    if (!currentUserId) return;

    try {
      const result = await saveToCloud(currentUserId, {
        stats,
        profile: userProfile,
        inventory: [], // 暂时为空，需要从实际状态中获取
        history: [], // 暂时为空，需要从实际状态中获取
        stories: [], // 暂时为空，需要从实际状态中获取
        heroes,
        activeHeroId
      });

      if (result.success) {
        setSyncStatus('saved');
        setLastCloudSaveTime(Date.now());
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Failed to save to cloud:', error);
      setSyncStatus('error');
    }
  };

  const handleFetchAgentRank = async (userCreatedAt: string) => {
    // 清除之前的超时
    if (rankFetchTimeoutRef.current) {
      clearTimeout(rankFetchTimeoutRef.current);
    }

    // 设置新的超时，延迟 1 秒执行
    rankFetchTimeoutRef.current = setTimeout(async () => {
      try {
        const rank = await fetchAgentRank(userCreatedAt);
        if (rank !== null) {
          setAgentRank(rank);
        }
      } catch (error) {
        console.error('Failed to fetch agent rank:', error);
      }
    }, 1000);
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.auth.signOut();
      setUserEmail(null);
      setCurrentUserId(null);
      setSyncStatus('offline');
      setAgentRank(null);
      addToast("已退出登录", 'info');
    } catch (error) {
      console.error('Failed to logout:', error);
      addToast("退出登录失败", 'error');
    }
  };

  const handleHardReset = () => {
    if (window.confirm("确定要删除所有存档和记录吗？(API Key 会保留)")) {
      resetLocalData();
      window.location.reload();
    }
  };

  const handleSaveConfig = (provider: AIProvider, key: string, baseUrl?: string, model?: string) => {
    setAiConfig({ provider, apiKey: key, baseUrl, model });
    saveAiConfig({ provider, apiKey: key, baseUrl, model });
    addToast("AI配置已保存", 'info');
  };

  return {
    handleLogout,
    handleHardReset,
    handleSaveConfig,
    handleSaveToCloud
  };
};