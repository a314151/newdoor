import { supabase } from './supabaseClient';
import { Friend, FriendRequest } from '../types';

class FriendsService {
  // 1. 获取好友列表：修复查询逻辑，确保正确获取双向好友关系，并与排行榜保持一致的名称和头像
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      console.log('正在获取用户好友列表，UID:', userId);

      // 使用正确的Supabase语法查询双向好友关系
      const { data, error } = await supabase
        .from('friend_relationships')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) {
        console.error('获取好友列表查询错误:', error);
        throw error;
      }

      console.log('数据库返回的原始好友数据:', data);

      const friendsMap = new Map<string, Friend>();

      // 获取所有好友的用户信息
      if (data && data.length > 0) {
        // 提取所有好友ID
        const friendIds = new Set<string>();
        data.forEach(rel => {
          if (rel.user_id === userId) {
            friendIds.add(rel.friend_id);
          } else {
            friendIds.add(rel.user_id);
          }
        });

        // 批量获取好友的用户信息
        if (friendIds.size > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', Array.from(friendIds));

          if (profileError) {
            console.error('获取好友用户信息错误:', profileError);
          } else if (profiles) {
            // 创建用户信息映射
            const profileMap = new Map<string, any>();
            profiles.forEach(profile => {
              profileMap.set(profile.id, profile);
            });

            // 批量获取好友的游戏存档数据
            const { data: saves, error: savesError } = await supabase
              .from('game_saves')
              .select('user_id, save_data')
              .in('user_id', Array.from(friendIds));

            if (savesError) {
              console.error('获取好友游戏存档错误:', savesError);
            }

            // 创建游戏存档映射
            const saveMap = new Map<string, any>();
            saves?.forEach(save => {
              saveMap.set(save.user_id, save);
            });

            // 构建好友列表
            data.forEach(rel => {
              let friendId: string;
              if (rel.user_id === userId) {
                friendId = rel.friend_id;
              } else {
                friendId = rel.user_id;
              }

              const profile = profileMap.get(friendId);
              if (profile) {
                // 获取好友的游戏存档数据
                const friendSave = saveMap.get(friendId);
                const saveData = friendSave?.save_data || {};
                const friendProfile = saveData.profile || {};

                // 使用与排行榜相同的方式获取用户名和头像
                const username = friendProfile.username || profile.email || `Agent ${friendId.substring(0, 8)}`;
                const avatarUrl = friendProfile.avatarUrl || 'https://placehold.co/100x100?text=?';

                friendsMap.set(friendId, {
                  id: profile.id,
                  email: profile.email,
                  username: username,
                  avatarUrl: avatarUrl,
                  lastActive: new Date(rel.updated_at).getTime(),
                  isOnline: false,
                  unreadCount: 0
                });
              }
            });
          }
        }
      }

      const result = Array.from(friendsMap.values());
      console.log('处理后的好友列表:', result);
      return result;
    } catch (error) {
      console.error('获取好友列表异常:', error);
      return [];
    }
  }

  // 2. 发送好友申请：修复状态检查逻辑
  static async sendFriendRequestNotification(currentUserId: string, friendId: string): Promise<boolean> {
    try {
      console.log('发送好友申请:', currentUserId, '->', friendId);

      // 1. 先检查是否已经是好友或已经有申请了（双向检查）
      const { data: existingRelations, error: checkError } = await supabase
        .from('friend_relationships')
        .select('status')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (checkError) {
        console.error('检查好友关系错误:', checkError);
      } else if (existingRelations && existingRelations.length > 0) {
        // 检查是否有已接受的关系
        const isFriend = existingRelations.some(rel => rel.status === 'accepted');
        if (isFriend) {
          console.log('已经是好友了');
          return false;
        }
        // 检查是否有待处理的申请
        const hasPending = existingRelations.some(rel => rel.status === 'pending');
        if (hasPending) {
          console.log('申请已发送，请耐心等待对方同意');
          return false;
        }
      }

      // 2. 获取发送者信息
      const { data: userData } = await supabase.from('profiles').select('email').eq('id', currentUserId).single();
      if (!userData?.email) {
        console.error('获取发送者信息失败');
        return false;
      }
      const senderName = userData.email.split('@')[0];

      // 3. 执行申请逻辑
      const { data, error } = await supabase
        .from('friend_relationships')
        .upsert(
          { 
            user_id: currentUserId, 
            friend_id: friendId, 
            status: 'pending', 
            updated_at: new Date().toISOString() 
          },
          { onConflict: 'user_id, friend_id' }
        )
        .select('id').single();

      if (error || !data) {
        console.error('创建好友申请失败:', error);
        throw error;
      }

      // 4. 发送通知
      await supabase.from('notifications').insert({
        user_id: friendId,
        type: 'friend_request',
        message: `${senderName} 向你发送了好友申请`,
        data: { senderId: currentUserId, senderName, requestId: data.id },
        read: false
      });

      console.log('好友申请发送成功:', data.id);
      return true;
    } catch (error) {
      console.error('申请失败:', error);
      return false;
    }
  }

  // 3. 接受好友申请：修复逻辑，确保正确创建双向好友关系
  static async acceptFriendRequest(currentUserId: string, requestId: string, senderId: string): Promise<boolean> {
    try {
      console.log('接受好友申请:', senderId, '->', currentUserId);

      // 1. 更新申请状态为已接受
      const { error: updateError } = await supabase
        .from('friend_relationships')
        .update({ 
          status: 'accepted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('更新好友申请状态失败:', updateError);
        throw updateError;
      }

      // 2. 创建反向好友关系（确保双向好友关系）
      try {
        const { error: createError } = await supabase
          .from('friend_relationships')
          .upsert(
            { 
              user_id: currentUserId, 
              friend_id: senderId, 
              status: 'accepted', 
              updated_at: new Date().toISOString() 
            },
            { onConflict: 'user_id, friend_id' }
          );

        if (createError) {
          console.warn('创建反向好友关系失败（可能是因为用户不存在）:', createError);
          // 继续执行，不影响主流程
        }
      } catch (error) {
        console.warn('创建反向好友关系异常（可能是因为用户不存在）:', error);
        // 继续执行，不影响主流程
      }

      // 3. 获取当前用户名称
      const { data: me } = await supabase.from('profiles').select('email').eq('id', currentUserId).single();
      const myName = me?.email?.split('@')[0] || '有人';

      // 4. 发送通知给申请人
      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'friend_request_accepted',
        message: `${myName} 已接受了你的好友申请`,
        data: { senderId: currentUserId },
        read: false
      });

      console.log('好友申请接受成功');
      return true;
    } catch (error) {
      console.error('接受失败:', error);
      return false;
    }
  }

  // 4. 获取待处理的好友申请：使用与排行榜相同的方式获取用户名称和头像
  static async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      console.log('获取待处理好友申请:', userId);

      // 获取待处理的好友申请
      const { data, error } = await supabase
        .from('friend_relationships')
        .select('id, created_at, user_id')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('获取好友申请错误:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // 提取所有发送者ID
      const senderIds = data.map(req => req.user_id);

      // 批量获取发送者信息
      const { data: senders, error: sendersError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', senderIds);

      if (sendersError) {
        console.error('获取发送者信息错误:', sendersError);
        return [];
      }

      // 批量获取发送者的游戏存档数据
      const { data: saves, error: savesError } = await supabase
        .from('game_saves')
        .select('user_id, save_data')
        .in('user_id', senderIds);

      if (savesError) {
        console.error('获取发送者游戏存档错误:', savesError);
      }

      // 创建发送者信息映射
      const senderMap = new Map<string, any>();
      senders?.forEach(sender => {
        senderMap.set(sender.id, sender);
      });

      // 创建游戏存档映射
      const saveMap = new Map<string, any>();
      saves?.forEach(save => {
        saveMap.set(save.user_id, save);
      });

      // 构建好友申请列表
      return data.map((req: any) => {
        const sender = senderMap.get(req.user_id);
        if (sender) {
          // 获取发送者的游戏存档数据
          const senderSave = saveMap.get(req.user_id);
          const saveData = senderSave?.save_data || {};
          const senderProfile = saveData.profile || {};

          // 使用与排行榜相同的方式获取用户名和头像
          const username = senderProfile.username || sender.email || `Agent ${req.user_id.substring(0, 8)}`;
          const avatarUrl = senderProfile.avatarUrl || 'https://placehold.co/100x100?text=?';

          return {
            id: req.id,
            userId: sender.id,
            username: username,
            avatarUrl: avatarUrl,
            createdAt: new Date(req.created_at).getTime()
          };
        } else {
          return {
            id: req.id,
            userId: req.user_id,
            username: '未知用户',
            avatarUrl: 'https://placehold.co/100x100?text=?',
            createdAt: new Date(req.created_at).getTime()
          };
        }
      });
    } catch (error) {
      console.error('获取好友申请异常:', error);
      return [];
    }
  }

  // 5. 拒绝好友申请
  static async rejectFriendRequest(currentUserId: string, senderId: string, requestId: string): Promise<boolean> {
    try {
      console.log('拒绝好友申请:', senderId, '->', currentUserId);

      const { error } = await supabase
        .from('friend_relationships')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('拒绝好友申请失败:', error);
        return false;
      }

      // 发送通知给申请人
      const { data: me } = await supabase.from('profiles').select('email').eq('id', currentUserId).single();
      const myName = me?.email?.split('@')[0] || '有人';

      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'friend_request_rejected',
        message: `${myName} 已拒绝了你的好友申请`,
        data: { senderId: currentUserId },
        read: false
      });

      console.log('好友申请拒绝成功');
      return true;
    } catch (error) {
      console.error('拒绝好友申请异常:', error);
      return false;
    }
  }

  // 6. 删除好友
  static async removeFriend(currentUserId: string, friendId: string): Promise<boolean> {
    try {
      console.log('删除好友:', currentUserId, '->', friendId);

      // 删除双向好友关系
      const { error } = await supabase
        .from('friend_relationships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);

      if (error) {
        console.error('删除好友失败:', error);
        return false;
      }

      console.log('好友删除成功');
      return true;
    } catch (error) {
      console.error('删除好友异常:', error);
      return false;
    }
  }
}

export default FriendsService;