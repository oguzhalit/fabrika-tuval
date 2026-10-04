import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Flag, 
  Check, 
  Plus, 
  CalendarDays,
  Target,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { GoalStatus, SubTask } from '../../types/goal';
import { triggerSmallCelebration, triggerGoalCelebration } from '../../utils/confetti';

interface MilestoneDetailDrawerProps {
  nodeId: string;
}

export const MilestoneDetailDrawer: React.FC<MilestoneDetailDrawerProps> = ({ nodeId }) => {
  const nodes = useGoalStore((s) => s.nodes);
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);
  const addSubTask = useGoalStore((s) => s.addSubTask);
  const toggleSubTask = useGoalStore((s) => s.toggleSubTask);
  const deleteSubTask = useGoalStore((s) => s.deleteSubTask);

  const [newSubStep, setNewSubStep] = useState('');

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const data = node.data;
  const isCompleted = data.status === 'completed';
  const parentGoal = data.parentId ? nodes.find((n) => n.id === data.parentId) : null;
  const tasks: SubTask[] = data.tasks || [];
  const completedTasksCount = tasks.filter((t) => t.completed).length;

  const handleToggleStatus = () => {
    const nextCompleted = !isCompleted;
    const nextStatus: GoalStatus = nextCompleted ? 'completed' : 'not_started';
    const nextProgress = nextCompleted ? 100 : 0;
    
    updateGoal(nodeId, {
      status: nextStatus,
      progress: nextProgress
    });

    if (nextCompleted) {
      triggerGoalCelebration();
    }
  };

  const handleAddSubStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubStep.trim()) return;
    addSubTask(nodeId, newSubStep.trim());
    setNewSubStep('');
    triggerSmallCelebration();
  };

  const handleSubTaskToggle = (taskId: string) => {
    toggleSubTask(nodeId, taskId);
    // Otomatik ilerleme hesaplama (tüm checklist adımları bitti mi?)
    setTimeout(() => {
      const current = useGoalStore.getState().nodes.find(n => n.id === nodeId);
      if (current && current.data.tasks && current.data.tasks.length > 0) {
        const done = current.data.tasks.filter(t => t.completed).length;
        const total = current.data.tasks.length;
        const calcProgress = Math.round((done / total) * 100);
        updateGoal(nodeId, {
          progress: calcProgress,
          status: calcProgress === 100 ? 'completed' : calcProgress > 0 ? 'in_progress' : 'not_started'
        });
      }
    }, 50);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] max-w-full bg-[#F5F0E6] border-l-4 border-black shadow-[8px_0px_0px_0px_#000] z-50 flex flex-col transition-transform duration-200 animate-in slide-in-from-right select-none">
      {/* Header */}
      <div className={`p-4 border-b-4 border-black flex items-center justify-between ${
        isCompleted ? 'bg-[#22C55E] text-black' : 'bg-[#A855F7] text-white'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
            <Flag className="w-5 h-5 stroke-[3] text-[#A855F7]" />
          </span>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block">
              AŞAMA & KİLOMETRE TAŞI DETAYI
            </span>
            <span className="text-[10px] font-bold opacity-85">
              PROJE ADIMI, TERMİN VE KONTROL LİSTESİ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              openConfirmDialog({
                title: 'AŞAMAYI SİL',
                message: `"${data.title}" aşamasını silmek istediğinize emin misiniz?`,
                confirmLabel: 'EVET, AŞAMAYI SİL',
                cancelLabel: 'VAZGEÇ',
                onConfirm: () => {
                  deleteGoal(nodeId);
                }
              });
            }}
            className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-rose-600 hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            title="Aşamayı Sil"
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
        {/* Bağlı Olduğu Üst Hedef */}
        {parentGoal && (
          <div 
            onClick={() => selectGoal(parentGoal.id)}
            className="p-3 bg-white border-3 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] flex items-center justify-between cursor-pointer hover:bg-[#FFE600] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 stroke-[2.5] text-black" />
              <span className="text-[11px] font-black uppercase text-stone-600">ÜST HEDEF:</span>
              <span className="text-xs font-black uppercase text-black truncate max-w-[240px]">
                {parentGoal.data.title}
              </span>
            </div>
            <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded flex items-center gap-1">
              HEDEFE GİT <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* Aşama Başlığı */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase block text-black">AŞAMA BAŞLIĞI</label>
          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => updateGoal(nodeId, { title: e.target.value.toUpperCase() })}
            placeholder="ÖRN: TASARIM SİSTEMİ FAZ-1..."
            className="w-full text-base font-black uppercase bg-white border-3 border-black rounded-xl p-3 outline-none text-black shadow-[3px_3px_0px_0px_#000]"
          />
        </div>

        {/* Tamamlama Durumu & Aksiyon Butonu */}
        <div className="p-4 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase flex items-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              AŞAMA DURUMU
            </span>
            <span className={`px-2.5 py-0.5 border-2 border-black rounded-md text-xs font-black uppercase ${
              isCompleted ? 'bg-[#22C55E] text-black' : 'bg-[#FFE600] text-black'
            }`}>
              {isCompleted ? 'TAMAMLANDI' : 'DEVAM EDİYOR'}
            </span>
          </div>

          <button
            onClick={handleToggleStatus}
            className={`w-full py-3 px-4 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              isCompleted
                ? 'bg-[#22C55E] text-black'
                : 'bg-white hover:bg-[#A855F7] hover:text-white text-black'
            }`}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>AŞAMA TAMAMLANDI (GERİ ALMAK İÇİN TIKLA)</span>
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 stroke-[2.5]" />
                <span>BU AŞAMAYI TAMAMLA</span>
              </>
            )}
          </button>
        </div>

        {/* Hedef Tarih / Termini (Notion Deadline Alanı) */}
        <div className="p-4 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-2">
          <label className="text-[11px] font-black uppercase flex items-center gap-1.5 text-black">
            <CalendarDays className="w-4 h-4 stroke-[2.5]" />
            HEDEF TERMİN TARİHİ (DEADLINE)
          </label>
          <input
            type="date"
            value={data.targetDate || ''}
            onChange={(e) => updateGoal(nodeId, { targetDate: e.target.value })}
            className="w-full bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 text-xs font-black text-black outline-none focus:bg-white"
          />
        </div>

        {/* Adımlar & Kontrol Listesi (Checklist) */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase flex items-center gap-1.5">
              <Layers className="w-4 h-4 stroke-[2.5]" />
              ALT ADIMLAR & CHECKLIST
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 bg-[#FFE600] border border-black rounded">
              {completedTasksCount}/{tasks.length} TAMAM
            </span>
          </div>

          {/* Yeni Alt Adım Ekle Formu */}
          <form onSubmit={handleAddSubStep} className="flex gap-2">
            <input
              type="text"
              value={newSubStep}
              onChange={(e) => setNewSubStep(e.target.value)}
              placeholder="Yeni alt adım / gereksinim yazın..."
              className="flex-1 bg-[#F5F0E6] border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-black outline-none focus:bg-white"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#FFE600] border-2 border-black rounded-xl text-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              EKLE
            </button>
          </form>

          {/* Adımlar Listesi */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-center py-4 text-xs font-bold text-stone-500 uppercase">
                Henüz alt adım eklenmedi. Yukarıdan ekleyebilirsiniz.
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2.5 border-2 border-black rounded-xl flex items-center justify-between gap-2 transition-all ${
                    task.completed ? 'bg-[#22C55E]/15 border-emerald-600' : 'bg-[#F5F0E6]'
                  }`}
                >
                  <button
                    onClick={() => handleSubTaskToggle(task.id)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    <div className={`w-5 h-5 border-2 border-black rounded flex items-center justify-center transition-colors ${
                      task.completed ? 'bg-[#22C55E] text-black' : 'bg-white'
                    }`}>
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-black ${
                      task.completed ? 'line-through text-stone-500' : 'text-black'
                    }`}>
                      {task.title}
                    </span>
                  </button>

                  <button
                    onClick={() => deleteSubTask(nodeId, task.id)}
                    className="p-1 hover:bg-rose-500 hover:text-white rounded border border-black transition-colors"
                    title="Adımı Sil"
                  >
                    <Trash2 className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aşama Notları & Açıklama */}
        <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
          <label className="text-[11px] font-black uppercase block text-black">
            AŞAMA NOTLARI & DETAYLAR (NOTION TARZI NOT TUTMA)
          </label>
          <textarea
            value={data.description || ''}
            onChange={(e) => updateGoal(nodeId, { description: e.target.value })}
            placeholder="Bu aşama için dikkat edilmesi gereken detaylar, bağlantılar veya blokajlar..."
            rows={4}
            className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-3 resize-none outline-none focus:bg-white shadow-inner"
          />
        </div>
      </div>
    </div>
  );
};
