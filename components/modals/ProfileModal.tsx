
import React, { useState } from 'react';
import { UserProfile, AIConfig } from '../../types';
import { generateImage } from '../../services/aiService';

interface ProfileModalProps {
  userProfile: UserProfile;
  aiConfig: AIConfig;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  checkApiKey: () => Promise<string | null>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, aiConfig, onSave, onClose, checkApiKey }) => {
  const [name, setName] = useState(userProfile.username);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState(userProfile.title);

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    
    const key = await checkApiKey();
    if (!key) return;

    setIsGenerating(true);
    try {
        const configWithKey = { ...aiConfig, apiKey: key };
        // Force pixel art style for consistency
        const url = await generateImage(configWithKey, `${avatarPrompt}, pixel art character portrait, face close up`, true);
        setAvatarUrl(url);
    } catch (e) {
        alert("生成失败，请重试");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
        alert("请输入昵称");
        return;
    }
    onSave({ username: name, avatarUrl, title });
    onClose();
  };

  const getRandomAvatar = () => {
      // Use DiceBear for free, instant avatars if they don't want to use AI tokens
      const seed = Math.random().toString(36).substring(7);
      setAvatarUrl(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-blue-500 rounded-lg w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-slate-500 hover:text-white">✕</button>
        
        <h3 className="text-xl font-bold mb-6 text-center text-blue-400 pixel-font">特工档案</h3>

        <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 overflow-hidden bg-black mb-4 relative group">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover pixelated" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">预览</span>
                </div>
            </div>
            
            <div className="flex gap-2 w-full">
                <input 
                    type="text" 
                    placeholder="输入外观描述 (如: 赛博忍者)"
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    className="flex-1 bg-black border border-slate-600 rounded px-2 text-sm"
                />
                <button 
                    onClick={handleGenerateAvatar}
                    disabled={isGenerating}
                    className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs font-bold disabled:opacity-50"
                >
                    {isGenerating ? "生成中..." : "AI生成"}
                </button>
            </div>
            <button 
                onClick={getRandomAvatar}
                className="text-[10px] text-slate-500 mt-2 underline hover:text-slate-300"
            >
                不想等待？随机生成一个
            </button>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-xs text-slate-400 block mb-1">代号 (昵称)</label>
                <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={12}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-slate-400 block mb-1">头衔 (自动获得)</label>
                <input 
                    type="text"
                    value={title}
                    disabled
                    className="w-full bg-slate-900/50 border border-slate-800 rounded p-2 text-slate-500 cursor-not-allowed"
                />
            </div>
        </div>

        <button 
            onClick={handleSave}
            className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold text-white shadow-lg transition-transform active:scale-95"
        >
            保存档案
        </button>

      </div>
    </div>
  );
};

export default ProfileModal;
