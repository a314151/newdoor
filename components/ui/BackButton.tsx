
import React from 'react';

interface BackButtonProps {
  onBack: () => void;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onBack, label = "返回" }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onBack();
      }}
      className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-5 py-3 bg-slate-800/95 border-2 border-slate-500 rounded-xl shadow-2xl hover:bg-slate-700 hover:border-white active:scale-90 transition-all touch-manipulation cursor-pointer group select-none"
      style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}
    >
      <span className="text-xl group-hover:-translate-x-1 transition-transform">↩</span>
      <span className="font-bold text-base text-slate-200 group-hover:text-white">{label}</span>
    </button>
  );
};

export default BackButton;
