import { supabase } from './supabaseClient';
import { Friend, FriendRequest } from '../types';

// 定义数据库查询返回的原始数据结构，告别 any
interface DBFriendRelationship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  updated_at: string;
  sender: { id: string; email: string } | null;
  receiver: { id: string; email: string } | null;
}

class FriendsService {
  // 1. 获取用户好友列表 (采用更标准的关联语法)
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      const { data, error } = await supabase
        .from('friend_relationships')
        .select(`
          id, user_id, friend_id, status, updated_at,
          sender:profiles!user_id(id, email),
          receiver:profiles!friend_id(id, email)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (error) throw error;

      const friendsMap = new Map<string, Friend>();

      (data as unknown as DBFriendRelationship[])?.forEach((rel) => {
        const isMeSender = rel.user_id === userId;
        const target = isMeSender ? rel.receiver : rel.sender;

        // 严格检查 target 是否存在
        if (target) {
          const username = target.email?.split('@')[0] || '未知用户';
          friendsMap.set(target.id, {
            id: target.id,
            email: target.email,
            username: username,
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${target.id}`,
            lastActive: new Date(rel.updated_at).getTime(),
            isOnline: false,
            unreadCount: 0
          });
        }
      });
      return Array.from(friendsMap.values());
    } catch (error) {
      console.error('获取好友列表失败:', error);
      return [];
    }
  }

  // 2. 接受好友申请 (增加严谨的错误处理)
  static async acceptFriendRequest(currentUserId: string, senderId: string, requestId: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('friend_relationships')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await this.sendFriendRequestAcceptedNotification(currentUserId, senderId);
      return true;
    } catch (error) {
      console.error('接受好友申请失败:', error);
      return false;
    }
  }

  // 3. 发送好友申请 (修复了 split 可能崩溃的问题)
  static async sendFriendRequestNotification(currentUserId: string, friendId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.from('profiles').select('email').eq('id', currentUserId).single();

      // 前置检查
      if (!userData?.email) {
        console.error('无法获取发送者信息');
        return false;
      }

      const senderName = userData.email.split('@')[0];

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

      if (error || !data) throw error;

      await this.sendRealTimeNotification(friendId, {
        type: 'friend_request',
        message: `${senderName} 向你发送了好友申请`,
        senderId: currentUserId,
        senderName: senderName,
        requestId: data.id
      });

      return true;
    } catch (error) {
      console.error('申请失败:', error);
      return false;
    }
  }

  // 4. 获取待处理申请
  static async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabase
        .from('friend_relationships')
        .select(`
          id, created_at,
          sender:profiles!user_id(id, email)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return (data as any[] || []).map(req => {
        const username = req.sender?.email?.split('@')[0] || '未知用户';
        return {
          id: req.id,
          userId: req.sender?.id,
          username: username,
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.sender?.id}`,
          timestamp: new Date(req.created_at).getTime()
        };
      });
    } catch (error) {
      return [];
    }
  }

  // 私有辅助方法：实时通知
  private static async sendRealTimeNotification(userId: string, n: any) {
    await supabase.from('notifications').insert({
      user_id: userId, type: n.type, message: n.message, data: n, read: false
    });
  }

  // 修复了此处的 split 潜在崩溃风险
  private static async sendFriendRequestAcceptedNotification(meId: string, himId: string) {
    const { data: meProfile } = await supabase.from('profiles').select('email').eq('id', meId).single();
    const myName = meProfile?.email?.split('@')[0] || '某人';

    await this.sendRealTimeNotification(himId, {
      type: 'friend_request_accepted',
      message: `${myName} 已接受了你的申请`,
      senderId: meId
    });
  }

  static async rejectFriendRequest(me: string, him: string, requestId: string) {
    const { error } = await supabase.from('friend_relationships').delete().eq('id', requestId);
    return !error;
  }

  static async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const { error } = await supabase.from('friend_relationships').delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    return !error;
  }
}

export default FriendsService;