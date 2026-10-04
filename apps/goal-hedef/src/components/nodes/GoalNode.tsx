import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  PauseCircle, 
  ListTodo, 
  Calendar, 
  TrendingUp,
  Plus,
  Pin,
  Flame,
  Zap,
  Coffee,
  Trash2
} from 'lucide-react';
import { GoalCategory, GoalStatus, GoalPriority } from '../../types/goal';
import { useGoalStore } from '../../store/useGoalStore';

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; bg: string; text: string }> = {
  career: { label: 'KARİYER // İŞ', bg: 'bg-[#00C2CB]', text: 'text-black' },
  health: { label: 'SAĞLIK // SPOR', bg: 'bg-[#22C55E]', text: 'text-black' },
  finance: { label: 'FİNANS // PARA', bg: 'bg-[#FFE600]', text: 'text-black' },
  education: { label: 'EĞİTİM // KİTAP', bg: 'bg-[#A855F7]', text: 'text-white' },
  personal: { label: 'KİŞİSEL GELİŞİM', bg: 'bg-[#FF3399]', text: 'text-white' },
  creative: { label: 'YARATICI PROJE', bg: 'bg-[#FF6B35]', text: 'text-black' },
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; bg: string; icon: React.ReactNode }> = {
  not_started: { label: 'BAŞLAMADI', bg: 'bg-white', icon: <Clock className="w-3.5 h-3.5 stroke-[2.5]" /> },
  in_progress: { label: 'DEVAM EDİYOR', bg: 'bg-[#FFE600]', icon: <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" /> },
  completed: { label: 'TAMAMLANDI', bg: 'bg-[#22C55E]', icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" /> },
  on_hold: { label: 'BEKLEMEDE', bg: 'bg-[#FF6B35]', icon: <PauseCircle className="w-3.5 h-3.5 stroke-[2.5]" /> },
};

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; bg: string; icon: React.ReactNode }> = {
  p1_high: { label: 'P1 // ACİL', bg: 'bg-[#FF6B35] text-white', icon: <Flame className="w-3 h-3 stroke-[2.5]" /> },
  p2_medium: { label: 'P2 // NORMAL', bg: 'bg-[#FFE600] text-black', icon: <Zap className="w-3 h-3 stroke-[2.5]" /> },
  p3_low: { label: 'P3 // DÜŞÜK', bg: 'bg-[#F5F0E6] text-black', icon: <Coffee className="w-3 h-3 stroke-[2.5]" /> },
};

export const GoalNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const addMilestone = useGoalStore((s) => s.addMilestone);
  const togglePinGoal = useGoalStore((s) => s.togglePinGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const categoryConfig = CATEGORY_CONFIG[data.category as GoalCategory] || CATEGORY_CONFIG.career;
  const statusConfig = STATUS_CONFIG[data.status as GoalStatus] || STATUS_CONFIG.not_started;
  const priorityConfig = data.priority ? PRIORITY_CONFIG[data.priority as GoalPriority] : PRIORITY_CONFIG.p2_medium;
  
  const completedTasks = (data.tasks || []).filter((t: any) => t.completed).length;
  const totalTasks = (data.tasks || []).length;
  const cardBg = data.cardColor || '#FFFFFF';

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    addMilestone('Yeni Kilometre Taşı', id);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinGoal(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmDialog({
      title: 'HEDEFİ SİL',
      message: `"${data.title || 'Bu hedefi'}" silmek istediğinize emin misiniz? Hedefe bağlı kilometre taşları ve ilişkiler de etkilenecektir.`,
      confirmLabel: 'EVET, HEDEFİ SİL',
      cancelLabel: 'VAZGEÇ',
      onConfirm: () => deleteGoal(id)
    });
  };

  return (
    <div
      onClick={() => selectGoal(id)}
      style={{ backgroundColor: cardBg }}
      className={`relative w-full h-full min-w-[280px] min-h-[160px] rounded-2xl border-3 border-black transition-all duration-150 select-none group cursor-pointer overflow-hidden ${
        selected 
          ? 'shadow-[8px_8px_0px_0px_#000000] -translate-x-1 -translate-y-1' 
          : 'shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5'
      }`}
    >
      <NodeResizer 
        isVisible={!!selected} 
        minWidth={280} 
        minHeight={160}
        handleClassName="!w-3.5 !h-3.5 !bg-[#FFE600] !border-2 !border-black !rounded-sm hover:!scale-125 !transition-transform"
        lineClassName="!border-black !border-dashed"
      />
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none" />

      {/* Milanote Tarzı Moodboard Kapak Görseli */}
      {data.coverImage && (
        <div className="w-full h-28 border-b-3 border-black overflow-hidden relative">
          <img 
            src={data.coverImage} 
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
            KAPAK GÖRSELİ
          </div>
        </div>
      )}

      {/* Kategori ve Üst Bar */}
      <div className={`p-3 border-b-3 border-black flex items-center justify-between ${categoryConfig.bg} ${categoryConfig.text}`}>
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-black tracking-wider uppercase">
            {categoryConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Silme (Çöp Kutusu) Butonu */}
          <button
            onClick={handleDelete}
            className="p-1 border border-black rounded-lg bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Hedefi Sil"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
          </button>

          {/* Google Keep Sabitleme (Pin) Butonu */}
          <button
            onClick={handlePin}
            className={`p-1 border border-black rounded-lg transition-colors ${
              data.pinned ? 'bg-[#FFE600] shadow-[1px_1px_0px_0px_#000]' : 'bg-white hover:bg-stone-200'
            }`}
            title={data.pinned ? 'Sabitlendi' : 'Panoya Sabitle'}
          >
            <Pin className={`w-3 h-3 stroke-[2.5] ${data.pinned ? 'fill-black' : ''}`} />
          </button>

          {/* Durum Rozeti */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase text-black ${statusConfig.bg} shadow-[2px_2px_0px_0px_#000]`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Kart İçerik Alanı */}
      <div className="p-4 space-y-3">
        {/* Notion Öncelik Rozeti */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black rounded-md text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] ${priorityConfig.bg}`}>
            {priorityConfig.icon}
            {priorityConfig.label}
          </span>

          {data.targetDate && (
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 border-2 border-black text-[10px] font-bold shadow-[2px_2px_0px_0px_#000]">
              <Calendar className="w-3 h-3 stroke-[2.5]" />
              <span>{data.targetDate}</span>
            </div>
          )}
        </div>

        {/* Başlık ve Açıklama */}
        <div>
          <h3 className="text-base font-black text-black leading-snug uppercase tracking-tight">
            {data.title}
          </h3>

          {data.description && (
            <p className="text-xs font-medium text-stone-700 mt-1.5 line-clamp-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>

        {/* İlerleme Çubuğu */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-black uppercase">
            <span>İlerleme Oranı</span>
            <span className="px-1.5 py-0.2 bg-[#FFE600] border-2 border-black text-black text-[11px] font-black shadow-[2px_2px_0px_0px_#000]">
              %{data.progress}
            </span>
          </div>

          <div className="h-4 w-full bg-[#F5F0E6] border-2 border-black p-0.5">
            <div
              className="h-full bg-[#22C55E] border-r-2 border-black transition-all duration-300"
              style={{ width: `${data.progress}%` }}
            />
          </div>
        </div>

        {/* Metrik Kutusu */}
        {data.metric && (
          <div className="flex items-center justify-between p-2 bg-[#F5F0E6] border-2 border-black text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000]">
            <span className="uppercase text-[11px] font-black">HEDEF METRİK:</span>
            <span className="font-black bg-white px-2 py-0.5 border border-black">
              {data.metric.current} / {data.metric.target} {data.metric.unit}
            </span>
          </div>
        )}

        {/* Alt Bilgiler: Görevler */}
        <div className="flex items-center justify-between text-xs font-black text-black pt-1 border-t-2 border-black/10">
          <div className="flex items-center gap-1.5">
            <ListTodo className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{totalTasks > 0 ? `${completedTasks}/${totalTasks} GÖREV` : 'NOTLAR'}</span>
          </div>

          <span className="text-[11px] uppercase tracking-wide opacity-80 group-hover:opacity-100">
            DETAY
          </span>
        </div>
      </div>

      {/* Alt Şerit & Alt Hedef Ekleme Butonu */}
      <div className="px-3 py-2 bg-[#F5F0E6] border-t-3 border-black flex items-center justify-between text-xs font-black">
        <span className="text-[11px] uppercase tracking-wide">
          DETAY NOTLARI
        </span>

        <button
          onClick={handleAddChild}
          className="border-2 border-black bg-[#FFE600] hover:bg-[#00C2CB] px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
          title="Bağlı Kilometre Taşı Ekle"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>AŞAMA</span>
        </button>
      </div>
    </div>
  );
});

GoalNode.displayName = 'GoalNode';
