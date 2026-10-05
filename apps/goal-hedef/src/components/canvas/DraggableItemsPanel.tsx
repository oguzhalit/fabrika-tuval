import { Flag, StickyNote, Target } from "lucide-react";
import React from "react";

interface DraggableItemsPanelProps {
	onDragStart: (
		e: React.DragEvent<HTMLDivElement>,
		itemType: "goal" | "note" | "milestone",
	) => void;
}

export const DraggableItemsPanel: React.FC<DraggableItemsPanelProps> = ({ onDragStart }) => {
	const items = [
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

	return (
		<div className="absolute right-2 sm:right-3 top-20 sm:top-24 z-30 flex flex-col gap-2 pointer-events-auto">
			<div className="flex flex-col gap-1 p-2 sm:p-3 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_0px_#000] select-none">
				{items.map((item) => (
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
		</div>
	);
};
