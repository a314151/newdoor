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
  friends, pendingRequests, onBack, onOpenChat, onAcceptRequest, onRejectRequest, onRemoveFriend
}) => {
  return (
    <div className="z-40 relative flex flex-col items-center w-full max-w-md px-4 animate-fade-in h-full overflow-y-auto pb-10">
      <div className="w-full flex justify-start pt-4"><BackButton onBack={onBack} label="返回游戏" /></div>

      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 pixel-font my-6">
        好友社交
      </h1>

      {/* 待处理申请区域 */}
      {pendingRequests.length > 0 && (
        <div className="w-full mb-6">
          <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-3 text-left px-2">待处理申请 ({pendingRequests.length})</h2>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-slate-800/80 border border-yellow-500/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <img src={req.avatarUrl} className="w-10 h-10 rounded-full border-2 border-yellow-500/50" alt="" />
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">{req.username}</div>
                    <div className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAcceptRequest(req.id)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs font-bold transition-all">接受</button>
                  <button onClick={() => onRejectRequest(req.id)} className="px-3 py-1 bg-slate-700 hover:bg-red-600 text-white rounded-md text-xs font-bold transition-all">拒绝</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 好友列表区域 */}
      <div className="w-full">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 text-left px-2">我的好友</h2>
        {friends.length === 0 ? (
          <div className="bg-slate-800/30 rounded-2xl py-12 border border-dashed border-slate-700">
            <p className="text-slate-500 text-sm">还没有好友，快去排行榜结交志同道合的人吧！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group"
                onClick={() => onOpenChat(friend)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={friend.avatarUrl} className="w-12 h-12 rounded-full border-2 border-slate-700 group-hover:border-blue-400 transition-all" alt="" />
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${friend.isOnline ? 'bg-green-500' : 'bg-slate-500'}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white flex items-center gap-2">
                      {friend.username}
                      {friend.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-bounce">{friend.unreadCount}</span>}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {friend.isOnline ? <span className="text-green-400">正在探险</span> : `上次出现: ${new Date(friend.lastActive).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveFriend(friend.id); }}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  title="删除好友"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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