import { Handle, NodeProps, Position } from "@xyflow/react";
import { Calendar, CheckCircle2, Trash2, User, Users } from "lucide-react";
import { memo } from "react";
import { useGoalStore } from "../../store/useGoalStore";

export const MeetingNode = memo(({ id, data, selected }: NodeProps<any>) => {
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const deleteGoal = useGoalStore((s) => s.deleteGoal);
	const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

	const meeting = data.meeting || {
		attendees: ["Mimar", "Mühendis", "Proje Yöneticisi"],
		decisions: ["Faz 1 onaylandı", "Bütçe revizyonu talep edildi"],
	};

	const cardBg = data.cardColor || "#FBCFE8"; // Pastel Pembe

	return (
		<div
			onClick={() => selectGoal(id)}
			style={{ backgroundColor: cardBg }}
			className={`relative w-80 rounded-2xl border-3 border-black transition-all duration-150 select-none cursor-pointer overflow-hidden ${
				selected
					? "shadow-[8px_8px_0px_0px_#000] -translate-x-1 -translate-y-1"
					: "shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000]"
			}`}
		>
			<Handle
				type="target"
				position={Position.Top}
				className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none"
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none"
			/>
			<Handle
				type="target"
				position={Position.Left}
				id="left"
				className="!bg-[#FFE600] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none"
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="right"
				className="!bg-[#00C2CB] !border-3 !border-black !w-3.5 !h-3.5 !rounded-none"
			/>

			{/* Üst Bar */}
			<div className="p-3 border-b-3 border-black bg-white flex items-center justify-between">
				<span className="inline-flex items-center gap-1 bg-[#FF3399] text-white px-2 py-0.5 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
					<Users className="w-3.5 h-3.5 stroke-[2.5]" />
					TOPLANTI NOTU
				</span>

				<div className="flex items-center gap-1.5">
					<button
						onClick={(e) => {
							e.stopPropagation();
							openConfirmDialog({
								title: "TOPLANTI NOTUNU SİL",
								message: `"${data.title || "Bu toplantı notunu"}" silmek istediğinize emin misiniz?`,
								confirmLabel: "EVET, SİL",
								cancelLabel: "VAZGEÇ",
								onConfirm: () => deleteGoal(id),
							});
						}}
						className="p-1 border border-black rounded-md bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
						title="Toplantı Notunu Sil"
					>
						<Trash2 className="w-3 h-3 stroke-[2.5]" />
					</button>

					{data.targetDate && (
						<span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F5F0E6] border border-black px-1.5 py-0.2 rounded">
							<Calendar className="w-3 h-3" />
							{data.targetDate}
						</span>
					)}
				</div>
			</div>

			{/* Gövde */}
			<div className="p-4 space-y-3">
				<h3 className="text-base font-black text-black uppercase leading-tight">{data.title}</h3>

				{/* Katılımcılar */}
				<div className="flex flex-wrap gap-1">
					{meeting.attendees?.map((att: string, i: number) => (
						<span
							key={i}
							className="px-2 py-0.5 bg-white border border-black rounded-md text-[10px] font-bold flex items-center gap-1"
						>
							<User className="w-2.5 h-2.5 stroke-[2.5]" /> {att}
						</span>
					))}
				</div>

				{/* Kritik Kararlar */}
				<div className="bg-white border-2 border-black rounded-xl p-2.5 space-y-1.5 shadow-[2px_2px_0px_0px_#000]">
					<span className="text-[9px] font-black uppercase text-stone-600 block">
						ALINAN KARARLAR:
					</span>
					{meeting.decisions?.map((dec: string, idx: number) => (
						<div key={idx} className="flex items-start gap-1.5 text-xs font-bold text-stone-800">
							<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
							<span>{dec}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});

MeetingNode.displayName = "MeetingNode";
