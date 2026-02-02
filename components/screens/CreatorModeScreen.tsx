
import React, { useState } from 'react';
import Header from '../ui/Header';
import { PlayerStats, EmailContentType, ItemType } from '../../types';
import { calculateMaxStats } from '../../services/gameLogic';

interface CreatorModeScreenProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onBack: () => void;
  onSendNotification?: (data: {
    subject: string;
    content: string;
    attachments: Array<{
      type: EmailContentType;
      itemType?: ItemType;
      amount?: number;
      level?: number;
      xp?: number;
      stones?: number;
    }>;
    sendToAll: boolean;
    specificUserId?: string;
  }) => void;
}

const CreatorModeScreen: React.FC<CreatorModeScreenProps> = ({ stats, setStats, onBack, onSendNotification }) => {
  const maxStats = calculateMaxStats(stats.level);
  
  // 发送通知的状态
  const [notificationSubject, setNotificationSubject] = useState('');
  const [notificationContent, setNotificationContent] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [specificUserId, setSpecificUserId] = useState('');
  
  // 附件状态
  const [attachments, setAttachments] = useState<Array<{
    type: EmailContentType;
    itemType?: ItemType;
    amount?: number;
    level?: number;
    xp?: number;
    stones?: number;
  }>>([]);
  
  const [newAttachmentType, setNewAttachmentType] = useState<EmailContentType>(EmailContentType.TEXT);
  const [newAttachmentAmount, setNewAttachmentAmount] = useState(1);
  const [newAttachmentItemType, setNewAttachmentItemType] = useState<ItemType>(ItemType.XP_SMALL);
  
  const addAttachment = () => {
    const newAttachment: any = {
      type: newAttachmentType
    };
    
    switch (newAttachmentType) {
      case EmailContentType.ITEM:
        newAttachment.itemType = newAttachmentItemType;
        newAttachment.amount = newAttachmentAmount;
        break;
      case EmailContentType.LEVEL:
        newAttachment.level = newAttachmentAmount;
        break;
      case EmailContentType.XP:
        newAttachment.xp = newAttachmentAmount;
        break;
      case EmailContentType.STONES:
        newAttachment.stones = newAttachmentAmount;
        break;
    }
    
    setAttachments([...attachments, newAttachment]);
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const handleSendNotification = () => {
    if (!onSendNotification) return;
    
    if (!notificationSubject || !notificationContent) {
      alert('请填写邮件主题和内容');
      return;
    }
    
    onSendNotification({
      subject: notificationSubject,
      content: notificationContent,
      attachments,
      sendToAll,
      specificUserId: sendToAll ? undefined : specificUserId
    });
    
    // 重置表单
    setNotificationSubject('');
    setNotificationContent('');
    setAttachments([]);
    setSendToAll(true);
    setSpecificUserId('');
  };

  const handleChange = (field: keyof PlayerStats, value: number) => {
    setStats(prev => ({ ...prev, [field]: value }));
  };

  const handleFullHeal = () => {
    const newMax = calculateMaxStats(stats.level);
    setStats(prev => ({
        ...prev,
        savedHp: newMax.maxHp,
        savedMp: newMax.maxMp
    }));
    alert("已恢复至当前等级的最大状态！");
  };

  return (
    <div className="z-20 w-full max-w-lg p-6 bg-slate-900 border-2 border-green-500 rounded-lg shadow-2xl animate-fade-in">
      <Header title="创作者模式 (DEBUG)" onBack={onBack} className="text-green-500" />
      
      <div className="space-y-6">
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">基础属性修改</h3>
            
            <div className="grid gap-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">等级 (Level) - 影响血量/蓝量上限</label>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="number" 
                            className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white"
                            value={stats.level}
                            onChange={(e) => handleChange('level', parseInt(e.target.value) || 1)}
                        />
                        <div className="text-xs text-slate-500 w-24">
                            HP: {maxStats.maxHp}<br/>MP: {maxStats.maxMp}
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-400 mb-1">基础攻击力 (Base ATK)</label>
                    <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={stats.baseAtk}
                        onChange={(e) => handleChange('baseAtk', parseInt(e.target.value) || 0)}
                    />
                </div>
            </div>
        </div>

        <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">资源修改</h3>
            <div>
                <label className="block text-xs text-slate-400 mb-1">召唤石 (Summon Stones)</label>
                <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                    value={stats.summonStones}
                    onChange={(e) => handleChange('summonStones', parseInt(e.target.value) || 0)}
                />
            </div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
                onClick={handleFullHeal}
                className="w-full py-3 bg-green-900/50 hover:bg-green-800 border border-green-600 rounded text-green-100 font-bold"
            >
                💉 一键满状态 (回血回蓝)
            </button>
            <p className="text-[10px] text-slate-500 text-center">修改等级后，请点击“一键满状态”以应用新的血量上限到当前血量。</p>
        </div>
        
        {/* 发送通知功能 */}
        <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h3 className="text-green-400 font-bold mb-4 border-b border-slate-600 pb-2">发送系统通知</h3>
            
            <div className="space-y-4">
                {/* 邮件主题 */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">邮件主题</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={notificationSubject}
                        onChange={(e) => setNotificationSubject(e.target.value)}
                        placeholder="请输入邮件主题"
                    />
                </div>
                
                {/* 邮件内容 */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">邮件内容</label>
                    <textarea 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white h-32"
                        value={notificationContent}
                        onChange={(e) => setNotificationContent(e.target.value)}
                        placeholder="请输入邮件内容"
                    />
                </div>
                
                {/* 发送对象 */}
                <div>
                    <label className="block text-xs text-slate-400 mb-2">发送对象</label>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                checked={sendToAll}
                                onChange={() => setSendToAll(true)}
                            />
                            <label className="text-xs text-slate-300">所有用户</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="radio" 
                                checked={!sendToAll}
                                onChange={() => setSendToAll(false)}
                            />
                            <label className="text-xs text-slate-300">指定用户</label>
                        </div>
                    </div>
                    {!sendToAll && (
                        <input 
                            type="text" 
                            className="mt-2 w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                            value={specificUserId}
                            onChange={(e) => setSpecificUserId(e.target.value)}
                            placeholder="请输入用户ID"
                        />
                    )}
                </div>
                
                {/* 附件管理 */}
                <div>
                    <label className="block text-xs text-slate-400 mb-2">附件管理</label>
                    
                    {/* 添加附件 */}
                    <div className="bg-slate-900 p-3 rounded border border-slate-700 mb-3">
                        <div className="flex gap-2 mb-2">
                            <select 
                                className="flex-1 bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs"
                                value={newAttachmentType}
                                onChange={(e) => setNewAttachmentType(e.target.value as EmailContentType)}
                            >
                                <option value={EmailContentType.TEXT}>文本</option>
                                <option value={EmailContentType.ITEM}>物品</option>
                                <option value={EmailContentType.LEVEL}>等级</option>
                                <option value={EmailContentType.XP}>经验</option>
                                <option value={EmailContentType.STONES}>召唤石</option>
                            </select>
                            
                            {newAttachmentType === EmailContentType.ITEM && (
                                <select 
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs"
                                    value={newAttachmentItemType}
                                    onChange={(e) => setNewAttachmentItemType(e.target.value as ItemType)}
                                >
                                    <option value={ItemType.XP_SMALL}>经验书 (小)</option>
                                    <option value={ItemType.XP_LARGE}>经验书 (大)</option>
                                    <option value={ItemType.HP_POTION}>治疗药水</option>
                                    <option value={ItemType.MP_POTION}>法力药水</option>
                                    <option value={ItemType.OMNI_KEY}>万能钥匙</option>
                                </select>
                            )}
                            
                            <input 
                                type="number" 
                                className="w-20 bg-slate-800 border border-slate-600 rounded p-1 text-white text-xs"
                                value={newAttachmentAmount}
                                onChange={(e) => setNewAttachmentAmount(parseInt(e.target.value) || 1)}
                                min="1"
                            />
                            
                            <button 
                                onClick={addAttachment}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold"
                            >
                                添加
                            </button>
                        </div>
                    </div>
                    
                    {/* 已添加的附件 */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                                    <span className="text-xs text-slate-300">
                                        {attachment.type === EmailContentType.ITEM && `物品: ${attachment.itemType} x${attachment.amount}`}
                                        {attachment.type === EmailContentType.LEVEL && `等级提升: +${attachment.level}`}
                                        {attachment.type === EmailContentType.XP && `经验: +${attachment.xp}`}
                                        {attachment.type === EmailContentType.STONES && `召唤石: +${attachment.stones}`}
                                        {attachment.type === EmailContentType.TEXT && `文本`}
                                    </span>
                                    <button 
                                        onClick={() => removeAttachment(index)}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* 发送按钮 */}
                <button 
                    onClick={handleSendNotification}
                    disabled={!notificationSubject || !notificationContent || !onSendNotification}
                    className="w-full py-3 bg-blue-900/50 hover:bg-blue-800 border border-blue-600 rounded text-blue-100 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    📧 发送通知
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorModeScreen;
