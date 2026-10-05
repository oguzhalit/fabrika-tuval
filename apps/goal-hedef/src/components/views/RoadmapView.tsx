import {
	Calendar,
	CheckCircle2,
	Clock,
	Coffee,
	Flame,
	GripVertical,
	Kanban,
	ListTodo,
	PauseCircle,
	Pin,
	Plus,
	TrendingUp,
	Zap,
} from "lucide-react";
import React, { useState } from "react";
import { useGoalStore } from "../../store/useGoalStore";
import { GoalPriority, GoalStatus } from "../../types/goal";
import { triggerGoalCelebration, triggerSmallCelebration } from "../../utils/confetti";

const COLUMNS: {
	id: GoalStatus;
	label: string;
	icon: React.ReactNode;
	bg: string;
	text: string;
}[] = [
	{
		id: "not_started",
		label: "BAŞLAMADI",
		icon: <Clock className="w-4 h-4 stroke-[2.5]" />,
		bg: "bg-white",
		text: "text-black",
	},
	{
		id: "in_progress",
		label: "DEVAM EDİYOR",
		icon: <TrendingUp className="w-4 h-4 stroke-[2.5]" />,
		bg: "bg-[#FFE600]",
		text: "text-black",
	},
	{
		id: "completed",
		label: "TAMAMLANDI",
		icon: <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />,
		bg: "bg-[#22C55E]",
		text: "text-black",
	},
	{
		id: "on_hold",
		label: "BEKLEMEDE",
		icon: <PauseCircle className="w-4 h-4 stroke-[2.5]" />,
		bg: "bg-[#FF6B35]",
		text: "text-black",
	},
];

const PRIORITY_BADGES: Record<GoalPriority, { label: string; bg: string; icon: React.ReactNode }> =
	{
		p1_high: {
			label: "P1",
			bg: "bg-[#FF6B35] text-white",
			icon: <Flame className="w-3 h-3 stroke-[2.5]" />,
		},
		p2_medium: {
			label: "P2",
			bg: "bg-[#FFE600] text-black",
			icon: <Zap className="w-3 h-3 stroke-[2.5]" />,
		},
		p3_low: {
			label: "P3",
			bg: "bg-[#F5F0E6] text-black",
			icon: <Coffee className="w-3 h-3 stroke-[2.5]" />,
		},
	};

export const RoadmapView: React.FC = () => {
	const nodes = useGoalStore((s) => s.nodes);
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const addGoal = useGoalStore((s) => s.addGoal);
	const updateGoal = useGoalStore((s) => s.updateGoal);

	const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);
	const [dragOverCol, setDragOverCol] = useState<GoalStatus | null>(null);

	const goalNodes = nodes.filter((n) => n.type === "goalNode");

	const handleDragStart = (e: React.DragEvent, id: string) => {
		e.dataTransfer.setData("text/plain", id);
		setDraggedGoalId(id);
	};

	const handleDragOver = (e: React.DragEvent, colId: GoalStatus) => {
		e.preventDefault();
		if (dragOverCol !== colId) {
			setDragOverCol(colId);
		}
	};

	const handleDragLeave = () => {
		setDragOverCol(null);
	};

	const handleDrop = (e: React.DragEvent, targetStatus: GoalStatus) => {
		e.preventDefault();
		const id = e.dataTransfer.getData("text/plain") || draggedGoalId;
		if (id) {
			updateGoal(id, { status: targetStatus });
			if (targetStatus === "completed") {
				triggerGoalCelebration();
			} else {
				triggerSmallCelebration();
			}
		}
		setDraggedGoalId(null);
		setDragOverCol(null);
	};

	return (
		<div className="w-full h-screen bg-[#F5F0E6] pt-20 md:pt-24 px-3 sm:px-6 md:px-8 pb-24 overflow-y-auto select-none">
			<div className="max-w-7xl mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000]">
				<div>
					<h2 className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 uppercase tracking-tight">
						<Kanban className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" /> YOL HARİTASI // SÜRÜKLE &
						BIRAK KANBAN
					</h2>
					<p className="text-[11px] sm:text-xs font-bold text-stone-700 uppercase tracking-wider mt-0.5">
						Kartları tutarak sütunlar arasında sürükleyip durumlarını güncelleyin.
					</p>
				</div>

				<button
					onClick={() => addGoal({ title: "YENİ HEDEF" })}
					className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FFE600] border-3 border-black rounded-xl text-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all"
				>
					<Plus className="w-4 h-4 stroke-[3]" />
					YENİ HEDEF EKLE
				</button>
			</div>

			<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
				{COLUMNS.map((col) => {
					const colGoals = goalNodes.filter((g) => g.data.status === col.id);
					const isOver = dragOverCol === col.id;

					return (
						<div
							key={col.id}
							onDragOver={(e) => handleDragOver(e, col.id)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, col.id)}
							className={`bg-white border-3 border-black rounded-2xl shadow-[5px_5px_0px_0px_#000] p-3 sm:p-4 flex flex-col min-h-[380px] md:min-h-[520px] transition-all ${
								isOver ? "ring-4 ring-[#FFE600] bg-yellow-50/50 scale-[1.01]" : ""
							}`}
						>
							{/* Kolon Başlığı */}
							<div
								className={`p-2.5 border-2 border-black rounded-xl mb-3 sm:mb-4 flex items-center justify-between shadow-[2px_2px_0px_0px_#000] ${col.bg} ${col.text}`}
							>
								<div className="flex items-center gap-2">
									{col.icon}
									<span className="text-xs font-black uppercase tracking-wider">{col.label}</span>
								</div>
								<span className="text-xs font-black px-2 py-0.5 bg-white border border-black rounded-md text-black">
									{colGoals.length}
								</span>
							</div>

							{/* Kolon Kartları */}
							<div className="space-y-3 flex-1">
								{colGoals.map((node) => {
									const data = node.data;
									const totalTasks = (data.tasks || []).length;
									const completedTasks = (data.tasks || []).filter((t: any) => t.completed).length;
									const cardBg = data.cardColor || "#FFFFFF";
									const priority = data.priority
										? PRIORITY_BADGES[data.priority as GoalPriority]
										: PRIORITY_BADGES.p2_medium;
									const isBeingDragged = draggedGoalId === node.id;

									return (
										<div
											key={node.id}
											draggable
											onDragStart={(e) => handleDragStart(e, node.id)}
											onDragEnd={() => {
												setDraggedGoalId(null);
												setDragOverCol(null);
											}}
											onClick={() => selectGoal(node.id)}
											style={{ backgroundColor: cardBg }}
											className={`rounded-xl border-2 border-black overflow-hidden shadow-[3px_3px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group ${
												isBeingDragged ? "opacity-40 scale-95" : ""
											}`}
										>
											{/* Milanote Kapak Görseli */}
											{data.coverImage && (
												<div className="w-full h-20 border-b-2 border-black overflow-hidden">
													<img
														src={data.coverImage}
														alt={data.title}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform"
													/>
												</div>
											)}

											<div className="p-3 space-y-2">
												<div className="flex items-center justify-between">
													<span
														className={`inline-flex items-center gap-1 px-1.5 py-0.2 border border-black rounded text-[9px] font-black uppercase ${priority.bg}`}
													>
														{priority.icon}
														{priority.label}
													</span>

													<div className="flex items-center gap-1">
														{data.pinned && <Pin className="w-3 h-3 fill-black text-black" />}
														<GripVertical className="w-3.5 h-3.5 text-stone-400 group-hover:text-black cursor-grab" />
													</div>
												</div>

												<h4 className="text-xs sm:text-sm font-black text-black uppercase leading-snug line-clamp-2">
													{data.title}
												</h4>

												{data.description && (
													<p className="text-[11px] font-medium text-stone-700 line-clamp-2">
														{data.description}
													</p>
												)}

												{/* İlerleme */}
												<div className="mt-1.5">
													<div className="flex justify-between items-center text-[9px] font-black uppercase mb-1">
														<span>İLERLEME</span>
														<span className="bg-[#FFE600] px-1 border border-black rounded">
															%{data.progress}
														</span>
													</div>
													<div className="h-2 w-full bg-white border border-black rounded-sm p-0.5">
														<div
															className="h-full bg-[#00C2CB] border-r border-black rounded-xs"
															style={{ width: `${data.progress}%` }}
														/>
													</div>
												</div>

												{/* Alt Bilgiler */}
												<div className="flex items-center justify-between pt-1.5 border-t border-black/10 text-[9px] font-black uppercase">
													<div className="flex items-center gap-1">
														<ListTodo className="w-3 h-3 stroke-[2.5]" />
														<span>
															{completedTasks}/{totalTasks} GÖREV
														</span>
													</div>

													{data.targetDate && (
														<div className="flex items-center gap-1 bg-white px-1 py-0.2 border border-black rounded">
															<Calendar className="w-3 h-3 stroke-[2.5]" />
															<span>{data.targetDate}</span>
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}

								{colGoals.length === 0 && (
									<div className="h-28 border-2 border-dashed border-black/30 rounded-xl flex items-center justify-center text-black/40 text-[11px] font-bold uppercase italic p-2 text-center">
										Buraya sürükleyip bırakın
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
