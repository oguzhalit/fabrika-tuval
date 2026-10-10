import { useReactFlow } from "@xyflow/react";
import React from "react";
import { clampCanvasPosition } from "../../constants/canvas";
import { useGoalStore } from "../../store/useGoalStore";

interface CanvasDropZoneProps {
	children: React.ReactNode;
	draggedItemTypeRef: React.MutableRefObject<"goal" | "note" | "milestone" | null>;
}

export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({ children, draggedItemTypeRef }) => {
	const { screenToFlowPosition } = useReactFlow();
	const addGoal = useGoalStore((s) => s.addGoal);
	const addStickyNote = useGoalStore((s) => s.addStickyNote);
	const addMilestone = useGoalStore((s) => s.addMilestone);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();

		const itemType = draggedItemTypeRef.current;
		if (!itemType) return;

		// Get drop position and convert to canvas coordinates
		const flowPosition = screenToFlowPosition({
			x: e.clientX,
			y: e.clientY,
		});

		// Clamp position within canvas bounds
		const xPos = clampCanvasPosition(flowPosition.x, true);
		const yPos = clampCanvasPosition(flowPosition.y, false);

		// Create the appropriate item based on type
		if (itemType === "goal") {
			addGoal({ title: "YENİ HEDEF" }, { x: xPos, y: yPos });
		} else if (itemType === "note") {
			addStickyNote(undefined, undefined, { x: xPos, y: yPos });
		} else if (itemType === "milestone") {
			addMilestone("YENİ AŞAMA", undefined, { x: xPos, y: yPos });
		}

		draggedItemTypeRef.current = null;
	};

	return (
		<div onDragOver={handleDragOver} onDrop={handleDrop}>
			{children}
		</div>
	);
};
