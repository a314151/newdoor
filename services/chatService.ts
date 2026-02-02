import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

class ChatService {
  private static subscriptions: Map<string, RealtimeChannel> = new Map();
  // 获取聊天记录
  static async getChatMessages(userId: string, friendId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        return data.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          isRead: msg.is_read
        }));
      }
      return [];
    } catch (error) {
      console.error('获取聊天记录失败:', error);
      return [];
    }
  }

  // 发送消息
  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content
        })
        .select('*')
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          senderId: data.sender_id,
          receiverId: data.receiver_id,
          content: data.content,
          timestamp: new Date(data.created_at).getTime(),
          isRead: data.is_read
        };
      }
      return null;
    } catch (error) {
      console.error('发送消息失败:', error);
      return null;
    }
  }

  // 标记消息为已读
  static async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      return !error;
    } catch (error) {
      console.error('标记消息已读失败:', error);
      return false;
    }
  }

  // 标记所有消息为已读
  static async markAllMessagesAsRead(userId: string, friendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('sender_id', friendId);
      
      return !error;
    } catch (error) {
      console.error('标记所有消息已读失败:', error);
      return false;
    }
  }

  // 获取未读消息数量
  static async getUnreadMessageCount(userId: string, friendId: string): Promise<number> {
    try {
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('sender_id', friendId)
        .eq('is_read', false);
      
      return count || 0;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return 0;
    }
  }

  // 删除聊天记录
  static async deleteChatMessages(userId: string, friendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`);
      
      return !error;
    } catch (error) {
      console.error('删除聊天记录失败:', error);
      return false;
    }
  }

  // 订阅实时消息
  static subscribeToMessages(userId: string, onNewMessage: (message: ChatMessage) => void): () => void {
    if (!isSupabaseConfigured()) return () => {};

    const channelName = `chat-messages-${userId}`;
    
    // 停止现有的订阅
    if (this.subscriptions.has(channelName)) {
      supabase.removeChannel(this.subscriptions.get(channelName)!);
      this.subscriptions.delete(channelName);
    }

    // 创建新的订阅
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${userId}`
      }, (payload) => {
        const message = payload.new;
        onNewMessage({
          id: message.id,
          senderId: message.sender_id,
          receiverId: message.receiver_id,
          content: message.content,
          timestamp: new Date(message.created_at).getTime(),
          isRead: message.is_read
        });
      })
      .subscribe();

    this.subscriptions.set(channelName, channel);

    // 返回取消订阅的函数
    return () => {
      if (this.subscriptions.has(channelName)) {
        supabase.removeChannel(this.subscriptions.get(channelName)!);
        this.subscriptions.delete(channelName);
      }
    };
  }

  // 取消所有订阅
  static unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
}

export default ChatService;