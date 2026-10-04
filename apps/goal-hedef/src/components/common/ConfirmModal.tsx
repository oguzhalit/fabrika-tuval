import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const ConfirmModal: React.FC = () => {
  const confirmModal = useGoalStore((s) => s.confirmModal);
  const closeConfirmDialog = useGoalStore((s) => s.closeConfirmDialog);

  if (!confirmModal || !confirmModal.isOpen) return null;

  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirmDialog();
  };

  const isDanger = confirmModal.isDanger !== false;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
        onClick={closeConfirmDialog}
      />

      {/* Modal Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[121] w-[90%] max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_#000] select-none transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-3 border-black mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] ${isDanger ? 'bg-[#FF3366] text-white' : 'bg-[#FFE600] text-black'}`}>
              {isDanger ? <Trash2 className="w-5 h-5 stroke-[2.5]" /> : <AlertTriangle className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-black">
                {confirmModal.title}
              </h3>
              <span className="text-[10px] font-bold uppercase text-stone-500">
                GERİ ALINAMAZ İŞLEM
              </span>
            </div>
          </div>

          <button
            onClick={closeConfirmDialog}
            className="p-1.5 hover:bg-stone-100 border-2 border-black rounded-xl transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Kapat"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Message */}
        <div className="py-2 mb-6">
          <p className="text-sm font-bold text-stone-800 leading-relaxed bg-[#F5F0E6] p-3.5 border-2 border-black rounded-xl">
            {confirmModal.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 py-3 px-4 border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
              isDanger
                ? 'bg-[#FF3366] hover:bg-rose-600 text-white'
                : 'bg-[#FFE600] hover:bg-yellow-400 text-black'
            }`}
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            {confirmModal.confirmLabel || 'EVET, SİL'}
          </button>

          <button
            type="button"
            onClick={closeConfirmDialog}
            className="py-3 px-5 bg-white hover:bg-stone-100 border-3 border-black rounded-xl font-black text-xs uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {confirmModal.cancelLabel || 'VAZGEÇ'}
          </button>
        </div>
      </div>
    </>
  );
};
