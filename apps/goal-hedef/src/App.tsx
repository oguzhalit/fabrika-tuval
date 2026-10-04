import { useEffect, useState } from 'react';
import { useGoalStore } from './store/useGoalStore';
import { GoalCanvas } from './components/canvas/GoalCanvas';
import { RoadmapView } from './components/views/RoadmapView';
import { HabitView } from './components/views/HabitView';
import { Toolbar } from './components/canvas/Toolbar';
import { EntityDetailRouter } from './components/drawer/EntityDetailRouter';
import { GoalBoxDrawer } from './components/inbox/GoalBoxDrawer';
import { ConfirmModal } from './components/common/ConfirmModal';

export function App() {
  const activeView = useGoalStore((s) => s.activeView);
  const loadFromLocalStorage = useGoalStore((s) => s.loadFromLocalStorage);
  const [isGoalBoxOpen, setIsGoalBoxOpen] = useState(false);

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const handleToggleGoalBox = () => {
    setIsGoalBoxOpen((prev) => !prev);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'canvas':
        return <GoalCanvas />;
      case 'roadmap':
        return <RoadmapView />;
      case 'habits':
        return <HabitView />;
      default:
        return <GoalCanvas />;
    }
  };

  return (
    <main className="relative w-screen h-screen h-[100dvh] overflow-hidden bg-[#F5F0E6]">
      {/* Üst Logo, Skor, Notepad++ Tuval Sekmeleri ve Görünüm Seçim Çubuğu */}
      <Toolbar
        onToggleGoalBox={handleToggleGoalBox}
        isGoalBoxOpen={isGoalBoxOpen}
      />

      {/* Ana Çalışma Alanı (Hedef Tuvali / Yol Haritası / Alışkanlıklar) */}
      {renderActiveView()}

      {/* Hedef Kutusu: Tüm Hedefleri Yönetme ve Hızlı Fikir Yakalama Çekmecesi */}
      <GoalBoxDrawer
        isOpen={isGoalBoxOpen}
        onClose={() => setIsGoalBoxOpen(false)}
      />

      {/* Aşama, Hedef, Alışkanlık, Not - Kendine Has Güncelleme Çekmecesi */}
      <EntityDetailRouter />

      {/* Neo-Brutalist Özel Onay Modalı */}
      <ConfirmModal />
    </main>
  );
}

export default App;
