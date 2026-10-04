import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen, Star, Plus, Minus, Trash2 } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const BookNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const book = data.book || {
    author: 'Yazar Belirtilmedi',
    totalPages: 300,
    readPages: 0,
    rating: 5,
    readingStatus: 'reading'
  };

  const cardBg = data.cardColor || '#FED7AA'; // Pastel Somon
  const progressPercent = book.totalPages > 0 
    ? Math.min(100, Math.round((book.readPages / book.totalPages) * 100)) 
    : 0;

  const handlePageChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPages = Math.max(0, Math.min(book.totalPages, book.readPages + delta));
    const newStatus = newPages >= book.totalPages ? 'finished' : 'reading';

    updateGoal(id, {
      progress: Math.round((newPages / book.totalPages) * 100),
      status: newStatus === 'finished' ? 'completed' : 'in_progress',
      book: {
        ...book,
        readPages: newPages,
        readingStatus: newStatus
      }
    });
  };

  return (
    <div
      onClick={() => selectGoal(id)}
      style={{ backgroundColor: cardBg }}
      className={`relative w-80 rounded-2xl border-3 border-black transition-all duration-150 select-none cursor-pointer overflow-hidden ${
        selected 
          ? 'shadow-[8px_8px_0px_0px_#000] -translate-x-1 -translate-y-1' 
          : 'shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />

      {/* Kapak Görseli */}
      {data.coverImage && (
        <div className="w-full h-28 border-b-3 border-black overflow-hidden relative">
          <img src={data.coverImage} alt={data.title} className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 bg-white border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
            KİTAP KAPAK
          </div>
        </div>
      )}

      {/* Üst Çubuk */}
      <div className="p-3 border-b-3 border-black bg-white flex items-center justify-between">
        <span className="inline-flex items-center gap-1 bg-[#00C2CB] text-black px-2 py-0.5 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
          <BookOpen className="w-3 h-3 stroke-[2.5]" />
          KİTAP & OKUMA
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog({
                title: 'KİTABI SİL',
                message: `"${data.title || 'Bu kitabı'}" silmek istediğinize emin misiniz?`,
                confirmLabel: 'EVET, SİL',
                cancelLabel: 'VAZGEÇ',
                onConfirm: () => deleteGoal(id)
              });
            }}
            className="p-1 border border-black rounded-md bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Kitabı Sil"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
          </button>

          <span className="inline-flex items-center gap-0.5 text-xs font-black bg-[#FFE600] border-2 border-black rounded-md px-1.5 py-0.2">
            <Star className="w-3 h-3 fill-black text-black" />
            {book.rating || 5}.0
          </span>
        </div>
      </div>

      {/* Gövde */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-black text-black uppercase leading-tight">
            {data.title}
          </h3>
          <p className="text-xs font-bold text-stone-700 mt-0.5">
            {book.author}
          </p>
        </div>

        {/* İlerleme ve Sayfa Sayacı */}
        <div className="bg-white border-2 border-black rounded-xl p-3 space-y-2 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex justify-between items-center text-xs font-black uppercase">
            <span>OKUNAN SAYFA</span>
            <span>{book.readPages} / {book.totalPages} sf (%{progressPercent})</span>
          </div>

          <div className="h-3.5 w-full bg-[#F5F0E6] border-2 border-black rounded-md p-0.5">
            <div
              className="h-full bg-[#FFE600] border-r-2 border-black rounded-sm transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Hızlı Sayfa Ekle / Çıkar (+10 sf, -10 sf) */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-black uppercase text-stone-600">Hızlı Güncelle:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => handlePageChange(-10, e)}
                className="px-2 py-0.5 bg-white hover:bg-stone-200 border-2 border-black rounded-md text-[10px] font-black shadow-[1px_1px_0px_0px_#000]"
                title="-10 Sayfa"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => handlePageChange(10, e)}
                className="px-2 py-0.5 bg-[#22C55E] hover:bg-[#1eb054] border-2 border-black rounded-md text-[10px] font-black shadow-[1px_1px_0px_0px_#000]"
                title="+10 Sayfa"
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

BookNode.displayName = 'BookNode';
