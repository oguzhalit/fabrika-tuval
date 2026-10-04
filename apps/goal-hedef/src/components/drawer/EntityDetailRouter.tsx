import React from 'react';
import { useGoalStore } from '../../store/useGoalStore';
import { GoalDetailDrawer } from './GoalDetailDrawer';
import { MilestoneDetailDrawer } from './MilestoneDetailDrawer';
import { StickyNoteDetailDrawer } from './StickyNoteDetailDrawer';
import { HabitDetailDrawer } from './HabitDetailDrawer';

export const EntityDetailRouter: React.FC = () => {
  const selectedGoalId = useGoalStore((s) => s.selectedGoalId);
  const nodes = useGoalStore((s) => s.nodes);

  if (!selectedGoalId) return null;

  const currentNode = nodes.find((n) => n.id === selectedGoalId);
  if (!currentNode) return null;

  const nodeType = currentNode.type;
  const moduleType = currentNode.data.moduleType;

  // 1. AŞAMA / KİLOMETRE TAŞI (Milestone)
  if (nodeType === 'milestoneNode' || moduleType === 'milestone') {
    return <MilestoneDetailDrawer nodeId={selectedGoalId} />;
  }

  // 2. STICKY NOT / POST-IT (Note)
  if (nodeType === 'stickyNode' || moduleType === 'sticky') {
    return <StickyNoteDetailDrawer nodeId={selectedGoalId} />;
  }

  // 3. ALIŞKANLIK (Habit)
  if (nodeType === 'habitNode' || moduleType === 'habit' || !!currentNode.data.habit) {
    return <HabitDetailDrawer nodeId={selectedGoalId} />;
  }

  // 4. HEDEF (Goal) ve diğer tüm hedefler
  return <GoalDetailDrawer />;
};
