import React, { useState } from 'react';
import { 
  Inbox, 
  X, 
  Plus, 
  ArrowRight, 
  Trash2, 
  Target
} from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { InboxItem } from '../../types/goal';
import { triggerSmallCelebration } from '../../utils/confetti';

interface UniversalInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UniversalInboxDrawer: React.FC<UniversalInboxDrawerProps> = ({ isOpen, onClose }) => {
  const addGoal = useGoalStore((s) => s.addGoal);
  const [inputText, setInputText] = useState('');
  
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([
    { id: 'in-1', text: 'Mobil arayüz prototipi için renk paletini araştır', category: 'idea', createdAt: 'Bugün 14:20' },
    { id: 'in-2', text: 'Kişisel gelişim için haftada 3 gün kitap okuma hedefi', category: 'task', createdAt: 'Bugün 12:05' },
    { id: 'in-3', text: 'İngilizce konuşma pratiği - Her gün 20 dk', category: 'task', createdAt: 'Dün 18:30' }
  ]);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      text: inputText.trim(),
      category: 'idea',
      createdAt: 'Az önce'
    };

    setInboxItems([newItem, ...inboxItems]);
    setInputText('');
    triggerSmallCelebration();
  };

  const handleConvertToGoal = (item: InboxItem) => {
    // Tuvale anında gerçek hedef kartı olarak ekle
    addGoal({
      title: item.text,
      description: 'Gelen Kutusundan aktarıldı.',
      category: 'personal',
      status: 'not_started',
      progress: 0
    });

    // Inbox'tan çıkar
    setInboxItems(inboxItems.filter(i => i.id !== item.id));
    triggerSmallCelebration();
  };

  const handleDelete = (id: string) => {
    setInboxItems(inboxItems.filter(i => i.id !== id));
  };

  return (
    <div className="fixed inset-y-0 left-0 w-[440px] max-w-full bg-[#F5F0E6] border-r-4 border-black shadow-[8px_0px_0px_0px_#000] z-50 flex flex-col transition-transform duration-200 animate-in slide-in-from-left select-none">
      {/* Üst Bar */}
      <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#FFE600] text-black">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-lg">
            <Inbox className="w-5 h-5 stroke-[3]" />
          </span>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block">
              GELEN KUTUSU // HIZLI YAKALAMA
            </span>
            <span className="text-[10px] font-bold opacity-80">
              AKLA GELEN HEDEF VE FİKİRLERİ TOPLA
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* Hızlı Ekleme Formu */}
      <div className="p-4 bg-white border-b-3 border-black space-y-3">
        <form onSubmit={handleAddItem} className="space-y-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Aklınıza gelen hedef veya fikri yazın..."
            className="w-full bg-[#F5F0E6] border-2 border-black rounded-xl p-3 text-xs font-bold outline-none shadow-[2px_2px_0px_0px_#000]"
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-[#FFE600] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              KAYDET
            </button>
          </div>
        </form>
      </div>

      {/* Bekleyen Hedefler Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex justify-between items-center text-xs font-black uppercase text-stone-700 pb-1">
          <span>BEKLEYENLER ({inboxItems.length})</span>
          <span className="text-[10px]">Tuvale Taşımak İçin Butona Basın</span>
        </div>

        {inboxItems.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] space-y-2.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="bg-[#FFE600] px-2 py-0.5 border border-black rounded text-[9px] font-black uppercase flex items-center gap-1">
                <Target className="w-2.5 h-2.5" /> FİKİR / HEDEF
              </span>
              <span className="text-[10px] font-bold text-stone-500">{item.createdAt}</span>
            </div>

            <p className="text-xs font-bold text-black leading-relaxed">
              {item.text}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <button
                onClick={() => handleConvertToGoal(item)}
                className="flex items-center gap-1 px-3 py-1 bg-[#22C55E] hover:bg-emerald-400 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
              >
                <span>HEDEFE DÖNÜŞTÜR</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1 hover:bg-rose-100 text-stone-600 hover:text-rose-600 rounded transition-colors"
                title="Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {inboxItems.length === 0 && (
          <div className="h-40 border-2 border-dashed border-black/30 rounded-xl flex items-center justify-center text-stone-500 text-xs font-bold uppercase italic text-center p-4">
            Gelen kutusu boş! Aklınıza yeni bir hedef geldiğinde hemen kaydedebilirsiniz.
          </div>
        )}
      </div>
    </div>
  );
};
