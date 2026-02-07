import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToastMessage, Email, Friend, FriendRequest, ChatMessage, LeaderboardEntry, Announcement } from '../../types';

interface UIContextType {
  toasts: ToastMessage[];
  addToast: (msg: string, type: 'info' | 'loot' | 'error') => void;
  removeToast: (id: string) => void;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  showInventory: boolean;
  setShowInventory: React.Dispatch<React.SetStateAction<boolean>>;
  showPasswordModal: boolean;
  setShowPasswordModal: React.Dispatch<React.SetStateAction<boolean>>;
  showQuitModal: boolean;
  setShowQuitModal: React.Dispatch<React.SetStateAction<boolean>>;
  showAuthModal: boolean;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  showProfileModal: boolean;
  setShowProfileModal: React.Dispatch<React.SetStateAction<boolean>>;
  showNotificationModal: boolean;
  setShowNotificationModal: React.Dispatch<React.SetStateAction<boolean>>;
  notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'friend_request';
    data: any;
  };
  setNotificationData: React.Dispatch<React.SetStateAction<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'friend_request';
    data: any;
  }>>;
  isAnnouncementVisible: boolean;
  setIsAnnouncementVisible: React.Dispatch<React.SetStateAction<boolean>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  emails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  unreadEmailCount: number;
  setUnreadEmailCount: React.Dispatch<React.SetStateAction<number>>;
  unreadAnnouncementCount: number;
  setUnreadAnnouncementCount: React.Dispatch<React.SetStateAction<number>>;
  friends: Friend[];
  setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
  pendingRequests: FriendRequest[];
  setPendingRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
  currentChatFriend: Friend | null;
  setCurrentChatFriend: React.Dispatch<React.SetStateAction<Friend | null>>;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  leaderboardData: LeaderboardEntry[];
  setLeaderboardData: React.Dispatch<React.SetStateAction<LeaderboardEntry[]>>;
  isLeaderboardLoading: boolean;
  setIsLeaderboardLoading: React.Dispatch<React.SetStateAction<boolean>>;
  leaderboardSortBy: 'registerTime' | 'level';
  setLeaderboardSortBy: React.Dispatch<React.SetStateAction<'registerTime' | 'level'>>;
  summonInput: string;
  setSummonInput: React.Dispatch<React.SetStateAction<string>>;
  isSummoning: boolean;
  setIsSummoning: React.Dispatch<React.SetStateAction<boolean>>;
  lastSummonedHero: any | null;
  setLastSummonedHero: React.Dispatch<React.SetStateAction<any | null>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'friend_request',
    data: {}
  });
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [currentChatFriend, setCurrentChatFriend] = useState<Friend | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<'registerTime' | 'level'>('registerTime');
  const [summonInput, setSummonInput] = useState("");
  const [isSummoning, setIsSummoning] = useState(false);
  const [lastSummonedHero, setLastSummonedHero] = useState<any | null>(null);

  const addToast = (msg: string, type: 'info' | 'loot' | 'error' = 'info') => {
    setToasts(prevToasts => {
      const existingToast = prevToasts.find(toast => toast.message === msg && toast.type === type);
      if (existingToast) {
        return prevToasts;
      }
      const id = Date.now().toString() + Math.random();
      return [...prevToasts, { id, message: msg, type }];
    });
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const value = {
    toasts,
    addToast,
    removeToast,
    showSettings,
    setShowSettings,
    showInventory,
    setShowInventory,
    showPasswordModal,
    setShowPasswordModal,
    showQuitModal,
    setShowQuitModal,
    showAuthModal,
    setShowAuthModal,
    showProfileModal,
    setShowProfileModal,
    showNotificationModal,
    setShowNotificationModal,
    notificationData,
    setNotificationData,
    isAnnouncementVisible,
    setIsAnnouncementVisible,
    announcements,
    setAnnouncements,
    emails,
    setEmails,
    unreadEmailCount,
    setUnreadEmailCount,
    unreadAnnouncementCount,
    setUnreadAnnouncementCount,
    friends,
    setFriends,
    pendingRequests,
    setPendingRequests,
    currentChatFriend,
    setCurrentChatFriend,
    chatMessages,
    setChatMessages,
    leaderboardData,
    setLeaderboardData,
    isLeaderboardLoading,
    setIsLeaderboardLoading,
    leaderboardSortBy,
    setLeaderboardSortBy,
    summonInput,
    setSummonInput,
    isSummoning,
    setIsSummoning,
    lastSummonedHero,
    setLastSummonedHero
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};