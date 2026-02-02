import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Friend, FriendRequest, Email, EmailContentType, ItemType } from '../types';

// 好友系统服务
class FriendsService {
  // 发送好友申请通知
  static async sendFriendRequestNotification(currentUserId: string, friendId: string): Promise<boolean> {
    try {
      // 获取当前用户信息
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', currentUserId)
        .single();
      
      if (!currentUserData) {
        console.error('获取当前用户信息失败');
        return false;
      }
      
      // 获取对方用户信息
      const { data: friendUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', friendId)
        .single();
      
      if (!friendUserData) {
        console.error('获取对方用户信息失败');
        return false;
      }
      
      // 创建好友申请邮件
      const friendRequestEmail: Email = {
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
      
      // 保存邮件到对方的localStorage
      this.saveEmailToLocalStorage(friendId, friendRequestEmail);
      
      // 使用Supabase实时功能发送通知
      await this.sendRealTimeNotification(friendId, {
        type: 'friend_request',
        message: `${currentUserData.email.split('@')[0]} 向你发送了好友申请`,
        senderId: currentUserId,
        senderName: currentUserData.email.split('@')[0],
        timestamp: Date.now()
      });
      
      console.log(`成功向用户 ${friendUserData.email} 发送好友申请通知`);
      return true;
    } catch (error) {
      console.error('发送好友申请通知失败:', error);
      return false;
    }
  }
  
  // 发送实时通知
  private static async sendRealTimeNotification(userId: string, notification: any): Promise<void> {
    try {
      // 使用Supabase的functions或realtime功能发送通知
      // 这里我们创建一个临时的通知表来存储实时通知
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          message: notification.message,
          data: notification,
          read: false,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('发送实时通知失败:', error);
      }
    } catch (error) {
      console.error('发送实时通知失败:', error);
    }
  }
  
  // 接受好友申请
  static async acceptFriendRequest(currentUserId: string, senderId: string, emailId: string): Promise<boolean> {
    try {
      // 检查是否已经是好友
      const { data: existingFriends } = await supabase
        .from('friend_relationships')
        .select('id, status')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${senderId}),and(user_id.eq.${senderId},friend_id.eq.${currentUserId})`);
      
      if (existingFriends && existingFriends.length > 0) {
        const isFriend = existingFriends.some(rel => rel.status === 'accepted');
        if (isFriend) {
          console.log('已经是好友了');
          return false;
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
        console.error('创建好友关系失败:', error);
        return false;
      }
      
      // 向发送方发送接受通知
      await this.sendFriendRequestAcceptedNotification(currentUserId, senderId);
      
      return true;
    } catch (error) {
      console.error('接受好友申请失败:', error);
      return false;
    }
  }
  
  // 拒绝好友申请
  static async rejectFriendRequest(currentUserId: string, senderId: string): Promise<boolean> {
    try {
      // 向发送方发送拒绝通知
      await this.sendFriendRequestRejectedNotification(currentUserId, senderId);
      
      return true;
    } catch (error) {
      console.error('拒绝好友申请失败:', error);
      return false;
    }
  }
  
  // 发送好友申请接受通知
  private static async sendFriendRequestAcceptedNotification(receiverId: string, senderId: string): Promise<void> {
    try {
      const { data: receiverUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', receiverId)
        .single();
      
      if (receiverUserData) {
        const { data: senderUserData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', senderId)
          .single();
        
        if (senderUserData) {
          const acceptanceEmail: Email = {
            id: Date.now().toString(),
            subject: '好友申请已接受',
            content: `亲爱的冒险者，\n\n${receiverUserData.email.split('@')[0]} 已接受了你的好友申请。\n\n现在你们已经成为好友，可以开始聊天了！`,
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
          
          this.saveEmailToLocalStorage(senderId, acceptanceEmail);
          console.log(`向用户 ${senderUserData.email} 发送好友申请接受邮件`);
        }
      }
    } catch (error) {
      console.error('发送好友申请接受通知失败:', error);
    }
  }
  
  // 发送好友申请拒绝通知
  private static async sendFriendRequestRejectedNotification(receiverId: string, senderId: string): Promise<void> {
    try {
      const { data: receiverUserData } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', receiverId)
        .single();
      
      if (receiverUserData) {
        const { data: senderUserData } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', senderId)
          .single();
        
        if (senderUserData) {
          const rejectionEmail: Email = {
            id: Date.now().toString(),
            subject: '好友申请已拒绝',
            content: `亲爱的冒险者，\n\n${receiverUserData.email.split('@')[0]} 已拒绝了你的好友申请。\n\n不要灰心，继续寻找其他冒险者一起冒险吧！`,
            attachments: [],
            isRead: false,
            isClaimed: false,
            timestamp: Date.now(),
            sender: '系统'
          };
          
          this.saveEmailToLocalStorage(senderId, rejectionEmail);
          console.log(`向用户 ${senderUserData.email} 发送好友申请拒绝邮件`);
        }
      }
    } catch (error) {
      console.error('发送好友申请拒绝通知失败:', error);
    }
  }
  
  // 保存邮件到localStorage
  private static saveEmailToLocalStorage(userId: string, email: Email): void {
    try {
      const emailsKey = `inf_emails_${userId}`;
      const savedEmails = localStorage.getItem(emailsKey);
      let emails: Email[] = [];
      
      if (savedEmails) {
        try {
          emails = JSON.parse(savedEmails);
        } catch (e) {
          console.error('解析保存的邮件失败:', e);
          emails = [];
        }
      }
      
      // 添加新邮件到列表开头
      emails.unshift(email);
      localStorage.setItem(emailsKey, JSON.stringify(emails));
      console.log(`邮件已保存到用户 ${userId} 的localStorage`);
    } catch (error) {
      console.error('保存邮件到localStorage失败:', error);
    }
  }
  
  // 获取用户好友列表
  static async getFriends(userId: string): Promise<Friend[]> {
    try {
      const { data: friendsData, error } = await supabase
        .from('friend_relationships')
        .select(`
          id, status, created_at, updated_at,
          friend:profiles!friend_relationships_friend_id_fkey(id, email, created_at)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');
      
      if (!error && friendsData) {
        return friendsData.map(rel => ({
          id: rel.friend.id,
          email: rel.friend.email,
          username: rel.friend.email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${rel.friend.id}`,
          lastActive: new Date(rel.updated_at).getTime(),
          isOnline: false,
          unreadCount: 0
        }));
      }
      return [];
    } catch (error) {
      console.error('获取好友列表失败:', error);
      return [];
    }
  }
  
  // 删除好友
  static async removeFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friend_relationships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
      
      if (error) {
        console.error('删除好友失败:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('删除好友失败:', error);
      return false;
    }
  }
}

export default FriendsService;