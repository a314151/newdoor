import React, { useState } from 'react';
import { Item } from '../../types';

interface InventoryModalProps {
  inventory: Item[];
  onUse: (item: Item) => void;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onUse, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-600 p-4 rounded-lg w-full max-w-md shadow-2xl relative">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className="font-bold text-yellow-500 pixel-font">背包物品</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-4 max-h-[50vh] overflow-y-auto">
              {inventory.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedItem(item)} 
                    className={`aspect-square rounded bg-slate-800 border-2 flex flex-col items-center justify-center relative transition-all ${selectedItem === item ? 'border-yellow-400 bg-slate-700' : 'border-slate-700 hover:bg-slate-700'}`}
                  >
                      <span className="text-2xl mb-1">{item.type.includes('POTION') ? '🧪' : item.type.includes('XP') ? '📜' : '🔑'}</span>
                      <span className="absolute bottom-0 right-0 bg-black/60 text-[10px] px-1 rounded-tl">{item.count}</span>
                  </button>
              ))}
              {[...Array(Math.max(0, 16 - inventory.length))].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded bg-slate-800/30 border border-slate-800/50"></div>
              ))}
          </div>
          
          {selectedItem ? (
            <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-4 flex justify-between items-center animate-fade-in">
              <div>
                <h4 className="font-bold text-sm">{selectedItem.name}</h4>
                <p className="text-xs text-slate-400">{selectedItem.description}</p>
              </div>
              <button 
                onClick={() => { onUse(selectedItem); setSelectedItem(null); }} 
                className="bg-green-700 hover:bg-green-600 text-xs px-4 py-2 rounded font-bold"
              >
                使用
              </button>
            </div>
          ) : (
             <div className="h-14 bg-slate-800/30 rounded border border-slate-800/50 mb-4 flex items-center justify-center text-xs text-slate-500">
                选择一个物品查看详情
             </div>
          )}
      </div>
    </div>
  );
};

export default InventoryModal;