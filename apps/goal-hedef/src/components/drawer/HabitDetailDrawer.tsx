import {
	Activity,
	Check,
	Flame,
	Layers,
	Pin,
	RotateCcw,
	Sparkles,
	Trash2,
	Trophy,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { useGoalStore } from "../../store/useGoalStore";
import { triggerGoalCelebration, triggerSmallCelebration } from "../../utils/confetti";

interface HabitDetailDrawerProps {
	nodeId: string;
}

export const HabitDetailDrawer: React.FC<HabitDetailDrawerProps> = ({ nodeId }) => {
	const nodes = useGoalStore((s) => s.nodes);
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const updateGoal = useGoalStore((s) => s.updateGoal);
	const deleteGoal = useGoalStore((s) => s.deleteGoal);
	const togglePinGoal = useGoalStore((s) => s.togglePinGoal);
	const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);

	const [activeTab, setActiveTab] = useState<"tracker" | "atomic" | "notes">("tracker");

	const node = nodes.find((n) => n.id === nodeId);
	if (!node) return null;

	const data = node.data;
	const habit = data.habit || {
		streak: 0,
		bestStreak: 0,
		completedToday: false,
		frequency: "daily",
		weekHistory: [false, false, false, false, false, false, false],
		targetDays: 21,
		activityLog: {},
		startDate: new Date().toISOString().split("T")[0],
	};

	const targetDays = habit.targetDays || 21;
	const habitProgress = Math.min(100, Math.round((habit.streak / targetDays) * 100));

	// Son 70 günlük (10 hafta) GitHub Contribution Matrisi
	const generateContributionDays = () => {
		const days: { dateStr: string; dayNum: number; count: number; isToday: boolean }[] = [];
		const today = new Date();
		const todayStr = today.toISOString().split("T")[0];

		for (let i = 69; i >= 0; i--) {
			const d = new Date();
			d.setDate(today.getDate() - i);
			const dateStr = d.toISOString().split("T")[0];
			const count = habit.activityLog?.[dateStr] || 0;
			days.push({
				dateStr,
				dayNum: d.getDate(),
				count,
				isToday: dateStr === todayStr,
			});
		}
		return days;
	};

	const contributionDays = generateContributionDays();
	const totalCompletedDays = Object.keys(habit.activityLog || {}).length;

	const handleToggleHabitDay = (dateStr: string) => {
		const currentCount = habit.activityLog?.[dateStr] || 0;
		const updatedLog = { ...(habit.activityLog || {}) };
		const todayStr = new Date().toISOString().split("T")[0];
		const isToday = dateStr === todayStr;

		if (currentCount > 0) {
			delete updatedLog[dateStr];
		} else {
			updatedLog[dateStr] = 1;
			triggerSmallCelebration();
		}

		const newStreak = Object.keys(updatedLog).length;
		const newProgress = Math.min(100, Math.round((newStreak / targetDays) * 100));

		updateGoal(nodeId, {
			progress: newProgress,
			status: isToday && updatedLog[todayStr] ? "completed" : data.status,
			habit: {
				...habit,
				streak: newStreak,
				bestStreak: Math.max(habit.bestStreak || 0, newStreak),
				completedToday: !!updatedLog[todayStr],
				activityLog: updatedLog,
			},
		});
	};

	const handleToggleToday = () => {
		const todayStr = new Date().toISOString().split("T")[0];
		const nextCompleted = !habit.completedToday;
		const updatedLog = { ...(habit.activityLog || {}) };

		if (nextCompleted) {
			updatedLog[todayStr] = 1;
			if ((habit.streak + 1) % 7 === 0) {
				triggerGoalCelebration();
			} else {
				triggerSmallCelebration();
			}
		} else {
			delete updatedLog[todayStr];
		}

		const nextStreak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
		const newProgress = Math.min(100, Math.round((nextStreak / targetDays) * 100));

		updateGoal(nodeId, {
			progress: newProgress,
			status: nextCompleted ? "completed" : "in_progress",
			habit: {
				...habit,
				completedToday: nextCompleted,
				streak: nextStreak,
				bestStreak: Math.max(habit.bestStreak || 0, nextStreak),
				activityLog: updatedLog,
				lastCompletedDate: nextCompleted ? todayStr : null,
			},
		});
	};

	return (
		<div className="fixed inset-y-0 right-0 w-[580px] max-w-full bg-[#F5F0E6] border-l-4 border-black shadow-[8px_0px_0px_0px_#000] z-50 flex flex-col transition-transform duration-200 animate-in slide-in-from-right select-none">
			{/* Drawer Header */}
			<div className="p-4 border-b-4 border-black flex items-center justify-between bg-[#FF6B35] text-white">
				<div className="flex items-center gap-2.5">
					<span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
						<Flame className="w-5 h-5 stroke-[3] text-[#FF6B35]" />
					</span>
					<div>
						<span className="text-xs font-black tracking-wider uppercase block">
							ALIŞKANLIK EDİNME VE TAKİP KARTI
						</span>
						<span className="text-[10px] font-bold opacity-85">
							ATOMIC HABITS & GITHUB STREAK SİSTEMİ
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						onClick={() => togglePinGoal(nodeId)}
						className={`p-2 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
							data.pinned ? "bg-[#FFE600] text-black" : "bg-white text-black"
						}`}
						title={data.pinned ? "Sabitlendi" : "Panoya Sabitle"}
					>
						<Pin className="w-4 h-4 stroke-[2.5]" />
					</button>

					<button
						onClick={() => {
							openConfirmDialog({
								title: "ALIŞKANLIĞI SİL",
								message: `"${data.title}" alışkanlığını silmek istediğinize emin misiniz?`,
								confirmLabel: "EVET, SİL",
								cancelLabel: "VAZGEÇ",
								onConfirm: () => {
									deleteGoal(nodeId);
								},
							});
						}}
						className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-rose-600 hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
						title="Sil"
					>
						<Trash2 className="w-4 h-4 stroke-[2.5]" />
					</button>

					<button
						onClick={() => selectGoal(null)}
						className="p-2 bg-white border-2 border-black rounded-lg text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
						title="Kapat"
					>
						<X className="w-5 h-5 stroke-[3]" />
					</button>
				</div>
			</div>

			{/* Sekmeler (Tabs) */}
			<div className="flex border-b-3 border-black bg-white">
				<button
					onClick={() => setActiveTab("tracker")}
					className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "tracker" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<Activity className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>SERİ & GITHUB GRAFİĞİ</span>
				</button>

				<button
					onClick={() => setActiveTab("atomic")}
					className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "atomic" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>ATOMIC HABITS DÖNGÜSÜ</span>
				</button>

				<button
					onClick={() => setActiveTab("notes")}
					className={`flex-1 py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "notes" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<Layers className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>SÜREÇ NOTLARI</span>
				</button>
			</div>

			{/* Ana Gövde */}
			<div className="flex-1 overflow-y-auto p-6 space-y-5">
				{/* Alışkanlık Başlığı & Açıklama */}
				<div className="space-y-3">
					<div>
						<label className="text-[11px] font-black uppercase block mb-1 text-black">
							ALIŞKANLIK BAŞLIĞI
						</label>
						<input
							type="text"
							value={data.title || ""}
							onChange={(e) => updateGoal(nodeId, { title: e.target.value.toUpperCase() })}
							placeholder="ÖRN: HER GÜN 20 SAYFA KİTAP OKUMA..."
							className="w-full text-base font-black uppercase bg-white border-3 border-black rounded-xl p-3 outline-none text-black shadow-[3px_3px_0px_0px_#000]"
						/>
					</div>

					<div>
						<label className="text-[11px] font-black uppercase block mb-1 text-black">
							HEDEF & MOTİVASYON AÇIKLAMASI
						</label>
						<textarea
							value={data.description || ""}
							onChange={(e) => updateGoal(nodeId, { description: e.target.value })}
							placeholder="Bu alışkanlığı neden kazanmak istiyorsun? Sana ne katacak?"
							rows={2}
							className="w-full text-xs font-bold text-black bg-white border-3 border-black rounded-xl p-2.5 resize-none outline-none shadow-[3px_3px_0px_0px_#000]"
						/>
					</div>
				</div>

				{/* 1. SEKME: SERİ TAKİBİ & GITHUB GRAFİĞİ */}
				{activeTab === "tracker" && (
					<div className="space-y-4 animate-in fade-in duration-200">
						{/* Bugün Tamamlama ve Seri Kartı */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
							<div className="flex items-center justify-between flex-wrap gap-2">
								<div className="flex items-center gap-2">
									<div className="p-2 bg-[#FF6B35] text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
										<Flame className="w-5 h-5 stroke-[3]" />
									</div>
									<div>
										<span className="text-[10px] font-black uppercase text-stone-500 block">
											MEVCUT SERİ
										</span>
										<span className="text-xl font-black text-black">
											{habit.streak} GÜN ARALIKSIZ
										</span>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-[10px] font-black uppercase px-2 py-1 bg-stone-100 border border-black rounded-lg">
										EN İYİ SERİ: {habit.bestStreak || habit.streak} GÜN
									</span>
									<span className="text-[10px] font-black uppercase px-2 py-1 bg-[#22C55E]/20 border border-black rounded-lg text-emerald-800">
										TOPLAM: {totalCompletedDays} GÜN
									</span>
								</div>
							</div>

							{/* Hızlı Bugün Tamamla Butonu */}
							<button
								onClick={handleToggleToday}
								className={`w-full py-3 px-4 border-3 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
									habit.completedToday
										? "bg-[#22C55E] text-black shadow-none translate-x-[2px] translate-y-[2px]"
										: "bg-[#FFE600] hover:bg-[#ffd900] text-black"
								}`}
							>
								{habit.completedToday ? (
									<>
										<Check className="w-4 h-4 stroke-[3]" />
										<span>BUGÜN BAŞARIYLA TAMAMLANDI</span>
									</>
								) : (
									<>
										<RotateCcw className="w-4 h-4 stroke-[2.5]" />
										<span>BUGÜN İÇİN ALIŞKANLIĞI TAMAMLA</span>
									</>
								)}
							</button>
						</div>

						{/* HEDEF SÜREYE GÖRE TAKİP (21 Gün / 30 Gün / 66 Gün / 90 Gün) */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Trophy className="w-4 h-4 stroke-[3] text-[#FFE600]" />
									<span className="text-xs font-black uppercase">
										HEDEF SÜRE VE ALIŞKANLIK KAZANIMI
									</span>
								</div>
								<span className="px-2 py-0.5 bg-[#FFE600] border-2 border-black rounded-md font-black text-xs shadow-[2px_2px_0px_0px_#000]">
									%{habitProgress}
								</span>
							</div>

							<div className="h-4 w-full bg-[#F5F0E6] border-2 border-black p-0.5 rounded-lg overflow-hidden">
								<div
									className="h-full bg-[#22C55E] border-r-2 border-black transition-all duration-300 rounded-sm"
									style={{ width: `${habitProgress}%` }}
								/>
							</div>

							<div className="flex items-center justify-between text-[11px] font-black uppercase text-stone-600">
								<span>Tamamlanan: {habit.streak} Gün</span>
								<span>Hedef: {targetDays} Gün</span>
							</div>

							<div className="grid grid-cols-4 gap-1.5">
								{[
									{ days: 21, label: "21 Gün (Kıvılcım)" },
									{ days: 30, label: "30 Gün (Aylık)" },
									{ days: 66, label: "66 Gün (Kalıcı)" },
									{ days: 90, label: "90 Gün (Mastery)" },
								].map((preset) => (
									<button
										key={preset.days}
										onClick={() => {
											updateGoal(nodeId, {
												habit: {
													...habit,
													targetDays: preset.days,
												},
												progress: Math.min(100, Math.round((habit.streak / preset.days) * 100)),
											});
										}}
										className={`px-2 py-1.5 border-2 border-black rounded-xl text-[10px] font-black uppercase transition-all ${
											targetDays === preset.days
												? "bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000] -translate-y-0.5"
												: "bg-white hover:bg-[#F5F0E6] text-stone-700 shadow-[1px_1px_0px_0px_#000]"
										}`}
									>
										{preset.label}
									</button>
								))}
							</div>
						</div>

						{/* GITHUB STYLE CONTRIBUTION HEATMAP */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-2.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Activity className="w-4 h-4 stroke-[3] text-black" />
									<span className="text-xs font-black uppercase">
										GITHUB AKTİVİTE & TUTARLILIK GRAFİĞİ
									</span>
								</div>
								<span className="text-[10px] font-bold text-stone-500">Son 10 Hafta (70 Gün)</span>
							</div>
							<p className="text-[11px] font-bold text-stone-600 leading-snug">
								Her kutu 1 günü temsil eder. Geçmiş günleri işaretlemek veya kaldırmak için
								tıklayabilirsiniz:
							</p>

							<div className="p-3 bg-[#F5F0E6] border-2 border-black rounded-xl">
								<div className="grid grid-rows-7 grid-flow-col gap-1.5 justify-center">
									{contributionDays.map((d) => {
										const isDone = d.count > 0;
										return (
											<button
												key={d.dateStr}
												onClick={() => handleToggleHabitDay(d.dateStr)}
												title={`${d.dateStr}: ${isDone ? "Tamamlandı" : "Yapılmadı"} (Tıkla)`}
												className={`w-5 h-5 rounded border border-black transition-all ${
													isDone
														? "bg-[#22C55E] hover:scale-125 hover:z-10"
														: "bg-white hover:bg-stone-200"
												} ${d.isToday ? "ring-2 ring-[#FF6B35]" : ""}`}
											/>
										);
									})}
								</div>

								<div className="flex items-center justify-between pt-2.5 mt-2 border-t border-black/10 text-[9px] font-black uppercase text-stone-500">
									<span>← 70 Gün Önce</span>
									<div className="flex items-center gap-1.5">
										<span>Boş</span>
										<span className="w-3 h-3 bg-white border border-black rounded" />
										<span className="w-3 h-3 bg-[#22C55E] border border-black rounded" />
										<span>Dolu</span>
									</div>
									<span>Bugün (Turuncu) →</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 2. SEKME: ATOMIC HABITS DÖNGÜSÜ */}
				{activeTab === "atomic" && (
					<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3 animate-in fade-in duration-200">
						<div className="flex items-center gap-1.5">
							<Sparkles className="w-4 h-4 stroke-[3] text-[#FF3399]" />
							<span className="text-xs font-black uppercase">ATOMIC HABITS ALIŞKANLIK DÖNGÜSÜ</span>
						</div>

						<div className="space-y-3">
							<div>
								<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
									1. TETİKLEYİCİ // İŞARET (Ne zaman & Nerede yapacaksın?)
								</label>
								<input
									type="text"
									value={habit.cue || ""}
									onChange={(e) => {
										updateGoal(nodeId, {
											habit: { ...habit, cue: e.target.value },
										});
									}}
									placeholder="Örn: Sabah kahvemi içer içmez..."
									className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
								/>
							</div>

							<div>
								<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
									2. RUTİN // EYLEM (Tam olarak ne yapacaksın?)
								</label>
								<input
									type="text"
									value={habit.routine || ""}
									onChange={(e) => {
										updateGoal(nodeId, {
											habit: { ...habit, routine: e.target.value },
										});
									}}
									placeholder="Örn: 20 sayfa kitap okuyacağım..."
									className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
								/>
							</div>

							<div>
								<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
									3. ÖDÜL // KUTLAMA (Kendini nasıl ödüllendireceksin?)
								</label>
								<input
									type="text"
									value={habit.reward || ""}
									onChange={(e) => {
										updateGoal(nodeId, {
											habit: { ...habit, reward: e.target.value },
										});
									}}
									placeholder="Örn: Listeye yeşil kutucuk ekleyip sevdiğim podcasti açacağım..."
									className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
								/>
							</div>
						</div>
					</div>
				)}

				{/* 3. SEKME: SÜREÇ NOTLARI */}
				{activeTab === "notes" && (
					<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-2 animate-in fade-in duration-200">
						<label className="text-xs font-black uppercase block">
							SÜREÇ & GELİŞİM NOTLARI (Zorlandığın anlar, çözümler)
						</label>
						<textarea
							value={habit.stagesNotes || ""}
							onChange={(e) => {
								updateGoal(nodeId, {
									habit: { ...habit, stagesNotes: e.target.value },
								});
							}}
							rows={6}
							placeholder="Örn: İlk 3 gün zorlandım ancak masanın üstüne hatırlatıcı koymak süreci çok kolaylaştırdı..."
							className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-3 resize-none outline-none focus:bg-white shadow-inner"
						/>
					</div>
				)}
			</div>
		</div>
	);
};
