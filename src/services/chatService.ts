import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ChatMessage } from '../../types';

class ChatService {
  static async getChatMessages(senderId: string, receiverId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('获取聊天记录失败:', error);
        return [];
      }

      return (data || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        timestamp: msg.timestamp,
        isRead: msg.is_read
      }));
    } catch (error) {
      console.error('获取聊天记录时出错:', error);
      return [];
    }
  }

  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content,
          timestamp: Date.now(),
          is_read: false
        })
        .select('*')
        .single();

      if (error) {
        console.error('发送消息失败:', error);
        return null;
      }

      return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: data.content,
        timestamp: data.timestamp,
        isRead: data.is_read
      };
    } catch (error) {
      console.error('发送消息时出错:', error);
      return null;
    }
  }

  static async markAllMessagesAsRead(senderId: string, receiverId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId);

      if (error) {
        console.error('标记消息为已读失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('标记消息为已读时出错:', error);
      return false;
    }
  }

  static subscribeToMessages(userId: string, callback: (message: ChatMessage) => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as any;
          callback({
            id: newMessage.id,
            senderId: newMessage.sender_id,
            receiverId: newMessage.receiver_id,
            content: newMessage.content,
            timestamp: newMessage.timestamp,
            isRead: newMessage.is_read
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export default ChatService;