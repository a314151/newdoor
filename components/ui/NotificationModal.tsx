import React from 'react';

interface NotificationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'friend_request';
  data?: any;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  title,
  message,
  type,
  data,
  onClose,
  onAccept,
  onReject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md p-6 bg-slate-900 border-2 border-yellow-600 rounded-lg animate-fade-in shadow-2xl">
        <h2 className="text-xl font-bold text-center text-yellow-500 mb-4">
          {title}
        </h2>
        
        <div className="text-center text-slate-300 mb-6">
          {message}
        </div>
        
        <div className="flex gap-3 justify-center">
          {type === 'friend_request' && (
            <>
              <button
                onClick={() => {
                  onAccept?.();
                  onClose();
                }}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded transition-colors"
              >
                接受
              </button>
              <button
                onClick={() => {
                  onReject?.();
                  onClose();
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors"
              >
                拒绝
              </button>
            </>
          )}
          
          {type !== 'friend_request' && (
            <button
              onClick={onClose}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded transition-colors"
            >
              确定
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;