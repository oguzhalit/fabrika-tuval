import React, { useState } from 'react';
import { useGoalStore } from '../../store/useGoalStore';
import { GoalCategory } from '../../types/goal';
import { Flame, Check, Plus, Trophy, Trash2, X, Sparkles } from 'lucide-react';
import { triggerSmallCelebration, triggerGoalCelebration } from '../../utils/confetti';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const HabitView: React.FC = () => {
  const nodes = useGoalStore((s) => s.nodes);
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const selectGoal = useGoalStore((s) => s.selectGoal);

  const habitNodes = nodes.filter((n) => n.data.moduleType === 'habit' || n.type === 'habitNode' || n.data.habit);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(21);
  const [newCategory, setNewCategory] = useState<GoalCategory>('health');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleToggle = (id: string, habit: any) => {
    const nextCompleted = !habit.completedToday;
    const nextStreak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    const updatedHistory = [...(habit.weekHistory || [false, false, false, false, false, false, false])];
    updatedHistory[updatedHistory.length - 1] = nextCompleted;

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedActivityLog = { ...(habit.activityLog || {}) };
    if (nextCompleted) {
      updatedActivityLog[todayStr] = (updatedActivityLog[todayStr] || 0) + 1;
    } else {
      delete updatedActivityLog[todayStr];
    }

    if (nextCompleted) {
      if (nextStreak % 7 === 0) {
        triggerGoalCelebration();
      } else {
        triggerSmallCelebration();
      }
    }

    const targetDays = habit.targetDays || 21;
    const calcProgress = Math.min(100, Math.round((nextStreak / targetDays) * 100));

    updateGoal(id, {
      progress: calcProgress,
      status: nextCompleted ? 'completed' : 'in_progress',
      habit: {
        ...habit,
        completedToday: nextCompleted,
        streak: nextStreak,
        bestStreak: Math.max(habit.bestStreak || 0, nextStreak),
        weekHistory: updatedHistory,
        activityLog: updatedActivityLog,
        lastCompletedDate: nextCompleted ? todayStr : null
      }
    });
  };

  const handleToggleDay = (id: string, habit: any, dayIndex: number) => {
    const updatedHistory = [...(habit.weekHistory || [false, false, false, false, false, false, false])];
    updatedHistory[dayIndex] = !updatedHistory[dayIndex];
    const isToday = dayIndex === updatedHistory.length - 1;
    const completedToday = isToday ? updatedHistory[dayIndex] : habit.completedToday;

    const completedDaysCount = updatedHistory.filter(Boolean).length;

    updateGoal(id, {
      habit: {
        ...habit,
        completedToday,
        streak: completedDaysCount,
        bestStreak: Math.max(habit.bestStreak || 0, completedDaysCount),
        weekHistory: updatedHistory
      }
    });
    if (updatedHistory[dayIndex]) {
      triggerSmallCelebration();
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const id = `habit-${Date.now()}`;
    useGoalStore.setState((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          type: 'habitNode',
          position: { x: 300, y: 300 },
          data: {
            id,
            title: newTitle.trim().toUpperCase(),
            category: newCategory,
            status: 'in_progress',
            progress: 0,
            moduleType: 'habit',
            habit: {
              streak: 0,
              bestStreak: 0,
              targetDays: newTarget,
              completedToday: false,
              frequency: 'daily',
              weekHistory: [false, false, false, false, false, false, false],
              startDate: new Date().toISOString().split('T')[0]
            }
          }
        }
      ]
    }));

    setNewTitle('');
    setIsCreateModalOpen(false);
    triggerSmallCelebration();
  };

  const totalStreak = habitNodes.reduce((acc, h) => acc + (h.data.habit?.streak || 0), 0);
  const completedTodayCount = habitNodes.filter((h) => h.data.habit?.completedToday).length;
  const bestOverallStreak = habitNodes.reduce((max, h) => Math.max(max, h.data.habit?.bestStreak || 0), 0);

  const filteredHabits = habitNodes.filter(h => {
    if (filterCategory === 'all') return true;
    return h.data.category === filterCategory;
  });

  return (
    <div className="w-full h-screen bg-[#F5F0E6] pt-20 md:pt-24 px-3 sm:px-6 md:px-8 pb-24 overflow-y-auto select-none">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Üst Başlık & Ekle Butonu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 uppercase tracking-tight">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /> ALIŞKANLIK TAKİBİ // STREAK
            </h2>
            <p className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider mt-0.5">
              Zinciri kırma! Günlük tekrarlarını takip et ve hedefine ulaş.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFE600] border-3 border-black rounded-xl text-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            YENİ ALIŞKANLIK
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 sm:p-4 bg-white border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-[#FF6B35] text-white border-2 border-black rounded-xl">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[11px] font-black uppercase text-stone-600 block">TOPLAM SERİ</span>
              <span className="text-base sm:text-2xl font-black text-black">{totalStreak} GÜN</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-white border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-[#22C55E] text-black border-2 border-black rounded-xl">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[11px] font-black uppercase text-stone-600 block">BUGÜN</span>
              <span className="text-base sm:text-2xl font-black text-black">{completedTodayCount}/{habitNodes.length}</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-white border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-[#FFE600] text-black border-2 border-black rounded-xl">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[11px] font-black uppercase text-stone-600 block">EN İYİ SERİ</span>
              <span className="text-base sm:text-2xl font-black text-black">{bestOverallStreak} GÜN</span>
            </div>
          </div>
        </div>

        {/* Kategori Filtreleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'TÜMÜ' },
            { id: 'health', label: 'SAĞLIK & SPOR' },
            { id: 'education', label: 'EĞİTİM & ÖĞRENME' },
            { id: 'career', label: 'KARİYER & İŞ' },
            { id: 'personal', label: 'KİŞİSEL GELİŞİM' },
            { id: 'creative', label: 'YARATICI' },
            { id: 'finance', label: 'FİNANS' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 border-2 border-black rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all ${
                filterCategory === cat.id
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_#000]'
                  : 'bg-white hover:bg-[#FFE600] text-black'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Alışkanlık Listesi */}
        <div className="space-y-3">
          {filteredHabits.map((node) => {
            const h = node.data.habit || {
              streak: 0,
              bestStreak: 0,
              completedToday: false,
              weekHistory: [false, false, false, false, false, false, false],
              targetDays: 21
            };
            const targetDays = h.targetDays || 21;
            const progressPercent = Math.min(100, Math.round((h.streak / targetDays) * 100));

            return (
              <div
                key={node.id}
                onClick={() => selectGoal(node.id)}
                className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
              >
                {/* Kart Üst Başlık & Aksiyon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 
                        className="text-sm sm:text-base font-black uppercase text-black flex items-center gap-1.5"
                        title="Alışkanlık Detay Kartını Aç"
                      >
                        {node.data.title}
                        <span className="text-[10px] text-stone-500 font-bold bg-[#FFE600] px-1.5 py-0.2 border border-black rounded">Detay & Grafik ↗</span>
                      </h4>
                      <span className="px-2 py-0.5 bg-[#FF6B35] text-white border border-black rounded-md text-[10px] font-black inline-flex items-center gap-1">
                        <Flame className="w-3 h-3 stroke-[3]" />
                        {h.streak} GÜN SERİ
                      </span>
                      <span className="px-1.5 py-0.5 bg-stone-100 border border-black rounded text-[9px] font-black text-stone-600">
                        EN İYİ: {h.bestStreak || h.streak}
                      </span>
                    </div>

                    {/* Hedef İlerleme Barı */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-32 sm:w-48 h-2 bg-stone-200 border border-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-stone-500">
                        {h.streak}/{targetDays} (%{progressPercent})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(node.id, h)}
                      className={`px-3 py-2 border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center gap-1.5 ${
                        h.completedToday
                          ? 'bg-[#22C55E] text-black ring-2 ring-black'
                          : 'bg-[#FFE600] hover:bg-[#ffd900] text-black'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{h.completedToday ? 'YAPILDI' : 'TAMAMLA'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) {
                          deleteGoal(node.id);
                        }
                      }}
                      className="p-2 border-2 border-black rounded-xl bg-white hover:bg-rose-500 hover:text-white text-stone-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7 Günlük Matris Butonları (Tıklanabilir gün gün takip) */}
                <div className="pt-2 border-t-2 border-black/10" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] font-black uppercase text-stone-500 block mb-1.5">
                    Haftalık Geçmiş (Güne tıklayarak durumu değiştirebilirsin):
                  </span>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {(h.weekHistory || [false, false, false, false, false, false, false]).map((done: boolean, idx: number) => {
                      const isToday = idx === 6;
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDay(node.id, h, idx);
                          }}
                          className={`flex flex-col items-center justify-center p-1.5 sm:p-2 border-2 border-black rounded-xl font-black transition-all ${
                            done
                              ? 'bg-[#22C55E] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                              : 'bg-white hover:bg-stone-100 text-stone-400'
                          } ${isToday ? 'ring-2 ring-[#FF6B35]' : ''}`}
                          title={`${DAYS[idx]} ${isToday ? '(Bugün)' : ''}`}
                        >
                          <span className="text-xs sm:text-sm mt-0.5 flex items-center justify-center">
                            {done ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredHabits.length === 0 && (
            <div className="h-40 bg-white border-3 border-dashed border-black rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-500 p-4 text-center">
              <Sparkles className="w-8 h-8 stroke-[2] text-[#00C2CB]" />
              <p className="text-xs font-black uppercase">Henüz bu kategoride alışkanlık eklenmedi.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-1 px-3 py-1.5 bg-[#FFE600] border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
              >
                İlk Alışkanlığını Ekle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Alışkanlık Ekleme Modal */}
      {isCreateModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <h3 className="text-sm font-black uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 stroke-[2.5]" /> YENİ ALIŞKANLIK OLUŞTUR
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                  Alışkanlık Başlığı
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: 30 DAKİKA KİTAP OKU, 2L SU İÇ"
                  autoFocus
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-[#FFE600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                    Hedef Gün
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#FFE600]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-[#FFE600] bg-white"
                  >
                    <option value="health">SAĞLIK & SPOR</option>
                    <option value="education">EĞİTİM & ÖĞRENME</option>
                    <option value="career">KARİYER & İŞ</option>
                    <option value="personal">KİŞİSEL GELİŞİM</option>
                    <option value="creative">YARATICI</option>
                    <option value="finance">FİNANS</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#22C55E] border-2 border-black rounded-xl text-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> ALIŞKANLIĞI KAYDET
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-white border-2 border-black rounded-xl text-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]"
                >
                  İPTAL
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
