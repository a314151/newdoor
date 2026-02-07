import { supabase, isSupabaseConfigured } from './supabaseClient';
import FriendsService from './friendsService';
import { RealtimeChannel } from '@supabase/supabase-js'; // 导入类型定义
import { Email, EmailContentType } from '../types';

interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'friend_request';
  data: any;
}

interface NotificationServiceProps {
  onShowNotification: (data: NotificationData) => void;
  onAddToast: (message: string, type: 'info' | 'loot' | 'error') => void;
  onAddEmail: (email: Email) => void;
  currentUserId: string | null;
}

class NotificationService {
  private onShowNotification: (data: NotificationData) => void;
  private onAddToast: (message: string, type: 'info' | 'loot' | 'error') => void;
  private onAddEmail: (email: Email) => void;
  private currentUserId: string | null;
  // 在 V2 中，订阅返回的是 RealtimeChannel 对象
  private subscription: RealtimeChannel | null = null;

  constructor(props: NotificationServiceProps) {
    this.onShowNotification = props.onShowNotification;
    this.onAddToast = props.onAddToast;
    this.onAddEmail = props.onAddEmail;
    this.currentUserId = props.currentUserId;
  }

  /**
   * 启动实时通知监听
   * 修正了 Supabase V2 的订阅语法
   */
  startNotificationListener(userId: string) {
    if (!isSupabaseConfigured() || !userId) return;

    // 如果已经存在监听，先停止旧的
    this.stopNotificationListener();

    try {
      console.log(`正在为用户 ${userId} 启动实时通知监听...`);

      // 1. 创建频道名（建议加上用户ID以示区分）
      const channelName = `notifications-user-${userId}`;

      // 2. 链式调用订阅逻辑
      this.subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('收到新通知原始数据:', payload);
            const notification = payload.new;

            // 在游戏界面左侧/右侧弹出通用 Toast 提示
            if (notification.message) {
              this.onAddToast(notification.message, 'info');
            }

            // 创建邮件通知，添加到邮件系统中
            // 对于系统通知，使用 data 字段中的详细内容和附件
            let emailSubject = notification.type === 'friend_request' ? '好友申请' : '系统通知';
            let emailContent = notification.message || '你收到了一条新通知';
            let emailAttachments = [];
            
            // 如果是系统通知且包含详细数据
            if (notification.type === 'system_notification' && notification.data) {
              emailSubject = notification.data.subject || emailSubject;
              emailContent = notification.data.content || emailContent;
              emailAttachments = notification.data.attachments || [];
            }
            
            const email: Email = {
              id: notification.id,
              subject: emailSubject,
              content: emailContent,
              attachments: emailAttachments,
              isRead: false,
              isClaimed: false,
              timestamp: new Date(notification.created_at || Date.now()).getTime(),
              sender: '系统'
            };
            
            // 将通知添加到邮件系统中
            this.onAddEmail(email);

            // 针对好友申请类型的特殊处理：显示带有 接受/拒绝 按钮的弹窗
            if (notification.type === 'friend_request') {
              // 提取 senderName，如果 data 里没传则显示"未知用户"
              const senderName = notification.data?.senderName || '未知用户';

              this.onShowNotification({
                title: '好友申请',
                message: `${senderName} 向你发送了好友申请，是否接受？`,
                type: 'friend_request',
                data: {
                  ...notification.data,
                  // 确保这里包含处理申请所需的 ID
                  requestId: notification.id
                }
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`实时通知订阅状态: ${status}`);
        });

    } catch (error) {
      console.error('启动实时通知监听失败:', error);
    }
  }

  /**
   * 停止通知监听
   * 使用 supabase.removeChannel 进行物理断开
   */
  stopNotificationListener() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      console.log('实时通知监听已彻底停止');
    }
  }

  // 处理通知中的接受操作
  async handleNotificationAccept(data: any) {
    // 这里的 data.senderId 和 data.requestId 需确保在发送通知时已存入 data 字段
    if (this.currentUserId && data.senderId && data.requestId) {
      try {
        await FriendsService.acceptFriendRequest(this.currentUserId, data.senderId, data.requestId);
        this.onAddToast('已接受好友申请', 'info');
      } catch (e) {
        this.onAddToast('操作失败', 'error');
      }
    } else {
      this.onAddToast('操作失败：缺少必要的信息', 'error');
    }
  }

  // 处理通知中的拒绝操作
  async handleNotificationReject(data: any) {
    if (this.currentUserId && data.senderId && data.requestId) {
      try {
        await FriendsService.rejectFriendRequest(this.currentUserId, data.senderId, data.requestId);
        this.onAddToast('已拒绝好友申请', 'info');
      } catch (e) {
        this.onAddToast('操作失败', 'error');
      }
    } else {
      this.onAddToast('操作失败：缺少必要的信息', 'error');
    }
  }

  // 发送开发者模式通知（本地测试用）
  sendDeveloperNotification(message: string) {
    this.onAddToast(`开发者通知: ${message}`, 'info');
  }

  // 发送好友申请通知（调用后端服务接口）
  async sendFriendRequestNotification(senderId: string, receiverId: string) {
    return FriendsService.sendFriendRequestNotification(senderId, receiverId);
  }

  // 更新当前用户ID并重新挂载监听
  updateCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      this.startNotificationListener(userId);
    } else {
      this.stopNotificationListener();
    }
  }
}

export default NotificationService;