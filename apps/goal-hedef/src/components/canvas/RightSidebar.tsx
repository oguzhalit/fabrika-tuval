import { Download, Flag, RotateCcw, StickyNote, Target, Upload } from "lucide-react";
import React, { useRef } from "react";
import { useGoalStore } from "../../store/useGoalStore";

interface RightSidebarProps {
	onDragStart: (
		e: React.DragEvent<HTMLDivElement>,
		itemType: "goal" | "note" | "milestone",
	) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onDragStart }) => {
	const resetToTemplate = useGoalStore((s) => s.resetToTemplate);
	const nodes = useGoalStore((s) => s.nodes);
	const edges = useGoalStore((s) => s.edges);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const draggableItems = [
		{
			id: "goal",
			type: "goal" as const,
			label: "HEDEF",
			icon: <Target className="w-4 h-4 stroke-[3]" />,
			color: "bg-[#FFE600]",
			hoverColor: "hover:bg-[#ffd900]",
		},
		{
			id: "note",
			type: "note" as const,
			label: "NOT",
			icon: <StickyNote className="w-4 h-4 stroke-[2.5]" />,
			color: "bg-[#FF3399]",
			hoverColor: "hover:bg-[#f3208c]",
		},
		{
			id: "milestone",
			type: "milestone" as const,
			label: "AŞAMA",
			icon: <Flag className="w-4 h-4 stroke-[2.5]" />,
			color: "bg-[#00C2CB]",
			hoverColor: "hover:bg-[#00abb3]",
		},
	];

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
				}
			} catch {
				alert("Geçersiz dosya formatı.");
			}
		};
		reader.readAsText(file);
	};

	return (
		<div className="absolute right-2 sm:right-3 top-20 sm:top-24 z-[102] flex flex-col gap-3 pointer-events-auto">
			{/* Draggable Items */}
			<div className="flex flex-col gap-1 p-2 sm:p-3 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_0px_#000] select-none">
				{draggableItems.map((item) => (
					<div
						key={item.id}
						draggable
						onDragStart={(e) => onDragStart(e, item.type)}
						className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 ${item.color} ${item.hoverColor} text-black font-black text-[10px] sm:text-xs border-2 border-black rounded-lg cursor-move transition-all active:scale-95 select-none`}
						title={`Sürükleyerek canvas'a ${item.label.toLowerCase()} ekle`}
					>
						{item.icon}
						<span className="hidden md:inline whitespace-nowrap">{item.label}</span>
						<span className="md:hidden">+</span>
					</div>
				))}
			</div>

			{/* Tool Buttons */}
			<div className="flex flex-col gap-1 p-2 sm:p-3 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_0px_#000] select-none">
				{/* Export */}
				<button
					onClick={handleExport}
					className="p-2 bg-white hover:bg-[#F5F0E6] text-black border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
					title="Tuvali ve Çizimleri JSON Olarak İndir"
				>
					<Download className="w-4 h-4 stroke-[2.5]" />
				</button>

				{/* Import */}
				<button
					onClick={() => fileInputRef.current?.click()}
					className="p-2 bg-white hover:bg-[#F5F0E6] text-black border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
					title="JSON Dosyasından İçe Aktar"
				>
					<Upload className="w-4 h-4 stroke-[2.5]" />
				</button>

				{/* Reset */}
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
					className="p-2 bg-white hover:bg-[#FF6B35] hover:text-white text-black border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] transition-all"
					title="Varsayılan Şablonu Yükle"
				>
					<RotateCcw className="w-4 h-4 stroke-[2.5]" />
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept=".json"
					onChange={handleImport}
					className="hidden"
				/>
			</div>
		</div>
	);
};
