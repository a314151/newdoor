
import React from 'react';

interface HeaderProps {
  title: string;
  onBack?: () => void; // Made optional
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, className = "" }) => {
  return (
    <div className={`relative z-[40] flex justify-between items-center mb-6 border-b border-slate-700 pb-2 w-full select-none ${className}`}>
      <h2 className="text-xl text-yellow-500 pixel-font truncate pr-12">{title}</h2>
      {onBack && (
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            e.preventDefault();
            onBack(); 
          }} 
          className="relative z-[50] flex-shrink-0 cursor-pointer text-sm text-slate-300 hover:text-white flex items-center gap-2 border border-slate-600 px-4 py-2 rounded bg-slate-800/90 hover:bg-slate-700 active:scale-95 transition-all shadow-lg touch-manipulation"
        >
          <span>↩</span> <span className="font-bold">返回</span>
        </button>
      )}
    </div>
  );
};

export default Header;
