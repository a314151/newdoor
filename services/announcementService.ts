import { Announcement } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

class AnnouncementService {
  private static STORAGE_KEY = 'inf_announcements';

  // 获取所有公告
  static async getAnnouncements(userId: string): Promise<Announcement[]> {
    try {
      if (isSupabaseConfigured()) {
        // 获取所有公告
        const { data: announcements, error: announceError } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (announceError) {
          console.error('Failed to get announcements from Supabase:', announceError);
          // 回退到localStorage
          return this.getLocalAnnouncements(userId);
        }

        // 获取用户已读公告ID
        const { data: readStatuses, error: readError } = await supabase
          .from('user_announcement_read')
          .select('announcement_id')
          .eq('user_id', userId);

        if (readError) {
          console.error('Failed to get read statuses from Supabase:', readError);
          // 回退到localStorage
          return this.getLocalAnnouncements(userId);
        }

        const readIds = new Set(readStatuses?.map(item => item.announcement_id) || []);

        return announcements.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          createdAt: new Date(item.created_at).getTime(),
          isRead: readIds.has(item.id)
        }));
      } else {
        // 使用localStorage作为回退
        return this.getLocalAnnouncements(userId);
      }
    } catch (error) {
      console.error('Failed to get announcements:', error);
      return this.getLocalAnnouncements(userId);
    }
  }

  // 从localStorage获取公告（回退方案）
  private static getLocalAnnouncements(userId: string): Announcement[] {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get local announcements:', error);
      return [];
    }
  }

  // 保存公告到localStorage（回退方案）
  private static saveLocalAnnouncements(userId: string, announcements: Announcement[]): void {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      localStorage.setItem(key, JSON.stringify(announcements));
    } catch (error) {
      console.error('Failed to save local announcements:', error);
    }
  }

  // 添加新公告
  static async addAnnouncement(title: string, content: string): Promise<Announcement> {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      isRead: false
    };

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            id: newAnnouncement.id,
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            created_at: new Date(newAnnouncement.createdAt).toISOString(),
            is_read: newAnnouncement.isRead
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to add announcement to Supabase:', error);
          // 回退到localStorage
          this.addLocalAnnouncement(newAnnouncement);
        }
      } else {
        // 使用localStorage作为回退
        this.addLocalAnnouncement(newAnnouncement);
      }
    } catch (error) {
      console.error('Failed to add announcement:', error);
      // 回退到localStorage
      this.addLocalAnnouncement(newAnnouncement);
    }

    return newAnnouncement;
  }

  // 添加公告到localStorage（回退方案）
  private static addLocalAnnouncement(userId: string, announcement: Announcement): void {
    const announcements = this.getLocalAnnouncements(userId);
    announcements.unshift(announcement);
    this.saveLocalAnnouncements(userId, announcements);
  }

  // 标记公告为已读
  static async markAsRead(userId: string, id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('user_announcement_read')
          .upsert(
            {
              user_id: userId,
              announcement_id: id,
              is_read: true,
              read_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id,announcement_id'
            }
          );

        if (error) {
          console.error('Failed to mark announcement as read in Supabase:', error);
          // 回退到localStorage
          this.markLocalAsRead(userId, id);
        }
      } else {
        // 使用localStorage作为回退
        this.markLocalAsRead(userId, id);
      }
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      // 回退到localStorage
      this.markLocalAsRead(userId, id);
    }
  }

  // 标记本地公告为已读（回退方案）
  private static markLocalAsRead(userId: string, id: string): void {
    const announcements = this.getLocalAnnouncements(userId);
    const updated = announcements.map(announcement => 
      announcement.id === id ? { ...announcement, isRead: true } : announcement
    );
    this.saveLocalAnnouncements(userId, updated);
  }

  // 标记所有公告为已读
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        // 首先获取所有未读公告
        const { data: announcements, error: getError } = await supabase
          .from('announcements')
          .select('id');

        if (getError) {
          console.error('Failed to get announcements for marking all as read:', getError);
          // 回退到localStorage
          this.markAllLocalAsRead(userId);
          return;
        }

        // 批量插入已读记录
        const readRecords = announcements.map(announcement => ({
          user_id: userId,
          announcement_id: announcement.id,
          is_read: true,
          read_at: new Date().toISOString()
        }));

        if (readRecords.length > 0) {
          const { error } = await supabase
            .from('user_announcement_read')
            .upsert(
              readRecords,
              {
                onConflict: 'user_id,announcement_id'
              }
            );

          if (error) {
            console.error('Failed to mark all announcements as read in Supabase:', error);
            // 回退到localStorage
            this.markAllLocalAsRead(userId);
          }
        }
      } else {
        // 使用localStorage作为回退
        this.markAllLocalAsRead(userId);
      }
    } catch (error) {
      console.error('Failed to mark all announcements as read:', error);
      // 回退到localStorage
      this.markAllLocalAsRead(userId);
    }
  }

  // 标记所有本地公告为已读（回退方案）
  private static markAllLocalAsRead(userId: string): void {
    const announcements = this.getLocalAnnouncements(userId);
    const updated = announcements.map(announcement => ({ ...announcement, isRead: true }));
    this.saveLocalAnnouncements(userId, updated);
  }

  // 检查是否有未读公告
  static async hasUnreadAnnouncements(userId: string): Promise<boolean> {
    try {
      if (isSupabaseConfigured()) {
        // 获取所有公告ID
        const { data: allAnnouncements, error: announceError } = await supabase
          .from('announcements')
          .select('id');

        if (announceError) {
          console.error('Failed to get announcements in Supabase:', announceError);
          // 回退到localStorage
          return this.hasLocalUnreadAnnouncements(userId);
        }

        // 获取用户已读公告ID
        const { data: readStatuses, error: readError } = await supabase
          .from('user_announcement_read')
          .select('announcement_id')
          .eq('user_id', userId);

        if (readError) {
          console.error('Failed to check unread announcements in Supabase:', readError);
          // 回退到localStorage
          return this.hasLocalUnreadAnnouncements(userId);
        }

        const readIds = new Set(readStatuses?.map(item => item.announcement_id) || []);
        const unreadCount = allAnnouncements.filter(announcement => !readIds.has(announcement.id)).length;

        return unreadCount > 0;
      } else {
        // 使用localStorage作为回退
        return this.hasLocalUnreadAnnouncements(userId);
      }
    } catch (error) {
      console.error('Failed to check unread announcements:', error);
      return this.hasLocalUnreadAnnouncements(userId);
    }
  }

  // 检查本地是否有未读公告（回退方案）
  private static hasLocalUnreadAnnouncements(userId: string): boolean {
    const announcements = this.getLocalAnnouncements(userId);
    return announcements.some(announcement => !announcement.isRead);
  }

  // 获取未读公告数量
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      if (isSupabaseConfigured()) {
        // 获取所有公告数量
        const { count: totalCount, error: totalError } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true });

        if (totalError) {
          console.error('Failed to get total announcements count from Supabase:', totalError);
          // 回退到localStorage
          return this.getLocalUnreadCount(userId);
        }

        // 获取用户已读公告数量
        const { count: readCount, error: readError } = await supabase
          .from('user_announcement_read')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (readError) {
          console.error('Failed to get read count from Supabase:', readError);
          // 回退到localStorage
          return this.getLocalUnreadCount(userId);
        }

        return (totalCount || 0) - (readCount || 0);
      } else {
        // 使用localStorage作为回退
        return this.getLocalUnreadCount(userId);
      }
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return this.getLocalUnreadCount(userId);
    }
  }

  // 获取本地未读公告数量（回退方案）
  private static getLocalUnreadCount(userId: string): number {
    const announcements = this.getLocalAnnouncements(userId);
    return announcements.filter(announcement => !announcement.isRead).length;
  }

  // 删除公告
  static async deleteAnnouncement(userId: string, id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        // 先删除公告
        const { error: deleteError } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('Failed to delete announcement from Supabase:', deleteError);
        }

        // 再删除所有用户对该公告的阅读记录
        const { error: readDeleteError } = await supabase
          .from('user_announcement_read')
          .delete()
          .eq('announcement_id', id);

        if (readDeleteError) {
          console.error('Failed to delete read statuses from Supabase:', readDeleteError);
        }

        if (deleteError) {
          // 回退到localStorage
          this.deleteLocalAnnouncement(userId, id);
        }
      } else {
        // 使用localStorage作为回退
        this.deleteLocalAnnouncement(userId, id);
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      // 回退到localStorage
      this.deleteLocalAnnouncement(userId, id);
    }
  }

  // 从localStorage删除公告（回退方案）
  private static deleteLocalAnnouncement(userId: string, id: string): void {
    const announcements = this.getLocalAnnouncements(userId);
    const updated = announcements.filter(announcement => announcement.id !== id);
    this.saveLocalAnnouncements(userId, updated);
  }

  // 清除所有公告
  static async clearAllAnnouncements(userId: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        // 删除所有公告
        const { error: deleteError } = await supabase
          .from('announcements')
          .delete();

        if (deleteError) {
          console.error('Failed to clear announcements from Supabase:', deleteError);
        }

        // 删除所有用户的阅读记录
        const { error: readDeleteError } = await supabase
          .from('user_announcement_read')
          .delete();

        if (readDeleteError) {
          console.error('Failed to clear read statuses from Supabase:', readDeleteError);
        }
      }
      // 同时清除localStorage
      const key = `${this.STORAGE_KEY}_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear announcements:', error);
      const key = `${this.STORAGE_KEY}_${userId}`;
      localStorage.removeItem(key);
    }
  }
}

export default AnnouncementService;