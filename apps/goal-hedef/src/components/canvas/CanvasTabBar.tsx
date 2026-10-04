import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Edit2, 
  Check, 
  Layers, 
  ChevronDown,
  Layout,
  FileText
} from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const CanvasTabBar: React.FC = () => {
  const tabs = useGoalStore((s) => s.tabs);
  const activeTabId = useGoalStore((s) => s.activeTabId);
  const addTab = useGoalStore((s) => s.addTab);
  const switchTab = useGoalStore((s) => s.switchTab);
  const closeTab = useGoalStore((s) => s.closeTab);
  const renameTab = useGoalStore((s) => s.renameTab);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const [isOpen, setIsOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(id);
    setEditingTitle(currentTitle);
  };

  const handleFinishRename = (id: string) => {
    if (editingTitle.trim()) {
      renameTab(id, editingTitle.trim());
    }
    setEditingTabId(null);
  };

  return (
    <div className="relative select-none">
      {/* Kompakt Neo-Brutalist Aktif Tuval Seçici (Temiz, taşma yapmayan modern buton) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl transition-all shadow-[2px_2px_0px_0px_#000] sm:shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 ${
            isOpen 
              ? 'bg-black text-white' 
              : 'bg-white hover:bg-[#FFE600] text-black'
          }`}
          title="Tüm Tuvalleri Görüntüle ve Yönet"
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-[#FFE600] text-black border border-black flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-[1px_1px_0px_0px_#000] shrink-0">
            <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
          </div>
          <span className="text-[11px] sm:text-xs font-black uppercase max-w-[65px] xs:max-w-[100px] sm:max-w-[150px] truncate">
            {activeTab?.title || 'Tuval'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 bg-[#F5F0E6] text-black border border-black rounded-md">
            {tabs.length}
          </span>
          <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Hızlı Yeni Tuval Açma Butonu */}
        <button
          onClick={() => addTab()}
          className="hidden xs:flex items-center justify-center p-1 sm:px-2.5 sm:py-1.5 bg-[#00C2CB] hover:bg-[#FFE600] text-black border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] sm:shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
          title="Yeni Boş Tuval Aç"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden md:inline ml-1">YENİ TUVAL</span>
        </button>
      </div>

      {/* Şık Neo-Brutalist Tuval Yönetim Menüsü / Stack Listesi */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]" 
            onClick={() => {
              setIsOpen(false);
              setEditingTabId(null);
            }} 
          />
          <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* Üst Başlık Bilgisi */}
            <div className="flex items-center justify-between pb-1.5 border-b-2 border-black/10 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5" />
                TUVALLER ({tabs.length})
              </span>
              <button
                onClick={() => addTab()}
                className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-[#FFE600] border border-black rounded-md shadow-[1px_1px_0px_0px_#000] hover:bg-black hover:text-white transition-colors"
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
                YENİ EKLE
              </button>
            </div>

            {/* Dikey Temiz Tuval Kartları (Scroll edilebilir, taşma yapmaz) */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
              {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const isEditing = editingTabId === tab.id;

                return (
                  <div
                    key={tab.id}
                    onClick={() => {
                      if (!isEditing) {
                        switchTab(tab.id);
                        setIsOpen(false);
                      }
                    }}
                    className={`group flex items-center justify-between p-2 rounded-xl border-2 border-black cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#FFE600] text-black shadow-[2.5px_2.5px_0px_0px_#000] translate-x-0.5' 
                        : 'bg-stone-50 hover:bg-white hover:shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[11px] font-black text-stone-400 w-4 shrink-0">
                        #{index + 1}
                      </span>
                      <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      
                      {isEditing ? (
                        <div 
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(tab.id);
                              if (e.key === 'Escape') setEditingTabId(null);
                            }}
                            autoFocus
                            className="bg-white border-2 border-black rounded px-2 py-0.5 text-xs font-black uppercase outline-none w-full"
                          />
                          <button
                            onClick={() => handleFinishRename(tab.id)}
                            className="p-1 bg-black text-white rounded hover:bg-stone-800"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-black uppercase truncate flex-1">
                          {tab.title}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Aktif Etiketi */}
                        {isActive && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-black text-white rounded">
                            AKTİF
                          </span>
                        )}

                        {/* Düzenle Butonu */}
                        <button
                          onClick={(e) => handleStartRename(tab.id, tab.title, e)}
                          className="p-1 hover:bg-black/10 rounded transition-colors text-stone-600 hover:text-black"
                          title="İsmi Düzenle"
                        >
                          <Edit2 className="w-3 h-3 stroke-[2.5]" />
                        </button>

                        {/* Kapat Butonu */}
                        {tabs.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirmDialog({
                                title: 'TUVALLİ KAPAT',
                                message: `"${tab.title}" tuvalini kapatmak istediğinize emin misiniz? Kaydedilmemiş değişiklikler silinebilir.`,
                                confirmLabel: 'EVET, KAPAT',
                                cancelLabel: 'VAZGEÇ',
                                onConfirm: () => closeTab(tab.id)
                              });
                            }}
                            className="p-1 hover:bg-rose-500 hover:text-white rounded transition-colors text-stone-500"
                            title="Tuvali Kapat"
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};


