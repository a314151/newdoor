import React, { useState } from 'react';
import { Email } from '../../types';
import BackButton from '../ui/BackButton';

interface EmailScreenProps {
  emails: Email[];
  onBack: () => void;
  onReadEmail: (emailId: string) => void;
  onClaimEmail: (emailId: string) => void;
  onDeleteEmail: (emailId: string) => void;
}

const EmailScreen: React.FC<EmailScreenProps> = ({ 
  emails, 
  onBack, 
  onReadEmail, 
  onClaimEmail,
  onDeleteEmail
}) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const handleEmailClick = (email: Email) => {
    if (!email.isRead) {
      onReadEmail(email.id);
    }
    setSelectedEmail(email);
  };

  const handleClaim = (email: Email) => {
    onClaimEmail(email.id);
    setSelectedEmail(prev => prev?.id === email.id ? { ...prev, isClaimed: true } : prev);
  };

  const unreadCount = emails.filter(email => !email.isRead).length;

  return (
    <div className="z-40 relative text-center flex flex-col items-center w-full max-w-md px-4 animate-fade-in">
      <BackButton onBack={onBack} label="返回" />
      
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 pixel-font mt-8 mb-6">
        系统通知
      </h1>
      
      {unreadCount > 0 && (
        <div className="w-full mb-4 p-2 bg-blue-900/30 border border-blue-700 rounded text-blue-300 text-sm">
          您有 {unreadCount} 封未读邮件
        </div>
      )}
      
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-400">邮件列表</h2>
          <span className="text-sm text-slate-400">共 {emails.length} 封</span>
        </div>
        
        {emails.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="mb-2">暂无邮件</p>
            <p className="text-sm">系统通知会显示在这里</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {emails.map((email) => (
              <div 
                key={email.id} 
                className={`
                  flex justify-between items-center p-3 rounded border cursor-pointer
                  ${email.isRead ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-900/30 border-blue-700'}
                  ${selectedEmail?.id === email.id ? 'ring-2 ring-blue-500' : ''}
                `}
                onClick={() => handleEmailClick(email)}
              >
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm truncate">
                    {email.subject}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {new Date(email.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!email.isClaimed && email.attachments.length > 0 && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      未领取
                    </span>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEmail(email.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedEmail && (
        <div className="w-full mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg text-left">
          <h3 className="text-lg font-bold text-white mb-2">{selectedEmail.subject}</h3>
          <p className="text-xs text-slate-400 mb-4">
            {selectedEmail.sender || '系统'} · {new Date(selectedEmail.timestamp).toLocaleString()}
          </p>
          <p className="text-sm text-slate-300 mb-4">{selectedEmail.content}</p>
          
          {selectedEmail.attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-yellow-400 mb-2">附件：</h4>
              <div className="space-y-2">
                {selectedEmail.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                    <span className="text-sm">
                      {attachment.type === 'item' && `物品: ${attachment.itemType}`}
                      {attachment.type === 'level' && `等级提升: +${attachment.level}`}
                      {attachment.type === 'xp' && `经验: +${attachment.xp}`}
                      {attachment.type === 'stones' && `召唤石: +${attachment.stones}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!selectedEmail.isClaimed && selectedEmail.attachments.length > 0 && (
            <button 
              onClick={() => handleClaim(selectedEmail)}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition-colors"
            >
              领取奖励
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailScreen;