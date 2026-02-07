
import React, { useState } from 'react';

interface PasswordModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (password === "lry123321" || password === "creator123") {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border-2 border-slate-600 p-6 rounded-lg w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button 
            onClick={onClose} 
            className="absolute top-2 right-3 text-slate-500 hover:text-white"
        >
            ✕
        </button>
        <h3 className="text-xl font-bold mb-4 text-center text-slate-200 pixel-font">身份验证</h3>
        <p className="text-xs text-slate-400 mb-4 text-center">请输入创作者访问代码以进入调试模式。</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="password" 
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="访问代码"
            className={`w-full bg-black border-2 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-green-500'} rounded p-3 text-white text-center outline-none transition-colors font-mono tracking-widest`}
          />
          
          {error && (
            <div className="text-red-500 text-xs text-center font-bold animate-pulse">
                ⛔ 访问拒绝：代码无效
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full py-3 bg-slate-700 hover:bg-green-700 rounded font-bold text-white border border-slate-500 hover:border-green-400 transition-all shadow-lg active:scale-95"
          >
            确认进入
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
