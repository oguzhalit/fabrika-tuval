import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Terminal, Copy, Check, Code, Trash2 } from 'lucide-react';
import { useGoalStore } from '../../store/useGoalStore';

export const DevCodeNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const selectGoal = useGoalStore((s) => s.selectGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);
  const [copied, setCopied] = useState(false);

  const dev = data.devCode || {
    language: 'TypeScript',
    codeSnippet: 'console.log("Universal Personal OS // Active");',
    command: 'npm run dev'
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(dev.codeSnippet || dev.command || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => selectGoal(id)}
      className={`relative w-84 rounded-2xl bg-white border-3 border-black transition-all duration-150 select-none cursor-pointer overflow-hidden ${
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
      <div className="p-3 border-b-3 border-black bg-[#C084FC] flex items-center justify-between text-black">
        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase">
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          KOD & GELİŞTİRİCİ
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog({
                title: 'KOD MODÜLÜNÜ SİL',
                message: `"${data.title || 'Bu kod modülünü'}" silmek istediğinize emin misiniz?`,
                confirmLabel: 'EVET, SİL',
                cancelLabel: 'VAZGEÇ',
                onConfirm: () => deleteGoal(id)
              });
            }}
            className="p-1 border border-black rounded-md bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Modülü Sil"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
          </button>

          <span className="bg-white border-2 border-black rounded-md px-2 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
            {dev.language}
          </span>
        </div>
      </div>

      {/* Gövde */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-black text-black uppercase leading-tight">
          {data.title}
        </h3>

        {/* Kod / Terminal Kutusu */}
        <div className="bg-[#0b0f17] border-2 border-black rounded-xl p-3 relative group/code text-slate-100 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Code className="w-3 h-3 text-[#FFE600]" />
              SNIPPET
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[9px] font-black uppercase border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'KOPYALANDI!' : 'KOPYALA'}</span>
            </button>
          </div>

          <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400 selection:bg-emerald-800">
            <code>{dev.codeSnippet}</code>
          </pre>

          {dev.command && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-sky-300">
              $ {dev.command}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DevCodeNode.displayName = 'DevCodeNode';
