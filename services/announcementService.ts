import { Announcement } from '../types';

class AnnouncementService {
  private static STORAGE_KEY = 'inf_announcements';
  private static READ_KEY = 'inf_announcements_read';

  // 获取所有公告
  static getAnnouncements(): Announcement[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get announcements:', error);
      return [];
    }
  }

  // 保存公告
  static saveAnnouncements(announcements: Announcement[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(announcements));
    } catch (error) {
      console.error('Failed to save announcements:', error);
    }
  }

  // 添加新公告
  static addAnnouncement(title: string, content: string): Announcement {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      isRead: false
    };

    const announcements = this.getAnnouncements();
    announcements.unshift(newAnnouncement); // 添加到开头
    this.saveAnnouncements(announcements);

    return newAnnouncement;
  }

  // 标记公告为已读
  static markAsRead(id: string): void {
    const announcements = this.getAnnouncements();
    const updated = announcements.map(announcement => 
      announcement.id === id ? { ...announcement, isRead: true } : announcement
    );
    this.saveAnnouncements(updated);
  }

  // 标记所有公告为已读
  static markAllAsRead(): void {
    const announcements = this.getAnnouncements();
    const updated = announcements.map(announcement => ({ ...announcement, isRead: true }));
    this.saveAnnouncements(updated);
  }

  // 检查是否有未读公告
  static hasUnreadAnnouncements(): boolean {
    const announcements = this.getAnnouncements();
    return announcements.some(announcement => !announcement.isRead);
  }

  // 获取未读公告数量
  static getUnreadCount(): number {
    const announcements = this.getAnnouncements();
    return announcements.filter(announcement => !announcement.isRead).length;
  }

  // 删除公告
  static deleteAnnouncement(id: string): void {
    const announcements = this.getAnnouncements();
    const updated = announcements.filter(announcement => announcement.id !== id);
    this.saveAnnouncements(updated);
  }

  // 清除所有公告
  static clearAllAnnouncements(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear announcements:', error);
    }
  }
}

export default AnnouncementService;