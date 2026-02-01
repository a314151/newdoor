
import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Provider } from '@supabase/supabase-js';

interface AuthModalProps {
  onLoginSuccess: (email: string) => void;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState(''); // 新增状态
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && data.user.email) {
            onLoginSuccess(data.user.email);
            onClose();
        }
      } else {
        // 注册逻辑
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              real_name: realName // 将真实姓名存入 user_metadata
            }
          }
        });
        if (error) throw error;
        setMessage("注册成功！请检查您的邮箱进行验证，或直接登录（如果未开启强制验证）。");
        if (data.user && !data.session) {
             // Verification email sent
        } else if (data.user && data.user.email) {
             // Auto logged in
             onLoginSuccess(data.user.email);
             onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin, // 登录成功后跳回当前页面
        },
      });
      if (error) throw error;
      // OAuth 会触发页面跳转，所以这里不需要手动 onClose
    } catch (err: any) {
      setError(err.message || `无法使用 ${provider} 登录`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border-2 border-blue-500 p-6 rounded-lg w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-3 text-slate-500 hover:text-white">✕</button>
        
        <h3 className="text-xl font-bold mb-6 text-center text-blue-400 pixel-font">
            {isLogin ? '云端链接' : '注册特工'}
        </h3>
        
        {error && <div className="bg-red-900/50 text-red-200 p-2 rounded text-xs mb-4 border border-red-800">{error}</div>}
        {message && <div className="bg-green-900/50 text-green-200 p-2 rounded text-xs mb-4 border border-green-800">{message}</div>}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* 新增：真实姓名输入框 (仅在注册时显示) */}
          {!isLogin && (
            <div className="animate-fade-in">
                <label className="text-xs text-slate-400 block mb-1">姓名 <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    required
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    className="w-full bg-black border border-slate-700 rounded p-3 text-white outline-none focus:border-blue-500"
                    placeholder="您的真实姓名"
                />
                <p className="text-[10px] text-purple-400 mt-1 italic">请输入真实姓名哦，没有其他人能看到，只有我能看到</p>
            </div>
          )}

          <div>
              <label className="text-xs text-slate-400 block mb-1">电子邮箱</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-slate-700 rounded p-3 text-white outline-none focus:border-blue-500"
              />
          </div>
          <div>
              <label className="text-xs text-slate-400 block mb-1">密码</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-slate-700 rounded p-3 text-white outline-none focus:border-blue-500"
              />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded font-bold text-white transition-all shadow-lg mt-2"
          >
            {loading ? '通讯中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        {/* Social Login Section */}
        <div className="mt-6">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">其他方式</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button 
              type="button"
              onClick={() => handleSocialLogin('wechat' as Provider)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 bg-[#07c160]/20 hover:bg-[#07c160]/40 border border-[#07c160] rounded text-[#07c160] transition-colors text-xs font-bold"
            >
              <span>💬</span> 微信登录
            </button>
            <button 
              type="button"
              onClick={() => handleSocialLogin('qq' as Provider)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 bg-[#12B7F5]/20 hover:bg-[#12B7F5]/40 border border-[#12B7F5] rounded text-[#12B7F5] transition-colors text-xs font-bold"
            >
              <span>🐧</span> QQ登录
            </button>
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-2">注意：第三方登录需要后台配置 AppID</p>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
            {isLogin ? "还没有账号？" : "已有账号？"}
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                className="text-blue-400 hover:text-blue-300 ml-2 underline"
            >
                {isLogin ? "立即注册" : "去登录"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
