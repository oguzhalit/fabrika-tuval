import {
	Download,
	Flag,
	Flame,
	Kanban,
	Layers,
	LayoutGrid,
	PenTool,
	RotateCcw,
	StickyNote,
	Target,
	Upload,
} from "lucide-react";
import React, { useRef } from "react";
import { clampCanvasPosition, TOOLBAR_CONFIG } from "../../constants/canvas";
import { useGoalStore } from "../../store/useGoalStore";
import { ActiveOSView } from "../../types/goal";
import { triggerGoalCelebration } from "../../utils/confetti";
import { CanvasTabBar } from "./CanvasTabBar";

interface ToolbarProps {
	onToggleGoalBox: () => void;
	isGoalBoxOpen: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onToggleGoalBox, isGoalBoxOpen }) => {
	const addGoal = useGoalStore((s) => s.addGoal);
	const addStickyNote = useGoalStore((s) => s.addStickyNote);
	const addMilestone = useGoalStore((s) => s.addMilestone);
	const activeView = useGoalStore((s) => s.activeView);
	const setActiveView = useGoalStore((s) => s.setActiveView);
	const resetToTemplate = useGoalStore((s) => s.resetToTemplate);
	const isDrawingMode = useGoalStore((s) => s.isDrawingMode);
	const toggleDrawingMode = useGoalStore((s) => s.toggleDrawingMode);
	const nodes = useGoalStore((s) => s.nodes);
	const edges = useGoalStore((s) => s.edges);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const goalNodes = nodes.filter((n) => n.type === "goalNode");
	const completedGoals = goalNodes.filter((n) => n.data.status === "completed");
	const overallProgress =
		goalNodes.length > 0
			? Math.round(goalNodes.reduce((acc, n) => acc + (n.data.progress || 0), 0) / goalNodes.length)
			: 0;

	const handleExport = () => {
		const dataStr =
			"data:text/json;charset=utf-8," +
			encodeURIComponent(
				JSON.stringify(
					{
						nodes,
						edges,
						drawingStrokes: useGoalStore.getState().drawingStrokes,
					},
					null,
					2,
				),
			);
		const downloadAnchor = document.createElement("a");
		downloadAnchor.setAttribute("href", dataStr);
		downloadAnchor.setAttribute(
			"download",
			`tuval-yedek-${new Date().toISOString().slice(0, 10)}.json`,
		);
		document.body.appendChild(downloadAnchor);
		downloadAnchor.click();
		downloadAnchor.remove();
	};

	const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const parsed = JSON.parse(event.target?.result as string);
				if (parsed.nodes && parsed.edges) {
					useGoalStore.setState({
						nodes: parsed.nodes,
						edges: parsed.edges,
						drawingStrokes: parsed.drawingStrokes || [],
					});
					triggerGoalCelebration();
				}
			} catch {
				alert("Geçersiz dosya formatı.");
			}
		};
		reader.readAsText(file);
	};

	const navViews: { id: ActiveOSView; label: string; icon: React.ReactNode; color: string }[] = [
		{
			id: "canvas",
			label: "TUVAL",
			icon: <LayoutGrid className="w-3.5 h-3.5 stroke-[2.5]" />,
			color: "bg-[#FFE600]",
		},
		{
			id: "roadmap",
			label: "YOL HARİTASI",
			icon: <Kanban className="w-3.5 h-3.5 stroke-[2.5]" />,
			color: "bg-[#00C2CB]",
		},
		{
			id: "habits",
			label: "ALIŞKANLIKLAR",
			icon: <Flame className="w-3.5 h-3.5 stroke-[2.5]" />,
			color: "bg-[#FF6B6B]",
		},
	];

	return (
		<>
			{/* ÜST NAVİGASYON BARI (Logo, Notepad++ Tuval Sekmeleri, Başarı Skoru, Görünümler) */}
			<header className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 z-30 flex items-center justify-between gap-1 sm:gap-2 pointer-events-none select-none">
				{/* Sol Blok: Logo + Notepad++ Tuval Sekmeleri */}
				<div className="flex items-center gap-1 sm:gap-2 pointer-events-auto min-w-0 shrink">
					{/* Logo: Sadece TUVAL */}
					<div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] shrink-0">
						<div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#FFE600] border border-black sm:border-2 rounded-md sm:rounded-lg flex items-center justify-center text-black font-black shadow-[1px_1px_0px_0px_#000]">
							<Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
						</div>
						<span className="text-[11px] sm:text-xs font-black tracking-wider text-black uppercase">
							TUVAL
						</span>
					</div>

					{/* Notepad++ Çoklu Tuval Sekmeleri */}
					{activeView === "canvas" && <CanvasTabBar />}
				</div>

				{/* Sağ Blok: İlerleme Skoru + Hedef Kutusu + Gelen Kutusu + Görünüm Butonları */}
				<div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
					{/* Canlı İlerleme Rozeti */}
					<div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-white border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] text-xs font-black uppercase">
						<span>BAŞARI:</span>
						<span className="px-1.5 py-0.5 bg-[#22C55E] border border-black rounded text-[11px] text-black">
							%{overallProgress}
						</span>
						<span className="text-[10px] bg-[#FFE600] px-1.5 py-0.5 border border-black rounded">
							{completedGoals.length}/{goalNodes.length} TAMAM
						</span>
					</div>

					{/* Hedef Kutusu Butonu (Toggle) - Consolidated */}
					<button
						onClick={onToggleGoalBox}
						className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border-2 sm:border-3 border-black rounded-xl text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all shrink-0 ${
							isGoalBoxOpen
								? "bg-[#00C2CB] text-black shadow-none translate-x-[1px] translate-y-[1px]"
								: "bg-white hover:bg-[#00C2CB] text-black"
						}`}
						title="Tüm hedefleri yönetin ve yeni fikirler kaydedin"
					>
						<Target className="w-3.5 h-3.5 stroke-[2.5]" />
						<span className="hidden md:inline">HEDEF KUTUSU</span>
					</button>

					{/* 3 Ana Görünüm: Tuval, Yol Haritası, Alışkanlıklar */}
					<div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] shrink-0">
						{navViews.map((item) => {
							const isActive = activeView === item.id;
							return (
								<button
									key={item.id}
									onClick={() => setActiveView(item.id)}
									className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 border sm:border-2 border-black rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black uppercase transition-all ${
										isActive
											? `${item.color} text-black shadow-[1.5px_1.5px_0px_0px_#000]`
											: "bg-white text-stone-700 hover:bg-[#F5F0E6]"
									}`}
									title={item.label}
								>
									{item.icon}
									<span className="hidden lg:inline">{item.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			</header>

			{/* ALT YÜZEN BAR (Görünüm bazlı koşullu render) */}
			{/* 1. Alışkanlıklar görünümünde HİÇBİRİ gözükmez */}
			{/* 2. Yol Haritası görünümünde SADECE HEDEF butonu gözükür */}
			{/* 3. Tuval görünümünde tüm araçlar gözükür */}
			{!isDrawingMode && activeView === "roadmap" && (
				<nav
					style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
					className="absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-white border-2.5 sm:border-4 border-black rounded-xl sm:rounded-3xl shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] max-w-[calc(100vw-1rem)] select-none"
				>
					{/* Yol haritasında sadece Hedef Ekle butonu */}
					<button
						onClick={() => addGoal({ title: "YENİ HEDEF" })}
						className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FFE600] hover:bg-[#ffd900] text-black font-black text-xs sm:text-sm border-2 sm:border-3 border-black rounded-lg sm:rounded-2xl shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] uppercase transition-all whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px]"
						title="Yeni Hedef Ekle"
					>
						<Target className="w-4 h-4 stroke-[3]" />
						<span>+ HEDEF</span>
					</button>
				</nav>
			)}

			{!isDrawingMode && activeView === "canvas" && (
				<nav
					style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
					className="absolute left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-white border-2.5 sm:border-4 border-black rounded-xl sm:rounded-3xl shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] max-w-[calc(100vw-1rem)] overflow-x-auto touch-pan-x scrollbar-none select-none"
				>
					{/* + Hedef Kartı */}
					<button
						onClick={() => addGoal({ title: "YENİ HEDEF" })}
						className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-2 bg-[#FFE600] hover:bg-[#ffd900] text-black font-black text-[10px] sm:text-xs border-2 sm:border-3 border-black rounded-lg sm:rounded-2xl shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] uppercase transition-all whitespace-nowrap shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
						title="Tuvale Yeni Hedef Kartı Ekle"
					>
						<Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
						<span>+ HEDEF</span>
					</button>

					{/* Tablet Kalemi & Çizim Modu Butonu (Emojisiz, temiz UI/UX) */}
					<button
						onClick={toggleDrawingMode}
						className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-2 bg-[#FED7AA] hover:bg-[#fbc286] text-black border-2 sm:border-3 border-black rounded-lg sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] transition-all whitespace-nowrap shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
						title="Tablet Kalemi & Çizim Araçları"
					>
						<PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
						<span className="hidden xs:inline">KALEM</span>
						<span className="xs:hidden">ÇİZ</span>
					</button>

					{/* + Sticky Not (Post-it) */}
					<button
						onClick={() => addStickyNote()}
						className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-2 bg-[#FF3399] hover:bg-[#f3208c] text-white font-black text-[10px] sm:text-xs border-2 sm:border-3 border-black rounded-lg sm:rounded-2xl shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] uppercase transition-all whitespace-nowrap shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
						title="Post-it Notu Ekle"
					>
						<StickyNote className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
						<span>+ NOT</span>
					</button>

					{/* + Kilometre Taşı */}
					<button
						onClick={(e) => {
							// Get button position in toolbar (at bottom center)
							const button = e.currentTarget as HTMLElement;
							const rect = button.getBoundingClientRect();

							// Position stage above the toolbar button
							// Button is at bottom-center, so place stage above it
							const xPos = clampCanvasPosition(rect.left, true);
							const yPos = clampCanvasPosition(rect.top + TOOLBAR_CONFIG.POSITION_OFFSET_Y, false);

							addMilestone("YENİ AŞAMA", undefined, { x: xPos, y: yPos });
						}}
						className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-2 bg-[#00C2CB] hover:bg-[#00abb3] text-black font-black text-[10px] sm:text-xs border-2 sm:border-3 border-black rounded-lg sm:rounded-2xl shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] uppercase transition-all whitespace-nowrap shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
						title="Tıklanan konumun yakınında yeni aşama oluştur"
					>
						<Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
						<span>+ AŞAMA</span>
					</button>

					<div className="w-[1.5px] sm:w-[2px] h-4 sm:h-6 bg-black mx-0.5 sm:mx-1 shrink-0" />

					{/* Dışa Aktar (Export) */}
					<button
						onClick={handleExport}
						className="p-1 sm:p-2 bg-white hover:bg-[#F5F0E6] text-black border-2 border-black rounded-lg sm:rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
						title="Tuvali ve Çizimleri JSON Olarak İndir"
					>
						<Download className="w-3.5 h-3.5 stroke-[2.5]" />
					</button>

					{/* İçe Aktar (Import) */}
					<button
						onClick={() => fileInputRef.current?.click()}
						className="p-1 sm:p-2 bg-white hover:bg-[#F5F0E6] text-black border-2 border-black rounded-lg sm:rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
						title="JSON Dosyasından İçe Aktar"
					>
						<Upload className="w-3.5 h-3.5 stroke-[2.5]" />
					</button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleImport}
						className="hidden"
					/>

					{/* Şablonu Sıfırla */}
					<button
						onClick={() => {
							if (
								confirm(
									"Tüm tuval ve çizimler sıfırlanıp varsayılan hedef şablonu yüklenecek. Emin misiniz?",
								)
							) {
								resetToTemplate();
							}
						}}
						className="p-1 sm:p-2 bg-white hover:bg-[#FF6B35] hover:text-white text-black border-2 border-black rounded-lg sm:rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
						title="Varsayılan Şablonu Yükle"
					>
						<RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
					</button>
				</nav>
			)}
		</>
	);
};
