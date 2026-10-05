import {
	Activity,
	Check,
	FileText,
	Flame,
	Image,
	Link as LinkIcon,
	ListTodo,
	Palette,
	Plus,
	RotateCcw,
	Sparkles,
	Target,
	Trash2,
	TrendingUp,
	Trophy,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { useGoalStore } from "../../store/useGoalStore";
import { GoalCategory, GoalPriority, GoalStatus } from "../../types/goal";
import { triggerSmallCelebration } from "../../utils/confetti";
import { DRAWER_CONFIG, clampCanvasPosition } from "../../constants/canvas";
import { RichTextEditor } from "./RichTextEditor";

const KEEP_COLORS = [
	{ hex: "#FFFFFF", label: "Beyaz" },
	{ hex: "#D9F99D", label: "Pastel Yeşil" },
	{ hex: "#FED7AA", label: "Pastel Somon" },
	{ hex: "#FBCFE8", label: "Pastel Pembe" },
	{ hex: "#C084FC", label: "Pastel Mor" },
	{ hex: "#00C2CB", label: "Canlı Teal" },
	{ hex: "#FFE600", label: "Güneş Sarısı" },
];

export const GoalDetailDrawer: React.FC = () => {
	const selectedGoalId = useGoalStore((s) => s.selectedGoalId);
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const nodes = useGoalStore((s) => s.nodes);
	const updateGoal = useGoalStore((s) => s.updateGoal);
	const deleteGoal = useGoalStore((s) => s.deleteGoal);
	const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);
	const updateProgress = useGoalStore((s) => s.updateProgress);
	const addSubTask = useGoalStore((s) => s.addSubTask);
	const toggleSubTask = useGoalStore((s) => s.toggleSubTask);
	const deleteSubTask = useGoalStore((s) => s.deleteSubTask);
	const addMilestone = useGoalStore((s) => s.addMilestone);
	const linkGoals = useGoalStore((s) => s.linkGoals);

	const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "habit" | "media" | "links">(
		"notes",
	);
	const [newTaskInput, setNewTaskInput] = useState("");
	const [coverInput, setCoverInput] = useState("");

	const currentNode = selectedGoalId ? nodes.find((n) => n.id === selectedGoalId) : null;
	const data = currentNode?.data;
	const isHabit = !!(
		data &&
		(data.moduleType === "habit" || currentNode?.type === "habitNode" || !!data.habit)
	);

	// Alışkanlık kartı açıldığında doğrudan alışkanlık sekmesini aç
	React.useEffect(() => {
		if (!selectedGoalId || !currentNode) return;
		if (isHabit) {
			setActiveTab("habit");
		} else {
			setActiveTab("notes");
		}
	}, [selectedGoalId, isHabit, currentNode]);

	if (!selectedGoalId || !currentNode || !data) return null;

	const handleAddTask = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTaskInput.trim()) return;
		addSubTask(selectedGoalId, newTaskInput.trim());
		setNewTaskInput("");
	};

	const handleSetCover = (e: React.FormEvent) => {
		e.preventDefault();
		updateGoal(selectedGoalId, { coverImage: coverInput });
		setCoverInput("");
	};

	const otherGoals = nodes.filter((n) => n.id !== selectedGoalId && n.type === "goalNode");
	const childNodes = nodes.filter((n) => n.data.parentId === selectedGoalId);

	// Alışkanlık verileri
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

	// Son 70 günlük (10 hafta) GitHub Contribution Matrisi Oluşturucu
	const generateContributionDays = () => {
		const days: { dateStr: string; dayNum: number; count: number; isToday: boolean }[] = [];
		const today = new Date();
		const todayStr = today.toISOString().split("T")[0];

		// Son 70 gün (geriden bugüne)
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

		updateGoal(selectedGoalId, {
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
			triggerSmallCelebration();
		} else {
			delete updatedLog[todayStr];
		}

		const nextStreak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
		const newProgress = Math.min(100, Math.round((nextStreak / targetDays) * 100));

		updateGoal(selectedGoalId, {
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
			{/* Drawer Üst Bar */}
			<div
				className={`p-4 border-b-4 border-black flex items-center justify-between ${isHabit ? "bg-[#FF6B35] text-white" : "bg-[#FFE600] text-black"}`}
			>
				<div className="flex items-center gap-2.5">
					<span className="p-2 bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] rounded-lg">
						{isHabit ? (
							<Flame className="w-5 h-5 stroke-[3] text-[#FF6B35]" />
						) : (
							<Target className="w-5 h-5 stroke-[3]" />
						)}
					</span>
					<div>
						<span className="text-xs font-black tracking-wider uppercase block">
							{isHabit ? "ALIŞKANLIK EDİNME VE TAKİP KARTI" : "HEDEF VE STRATEJİ DETAYI"}
						</span>
						<span className="text-[10px] font-bold opacity-80">
							{isHabit ? "ATOMIC HABITS & GITHUB STREAK SİSTEMİ" : "PLANLAMA VE NOT DEFTERİ"}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						onClick={() => {
							if (!selectedGoalId) return;
							openConfirmDialog({
								title: isHabit ? "ALIŞKANLIĞI SİL" : "HEDEFİ SİL",
								message: `"${data?.title || "Bu öğeyi"}" silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
								confirmLabel: "EVET, SİL",
								cancelLabel: "VAZGEÇ",
								onConfirm: () => {
									deleteGoal(selectedGoalId);
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
			<div className="flex border-b-3 border-black bg-white overflow-x-auto">
				{isHabit && (
					<button
						onClick={() => setActiveTab("habit")}
						className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
							activeTab === "habit" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
						}`}
					>
						<Activity className="w-3.5 h-3.5 stroke-[2.5]" />
						<span>ALIŞKANLIK & AKTİVİTE</span>
					</button>
				)}

				<button
					onClick={() => setActiveTab("notes")}
					className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "notes" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<FileText className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>NOTLAR</span>
				</button>

				<button
					onClick={() => setActiveTab("tasks")}
					className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "tasks" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<ListTodo className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>EYLEMLER</span>
				</button>

				<button
					onClick={() => setActiveTab("media")}
					className={`flex-1 py-2.5 px-3 border-r-2 border-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "media" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<Image className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>GÖRSEL</span>
				</button>

				<button
					onClick={() => setActiveTab("links")}
					className={`flex-1 py-2.5 px-3 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
						activeTab === "links" ? "bg-[#FFE600] shadow-inner" : "hover:bg-[#F5F0E6]"
					}`}
				>
					<LinkIcon className="w-3.5 h-3.5 stroke-[2.5]" />
					<span>BAĞLANTILAR</span>
				</button>
			</div>

			{/* Kaydırılabilir İçerik Alanı */}
			<div className="flex-1 overflow-y-auto p-6 space-y-5">
				{/* Başlık ve Açıklama */}
				<div className="space-y-3">
					<div>
						<label className="text-[11px] font-black uppercase block mb-1">HEDEF BAŞLIĞI</label>
						<input
							type="text"
							value={data.title || ""}
							onChange={(e) => updateGoal(selectedGoalId, { title: e.target.value })}
							placeholder="HEDEF BAŞLIĞI GİRİNİZ..."
							className="w-full text-base font-black uppercase bg-white border-3 border-black rounded-xl p-3 outline-none text-black shadow-[3px_3px_0px_0px_#000]"
						/>
					</div>

					<div>
						<label className="text-[11px] font-black uppercase block mb-1">
							STRATEJİK AÇIKLAMA
						</label>
						<textarea
							value={data.description || ""}
							onChange={(e) => updateGoal(selectedGoalId, { description: e.target.value })}
							placeholder="Hedefin amacı ve motivasyonu..."
							rows={2}
							className="w-full text-xs font-bold text-black bg-white border-3 border-black rounded-xl p-2.5 resize-none outline-none shadow-[3px_3px_0px_0px_#000]"
						/>
					</div>
				</div>

				{/* Durum & Kategori & Notion Öncelik Grid */}
				<div className="grid grid-cols-3 gap-2.5">
					<div>
						<label className="text-[10px] font-black uppercase block mb-1">DURUM</label>
						<select
							value={data.status}
							onChange={(e) => updateGoal(selectedGoalId, { status: e.target.value as GoalStatus })}
							className="w-full bg-white border-2 border-black rounded-lg p-2 text-xs font-black uppercase outline-none shadow-[2px_2px_0px_0px_#000]"
						>
							<option value="not_started">BAŞLAMADI</option>
							<option value="in_progress">DEVAM EDİYOR</option>
							<option value="completed">TAMAMLANDI</option>
							<option value="on_hold">BEKLEMEDE</option>
						</select>
					</div>

					<div>
						<label className="text-[10px] font-black uppercase block mb-1">KATEGORİ</label>
						<select
							value={data.category}
							onChange={(e) =>
								updateGoal(selectedGoalId, { category: e.target.value as GoalCategory })
							}
							className="w-full bg-white border-2 border-black rounded-lg p-2 text-xs font-black uppercase outline-none shadow-[2px_2px_0px_0px_#000]"
						>
							<option value="career">KARİYER // İŞ</option>
							<option value="health">SAĞLIK // SPOR</option>
							<option value="finance">FİNANS</option>
							<option value="education">EĞİTİM // KİTAP</option>
							<option value="personal">KİŞİSEL GELİŞİM</option>
							<option value="creative">YARATICI PROJE</option>
						</select>
					</div>

					<div>
						<label className="text-[10px] font-black uppercase block mb-1">ÖNCELİK SEVİYESİ</label>
						<select
							value={data.priority || "p2_medium"}
							onChange={(e) =>
								updateGoal(selectedGoalId, { priority: e.target.value as GoalPriority })
							}
							className="w-full bg-white border-2 border-black rounded-lg p-2 text-xs font-black uppercase outline-none shadow-[2px_2px_0px_0px_#000]"
						>
							<option value="p1_high">P1 // ACİL</option>
							<option value="p2_medium">P2 // NORMAL</option>
							<option value="p3_low">P3 // DÜŞÜK</option>
						</select>
					</div>
				</div>

				{/* 0. SEKME: ALIŞKANLIK EDİNME SÜRECİ & GITHUB AKTİVİTE GRAFİĞİ */}
				{isHabit && activeTab === "habit" && (
					<div className="space-y-4 animate-in fade-in duration-200">
						{/* Bugün Tamamlama ve Seri Özeti Kartı */}
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

						{/* HEDEF SÜREYE GÖRE TAKİP (21 Gün / 30 Gün / 66 Gün / 90 Gün Alışkanlık Kazanımı) */}
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

							{/* İlerleme Çubuğu */}
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

							{/* Hedef Süre Seçici Butonları */}
							<div>
								<span className="text-[10px] font-black uppercase text-stone-500 block mb-1.5">
									HEDEF SÜRE SEÇ:
								</span>
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
												updateGoal(selectedGoalId, {
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
						</div>

						{/* GITHUB STYLE ACTIVITY CONTRIBUTION HEATMAP (Son 70 Gün) */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-2.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Activity className="w-4 h-4 stroke-[3] text-black" />
									<span className="text-xs font-black uppercase">
										GITHUB AKTİVİTE VE TUTARLILIK GRAFİĞİ
									</span>
								</div>
								<span className="text-[10px] font-bold text-stone-500">Son 10 Hafta (70 Gün)</span>
							</div>
							<p className="text-[11px] font-bold text-stone-600 leading-snug">
								Her bir kutucuk bir günü temsil eder. Geçmiş günleri işaretlemek veya kaldırmak için
								kutucuklara tıklayabilirsiniz:
							</p>

							{/* GitHub 7x10 Grid */}
							<div className="p-3 bg-[#F5F0E6] border-2 border-black rounded-xl">
								<div className="grid grid-rows-7 grid-flow-col gap-1.5 justify-center">
									{contributionDays.map((d) => {
										const isDone = d.count > 0;
										return (
											<button
												key={d.dateStr}
												onClick={() => handleToggleHabitDay(d.dateStr)}
												title={`${d.dateStr}: ${isDone ? "Tamamlandı" : "Yapılmadı"} (Değiştirmek için tıkla)`}
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
										<span>Az</span>
										<span className="w-3 h-3 bg-white border border-black rounded" />
										<span className="w-3 h-3 bg-[#22C55E] border border-black rounded" />
										<span>Çok</span>
									</div>
									<span>Bugün (Turuncu Halkalı) →</span>
								</div>
							</div>
						</div>

						{/* ATOMIC HABITS ALIŞKANLIK DÖNGÜSÜ (Tetikleyici - Rutin - Ödül) */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
							<div className="flex items-center gap-1.5">
								<Sparkles className="w-4 h-4 stroke-[3] text-[#FF3399]" />
								<span className="text-xs font-black uppercase">
									ALIŞKANLIK EDİNME SÜRECİ & ATOMIC DÖNGÜ
								</span>
							</div>

							<div className="space-y-2.5">
								{/* 1. Tetikleyici / İşaret */}
								<div>
									<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
										1. TETİKLEYİCİ // İŞARET (Ne zaman & Nerede yapacaksın?)
									</label>
									<input
										type="text"
										value={habit.cue || ""}
										onChange={(e) => {
											updateGoal(selectedGoalId, {
												habit: { ...habit, cue: e.target.value },
											});
										}}
										placeholder="Örn: Sabah kahvemi içtikten hemen sonra..."
										className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
									/>
								</div>

								{/* 2. Rutin / Eylem */}
								<div>
									<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
										2. RUTİN // EYLEM (Tam olarak ne yapacaksın?)
									</label>
									<input
										type="text"
										value={habit.routine || ""}
										onChange={(e) => {
											updateGoal(selectedGoalId, {
												habit: { ...habit, routine: e.target.value },
											});
										}}
										placeholder="Örn: 20 sayfa kitap okuyacağım / 10 dakika esneme yapacağım..."
										className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
									/>
								</div>

								{/* 3. Ödül */}
								<div>
									<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
										3. ÖDÜL // KUTLAMA (Kendini nasıl ödüllendireceksin?)
									</label>
									<input
										type="text"
										value={habit.reward || ""}
										onChange={(e) => {
											updateGoal(selectedGoalId, {
												habit: { ...habit, reward: e.target.value },
											});
										}}
										placeholder="Örn: Günlük hedefe bir çentik atıp sevdiğim müziği dinleyeceğim..."
										className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 outline-none focus:bg-white"
									/>
								</div>
							</div>
						</div>

						{/* ALIŞKANLIK SÜREÇ DENEYİM NOTLARI */}
						<div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
							<label className="text-xs font-black uppercase block">
								SÜREÇ & GELİŞİM NOTLARI (Zorlandığın anlar, çözümler)
							</label>
							<textarea
								value={habit.stagesNotes || ""}
								onChange={(e) => {
									updateGoal(selectedGoalId, {
										habit: { ...habit, stagesNotes: e.target.value },
									});
								}}
								rows={3}
								placeholder="Örn: İlk 3 gün zorlandım ancak masanın üstüne hatırlatıcı koymak süreci çok kolaylaştırdı..."
								className="w-full text-xs font-bold bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 resize-none outline-none focus:bg-white shadow-inner"
							/>
						</div>
					</div>
				)}

				{/* 1. SEKME: NOTLAR & EVERNOTE EDITÖR */}
				{activeTab === "notes" && (
					<div className="space-y-3 animate-in fade-in duration-200">
						<h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
							<FileText className="w-4 h-4 stroke-[3]" />
							ZENGİN STRATEJİ DEFTERİ
						</h4>

						<RichTextEditor
							content={data.richNotes || ""}
							onChange={(html) => updateGoal(selectedGoalId, { richNotes: html })}
						/>
					</div>
				)}

				{/* 2. SEKME: EYLEM ADIMLARI & METRİK */}
				{activeTab === "tasks" && (
					<div className="space-y-4 animate-in fade-in duration-200">
						{/* İlerleme Kaydırıcısı */}
						<div className="bg-white border-3 border-black rounded-xl p-4 space-y-2.5 shadow-[4px_4px_0px_0px_#000]">
							<div className="flex justify-between items-center text-xs font-black uppercase">
								<span className="flex items-center gap-1.5">
									<TrendingUp className="w-4 h-4 stroke-[3]" />
									İLERLEME SKORU
								</span>
								<span className="px-2 py-0.5 bg-[#FFE600] border-2 border-black rounded-md font-black text-xs shadow-[2px_2px_0px_0px_#000]">
									%{data.progress}
								</span>
							</div>

							<input
								type="range"
								min="0"
								max="100"
								value={data.progress || 0}
								onChange={(e) => updateProgress(selectedGoalId, Number(e.target.value))}
								className="w-full accent-black bg-[#F5F0E6] border-2 border-black h-3 cursor-pointer"
							/>
						</div>

						{/* Sayısal Metrik Takibi */}
						<div className="bg-white border-3 border-black rounded-xl p-4 space-y-2.5 shadow-[4px_4px_0px_0px_#000]">
							<div className="flex justify-between items-center text-xs font-black uppercase">
								<span>ÖLÇÜLEBİLİR METRİK</span>
								<span className="text-[10px] text-stone-600">Örn: 10 KM Koşu</span>
							</div>

							<div className="grid grid-cols-3 gap-2">
								<div>
									<label className="text-[10px] font-black uppercase block mb-1">MEVCUT</label>
									<input
										type="number"
										value={data.metric?.current || 0}
										onChange={(e) =>
											updateGoal(selectedGoalId, {
												metric: {
													current: Number(e.target.value),
													target: data.metric?.target || 10,
													unit: data.metric?.unit || "Adet",
												},
											})
										}
										className="w-full bg-[#F5F0E6] border-2 border-black rounded-lg p-2 text-xs font-black outline-none"
									/>
								</div>
								<div>
									<label className="text-[10px] font-black uppercase block mb-1">HEDEF</label>
									<input
										type="number"
										value={data.metric?.target || 10}
										onChange={(e) =>
											updateGoal(selectedGoalId, {
												metric: {
													current: data.metric?.current || 0,
													target: Number(e.target.value),
													unit: data.metric?.unit || "Adet",
												},
											})
										}
										className="w-full bg-[#F5F0E6] border-2 border-black rounded-lg p-2 text-xs font-black outline-none"
									/>
								</div>
								<div>
									<label className="text-[10px] font-black uppercase block mb-1">BİRİM</label>
									<input
										type="text"
										value={data.metric?.unit || "Adet"}
										onChange={(e) =>
											updateGoal(selectedGoalId, {
												metric: {
													current: data.metric?.current || 0,
													target: data.metric?.target || 10,
													unit: e.target.value,
												},
											})
										}
										className="w-full bg-[#F5F0E6] border-2 border-black rounded-lg p-2 text-xs font-black outline-none"
									/>
								</div>
							</div>
						</div>

						{/* Checklist */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
									<ListTodo className="w-4 h-4 stroke-[3]" />
									EYLEM ADIMLARI
								</h4>
								<span className="text-xs font-black px-2 py-0.5 bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_#000]">
									{(data.tasks || []).filter((t: any) => t.completed).length} /{" "}
									{(data.tasks || []).length} BİTTİ
								</span>
							</div>

							<form onSubmit={handleAddTask} className="flex gap-2">
								<input
									type="text"
									value={newTaskInput}
									onChange={(e) => setNewTaskInput(e.target.value)}
									placeholder="YENİ ADIM..."
									className="flex-1 bg-white border-3 border-black rounded-xl p-2.5 text-xs font-black outline-none shadow-[3px_3px_0px_0px_#000]"
								/>
								<button
									type="submit"
									className="px-4 py-2.5 bg-[#FFE600] border-3 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1"
								>
									<Plus className="w-4 h-4 stroke-[3]" />
									EKLE
								</button>
							</form>

							<div className="space-y-2">
								{(data.tasks || []).map((task: any) => (
									<div
										key={task.id}
										className="flex items-center justify-between p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] group"
									>
										<label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
											<input
												type="checkbox"
												checked={task.completed}
												onChange={() => toggleSubTask(selectedGoalId, task.id)}
												className="w-4 h-4 border-2 border-black rounded-md accent-black cursor-pointer"
											/>
											<span
												className={`text-xs font-bold ${task.completed ? "line-through opacity-50" : "text-black"}`}
											>
												{task.title}
											</span>
										</label>

										<button
											onClick={() => deleteSubTask(selectedGoalId, task.id)}
											className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#FF6B35] hover:text-white border border-black rounded-md transition-all"
										>
											<Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* 3. SEKME: GÖRSEL & MILANOTE MOODBOARD */}
				{activeTab === "media" && (
					<div className="space-y-4 animate-in fade-in duration-200">
						{/* Kart Rengi Seçici */}
						<div className="bg-white border-3 border-black rounded-xl p-4 space-y-2.5 shadow-[4px_4px_0px_0px_#000]">
							<h4 className="text-xs font-black uppercase flex items-center gap-1.5">
								<Palette className="w-4 h-4 stroke-[3]" />
								KART ZEMİN RENGİ
							</h4>

							<div className="flex items-center gap-2 pt-1">
								{KEEP_COLORS.map((c) => (
									<button
										key={c.hex}
										onClick={() => updateGoal(selectedGoalId, { cardColor: c.hex })}
										className={`w-8 h-8 rounded-xl border-3 border-black transition-transform flex items-center justify-center ${
											(data.cardColor || "#FFFFFF") === c.hex
												? "scale-110 shadow-[2px_2px_0px_0px_#000]"
												: "hover:scale-105"
										}`}
										style={{ backgroundColor: c.hex }}
										title={c.label}
									>
										{(data.cardColor || "#FFFFFF") === c.hex && (
											<Check className="w-4 h-4 stroke-[3] text-black" />
										)}
									</button>
								))}
							</div>
						</div>

						{/* Kapak Görseli */}
						<div className="bg-white border-3 border-black rounded-xl p-4 space-y-3 shadow-[4px_4px_0px_0px_#000]">
							<h4 className="text-xs font-black uppercase flex items-center gap-1.5">
								<Image className="w-4 h-4 stroke-[3]" />
								KAPAK GÖRSELİ (URL)
							</h4>

							{data.coverImage && (
								<div className="w-full h-36 rounded-xl border-2 border-black overflow-hidden relative">
									<img src={data.coverImage} alt="Kapak" className="w-full h-full object-cover" />
									<button
										onClick={() => updateGoal(selectedGoalId, { coverImage: "" })}
										className="absolute top-2 right-2 p-1.5 bg-white border-2 border-black rounded-lg text-black hover:bg-rose-500 hover:text-white"
										title="Görseli Kaldır"
									>
										<Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
									</button>
								</div>
							)}

							<form onSubmit={handleSetCover} className="flex gap-2">
								<input
									type="url"
									value={coverInput}
									onChange={(e) => setCoverInput(e.target.value)}
									placeholder="https://images.unsplash.com/... görsel bağlantısı"
									className="flex-1 bg-[#F5F0E6] border-2 border-black rounded-xl p-2.5 text-xs font-bold outline-none"
								/>
								<button
									type="submit"
									className="px-4 py-2.5 bg-[#00C2CB] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]"
								>
									AYARLA
								</button>
							</form>
						</div>
					</div>
				)}

				{/* 4. SEKME: BAĞLANTILAR */}
				{activeTab === "links" && (
					<div className="space-y-4 animate-in fade-in duration-200">
						{/* Diğer Hedeflerle Çift Yönlü Bağlantı Kur */}
						<div className="bg-white border-3 border-black rounded-xl p-4 space-y-3 shadow-[4px_4px_0px_0px_#000]">
							<h4 className="text-xs font-black uppercase flex items-center gap-1.5">
								<LinkIcon className="w-4 h-4 stroke-[3]" />
								İLİŞKİLİ HEDEFLER & BAĞLANTILAR
							</h4>
							<p className="text-[11px] font-bold text-stone-600">
								Seçtiğiniz hedefe anında tuval üzerinde kalın siyah bağlantı oku çekilir.
							</p>

							<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
								{otherGoals.map((g) => (
									<div
										key={g.id}
										className="p-2.5 bg-[#F5F0E6] border-2 border-black rounded-xl flex items-center justify-between text-xs"
									>
										<span className="font-black uppercase truncate max-w-[280px]">
											{g.data.title}
										</span>
										<button
											onClick={() => linkGoals(selectedGoalId, g.id)}
											className="px-2.5 py-1 bg-[#FFE600] border border-black rounded-lg font-black text-[10px] uppercase shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
										>
											BAĞLA
										</button>
									</div>
								))}
							</div>
						</div>

						{/* Bağlı Alt Aşamalar */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-black uppercase">BAĞLI ALT AŞAMALAR</h4>
								<button
									onClick={(e) => {
										// Get button position and drawer width from DOM
										const button = e.currentTarget as HTMLElement;
										const rect = button.getBoundingClientRect();

										// Read drawer width from the drawer element
										const drawerElement = document.querySelector('.fixed.inset-y-0.right-0.w-\\[580px\\]');
										const drawerWidth = drawerElement
											? drawerElement.clientWidth
											: DRAWER_CONFIG.WIDTH;

										// Calculate position on canvas, offsetting from button
										// Position to the left of the drawer, at button height
										const xPos = clampCanvasPosition(
											rect.left - drawerWidth / 2 + DRAWER_CONFIG.DROPDOWN_OFFSET_X,
											true
										);
										const yPos = clampCanvasPosition(
											rect.top + DRAWER_CONFIG.DROPDOWN_OFFSET_Y,
											false
										);

										addMilestone("YENİ AŞAMA", selectedGoalId, { x: xPos, y: yPos });
									}}
									className="text-xs font-black uppercase bg-[#00C2CB] border-2 border-black rounded-lg px-2 py-0.5 shadow-[2px_2px_0px_0px_#000] hover:bg-[#00b3bb] active:shadow-none transition-all"
									title="Tıklanan konumun yakınında yeni aşama oluştur"
								>
									+ AŞAMA
								</button>
							</div>

							<div className="space-y-2">
								{childNodes.map((child) => (
									<div
										key={child.id}
										onClick={() => selectGoal(child.id)}
										className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center justify-between text-xs cursor-pointer hover:bg-[#F5F0E6]"
									>
										<span className="font-black uppercase">{child.data.title}</span>
										<span className="px-2 py-0.5 bg-[#FFE600] border border-black rounded-md font-black">
											%{child.data.progress}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
