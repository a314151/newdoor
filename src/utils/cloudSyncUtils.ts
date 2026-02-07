import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { PlayerStats, UserProfile, Item, StoryLog, StoryCampaign, Hero } from '../../types';

const DATA_VERSION = "3.0.0";

export const fetchFromCloud = async (userId: string) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('save_data, updated_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data?.save_data) {
      const saveData = data.save_data;
      return {
        success: true,
        data: {
          stats: saveData.stats || null,
          profile: saveData.profile || null,
          inventory: saveData.inventory || null,
          history: saveData.history || null,
          stories: saveData.stories || null,
          heroes: saveData.heroes || null,
          activeHeroId: saveData.activeHeroId || null,
          updatedAt: data.updated_at
        }
      };
    }

    return { success: false, data: null };
  } catch (error) {
    console.error('Failed to fetch from cloud:', error);
    return { success: false, error };
  }
};

export const saveToCloud = async (
  userId: string,
  data: {
    stats: PlayerStats;
    profile: UserProfile;
    inventory: Item[];
    history: StoryLog[];
    stories: StoryCampaign[];
    heroes: Hero[];
    activeHeroId: string;
  }
) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const saveData = {
      version: DATA_VERSION,
      timestamp: Date.now(),
      stats: data.stats,
      profile: data.profile,
      inventory: data.inventory,
      history: data.history,
      stories: data.stories,
      heroes: data.heroes,
      activeHeroId: data.activeHeroId
    };

    const { error } = await supabase
      .from('game_saves')
      .upsert({
        user_id: userId,
        save_data: saveData,
        updated_at: new Date().toISOString(),
        version: DATA_VERSION
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save to cloud:', error);
    return { success: false, error };
  }
};

// 用于缓存 rank 结果，避免频繁请求
let rankCache: { [key: string]: number | null } = {};
let rankCacheTime: { [key: string]: number } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export const fetchAgentRank = async (userCreatedAt: string) => {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    // 检查 userCreatedAt 是否有效
    if (!userCreatedAt || isNaN(new Date(userCreatedAt).getTime())) {
      console.warn('Invalid userCreatedAt for rank fetch:', userCreatedAt);
      return null;
    }

    // 检查缓存
    const cacheKey = userCreatedAt;
    const now = Date.now();
    if (rankCache[cacheKey] !== undefined && (now - rankCacheTime[cacheKey]) < CACHE_DURATION) {
      return rankCache[cacheKey];
    }

    try {
      // 使用 RPC 函数获取排名，避免直接查询
      const { data, error } = await supabase
        .rpc('get_user_rank', { user_created_at: userCreatedAt });

      if (error) {
        console.error('Error fetching agent rank via RPC:', error);
        // 如果 RPC 失败，尝试使用传统的 COUNT 查询
        const { count, error: countError } = await supabase
          .from('game_saves')
          .select('user_id', { count: 'exact', head: true })
          .lt('created_at', userCreatedAt);

        if (countError) {
          console.error('Error fetching agent rank via COUNT:', countError);
          return null;
        }

        const rank = count !== null ? count + 1 : null;
        
        // 更新缓存
        if (rank !== null) {
          rankCache[cacheKey] = rank;
          rankCacheTime[cacheKey] = now;
        }

        return rank;
      }

      const rank = data as number | null;
      
      // 更新缓存
      if (rank !== null) {
        rankCache[cacheKey] = rank;
        rankCacheTime[cacheKey] = now;
      }

      return rank;
    } catch (error) {
      console.error('Failed to fetch agent rank:', error);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch agent rank:', error);
    return null;
  }
};

export const fetchLeaderboardData = async (sortBy: 'registerTime' | 'level') => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // 获取所有用户信息
    let allUsers: any[] = [];
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at');

      if (!profilesError && profilesData) {
        allUsers = profilesData;
      } else {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, created_at');

        if (!usersError && usersData) {
          allUsers = usersData;
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }

    // 获取所有游戏存档数据
    let saves: any[] = [];
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*');

      if (!error && data) {
        saves = data;
      }
    } catch (error) {
      console.error('Failed to fetch saves:', error);
    }

    // 创建用户数据映射
    const userMap: Record<string, any> = {};
    allUsers.forEach(userData => {
      const userId = userData.id || userData.user_id;
      userMap[userId] = userData;
    });

    // 创建存档数据映射
    const saveMap: Record<string, any> = {};
    saves.forEach(save => {
      saveMap[save.user_id] = save;
    });

    // 生成排行榜条目
    const entries: any[] = [];

    // 处理有存档的用户
    saves.forEach(save => {
      const saveData = save.save_data || {};
      const userData = userMap[save.user_id];

      let createdTime = new Date();
      let createdAt = createdTime.getTime();

      if (userData && userData.created_at) {
        createdTime = new Date(userData.created_at);
        if (!isNaN(createdTime.getTime())) {
          createdAt = createdTime.getTime();
        }
      }

      let isOnline = false;
      if (save.updated_at) {
        const lastActiveTime = new Date(save.updated_at).getTime();
        isOnline = lastActiveTime > Date.now() - 5 * 60 * 1000;
      }

      entries.push({
        userId: save.user_id,
        username: saveData.profile?.username || `Agent ${save.user_id.substring(0, 8)}`,
        avatarUrl: saveData.profile?.avatarUrl || 'https://placehold.co/100x100?text=?',
        title: saveData.profile?.title || '见习',
        level: saveData.stats?.level || 1,
        updatedAt: new Date(save.updated_at).getTime(),
        createdAt,
        isOnline
      });
    });

    // 处理没有存档的用户
    allUsers.forEach(userData => {
      const userId = userData.id || userData.user_id;
      if (!saveMap[userId]) {
        let createdTime = new Date();
        let createdAt = createdTime.getTime();

        if (userData.created_at) {
          createdTime = new Date(userData.created_at);
          if (!isNaN(createdTime.getTime())) {
            createdAt = createdTime.getTime();
          }
        }

        entries.push({
          userId,
          username: userData.email || `Agent ${userId.substring(0, 8)}`,
          avatarUrl: 'https://placehold.co/100x100?text=?',
          title: '见习',
          level: 1,
          updatedAt: createdAt,
          createdAt,
          isOnline: false
        });
      }
    });

    // 排序
    if (sortBy === 'registerTime') {
      entries.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      entries.sort((a, b) => b.level - a.level);
    }

    return { success: true, data: entries };
  } catch (error) {
    console.error('Failed to fetch leaderboard data:', error);
    return { success: false, error };
  }
};