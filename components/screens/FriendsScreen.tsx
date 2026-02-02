import React from 'react';
import { Friend, FriendRequest } from '../../types';
import BackButton from '../ui/BackButton';

interface FriendsScreenProps {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onBack: () => void;
  onOpenChat: (friend: Friend) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({
  friends,
  pendingRequests,
  onBack,
  onOpenChat,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend
}) => {
  return (
    <div className="z-40 relative text-center flex flex-col items-center w-full max-w-md px-4 animate-fade-in">
      <BackButton onBack={onBack} label="返回" />
      
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 pixel-font mt-8 mb-8">
        好友系统
      </h1>
      
      {/* 待处理请求 */}
      {pendingRequests.length > 0 && (
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
            <span className="mr-2">📋</span> 待处理请求
            <span className="ml-2 text-sm bg-yellow-400 text-black px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={request.avatarUrl} 
                    alt={request.username} 
                    className="w-10 h-10 rounded-full border-2 border-slate-600"
                  />
                  <div className="text-left">
                    <div className="font-bold text-white">{request.username}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onAcceptRequest(request.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold transition-colors"
                  >
                    接受
                  </button>
                  <button 
                    onClick={() => onRejectRequest(request.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-bold transition-colors"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 好友列表 */}
      <div className="w-full">
        <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
          <span className="mr-2">👥</span> 好友列表
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="mb-2">暂无好友</p>
            <p className="text-sm">在排行榜中添加好友吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div 
                key={friend.id} 
                className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => onOpenChat(friend)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={friend.avatarUrl} 
                      alt={friend.username} 
                      className="w-12 h-12 rounded-full border-2 border-slate-600"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                      friend.isOnline ? 'bg-green-400' : 'bg-slate-500'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white flex items-center">
                      {friend.username}
                      {friend.unreadCount > 0 && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {friend.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {friend.isOnline ? '在线' : `最后在线: ${new Date(friend.lastActive).toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFriend(friend.id);
                  }}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsScreen;