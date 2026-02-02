import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Friend } from '../../types';
import BackButton from '../ui/BackButton';

interface ChatScreenProps {
  friend: Friend | null;
  messages: ChatMessage[];
  currentUserId: string | null;
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  friend,
  messages,
  currentUserId,
  onBack,
  onSendMessage
}) => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageInput.trim() && friend) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!friend) {
    return (
      <div className="z-40 relative text-center flex flex-col items-center w-full max-w-md px-4 animate-fade-in">
        <BackButton onBack={onBack} label="返回" />
        <div className="text-center py-20 text-slate-400">
          <p>未选择聊天对象</p>
        </div>
      </div>
    );
  }

  return (
    <div className="z-40 relative flex flex-col items-center w-full max-w-md px-4 h-screen animate-fade-in">
      {/* Header */}
      <div className="w-full flex items-center justify-between p-4">
        <BackButton onBack={onBack} label="返回" />
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={friend.avatarUrl} 
              alt={friend.username} 
              className="w-10 h-10 rounded-full border-2 border-slate-600"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
              friend.isOnline ? 'bg-green-400' : 'bg-slate-500'
            }`} />
          </div>
          <div className="text-left">
            <div className="font-bold text-white">{friend.username}</div>
            <div className="text-xs text-slate-400">
              {friend.isOnline ? '在线' : `最后在线: ${new Date(friend.lastActive).toLocaleString()}`}
            </div>
          </div>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Messages */}
      <div className="flex-1 w-full p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p>暂无消息</p>
            <p className="text-sm mt-1">开始聊天吧！</p>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.senderId === currentUserId;
            return (
              <div 
                key={message.id} 
                className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-2 rounded-lg ${isSent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                    {message.content}
                  </div>
                  <div className={`text-xs ${isSent ? 'text-slate-400 text-right' : 'text-slate-400 text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="w-full p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
            disabled={!messageInput.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;