import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';

interface ToastNotificationProps {
  message: string;
  type: ToastMessage['type'];
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let bgColor = 'bg-slate-800';
  let textColor = 'text-white';
  let icon = 'ℹ️';

  if (type === 'loot') {
    bgColor = 'bg-yellow-900/90';
    textColor = 'text-yellow-100';
    icon = '🎁';
  } else if (type === 'error') {
    bgColor = 'bg-red-900/90';
    textColor = 'text-red-100';
    icon = '⚠️';
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm items-center">
      <div className={`${bgColor} ${textColor} px-4 py-2 rounded shadow-lg border border-white/10 flex items-center gap-2 animate-bounce-in`}>
        <span>{icon}</span>
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

export default ToastNotification;