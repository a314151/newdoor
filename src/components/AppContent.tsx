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
    toasts, removeToast, 
    announcements, setAnnouncements, isAnnouncementVisible, setIsAnnouncementVisible,
    showSettings, setShowSettings, 
    showInventory, setShowInventory, 
    showPasswordModal, setShowPasswordModal, 
    showAuthModal, setShowAuthModal, 
    showProfileModal, setShowProfileModal, 
    showNotificationModal, setShowNotificationModal, notificationData,
    unreadEmailCount, setUnreadEmailCount, unreadAnnouncementCount,
    currentChatFriend, setCurrentChatFriend, chatMessages, setChatMessages,
    emails, setEmails,
    friends, setFriends, pendingRequests, setPendingRequests, leaderboardData, setLeaderboardData, isLeaderboardLoading, leaderboardSortBy, setLeaderboardSortBy,
    summonInput, setSummonInput, isSummoning, lastSummonedHero,
    notifications, setNotifications, unreadNotificationCount, setUnreadNotificationCount
  } = useUI();

  const { handleLogout, handleHardReset, handleSaveConfig } = useUserManagement();
  const { handleGainXp, addToInventory, movePlayer, handleAttack } = useGameLogic();

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

  // 加载邮件数据
  React.useEffect(() => {
    if (gameState === GameState.EMAIL && currentUserId) {
      const loadEmails = async () => {
        try {
          const { loadEmails } = await import('../utils/storageUtils');
          const emailsData = loadEmails(currentUserId);
          setEmails(emailsData);
          setUnreadEmailCount(emailsData.filter((e: any) => !e.isRead).length);
        } catch (error) {
          console.error('Failed to load emails:', error);
        }
      };
      loadEmails();
    }
  }, [gameState, currentUserId, setEmails, setUnreadEmailCount]);

  // 加载通知数据
  React.useEffect(() => {
    if (currentUserId) {
      const loadNotifications = async () => {
        try {
          const NotificationService = (await import('../../services/notificationService')).default;
          const notifications = await NotificationService.getNotifications(currentUserId);
          setNotifications(notifications);
          setUnreadNotificationCount(notifications.filter(n => !n.read).length);
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };
      loadNotifications();
    }
  }, [currentUserId, setNotifications, setUnreadNotificationCount]);

  // 订阅通知变化
  React.useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe: () => void;

    const setupSubscription = async () => {
      const { default: NotificationService } = await import('../../services/notificationService');
      unsubscribe = NotificationService.subscribeToNotifications(currentUserId, (notifications) => {
        setNotifications(notifications);
        setUnreadNotificationCount(notifications.filter(n => !n.read).length);
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId, setNotifications, setUnreadNotificationCount]);

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

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
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
  const handleMarkAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };
  const handleMarkAllAnnouncementsAsRead = () => {
    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
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
  const handleReadEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
  };
  const handleClaimEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isClaimed: true } : e));
    // Add rewards logic here
  };
  const handleDeleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const renderScreen = () => {
    switch (gameState) {
      case GameState.MENU:
        return (
          <MenuScreen 
            userProfile={userProfile}
            stats={stats}
            stories={[]}
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
            stories={[]} // TODO
            history={[]} // TODO
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
            stories={[]}
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