import React from 'react';
import { Announcement } from '../../types';

interface AnnouncementBarProps {
  announcements: Announcement[];
  isVisible: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  announcements,
  isVisible,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  if (!isVisible) {
    return null;
  }

  // 检查是否有未读公告
  const hasUnread = announcements.some(announcement => !announcement.isRead);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-600 rounded-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">公告详情</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {announcements.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            暂无公告
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <div 
                key={announcement.id} 
                className={`p-4 rounded border ${announcement.isRead ? 'border-slate-700 bg-slate-800' : 'border-yellow-700 bg-yellow-900/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white">{announcement.title}</h3>
                  {!announcement.isRead && (
                    <button 
                      onClick={() => onMarkAsRead(announcement.id)}
                      className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded hover:bg-blue-700"
                    >
                      标记已读
                    </button>
                  )}
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  {announcement.content}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(announcement.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {announcements.length > 0 && hasUnread && (
          <div className="mt-4 text-center">
            <button 
              onClick={onMarkAllAsRead}
              className="text-sm bg-blue-800 text-blue-200 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              标记所有已读
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;