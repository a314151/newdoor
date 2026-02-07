import React from 'react';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { useUserManagement } from '../hooks/useUserManagement';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameState, AIProvider, EmailContentType, ItemType } from '../../types';

// Modular Component Imports
import GameGrid from '../../components/GameGrid';
import CombatScreen from '../../components/CombatScreen';
import ToastNotification from '../../components/ToastNotification';
import ShopScreen from '../../components/screens/ShopScreen';
import CharacterScreen from '../../components/screens/CharacterScreen';
import HandbookScreen from '../../components/screens/HandbookScreen';
import HistoryScreen from '../../components/screens/HistoryScreen';
import StorySelectScreen from '../../components/screens/StorySelectScreen';
import GameScreen from '../../components/screens/GameScreen';
import CreatorModeScreen from '../../components/screens/CreatorModeScreen';
import DiscussionScreen from '../../components/screens/DiscussionScreen';
import LuckScreen from '../../components/screens/LuckScreen';
import MenuScreen from '../../components/screens/MenuScreen';
import LeaderboardScreen from '../../components/screens/LeaderboardScreen';
import FriendsScreen from '../../components/screens/FriendsScreen';
import ChatScreen from '../../components/screens/ChatScreen';
import EmailScreen from '../../components/screens/EmailScreen';
import InventoryModal from '../../components/modals/InventoryModal';
import SettingsModal from '../../components/modals/SettingsModal';
import PasswordModal from '../../components/modals/PasswordModal';
import ProfileModal from '../../components/modals/ProfileModal';
import BackButton from '../../components/ui/BackButton';
import AuthModal from '../../components/modals/AuthModal';
import NotificationModal from '../../components/ui/NotificationModal';
import AnnouncementBar from '../../components/ui/AnnouncementBar';

const AppContent: React.FC = () => {
  const { 
    gameState, setGameState, 
    grid, player, currentEnemy, theme, assets, 
    storyOptions, setStoryOptions, isRefreshing, setIsRefreshing,
    setCurrentStoryId
  } = useGame();
  const { 
    userEmail, currentUserId, syncStatus, agentRank, userProfile, setUserProfile, stats, setStats, heroes, activeHeroId, setActiveHeroId, setHeroes,
    useAiImages, setUseAiImages, aiConfig, setAiConfig
  } = useUser();
  const { 
    toasts, removeToast, addToast,
    announcements, setAnnouncements, isAnnouncementVisible, setIsAnnouncementVisible,
    showSettings, setShowSettings, 
    showInventory, setShowInventory, 
    showPasswordModal, setShowPasswordModal, 
    showAuthModal, setShowAuthModal, 
    showProfileModal, setShowProfileModal, 
    showNotificationModal, setShowNotificationModal, notificationData,
    unreadEmailCount, setUnreadEmailCount, unreadAnnouncementCount, setUnreadAnnouncementCount,
    currentChatFriend, setCurrentChatFriend, chatMessages, setChatMessages,
    emails, setEmails,
    friends, setFriends, pendingRequests, setPendingRequests, leaderboardData, setLeaderboardData, isLeaderboardLoading, leaderboardSortBy, setLeaderboardSortBy,
    summonInput, setSummonInput, isSummoning, lastSummonedHero,
    notifications, setNotifications, unreadNotificationCount, setUnreadNotificationCount
  } = useUI();

  const { handleLogout, handleHardReset, handleSaveConfig } = useUserManagement();
  const { handleGainXp, addToInventory, movePlayer, handleAttack } = useGameLogic();

  // 用户故事和历史记录状态
  const [stories, setStories] = React.useState<any[]>([]);
  const [history, setHistory] = React.useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // 加载用户故事和历史记录
  React.useEffect(() => {
    if (currentUserId) {
      const loadStoriesAndHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const { fetchFromCloud } = await import('../utils/cloudSyncUtils');
          // 添加超时处理，防止请求无限挂起
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('加载超时')), 10000); // 10秒超时
          });
          
          const savedData = await Promise.race([
            fetchFromCloud(currentUserId),
            timeoutPromise
          ]) as any;
          
          // 检查返回的数据结构
          if (savedData && typeof savedData === 'object' && savedData.success && savedData.data) {
            const { stories = [], history = [] } = savedData.data;
            setStories(Array.isArray(stories) ? stories : []);
            setHistory(Array.isArray(history) ? history : []);
          } else {
            // 如果数据加载失败或返回空，设置空数组
            console.log('未找到故事和历史记录数据，或数据为空', savedData);
            setStories([]);
            setHistory([]);
          }
        } catch (error) {
          console.error('Failed to load stories and history:', error);
          // 出错时也设置空数组，避免界面卡住
          setStories([]);
          setHistory([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      loadStoriesAndHistory();
    } else {
      // 如果没有用户ID，清空数据
      setStories([]);
      setHistory([]);
    }
  }, [currentUserId]);

  // 加载排行榜数据
  React.useEffect(() => {
    if (gameState === GameState.LEADERBOARD) {
      const loadLeaderboard = async () => {
        try {
          const { fetchLeaderboardData } = await import('../utils/cloudSyncUtils');
          const result = await fetchLeaderboardData(leaderboardSortBy);
          if (result && result.data) {
            setLeaderboardData(result.data);
          }
        } catch (error) {
          console.error('Failed to load leaderboard:', error);
        }
      };
      loadLeaderboard();
    }
  }, [gameState, leaderboardSortBy, setLeaderboardData]);

  // 加载好友数据
  React.useEffect(() => {
    if (gameState === GameState.FRIENDS && currentUserId) {
      const loadFriends = async () => {
        try {
          const FriendsService = (await import('../../services/friendsService')).default;
          const friendsData = await FriendsService.getFriends(currentUserId);
          const requestsData = await FriendsService.getFriendRequests(currentUserId);
          setFriends(friendsData);
          setPendingRequests(requestsData);
        } catch (error) {
          console.error('Failed to load friends:', error);
        }
      };
      loadFriends();
    }
  }, [gameState, currentUserId, setFriends, setPendingRequests]);

  // 加载邮件数据（从本地存储和通知合并）
  React.useEffect(() => {
    if (gameState === GameState.EMAIL && currentUserId) {
      const loadEmails = async () => {
        try {
          // 1. 从本地存储加载邮件
          const { loadEmails: loadLocalEmails } = await import('../utils/storageUtils');
          const localEmails = loadLocalEmails(currentUserId);
          
          // 2. 从通知加载邮件
          const { default: NotificationService } = await import('../../services/notificationService');
          const notifications = await NotificationService.getNotifications(currentUserId);
          
          // 3. 将通知转换为邮件格式
          const notificationEmails = notifications.map(notification => {
            const baseEmail = {
              id: `notification_${notification.id}`,
              subject: notification.message || '系统通知',
              content: notification.content || notification.data?.content || '',
              attachments: notification.data?.attachments || [],
              isRead: notification.read,
              isClaimed: false,
              timestamp: new Date(notification.created_at).getTime(),
              sender: '系统',
              friendRequest: undefined
            };
            
            // 处理好友申请通知
            if (notification.type === 'friend_request' && notification.data?.senderId) {
              return {
                ...baseEmail,
                subject: '好友申请',
                content: notification.message || `${notification.data?.senderName || '有人'} 向你发送了好友申请`,
                friendRequest: {
                  senderId: notification.data.senderId,
                  senderName: notification.data.senderName || '未知用户',
                  requestId: notification.data.requestId
                }
              };
            }
            
            // 处理好友申请接受通知
            if (notification.type === 'friend_request_accepted' && notification.data?.senderId) {
              return {
                ...baseEmail,
                subject: '好友申请已接受',
                content: notification.message || `${notification.data?.senderName || '有人'} 已接受了你的好友申请`,
                friendRequest: undefined
              };
            }
            
            return baseEmail;
          });
          
          // 4. 合并邮件，去重（优先保留本地邮件）
          const emailMap = new Map();
          // 先添加通知邮件
          notificationEmails.forEach(email => emailMap.set(email.id, email));
          // 再添加本地邮件（本地邮件可能覆盖通知邮件）
          localEmails.forEach(email => emailMap.set(email.id, email));
          
          const mergedEmails = Array.from(emailMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);
          
          setEmails(mergedEmails);
          setUnreadEmailCount(mergedEmails.filter(e => !e.isRead).length);
        } catch (error) {
          console.error('Failed to load emails:', error);
        }
      };
      loadEmails();
    }
  }, [gameState, currentUserId, setEmails, setUnreadEmailCount]);

  // 加载通知数据并更新邮件状态
  React.useEffect(() => {
    if (currentUserId) {
      const loadNotifications = async () => {
        try {
          const NotificationService = (await import('../../services/notificationService')).default;
          const notifications = await NotificationService.getNotifications(currentUserId);
          setNotifications(notifications);
          setUnreadNotificationCount(notifications.filter(n => !n.read).length);
          
          // 同时更新邮件状态
          try {
            const { loadEmails: loadLocalEmails } = await import('../utils/storageUtils');
            const localEmails = loadLocalEmails(currentUserId);
            
            // 将通知转换为邮件格式
            const notificationEmails = notifications.map(notification => ({
              id: `notification_${notification.id}`,
              subject: notification.message || '系统通知',
              content: notification.content || notification.data?.content || '',
              attachments: notification.data?.attachments || [],
              isRead: notification.read,
              isClaimed: false,
              timestamp: new Date(notification.created_at).getTime(),
              sender: '系统',
              friendRequest: undefined
            }));
            
            // 合并邮件，去重（优先保留本地邮件）
            const emailMap = new Map();
            notificationEmails.forEach(email => emailMap.set(email.id, email));
            localEmails.forEach(email => emailMap.set(email.id, email));
            
            const mergedEmails = Array.from(emailMap.values())
              .sort((a, b) => b.timestamp - a.timestamp);
            
            setEmails(mergedEmails);
            setUnreadEmailCount(mergedEmails.filter(e => !e.isRead).length);
          } catch (error) {
            console.error('Failed to update emails from notifications:', error);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };
      loadNotifications();
    }
  }, [currentUserId, setNotifications, setUnreadNotificationCount, setEmails, setUnreadEmailCount]);

  // 订阅通知变化
  React.useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe: () => void;

    const setupSubscription = async () => {
      const { default: NotificationService } = await import('../../services/notificationService');
      unsubscribe = NotificationService.subscribeToNotifications(currentUserId, async (notifications) => {
        setNotifications(notifications);
        setUnreadNotificationCount(notifications.filter(n => !n.read).length);
        
        // 同时更新邮件状态
        try {
          const { loadEmails: loadLocalEmails } = await import('../utils/storageUtils');
          const localEmails = loadLocalEmails(currentUserId);
          
          // 将通知转换为邮件格式
          const notificationEmails = notifications.map(notification => ({
            id: `notification_${notification.id}`,
            subject: notification.message || '系统通知',
            content: notification.content || notification.data?.content || '',
            attachments: notification.data?.attachments || [],
            isRead: notification.read,
            isClaimed: false,
            timestamp: new Date(notification.created_at).getTime(),
            sender: '系统',
            friendRequest: undefined
          }));
          
          // 合并邮件，去重（优先保留本地邮件）
          const emailMap = new Map();
          notificationEmails.forEach(email => emailMap.set(email.id, email));
          localEmails.forEach(email => emailMap.set(email.id, email));
          
          const mergedEmails = Array.from(emailMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);
          
          setEmails(mergedEmails);
          setUnreadEmailCount(mergedEmails.filter(e => !e.isRead).length);
        } catch (error) {
          console.error('Failed to update emails from notifications:', error);
        }
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId, setNotifications, setUnreadNotificationCount, setEmails, setUnreadEmailCount]);

  // 加载公告数据
  React.useEffect(() => {
    if (currentUserId) {
      const loadAnnouncements = async () => {
        try {
          const { default: AnnouncementService } = await import('../../services/announcementService');
          const announcements = await AnnouncementService.getAnnouncements(currentUserId);
          setAnnouncements(announcements);
          setUnreadAnnouncementCount(announcements.filter(a => !a.isRead).length);
        } catch (error) {
          console.error('Failed to load announcements:', error);
        }
      };
      loadAnnouncements();
    }
  }, [currentUserId, setAnnouncements, setUnreadAnnouncementCount]);

  // 回调函数
  const handleOpenProfile = () => setShowProfileModal(true);
  const handleOpenAuth = () => setShowAuthModal(true);
  const handleStartAdventure = () => setGameState(GameState.EXPLORING);
  const handleNewStory = () => setGameState(GameState.STORY_SELECT);
  const handleOpenCharacters = () => setGameState(GameState.CHARACTERS);
  const handleOpenShop = () => setGameState(GameState.SHOP);
  const handleOpenHandbook = () => setGameState(GameState.HANDBOOK);
  const handleOpenHistory = () => setGameState(GameState.HISTORY_VIEW);
  const handleOpenInventory = () => setShowInventory(true);
  const handleOpenSettings = () => setShowSettings(true);
  const handleOpenLeaderboard = () => setGameState(GameState.LEADERBOARD);
  const handleOpenFriends = () => setGameState(GameState.FRIENDS);
  const handleOpenEmail = () => setGameState(GameState.EMAIL);
  const handleOpenAnnouncements = () => setIsAnnouncementVisible(true);
  const handleResumeStory = (story: any) => setGameState(GameState.EXPLORING);
  const handleDeleteHero = (id: string) => {
    setHeroes(prevHeroes => prevHeroes.filter(hero => hero.id !== id));
  };
  const handleBackToMenu = () => setGameState(GameState.MENU);

  // 添加好友处理
  const handleAddFriend = async (friendId: string) => {
    if (!currentUserId) {
      console.error('用户未登录，无法发送好友申请');
      return;
    }

    try {
      const FriendsService = (await import('../../services/friendsService')).default;
      const success = await FriendsService.sendFriendRequestNotification(currentUserId, friendId);
      
      if (success) {
        // 显示成功消息
        addToast('好友申请已发送', 'info');
        
        // 可选：添加本地邮件通知
        const newEmail = {
          id: `friend_request_${Date.now()}`,
          subject: '好友申请已发送',
          content: `你的好友申请已成功发送，等待对方确认。`,
          attachments: [],
          isRead: true,
          isClaimed: false,
          timestamp: Date.now(),
          sender: '系统',
          friendRequest: undefined
        };
        setEmails(prev => [newEmail, ...prev]);
      } else {
        addToast('发送申请失败，可能已是好友或已有待处理申请', 'error');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      addToast('发送申请时发生错误', 'error');
    }
  };

  // 好友请求处理
  const handleAcceptFriendRequest = async (requestId: string, senderId: string) => {
    try {
      const FriendsService = (await import('../../services/friendsService')).default;
      const success = await FriendsService.acceptFriendRequest(currentUserId!, requestId, senderId);
      if (success) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        // 重新加载好友列表
        const friendsData = await FriendsService.getFriends(currentUserId!);
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId: string, senderId: string) => {
    try {
      const FriendsService = (await import('../../services/friendsService')).default;
      const success = await FriendsService.rejectFriendRequest(currentUserId!, requestId, senderId);
      if (success) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const FriendsService = (await import('../../services/friendsService')).default;
      const success = await FriendsService.removeFriend(currentUserId!, friendId);
      if (success) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  // 创作者模式密码验证
  const handleOpenCreatorMode = () => {
    setShowPasswordModal(true);
  };

  // 公告管理
  const handleAddAnnouncement = async (title: string, content: string) => {
    const newAnnouncement = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      isRead: false
    };
    
    // 同时保存到 Supabase
    if (currentUserId) {
      try {
        const { default: AnnouncementService } = await import('../../services/announcementService');
        await AnnouncementService.addAnnouncement(currentUserId, title, content);
      } catch (error) {
        console.error('Failed to save announcement to Supabase:', error);
      }
    }
    
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    // 更新本地状态
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      
      // 更新未读计数
      const unreadCount = updated.filter(a => !a.isRead).length;
      setUnreadAnnouncementCount(unreadCount);
      
      return updated;
    });
    
    // 同步到 Supabase
    if (currentUserId) {
      try {
        const { default: AnnouncementService } = await import('../../services/announcementService');
        await AnnouncementService.deleteAnnouncement(currentUserId, id);
      } catch (error) {
        console.error('Failed to delete announcement from Supabase:', error);
      }
    }
  };

  // 发送通知
  const handleSendNotification = async (data: {
    subject: string;
    content: string;
    attachments: Array<{
      type: EmailContentType;
      itemType?: ItemType;
      amount?: number;
      level?: number;
      xp?: number;
      stones?: number;
    }>;
    sendToAll: boolean;
    specificUserId?: string;
  }) => {
    try {
      const { supabase } = await import('../../services/supabaseClient');
      
      // 1. 构造通知数据
      const notificationData = {
        type: 'system_notification',
        message: data.subject,
        content: data.content,
        data: {
          subject: data.subject,
          content: data.content,
          attachments: data.attachments
        },
        read: false,
        created_at: new Date().toISOString()
      };

      // 2. 发送给特定用户或所有用户
      if (data.sendToAll) {
        // 获取所有用户ID
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id');
        
        if (usersError) throw usersError;
        
        if (users && users.length > 0) {
          const notifications = users.map(user => ({
            ...notificationData,
            user_id: user.id
          }));
          
          const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);
            
          if (insertError) throw insertError;
        }
      } else if (data.specificUserId) {
        const notification = {
          ...notificationData,
          user_id: data.specificUserId
        };
        
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notification);
          
        if (insertError) throw insertError;
      }
      
      alert('通知发送成功！');
    } catch (error) {
      console.error('发送通知失败:', error);
      alert('发送通知失败，请检查控制台日志。');
    }
  };

  // Announcement Handlers
  const handleCloseAnnouncements = () => setIsAnnouncementVisible(false);
  const handleMarkAnnouncementAsRead = async (id: string) => {
    // 更新本地状态
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isRead: true } : a);
      
      // 更新未读计数
      const unreadCount = updated.filter(a => !a.isRead).length;
      setUnreadAnnouncementCount(unreadCount);
      
      return updated;
    });
    
    // 同步到 Supabase
    if (currentUserId) {
      try {
        const { default: AnnouncementService } = await import('../../services/announcementService');
        await AnnouncementService.markAsRead(currentUserId, id);
      } catch (error) {
        console.error('Failed to mark announcement as read in Supabase:', error);
      }
    }
  };
  const handleMarkAllAnnouncementsAsRead = async () => {
    // 更新本地状态
    setAnnouncements(prev => {
      const updated = prev.map(a => ({ ...a, isRead: true }));
      
      // 更新未读计数
      setUnreadAnnouncementCount(0);
      
      return updated;
    });
    
    // 同步到 Supabase
    if (currentUserId) {
      try {
        const { default: AnnouncementService } = await import('../../services/announcementService');
        await AnnouncementService.markAllAsRead(currentUserId);
      } catch (error) {
        console.error('Failed to mark all announcements as read in Supabase:', error);
      }
    }
  };

  // Chat Handlers
  const handleSendMessage = (content: string) => {
    if (!currentChatFriend || !currentUserId) return;
    const newMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: currentChatFriend.id,
      content,
      timestamp: Date.now(),
      isRead: false
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Email Handlers
  const handleReadEmail = async (id: string) => {
    // 更新本地状态
    setEmails(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, isRead: true } : e);
      
      // 更新未读计数
      const unreadCount = updated.filter(e => !e.isRead).length;
      setUnreadEmailCount(unreadCount);
      
      // 异步保存普通邮件到本地存储
      if (!id.startsWith('notification_') && currentUserId) {
        (async () => {
          try {
            const { saveEmails } = await import('../utils/storageUtils');
            saveEmails(currentUserId, updated);
          } catch (error) {
            console.error('Failed to save emails to local storage:', error);
          }
        })();
      }
      
      return updated;
    });
    
    // 如果是通知，同步到 Supabase
    if (id.startsWith('notification_') && currentUserId) {
      try {
        const notificationId = id.replace('notification_', '');
        const { default: NotificationService } = await import('../../services/notificationService');
        await NotificationService.markAsRead(currentUserId, notificationId);
      } catch (error) {
        console.error('Failed to mark notification as read in Supabase:', error);
      }
    }
  };
  const handleClaimEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isClaimed: true } : e));
    // Add rewards logic here
  };
  const handleDeleteEmail = async (id: string) => {
    // 更新本地状态
    setEmails(prev => {
      const updated = prev.filter(e => e.id !== id);
      
      // 更新未读计数
      const unreadCount = updated.filter(e => !e.isRead).length;
      setUnreadEmailCount(unreadCount);
      
      // 异步处理删除逻辑
      (async () => {
        // 如果是通知，从 Supabase 删除
        if (id.startsWith('notification_') && currentUserId) {
          try {
            const notificationId = id.replace('notification_', '');
            const { default: NotificationService } = await import('../../services/notificationService');
            await NotificationService.deleteNotification(currentUserId, notificationId);
          } catch (error) {
            console.error('Failed to delete notification from Supabase:', error);
          }
        } else {
          // 如果是普通邮件，从本地存储删除
          if (currentUserId) {
            try {
              const { saveEmails } = await import('../utils/storageUtils');
              saveEmails(currentUserId, updated);
            } catch (error) {
              console.error('Failed to delete email from local storage:', error);
            }
          }
        }
      })();
      
      return updated;
    });
  };

  const renderScreen = () => {
    switch (gameState) {
      case GameState.MENU:
        return (
          <MenuScreen 
            userProfile={userProfile}
            stats={stats}
            stories={stories}
            agentRank={agentRank}
            userEmail={userEmail}
            isSupabaseConfigured={true}
            onOpenProfile={handleOpenProfile}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onStartAdventure={handleStartAdventure}
            onNewStory={handleNewStory}
            onOpenCharacters={handleOpenCharacters}
            onOpenShop={handleOpenShop}
            onOpenHandbook={handleOpenHandbook}
            onOpenHistory={handleOpenHistory}
            onOpenInventory={handleOpenInventory}
            onOpenSettings={handleOpenSettings}
            onOpenCreatorMode={handleOpenCreatorMode}
            onResumeStory={handleResumeStory}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenFriends={handleOpenFriends}
            onOpenEmail={handleOpenEmail}
            onOpenAnnouncements={handleOpenAnnouncements}
            unreadEmailCount={unreadEmailCount}
            unreadAnnouncementCount={unreadAnnouncementCount}
          />
        );
      case GameState.STORY_SELECT:
        return (
          <StorySelectScreen 
            storyOptions={storyOptions}
            isRefreshing={isRefreshing}
            onSelectStory={(id) => { setCurrentStoryId(id); setGameState(GameState.GENERATING); }}
            onRefresh={() => {}} // TODO
            onBack={handleBackToMenu}
          />
        );
      case GameState.GENERATING:
        return <div className="loading-screen">生成游戏中...</div>;
      case GameState.EXPLORING:
        return (
          <GameGrid 
            grid={grid}
            player={player}
            theme={theme}
            assets={assets}
            onMove={movePlayer}
          />
        );
      case GameState.COMBAT:
        return (
          <CombatScreen 
            player={player}
            enemy={currentEnemy}
            hero={heroes.find(h => h.id === activeHeroId) || heroes[0]}
            theme={theme}
            assets={assets}
            onWin={(hp, mp) => {
              // TODO: Update player stats
              setGameState(GameState.VICTORY);
            }}
            onLose={() => setGameState(GameState.GAME_OVER)}
          />
        );
      case GameState.GAME_OVER:
        return <div className="game-over-screen">游戏结束</div>;
      case GameState.VICTORY:
        return <div className="victory-screen">胜利！</div>;
      case GameState.SHOP:
        return (
          <ShopScreen 
            stats={stats}
            summonInput={summonInput}
            setSummonInput={setSummonInput}
            isSummoning={isSummoning}
            lastSummonedHero={lastSummonedHero}
            setLastSummonedHero={() => {}} // TODO: Add handler
            handleSummonHero={() => {}} // TODO: Add handler
            onBack={handleBackToMenu}
          />
        );
      case GameState.CHARACTERS:
        return (
          <CharacterScreen 
            heroes={heroes}
            activeHeroId={activeHeroId}
            setActiveHeroId={setActiveHeroId}
            onDeleteHero={handleDeleteHero}
            onBack={handleBackToMenu}
          />
        );
      case GameState.HANDBOOK:
        return <HandbookScreen onBack={handleBackToMenu} />;
      case GameState.HISTORY_VIEW:
        return (
          <HistoryScreen 
            stories={stories}
            history={history}
            onBack={handleBackToMenu}
          />
        );
      case GameState.CREATOR_MODE:
        return (
          <CreatorModeScreen 
            stats={stats}
            setStats={setStats}
            onBack={handleBackToMenu}
            onAddAnnouncement={handleAddAnnouncement}
            announcements={announcements}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onSendNotification={handleSendNotification}
          />
        );
      case GameState.DISCUSSION:
        return (
          <DiscussionScreen 
            hero={heroes.find(h => h.id === activeHeroId) || heroes[0]}
            theme={theme}
            aiConfig={aiConfig}
            onComplete={() => setGameState(GameState.EXPLORING)}
          />
        );
      case GameState.LUCK:
        return (
          <LuckScreen 
            onComplete={(effect) => {
              // TODO: apply effect
              setGameState(GameState.EXPLORING);
            }}
          />
        );
      case GameState.LEADERBOARD:
        return (
          <LeaderboardScreen 
            entries={leaderboardData}
            isLoading={isLeaderboardLoading}
            currentUserId={currentUserId}
            sortBy={leaderboardSortBy}
            onToggleSort={() => setLeaderboardSortBy(prev => prev === 'level' ? 'registerTime' : 'level')}
            onBack={handleBackToMenu}
            onAddFriend={handleAddFriend}
          />
        );
      case GameState.FRIENDS:
        return (
          <FriendsScreen 
            friends={friends}
            pendingRequests={pendingRequests}
            onBack={handleBackToMenu}
            onOpenChat={(friend) => {
              setCurrentChatFriend(friend);
              setGameState(GameState.CHAT);
            }}
            onAcceptRequest={handleAcceptFriendRequest}
            onRejectRequest={handleRejectFriendRequest}
            onRemoveFriend={handleRemoveFriend}
          />
        );
      case GameState.CHAT:
        return (
          <ChatScreen 
            friend={currentChatFriend}
            messages={chatMessages}
            currentUserId={currentUserId}
            onBack={handleBackToMenu}
            onSendMessage={handleSendMessage}
          />
        );
      case GameState.EMAIL:
        return (
          <EmailScreen 
            emails={emails}
            onBack={handleBackToMenu}
            onReadEmail={handleReadEmail}
            onClaimEmail={handleClaimEmail}
            onDeleteEmail={handleDeleteEmail}
          />
        );
      default:
        return (
          <MenuScreen 
            userProfile={userProfile}
            stats={stats}
            stories={stories}
            agentRank={agentRank}
            userEmail={userEmail}
            isSupabaseConfigured={true}
            onOpenProfile={handleOpenProfile}
            onOpenAuth={handleOpenAuth}
            onLogout={handleLogout}
            onStartAdventure={handleStartAdventure}
            onNewStory={handleNewStory}
            onOpenCharacters={handleOpenCharacters}
            onOpenShop={handleOpenShop}
            onOpenHandbook={handleOpenHandbook}
            onOpenHistory={handleOpenHistory}
            onOpenInventory={handleOpenInventory}
            onOpenSettings={handleOpenSettings}
            onOpenCreatorMode={handleOpenCreatorMode}
            onResumeStory={handleResumeStory}
            onOpenLeaderboard={handleOpenLeaderboard}
            onOpenFriends={handleOpenFriends}
            onOpenEmail={handleOpenEmail}
            onOpenAnnouncements={handleOpenAnnouncements}
            unreadEmailCount={unreadEmailCount}
            unreadAnnouncementCount={unreadAnnouncementCount}
          />
        );
    }
  };

  return (
    <div className="app-content w-full min-h-screen flex flex-col items-center justify-center px-4">
      {/* 同步状态指示器 */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-slate-700 backdrop-blur-sm pointer-events-none">
        <div className={`w-2.5 h-2.5 rounded-full ${
          syncStatus === 'saved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
          syncStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
          syncStatus === 'error' ? 'bg-red-500' :
          'bg-slate-500'
        }`} />
        <span className="text-xs font-medium text-slate-300">
          {syncStatus === 'saved' ? '已同步' :
           syncStatus === 'saving' ? '同步中...' :
           syncStatus === 'error' ? '同步失败' :
           '离线模式'}
        </span>
      </div>

      {/* 公告栏 */}
      {isAnnouncementVisible && (
        <AnnouncementBar 
          announcements={announcements} 
          isVisible={isAnnouncementVisible}
          onClose={handleCloseAnnouncements}
          onMarkAsRead={handleMarkAnnouncementAsRead}
          onMarkAllAsRead={handleMarkAllAnnouncementsAsRead}
        />
      )}

      {/* 主要游戏屏幕 */}
      {renderScreen()}

      {/* 模态框 */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          onSave={handleSaveConfig} 
          useAiImages={useAiImages}
          setUseAiImages={setUseAiImages}
          aiConfig={aiConfig}
          setAiConfig={setAiConfig}
          onReset={handleHardReset}
          onLogout={handleLogout}
        />
      )}
      {showInventory && (
        <InventoryModal 
          onClose={() => setShowInventory(false)} 
          inventory={[]} // TODO: Implement inventory
          onUse={() => {}} // TODO: Implement use item
        />
      )}
      {showPasswordModal && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)} 
          onSuccess={() => {
            setShowPasswordModal(false);
            setGameState(GameState.CREATOR_MODE);
          }}
        />
      )}
      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          userProfile={userProfile}
          aiConfig={aiConfig}
          onSave={setUserProfile}
          checkApiKey={async () => aiConfig.apiKey || null}
        />
      )}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={() => setShowAuthModal(false)}
        />
      )}
      {showNotificationModal && (
        <NotificationModal 
          title={notificationData.title}
          message={notificationData.message}
          type={notificationData.type}
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onAccept={() => {}}
          onReject={() => {}}
        />
      )}

      {/* 底部提示 */}
      {toasts.map(toast => (
        <ToastNotification 
          key={toast.id} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

export default AppContent;