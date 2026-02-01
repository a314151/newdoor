import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';

interface ToastNotificationProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  let bgColor = 'bg-slate-800';
  let textColor = 'text-white';
  let icon = 'ℹ️';

  if (toast.type === 'loot') {
    bgColor = 'bg-yellow-900/90';
    textColor = 'text-yellow-100';
    icon = '🎁';
  } else if (toast.type === 'error') {
    bgColor = 'bg-red-900/90';
    textColor = 'text-red-100';
    icon = '⚠️';
  }

  return (
    <div className={`${bgColor} ${textColor} px-4 py-2 rounded shadow-lg border border-white/10 flex items-center gap-2 animate-bounce-in`}>
      <span>{icon}</span>
      <span className="text-sm font-bold">{toast.message}</span>
    </div>
  );
};

export default ToastNotification;