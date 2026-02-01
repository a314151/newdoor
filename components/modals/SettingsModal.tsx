
import React from 'react';
import { AIConfig, AIProvider } from '../../types';

interface SettingsModalProps {
  useAiImages: boolean;
  setUseAiImages: (val: boolean) => void;
  aiConfig: AIConfig;
  setAiConfig: (config: AIConfig) => void;
  onSave: (provider: AIProvider, key: string, baseUrl?: string, model?: string) => void;
  onReset: (e: React.MouseEvent) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  useAiImages, setUseAiImages, aiConfig, setAiConfig, onSave, onReset, onClose 
}) => {
  
  // Helper to handle saving
  const handleSave = () => {
    onSave(aiConfig.provider, aiConfig.apiKey, aiConfig.baseUrl, aiConfig.model);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-slate-900 border-2 border-slate-700 p-6 rounded-lg max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-purple-400 pixel-font">设置</h2>
          
          <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-800 rounded border border-slate-600 hover:bg-slate-750">
                <input type="checkbox" checked={useAiImages} onChange={(e) => setUseAiImages(e.target.checked)} className="w-5 h-5 accent-purple-500" /> 
                <span>启用 AI 图像生成</span>
              </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">AI 模型提供商</label>
            <select 
              className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500" 
              value={aiConfig.provider} 
              onChange={(e) => setAiConfig({...aiConfig, provider: e.target.value as AIProvider})}
            >
              <option value={AIProvider.DEEPSEEK}>DeepSeek (推荐)</option>
              <option value={AIProvider.GEMINI}>Google Gemini</option>
              <option value={AIProvider.ZHIPU}>智谱 AI</option>
            </select>
          </div>
          
          {aiConfig.provider !== AIProvider.GEMINI && (
            <>
                <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-2">API Key</label>
                    <input 
                        type="password" 
                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500" 
                        placeholder="sk-..." 
                        value={aiConfig.apiKey} 
                        onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})} 
                    />
                </div>

                {/* DeepSeek Specific Settings */}
                {aiConfig.provider === AIProvider.DEEPSEEK && (
                    <div className="mb-4">
                        <label className="block text-sm text-slate-400 mb-2">运行模式</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500"
                            value={aiConfig.model || 'deepseek-chat'}
                            onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                        >
                            <option value="deepseek-chat">极速模式 (deepseek-chat) - 推荐</option>
                            <option value="deepseek-reasoner">深度思考 (deepseek-reasoner) - 较慢</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">极速模式更适合游戏生成，且速度快；深度思考模式会先输出思维链。</p>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">API Base URL (选填)</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white outline-none focus:border-purple-500 text-sm" 
                        placeholder="https://api.deepseek.com" 
                        value={aiConfig.baseUrl || ''} 
                        onChange={(e) => setAiConfig({...aiConfig, baseUrl: e.target.value})} 
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                        留空则默认使用官方地址。如果遇到网络错误/CORS，请填入代理地址。<br/>
                        系统会自动补全 <code className="bg-black/30 px-1 rounded">/chat/completions</code>。
                    </p>
                </div>
            </>
          )}
          
          <div className="mb-6 border-t border-slate-700 pt-4">
            <button onClick={onReset} className="w-full py-2 bg-red-900/20 border border-red-800 text-red-400 rounded text-xs font-bold hover:bg-red-900/40">
              ⚠️ 重置所有游戏数据
            </button>
          </div>
          
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">取消</button>
            <button onClick={handleSave} className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-500">
              保存
            </button>
          </div>
       </div>
    </div>
  );
};

export default SettingsModal;
