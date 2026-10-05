import { Handle, NodeProps, Position } from "@xyflow/react";
import { Check, Flame, Pin, RotateCcw, Trash2 } from "lucide-react";
import React, { memo } from "react";
import { useGoalStore } from "../../store/useGoalStore";
import { triggerSmallCelebration } from "../../utils/confetti";

const DAYS = ["P", "S", "Ç", "P", "C", "C", "P"];

export const HabitNode = memo(({ id, data, selected }: NodeProps<any>) => {
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const updateGoal = useGoalStore((s) => s.updateGoal);
	const togglePinGoal = useGoalStore((s) => s.togglePinGoal);
	const deleteGoal = useGoalStore((s) => s.deleteGoal);
	const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

	const habit = data.habit || {
		streak: 0,
		bestStreak: 0,
		completedToday: false,
		frequency: "daily",
		weekHistory: [false, false, false, false, false, false, false],
	};

	const cardBg = data.cardColor || "#D9F99D"; // Pastel lime

	const toggleToday = (e: React.MouseEvent) => {
		e.stopPropagation();
		const nextCompleted = !habit.completedToday;
		const nextStreak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
		const updatedHistory = [
			...(habit.weekHistory || [false, false, false, false, false, false, false]),
		];
		updatedHistory[updatedHistory.length - 1] = nextCompleted;

		const todayStr = new Date().toISOString().split("T")[0];
		const updatedActivityLog = { ...(habit.activityLog || {}) };
		if (nextCompleted) {
			updatedActivityLog[todayStr] = (updatedActivityLog[todayStr] || 0) + 1;
		} else {
			delete updatedActivityLog[todayStr];
		}

		if (nextCompleted) {
			triggerSmallCelebration();
		}

		const targetDays = habit.targetDays || 21;
		const calcProgress = Math.min(100, Math.round((nextStreak / targetDays) * 100));

		updateGoal(id, {
			progress: calcProgress,
			status: nextCompleted ? "completed" : "in_progress",
			habit: {
				...habit,
				completedToday: nextCompleted,
				streak: nextStreak,
				bestStreak: Math.max(habit.bestStreak || 0, nextStreak),
				weekHistory: updatedHistory,
				activityLog: updatedActivityLog,
				lastCompletedDate: nextCompleted ? todayStr : null,
			},
		});
	};

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

			{/* Üst Bar: Modül Etiketi & Streak Rozeti */}
			<div className="p-3 border-b-3 border-black bg-white flex items-center justify-between">
				<span className="inline-flex items-center gap-1 bg-[#FFE600] px-2 py-0.5 border-2 border-black rounded-lg text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
					<Flame className="w-3 h-3 stroke-[2.5]" /> ALIŞKANLIK TAKİBİ
				</span>

				<div className="flex items-center gap-1.5">
					<button
						onClick={(e) => {
							e.stopPropagation();
							openConfirmDialog({
								title: "ALIŞKANLIĞI SİL",
								message: `"${data.title || "Bu alışkanlığı"}" silmek istediğinize emin misiniz?`,
								confirmLabel: "EVET, SİL",
								cancelLabel: "VAZGEÇ",
								onConfirm: () => deleteGoal(id),
							});
						}}
						className="p-1 border border-black rounded-md bg-white hover:bg-[#FF6B35] hover:text-white transition-all text-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
						title="Alışkanlığı Sil"
					>
						<Trash2 className="w-3 h-3 stroke-[2.5]" />
					</button>

					<button
						onClick={(e) => {
							e.stopPropagation();
							togglePinGoal(id);
						}}
						className={`p-1 border border-black rounded-md ${data.pinned ? "bg-[#FFE600]" : "bg-white"}`}
					>
						<Pin className="w-3 h-3" />
					</button>

					<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF6B35] text-white border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_#000]">
						<Flame className="w-3.5 h-3.5 stroke-[2.5]" />
						{habit.streak} GÜN SERİ
					</span>
				</div>
			</div>

			{/* Kart İçeriği */}
			<div className="p-4 space-y-3.5">
				<div>
					<h3 className="text-base font-black text-black uppercase leading-tight">{data.title}</h3>
					{data.description && (
						<p className="text-xs font-medium text-stone-800 mt-1 line-clamp-2">
							{data.description}
						</p>
					)}
				</div>

				{/* Bugün Tamamla Butonu */}
				<button
					onClick={toggleToday}
					className={`w-full py-2.5 px-4 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
						habit.completedToday
							? "bg-[#22C55E] text-black shadow-none translate-x-[2px] translate-y-[2px]"
							: "bg-white hover:bg-[#FFE600] text-black"
					}`}
				>
					{habit.completedToday ? (
						<>
							<Check className="w-4 h-4 stroke-[3]" />
							<span>BUGÜN YAPILDI</span>
						</>
					) : (
						<>
							<RotateCcw className="w-4 h-4 stroke-[2.5]" />
							<span>BUGÜN TAMAMLA</span>
						</>
					)}
				</button>

				{/* Haftalık Mini Isı Haritası */}
				<div className="bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#000]">
					<span className="text-[9px] font-black uppercase text-stone-600 block mb-1.5">
						HAFTALIK GEÇMİŞ (7 GÜN)
					</span>
					<div className="flex justify-between items-center gap-1">
						{DAYS.map((day, idx) => {
							const isDone = habit.weekHistory?.[idx] || false;
							return (
								<div key={idx} className="flex flex-col items-center gap-1 flex-1">
									<div
										className={`w-6 h-6 border-2 border-black rounded-md flex items-center justify-center text-[10px] font-black ${
											isDone ? "bg-[#22C55E] text-black" : "bg-[#F5F0E6] text-stone-400"
										}`}
									>
										{isDone && <Check className="w-3 h-3 stroke-[3]" />}
									</div>
									<span className="text-[8px] font-black text-stone-600">{day}</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
});

HabitNode.displayName = "HabitNode";
