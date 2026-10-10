import {
	Background,
	BackgroundVariant,
	ConnectionMode,
	Controls,
	DefaultEdgeOptions,
	MiniMap,
	ReactFlow,
} from "@xyflow/react";
import React, { useMemo, useRef } from "react";
import "@xyflow/react/dist/style.css";

import { useGoalStore } from "../../store/useGoalStore";
import { BookNode } from "../nodes/BookNode";
import { DevCodeNode } from "../nodes/DevCodeNode";
import { FinanceNode } from "../nodes/FinanceNode";
import { GoalNode } from "../nodes/GoalNode";
import { HabitNode } from "../nodes/HabitNode";
import { MeetingNode } from "../nodes/MeetingNode";
import { MilestoneNode } from "../nodes/MilestoneNode";
import { StickyNoteNode } from "../nodes/StickyNoteNode";
import { CanvasDropZone } from "./CanvasDropZone";
import { DrawingLayer } from "./DrawingLayer";
import { RightSidebar } from "./RightSidebar";

interface GoalCanvasProps {}

export const GoalCanvas: React.FC<GoalCanvasProps> = () => {
	const nodes = useGoalStore((s) => s.nodes);
	const edges = useGoalStore((s) => s.edges);
	const onNodesChange = useGoalStore((s) => s.onNodesChange);
	const onEdgesChange = useGoalStore((s) => s.onEdgesChange);
	const onConnect = useGoalStore((s) => s.onConnect);
	const selectGoal = useGoalStore((s) => s.selectGoal);

	const draggedItemTypeRef = useRef<"goal" | "note" | "milestone" | null>(null);

	const nodeTypes = useMemo(
		() => ({
			goalNode: GoalNode,
			stickyNode: StickyNoteNode,
			milestoneNode: MilestoneNode,
			habitNode: HabitNode,
			bookNode: BookNode,
			devNode: DevCodeNode,
			financeNode: FinanceNode,
			meetingNode: MeetingNode,
		}),
		[],
	) as any;

	const defaultEdgeOptions: DefaultEdgeOptions = {
		animated: true,
		style: {
			stroke: "#000000",
			strokeWidth: 3.5,
		},
	};

	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		itemType: "goal" | "note" | "milestone",
	) => {
		draggedItemTypeRef.current = itemType;
		e.dataTransfer.effectAllowed = "move";
	};

	return (
		<div className="w-full h-screen bg-[#F5F0E6] relative overflow-hidden">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				defaultEdgeOptions={defaultEdgeOptions}
				connectionMode={ConnectionMode.Loose}
				onPaneClick={() => selectGoal(null)}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				minZoom={0.2}
				maxZoom={2}
			>
				<CanvasDropZone draggedItemTypeRef={draggedItemTypeRef}>
					{/* Right Sidebar - Draggable Items + Tools */}
					<RightSidebar onDragStart={handleDragStart} />

					{/* React Flow Viewport'una Doğrudan Bağlı Çizim Katmanı */}
					<DrawingLayer />

					{/* Neo-Brutalist Paper Grid Arka Planı (Siyah noktalar bej zemin) */}
					<Background
						variant={BackgroundVariant.Dots}
						gap={24}
						size={2}
						color="#000000"
						className="opacity-20"
					/>

					{/* Neo-Brutalist Yakınlaştırma & Odak Kontrolleri */}
					<Controls
						className="!bg-white !border-3 !border-black !rounded-none !shadow-[4px_4px_0px_0px_#000] !overflow-hidden [&>button]:!bg-white [&>button]:!border-b-2 [&>button]:!border-black [&>button]:!text-black [&>button:hover]:!bg-[#FFE600] !bottom-16 sm:!bottom-4"
						showInteractive={false}
					/>

					{/* Neo-Brutalist MiniMap */}
					<MiniMap
						nodeStrokeColor="#000000"
						nodeStrokeWidth={2}
						nodeColor={(node) => {
							if (node.type === "stickyNode") return "#FF3399";
							if (node.type === "milestoneNode") return "#A855F7";
							if (node.type === "habitNode") return "#22C55E";
							if (node.type === "bookNode") return "#FED7AA";
							if (node.type === "devNode") return "#C084FC";
							if (node.type === "financeNode") return "#FFE600";
							return "#00C2CB";
						}}
						nodeBorderRadius={0}
						maskColor="rgba(245, 240, 230, 0.7)"
						className="!bg-white !border-3 !border-black !rounded-none !shadow-[4px_4px_0px_0px_#000] overflow-hidden hidden md:block"
					/>
				</CanvasDropZone>
			</ReactFlow>
		</div>
	);
};
