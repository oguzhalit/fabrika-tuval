import { Flame, Kanban, LayoutGrid } from "lucide-react";
import React from "react";
import { useGoalStore } from "../../store/useGoalStore";
import { ActiveOSView } from "../../types/goal";

interface NavigationBarProps {
	onToggleGoalBox: () => void;
	isGoalBoxOpen: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ onToggleGoalBox, isGoalBoxOpen }) => {
	const activeView = useGoalStore((s) => s.activeView);
	const setActiveView = useGoalStore((s) => s.setActiveView);

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
		<header className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 z-30 flex items-center justify-between gap-1 sm:gap-2 pointer-events-none select-none">
			{/* Logo */}
			<div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white border-2 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] shrink-0 pointer-events-auto">
				<div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#FFE600] border border-black sm:border-2 rounded-md sm:rounded-lg flex items-center justify-center text-black font-black shadow-[1px_1px_0px_0px_#000]">
					<LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
				</div>
				<span className="text-[11px] sm:text-xs font-black tracking-wider text-black uppercase">
					TUVAL
				</span>
			</div>

			{/* Right Block: Goal Box + View Buttons */}
			<div className="flex items-center gap-1 sm:gap-2 pointer-events-auto shrink-0">
				{/* Goal Box Button */}
				<button
					onClick={onToggleGoalBox}
					className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 border-2 sm:border-3 border-black rounded-xl text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all shrink-0 ${
						isGoalBoxOpen
							? "bg-[#00C2CB] text-black shadow-none translate-x-[1px] translate-y-[1px]"
							: "bg-white hover:bg-[#00C2CB] text-black"
					}`}
					title="Tüm hedefleri yönetin ve yeni fikirler kaydedin"
				>
					<span className="hidden md:inline">HEDEF KUTUSU</span>
					<span className="md:hidden">📋</span>
				</button>

				{/* View Buttons */}
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
	);
};
