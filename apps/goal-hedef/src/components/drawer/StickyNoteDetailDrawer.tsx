import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Palette, 
  Pin, 
  FileText, 
  Tag
} from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { triggerSmallCelebration } from '../../utils/confetti';

interface StickyNoteDetailDrawerProps {
  nodeId: string;
}

const STICKY_PALETTES = [
  { bg: '#FFE600', name: 'Güneş Sarısı' },
  { bg: '#FF3399', name: 'Canlı Pembe' },
  { bg: '#00C2CB', name: 'Siber Teal' },
  { bg: '#22C55E', name: 'Neon Yeşil' },
  { bg: '#FF6B35', name: 'Sıcak Turuncu' },
  { bg: '#C084FC', name: 'Pastel Mor' },
  { bg: '#FFFFFF', name: 'Saf Beyaz' },
];

export const StickyNoteDetailDrawer: React.FC<StickyNoteDetailDrawerProps> = ({ nodeId }) => {
  const nodes = useGoalStore((s) => s.nodes);
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const togglePinGoal = useGoalStore((s) => s.togglePinGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const [copied, setCopied] = useState(false);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const data = node.data;
  const currentColor = data.stickyColor || '#FFE600';

  const handleCopyText = () => {
    navigator.clipboard.writeText(data.stickyText || '');
    setCopied(true);
    triggerSmallCelebration();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] max-w-full bg-[#F5F0E6] border-l-4 border-black shadow-[8px_0px_0px_0px_#000] z-50 flex flex-col transition-transform duration-200 animate-in slide-in-from-right select-none">
      {/* Drawer Header */}
      <div 
        style={{ backgroundColor: currentColor }} 
        className="p-4 border-b-4 border-black flex items-center justify-between text-black transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
            <Sparkles className="w-5 h-5 stroke-[3]" />
          </span>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block">
              NOT // POST-IT DETAY KARTI
            </span>
            <span className="text-[10px] font-bold opacity-80">
              HIZLI FİKİRLER, STİCKER VE KARALAMA NOTU
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => togglePinGoal(nodeId)}
            className={`p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
              data.pinned ? 'bg-black text-white' : 'bg-white text-black'
            }`}
            title={data.pinned ? 'Sabitlemeyi Kaldır' : 'Panoya Sabitle'}
          >
            <Pin className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={() => {
              openConfirmDialog({
                title: 'NOTU SİL',
                message: 'Bu notu silmek istediğinize emin misiniz?',
                confirmLabel: 'EVET, NOTU SİL',
                cancelLabel: 'VAZGEÇ',
                onConfirm: () => {
                  deleteGoal(nodeId);
                }
              });
            }}
            className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-rose-600 hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            title="Notu Sil"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            onClick={() => selectGoal(null)}
            className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            title="Kapat"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Ana Gövde */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Not Başlığı */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase block text-black">NOT BAŞLIĞI / ETİKETİ</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => updateGoal(nodeId, { title: e.target.value.toUpperCase() })}
            placeholder="NOT BAŞLIĞI..."
            className="w-full text-base font-black uppercase bg-white border-3 border-black rounded-xl p-3 outline-none text-black shadow-[3px_3px_0px_0px_#000]"
          />
        </div>

        {/* Renk Seçici Paleti */}
        <div className="p-4 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-2.5">
          <span className="text-xs font-black uppercase flex items-center gap-1.5">
            <Palette className="w-4 h-4 stroke-[2.5]" />
            POST-IT RENGİ SEÇ
          </span>
          <div className="grid grid-cols-7 gap-2">
            {STICKY_PALETTES.map((color) => (
              <button
                key={color.bg}
                onClick={() => updateGoal(nodeId, { stickyColor: color.bg })}
                style={{ backgroundColor: color.bg }}
                className={`h-9 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-transform flex items-center justify-center ${
                  currentColor === color.bg ? 'scale-110 ring-2 ring-black font-black' : 'hover:scale-105'
                }`}
                title={color.name}
              >
                {currentColor === color.bg && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Ana Not Metni Düzenleme Alanı */}
        <div className="p-4 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4 stroke-[2.5]" />
              NOT İÇERİĞİ
            </span>
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1 bg-[#F5F0E6] hover:bg-[#FFE600] border border-black rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3 stroke-[2.5]" />}
              {copied ? 'KOPYALANDI' : 'METNİ KOPYALA'}
            </button>
          </div>

          <div 
            style={{ backgroundColor: currentColor }} 
            className="p-4 border-2 border-black rounded-xl shadow-inner transition-colors"
          >
            <textarea
              value={data.stickyText || ''}
              onChange={(e) => updateGoal(nodeId, { stickyText: e.target.value })}
              placeholder="Notunuzu buraya yazın..."
              rows={8}
              className="w-full bg-transparent resize-none border-none outline-none font-handwriting text-2xl font-bold leading-relaxed placeholder-black/40 text-black focus:ring-0"
            />
          </div>
          <span className="text-[10px] font-bold text-stone-500 uppercase block">
            İpucu: Tuval üzerinde el yazısı formatında görüntülenir.
          </span>
        </div>

        {/* Hızlı Not Şablonları */}
        <div className="p-4 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-2.5">
          <span className="text-xs font-black uppercase flex items-center gap-1.5">
            <Tag className="w-4 h-4 stroke-[2.5]" />
            HIZLI NOT ŞABLONLARI
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'MOTİVASYON', text: 'LET\'S GO! "Büyük hedefler, küçük günlük adımların toplamıdır."' },
              { label: 'PARLAK FİKİR', text: 'FİKİR: \n- Problem: \n- Çözüm: \n- İlk Adım: ' },
              { label: 'HATIRLATICI', text: 'ÖNEMLİ: \nUnutma, yarın saat 10:00\'da ekip toplantısı var!' },
              { label: 'HAFTALIK ODAK', text: 'BU HAFTANIN ODAĞI: \n1. Hedef tuvalini tamamla\n2. 3 gün antrenman yap' },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => updateGoal(nodeId, { stickyText: tmpl.text })}
                className="p-2 bg-[#F5F0E6] hover:bg-[#FFE600] border-2 border-black rounded-xl text-left text-xs font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
