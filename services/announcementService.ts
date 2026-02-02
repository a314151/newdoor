import { Announcement } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

class AnnouncementService {
  private static STORAGE_KEY = 'inf_announcements';

  // 获取所有公告
  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to get announcements from Supabase:', error);
          // 回退到localStorage
          return this.getLocalAnnouncements();
        }

        return data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          createdAt: new Date(item.created_at).getTime(),
          isRead: item.is_read
        }));
      } else {
        // 使用localStorage作为回退
        return this.getLocalAnnouncements();
      }
    } catch (error) {
      console.error('Failed to get announcements:', error);
      return this.getLocalAnnouncements();
    }
  }

  // 从localStorage获取公告（回退方案）
  private static getLocalAnnouncements(): Announcement[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get local announcements:', error);
      return [];
    }
  }

  // 保存公告到localStorage（回退方案）
  private static saveLocalAnnouncements(announcements: Announcement[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(announcements));
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
  private static addLocalAnnouncement(announcement: Announcement): void {
    const announcements = this.getLocalAnnouncements();
    announcements.unshift(announcement);
    this.saveLocalAnnouncements(announcements);
  }

  // 标记公告为已读
  static async markAsRead(id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('announcements')
          .update({ is_read: true })
          .eq('id', id);

        if (error) {
          console.error('Failed to mark announcement as read in Supabase:', error);
          // 回退到localStorage
          this.markLocalAsRead(id);
        }
      } else {
        // 使用localStorage作为回退
        this.markLocalAsRead(id);
      }
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      // 回退到localStorage
      this.markLocalAsRead(id);
    }
  }

  // 标记本地公告为已读（回退方案）
  private static markLocalAsRead(id: string): void {
    const announcements = this.getLocalAnnouncements();
    const updated = announcements.map(announcement => 
      announcement.id === id ? { ...announcement, isRead: true } : announcement
    );
    this.saveLocalAnnouncements(updated);
  }

  // 标记所有公告为已读
  static async markAllAsRead(): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('announcements')
          .update({ is_read: true });

        if (error) {
          console.error('Failed to mark all announcements as read in Supabase:', error);
          // 回退到localStorage
          this.markAllLocalAsRead();
        }
      } else {
        // 使用localStorage作为回退
        this.markAllLocalAsRead();
      }
    } catch (error) {
      console.error('Failed to mark all announcements as read:', error);
      // 回退到localStorage
      this.markAllLocalAsRead();
    }
  }

  // 标记所有本地公告为已读（回退方案）
  private static markAllLocalAsRead(): void {
    const announcements = this.getLocalAnnouncements();
    const updated = announcements.map(announcement => ({ ...announcement, isRead: true }));
    this.saveLocalAnnouncements(updated);
  }

  // 检查是否有未读公告
  static async hasUnreadAnnouncements(): Promise<boolean> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('announcements')
          .select('is_read')
          .eq('is_read', false)
          .limit(1);

        if (error) {
          console.error('Failed to check unread announcements in Supabase:', error);
          // 回退到localStorage
          return this.hasLocalUnreadAnnouncements();
        }

        return data.length > 0;
      } else {
        // 使用localStorage作为回退
        return this.hasLocalUnreadAnnouncements();
      }
    } catch (error) {
      console.error('Failed to check unread announcements:', error);
      return this.hasLocalUnreadAnnouncements();
    }
  }

  // 检查本地是否有未读公告（回退方案）
  private static hasLocalUnreadAnnouncements(): boolean {
    const announcements = this.getLocalAnnouncements();
    return announcements.some(announcement => !announcement.isRead);
  }

  // 获取未读公告数量
  static async getUnreadCount(): Promise<number> {
    try {
      if (isSupabaseConfigured()) {
        const { count, error } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        if (error) {
          console.error('Failed to get unread count from Supabase:', error);
          // 回退到localStorage
          return this.getLocalUnreadCount();
        }

        return count || 0;
      } else {
        // 使用localStorage作为回退
        return this.getLocalUnreadCount();
      }
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return this.getLocalUnreadCount();
    }
  }

  // 获取本地未读公告数量（回退方案）
  private static getLocalUnreadCount(): number {
    const announcements = this.getLocalAnnouncements();
    return announcements.filter(announcement => !announcement.isRead).length;
  }

  // 删除公告
  static async deleteAnnouncement(id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Failed to delete announcement from Supabase:', error);
          // 回退到localStorage
          this.deleteLocalAnnouncement(id);
        }
      } else {
        // 使用localStorage作为回退
        this.deleteLocalAnnouncement(id);
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      // 回退到localStorage
      this.deleteLocalAnnouncement(id);
    }
  }

  // 从localStorage删除公告（回退方案）
  private static deleteLocalAnnouncement(id: string): void {
    const announcements = this.getLocalAnnouncements();
    const updated = announcements.filter(announcement => announcement.id !== id);
    this.saveLocalAnnouncements(updated);
  }

  // 清除所有公告
  static async clearAllAnnouncements(): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('announcements')
          .delete();

        if (error) {
          console.error('Failed to clear announcements from Supabase:', error);
        }
      }
      // 同时清除localStorage
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear announcements:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export default AnnouncementService;