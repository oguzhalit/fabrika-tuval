import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const FinanceNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

  const fin = data.finance || {
    amount: 15000,
    currency: '₺',
    transactionType: 'savings_goal',
    targetAmount: 50000
  };

  const cardBg = data.cardColor || '#FFE600'; // Güneş sarısı
  const isSavings = fin.transactionType === 'savings_goal';
  const progressPercent = isSavings && fin.targetAmount && fin.targetAmount > 0 
    ? Math.min(100, Math.round((fin.amount / fin.targetAmount) * 100)) 
    : 100;

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

      {/* Üst Bar */}
      <div className="p-3 border-b-3 border-black bg-white flex items-center justify-between">
        <span className="inline-flex items-center gap-1 bg-[#22C55E] text-black px-2 py-0.5 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
          <Wallet className="w-3.5 h-3.5 stroke-[2.5]" />
          BÜTÇE & FİNANS
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog({
                title: 'FİNANS KAYDINI SİL',
                message: `"${data.title || 'Bu finans kaydını'}" silmek istediğinize emin misiniz?`,
                confirmLabel: 'EVET, SİL',
                cancelLabel: 'VAZGEÇ',
                onConfirm: () => deleteGoal(id)
              });
            }}
            className="p-1 border border-black rounded-md bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Finans Kaydını Sil"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
          </button>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white border-2 border-black rounded-md text-xs font-black">
            {fin.transactionType === 'income' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
            {fin.transactionType === 'expense' && <TrendingDown className="w-3 h-3 text-rose-400" />}
            {fin.transactionType === 'savings_goal' && <DollarSign className="w-3 h-3 text-yellow-300" />}
            {fin.transactionType.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Gövde */}
      <div className="p-4 space-y-3">
        <h3 className="text-base font-black text-black uppercase leading-tight">
          {data.title}
        </h3>

        {/* Tutar Panosu */}
        <div className="bg-white border-2 border-black rounded-xl p-3 space-y-2 shadow-[2px_2px_0px_0px_#000]">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black uppercase text-stone-600">MEVCUT BİRİKİM</span>
            <span className="text-xl font-black text-black">
              {fin.currency} {fin.amount?.toLocaleString('tr-TR')}
            </span>
          </div>

          {isSavings && fin.targetAmount && (
            <>
              <div className="h-3 w-full bg-[#F5F0E6] border-2 border-black rounded-md p-0.5">
                <div
                  className="h-full bg-[#22C55E] border-r-2 border-black rounded-sm transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase text-stone-700">
                <span>Hedef: {fin.currency} {fin.targetAmount.toLocaleString('tr-TR')}</span>
                <span className="bg-[#FFE600] px-1 border border-black rounded">%{progressPercent}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

FinanceNode.displayName = 'FinanceNode';
