
import React, { useState, useEffect, useRef } from 'react';
import { Hero, ThemeConfig, AIConfig } from '../../types';
import { generateDialogue } from '../../services/aiService';

interface DiscussionScreenProps {
  hero: Hero;
  theme: ThemeConfig;
  aiConfig: AIConfig;
  onComplete: () => void;
  onFail?: () => void; // Optional if we want a "fail" state for bad talks
}

const DiscussionScreen: React.FC<DiscussionScreenProps> = ({ hero, theme, aiConfig, onComplete, onFail }) => {
  const [messages, setMessages] = useState<{role: 'monster' | 'player', content: string}[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    handleNextTurn();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNextTurn = async (playerResponse?: string) => {
    setIsLoading(true);
    setOptions([]);
    
    // Add player message if exists
    let newHistory = [...messages];
    if (playerResponse) {
        newHistory.push({ role: 'player', content: playerResponse });
        setMessages(newHistory);
    }

    try {
        // Construct history for AI (convert to simple format)
        const aiHistory = newHistory.map(m => ({ role: m.role, content: m.content }));
        
        const response = await generateDialogue(aiConfig, hero, theme, aiHistory, round);
        
        setMessages(prev => [...prev, { role: 'monster', content: response.monsterText }]);
        
        if (response.isFinished || round >= 8) {
            // End conversation
            setTimeout(onComplete, 3000); // Give time to read before closing
        } else {
            setOptions(response.options);
            setRound(r => r + 1);
        }
    } catch (e) {
        setMessages(prev => [...prev, { role: 'monster', content: "（对方似乎陷入了沉思，无法回应...）" }]);
        setTimeout(onComplete, 2000);
    } finally {
        setIsLoading(false);
        setCustomInput("");
        setShowInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg h-[80vh] flex flex-col bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900/30 p-4 border-b border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-3xl">💬</span>
                <div>
                    <h3 className="text-blue-300 font-bold pixel-font">初心试炼</h3>
                    <p className="text-[10px] text-slate-400">Round {round}/8</p>
                </div>
            </div>
            <button onClick={onComplete} className="text-slate-500 hover:text-white text-xs">跳过</button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
             {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                         msg.role === 'player' 
                            ? 'bg-blue-900/50 text-blue-100 border border-blue-700 rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 border border-slate-600 rounded-bl-none'
                     }`}>
                         {msg.role === 'monster' && <div className="text-[10px] text-purple-400 mb-1 font-bold">???</div>}
                         {msg.content}
                     </div>
                 </div>
             ))}
             
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 rounded-bl-none flex gap-1">
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                     </div>
                 </div>
             )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
            {!isLoading && messages.length > 0 && round <= 8 && (
                <div className="flex flex-col gap-2">
                    {options.map((opt, i) => (
                        <button 
                            key={i}
                            onClick={() => handleNextTurn(opt)}
                            className="w-full p-3 text-left bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 rounded transition-all text-sm text-slate-200"
                        >
                            {i + 1}. {opt}
                        </button>
                    ))}
                    
                    {/* Custom Input Toggle */}
                    {!showInput ? (
                        <button 
                            onClick={() => setShowInput(true)} 
                            className="text-xs text-center text-slate-500 hover:text-blue-400 mt-2 underline"
                        >
                            我有些心里话想说... (自定义输入)
                        </button>
                    ) : (
                        <div className="flex gap-2 mt-2">
                            <input 
                                type="text" 
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="输入你的回答..."
                                className="flex-1 bg-black border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && customInput && handleNextTurn(customInput)}
                            />
                            <button 
                                onClick={() => customInput && handleNextTurn(customInput)}
                                className="bg-blue-700 px-4 rounded text-white font-bold hover:bg-blue-600"
                            >
                                发送
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {round > 8 && !isLoading && (
                 <div className="text-center text-slate-500 text-sm">对话结束...</div>
            )}
        </div>

      </div>
    </div>
  );
};

export default DiscussionScreen;
