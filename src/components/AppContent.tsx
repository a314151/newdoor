import React from 'react';
import { useGame } from '../context/GameContext';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { useUserManagement } from '../hooks/useUserManagement';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameState, AIProvider } from '../../types';

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
    unreadEmailCount, unreadAnnouncementCount,
    currentChatFriend, setCurrentChatFriend, chatMessages, setChatMessages,
    emails, setEmails,
    friends, pendingRequests, leaderboardData, isLeaderboardLoading, leaderboardSortBy, setLeaderboardSortBy,
    summonInput, setSummonInput, isSummoning, lastSummonedHero
  } = useUI();

  const { handleLogout, handleHardReset, handleSaveConfig } = useUserManagement();
  const { handleGainXp, addToInventory, movePlayer, handleAttack } = useGameLogic();

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
  const handleOpenCreatorMode = () => setGameState(GameState.CREATOR_MODE);
  const handleOpenLeaderboard = () => setGameState(GameState.LEADERBOARD);
  const handleOpenFriends = () => setGameState(GameState.FRIENDS);
  const handleOpenEmail = () => setGameState(GameState.EMAIL);
  const handleOpenAnnouncements = () => setIsAnnouncementVisible(true);
  const handleResumeStory = (story: any) => setGameState(GameState.EXPLORING);
  const handleDeleteHero = (id: string) => {
    setHeroes(prevHeroes => prevHeroes.filter(hero => hero.id !== id));
  };
  const handleBackToMenu = () => setGameState(GameState.MENU);

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
            onAcceptRequest={() => {}} // TODO
            onRejectRequest={() => {}} // TODO
            onRemoveFriend={() => {}} // TODO
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
    <div className="app-content">
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
          onSuccess={() => setShowPasswordModal(false)}
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