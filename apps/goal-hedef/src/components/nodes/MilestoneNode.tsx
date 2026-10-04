import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Flag, Check, Trash2 } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const MilestoneNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const isCompleted = data.status === 'completed';

  const toggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = isCompleted ? 'not_started' : 'completed';
    const nextProgress = isCompleted ? 0 : 100;
    updateGoal(id, { status: nextStatus, progress: nextProgress });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmDialog({
      title: 'AŞAMAYI SİL',
      message: `"${data.title || 'Bu aşamayı'}" silmek istediğinize emin misiniz?`,
      confirmLabel: 'EVET, AŞAMAYI SİL',
      cancelLabel: 'VAZGEÇ',
      onConfirm: () => deleteGoal(id)
    });
  };

  return (
    <div
      onClick={() => selectGoal(id)}
      className={`group relative flex items-center justify-between gap-3 px-3 py-2 border-3 border-black transition-all duration-150 cursor-pointer min-w-[160px] min-h-[44px] w-full h-full ${
        isCompleted
          ? 'bg-[#22C55E] text-black shadow-[4px_4px_0px_0px_#000]'
          : 'bg-[#A855F7] text-white shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]'
      } ${selected ? 'shadow-[8px_8px_0px_0px_#000] -translate-x-1 -translate-y-1' : ''}`}
    >
      <NodeResizer 
        isVisible={!!selected} 
        minWidth={150} 
        minHeight={42}
        handleClassName="!w-3 !h-3 !bg-white !border-2 !border-black !rounded-sm hover:!scale-125 !transition-transform"
        lineClassName="!border-black !border-dashed"
      />

      <Handle type="target" position={Position.Top} className="!bg-[#FFE600] !border-2 !border-black !w-3 !h-3 !rounded-none" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#00C2CB] !border-2 !border-black !w-3 !h-3 !rounded-none" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[#FFE600] !border-2 !border-black !w-3 !h-3 !rounded-none" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-[#00C2CB] !border-2 !border-black !w-3 !h-3 !rounded-none" />

      {/* Sol İçerik: Checkbox + Başlık */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Checkbox / Flag Butonu */}
        <button
          onClick={toggleComplete}
          className={`w-6 h-6 flex-shrink-0 border-2 border-black flex items-center justify-center font-black transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            isCompleted
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-[#FFE600]'
          }`}
        >
          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Flag className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Başlık */}
        <span className={`text-xs font-black uppercase tracking-tight truncate flex-1 ${
          isCompleted ? 'line-through opacity-80' : 'text-white'
        }`}>
          {data.title}
        </span>
      </div>

      {/* Silme */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 bg-white border border-black hover:bg-[#FF6B35] text-black transition-all ml-1 shadow-[1px_1px_0px_0px_#000]"
        title="Kilometre Taşını Sil"
      >
        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
});

MilestoneNode.displayName = 'MilestoneNode';
