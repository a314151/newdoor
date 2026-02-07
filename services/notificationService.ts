import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  content?: string;
  data?: any;
  read: boolean;
  created_at: string;
}

class NotificationService {
  // 获取用户的通知
  static async getNotifications(userId: string): Promise<AppNotification[]> {
    try {
      if (!isSupabaseConfigured()) {
        return this.getLocalNotifications(userId);
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get notifications from Supabase:', error);
        return this.getLocalNotifications(userId);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return this.getLocalNotifications(userId);
    }
  }

  // 获取未读通知数量
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!isSupabaseConfigured()) {
        const notifications = this.getLocalNotifications(userId);
        return notifications.filter(n => !n.read).length;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Failed to get unread count from Supabase:', error);
        const notifications = this.getLocalNotifications(userId);
        return notifications.filter(n => !n.read).length;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // 标记通知为已读
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        this.markLocalAsRead(userId, notificationId);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to mark notification as read in Supabase:', error);
        this.markLocalAsRead(userId, notificationId);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      this.markLocalAsRead(userId, notificationId);
    }
  }

  // 标记所有通知为已读
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        this.markAllLocalAsRead(userId);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Failed to mark all notifications as read in Supabase:', error);
        this.markAllLocalAsRead(userId);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      this.markAllLocalAsRead(userId);
    }
  }

  // 删除通知
  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        this.deleteLocalNotification(userId, notificationId);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to delete notification from Supabase:', error);
        this.deleteLocalNotification(userId, notificationId);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      this.deleteLocalNotification(userId, notificationId);
    }
  }

  // 订阅通知变化
  static subscribeToNotifications(userId: string, callback: (notifications: AppNotification[]) => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          const notifications = await this.getNotifications(userId);
          callback(notifications);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // 从 localStorage 获取通知（回退方案）
  private static getLocalNotifications(userId: string): AppNotification[] {
    try {
      const key = `inf_notifications_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get local notifications:', error);
      return [];
    }
  }

  // 保存通知到 localStorage（回退方案）
  private static saveLocalNotifications(userId: string, notifications: AppNotification[]): void {
    try {
      const key = `inf_notifications_${userId}`;
      localStorage.setItem(key, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save local notifications:', error);
    }
  }

  // 标记本地通知为已读（回退方案）
  private static markLocalAsRead(userId: string, notificationId: string): void {
    const notifications = this.getLocalNotifications(userId);
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveLocalNotifications(userId, updated);
  }

  // 标记所有本地通知为已读（回退方案）
  private static markAllLocalAsRead(userId: string): void {
    const notifications = this.getLocalNotifications(userId);
    const updated = notifications.map(n => ({ ...n, read: true }));
    this.saveLocalNotifications(userId, updated);
  }

  // 删除本地通知（回退方案）
  private static deleteLocalNotification(userId: string, notificationId: string): void {
    const notifications = this.getLocalNotifications(userId);
    const updated = notifications.filter(n => n.id !== notificationId);
    this.saveLocalNotifications(userId, updated);
  }
}

export default NotificationService;
