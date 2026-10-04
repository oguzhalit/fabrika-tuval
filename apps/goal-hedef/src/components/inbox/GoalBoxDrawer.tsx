import React, { useState, useMemo } from 'react';
import { 
  Target, 
  X, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  ArrowUpRight
} from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';
import { triggerSmallCelebration } from '../../utils/confetti';

interface GoalBoxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalBoxDrawer: React.FC<GoalBoxDrawerProps> = ({ isOpen, onClose }) => {
  const nodes = useGoalStore((s) => s.nodes);
  const addGoal = useGoalStore((s) => s.addGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const goalNodes = useMemo(() => {
    return nodes.filter(n => n.type === 'goalNode');
  }, [nodes]);

  const filteredGoals = useMemo(() => {
    return goalNodes.filter(n => {
      const titleMatch = (n.data.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = (n.data.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = titleMatch || descMatch;

      if (!matchesSearch) return false;

      if (filterStatus === 'completed') return n.data.status === 'completed';
      if (filterStatus === 'in_progress') return n.data.status !== 'completed';
      return true;
    });
  }, [goalNodes, searchTerm, filterStatus]);

  if (!isOpen) return null;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    addGoal({
      title: newGoalTitle.trim().toUpperCase(),
      category: 'career',
      status: 'in_progress',
      progress: 0
    });
    setNewGoalTitle('');
    triggerSmallCelebration();
  };

  const handleToggleComplete = (id: string, currentStatus?: string) => {
    const isCompleted = currentStatus === 'completed';
    updateGoal(id, {
      status: isCompleted ? 'in_progress' : 'completed',
      progress: isCompleted ? 50 : 100
    });
    if (!isCompleted) triggerSmallCelebration();
  };

  return (
    <div className="fixed inset-y-0 left-0 w-[460px] max-w-full bg-[#F5F0E6] border-r-4 border-black shadow-[8px_0px_0px_0px_#000] z-50 flex flex-col transition-transform duration-200 animate-in slide-in-from-left select-none">
      {/* Üst Bar */}
      <div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#00C2CB] text-black">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-lg">
            <Target className="w-5 h-5 stroke-[3]" />
          </span>
          <div>
            <span className="text-xs font-black tracking-wider uppercase block">
              HEDEF KUTUSU // TÜM HEDEFLER
            </span>
            <span className="text-[10px] font-bold opacity-80 uppercase">
              {goalNodes.length} HEDEF • {goalNodes.filter(n => n.data.status === 'completed').length} TAMAMLANDI
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          title="Kapat"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* Hızlı Hedef Ekleme Formu */}
      <div className="p-4 bg-white border-b-3 border-black space-y-3">
        <form onSubmit={handleCreateGoal} className="flex gap-2">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="YENİ HEDEF BAŞLIĞI..."
            className="flex-1 bg-[#F5F0E6] border-2 border-black rounded-xl px-3 py-2 text-xs font-black uppercase outline-none shadow-[2px_2px_0px_0px_#000]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-[#FFE600] hover:bg-[#ffd900] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            EKLE
          </button>
        </form>

        {/* Arama & Filtreleme */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hedeflerde ara..."
              className="w-full bg-[#F5F0E6] border border-black rounded-lg pl-8 pr-2.5 py-1 text-[11px] font-bold outline-none"
            />
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2 py-1 text-[10px] font-black uppercase border border-black rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              TÜMÜ
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-2 py-1 text-[10px] font-black uppercase border border-black rounded-lg transition-all ${
                filterStatus === 'in_progress' ? 'bg-[#FFE600] text-black' : 'bg-white text-black'
              }`}
            >
              AKTİF
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2 py-1 text-[10px] font-black uppercase border border-black rounded-lg transition-all ${
                filterStatus === 'completed' ? 'bg-[#22C55E] text-black' : 'bg-white text-black'
              }`}
            >
              BİTEN
            </button>
          </div>
        </div>
      </div>

      {/* Hedefler Listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredGoals.map((n) => {
          const isDone = n.data.status === 'completed';
          const progress = n.data.progress || 0;

          return (
            <div
              key={n.id}
              className={`p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000] space-y-2 transition-all hover:bg-stone-50 ${
                isDone ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div 
                  onClick={() => {
                    selectGoal(n.id);
                  }}
                  className="flex-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#FFE600] border border-black rounded">
                      {n.data.category || 'GENEL'}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#22C55E] text-black border border-black rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
                        TAMAMLANDI
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-black uppercase tracking-tight text-black mt-1 group-hover:text-blue-600 transition-colors ${
                    isDone ? 'line-through text-stone-500' : ''
                  }`}>
                    {n.data.title || 'İSİMSİZ HEDEF'}
                  </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleComplete(n.id, n.data.status)}
                    className={`p-1.5 border border-black rounded-lg shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all ${
                      isDone ? 'bg-[#22C55E] text-black' : 'bg-white hover:bg-[#FFE600]'
                    }`}
                    title={isDone ? 'Devam Ediyor Yap' : 'Tamamlandı Olarak İşaretle'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={() => selectGoal(n.id)}
                    className="p-1.5 bg-white hover:bg-black hover:text-white border border-black rounded-lg shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
                    title="Detayını Aç"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <button
                    onClick={() => {
                      openConfirmDialog({
                        title: 'HEDEFİ SİL',
                        message: `"${n.data.title || 'Bu hedefi'}" silmek istediğinize emin misiniz?`,
                        confirmLabel: 'EVET, SİL',
                        onConfirm: () => deleteGoal(n.id)
                      });
                    }}
                    className="p-1.5 bg-white hover:bg-rose-100 text-stone-600 hover:text-rose-600 border border-black rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-stone-600">
                  <span>İLERLEME</span>
                  <span>%{progress}</span>
                </div>
                <div className="w-full h-2 bg-stone-100 border border-black rounded-full overflow-hidden">
                  <div 
                    className={`h-full border-r border-black transition-all ${isDone ? 'bg-[#22C55E]' : 'bg-[#FFE600]'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="h-40 border-2 border-dashed border-black/30 rounded-xl flex flex-col items-center justify-center text-stone-500 text-xs font-bold uppercase italic text-center p-4">
            <span>Hedef bulunamadı.</span>
            <span className="text-[10px] font-normal not-italic mt-1">Yukarıdaki formdan yeni bir hedef ekleyebilirsiniz.</span>
          </div>
        )}
      </div>
    </div>
  );
};
