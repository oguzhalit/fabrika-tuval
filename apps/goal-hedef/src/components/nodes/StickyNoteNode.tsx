import { Handle, NodeProps, NodeResizer, Position } from "@xyflow/react";
import { Sparkles, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { useGoalStore } from "../../store/useGoalStore";

export const StickyNoteNode = memo(({ id, data, selected }: NodeProps<any>) => {
	const updateGoal = useGoalStore((s) => s.updateGoal);
	const deleteGoal = useGoalStore((s) => s.deleteGoal);
	const selectGoal = useGoalStore((s) => s.selectGoal);
	const openConfirmDialog = useGoalStore((s) => s.openConfirmDialog);
	const [isEditingLabel, setIsEditingLabel] = useState(false);
	const [editingLabelText, setEditingLabelText] = useState(
		data.stickyLabel || "HIZLI NOT // STICKER",
	);

	const colors = [
		{ bg: "#FFE600", label: "Sarı" },
		{ bg: "#FF3399", label: "Pembe" },
		{ bg: "#00C2CB", label: "Teal" },
		{ bg: "#22C55E", label: "Yeşil" },
		{ bg: "#FF6B35", label: "Turuncu" },
	];

	const currentColor = data.stickyColor || "#FFE600";

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		openConfirmDialog({
			title: "NOTU SİL",
			message: "Bu yapışkan notu silmek istediğinize emin misiniz?",
			confirmLabel: "EVET, NOTU SİL",
			cancelLabel: "VAZGEÇ",
			onConfirm: () => deleteGoal(id),
		});
	};

	const handleLabelClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsEditingLabel(true);
	};

	const handleSaveLabel = () => {
		if (editingLabelText.trim()) {
			updateGoal(id, { stickyLabel: editingLabelText.trim() });
		}
		setIsEditingLabel(false);
	};

	const handleCancelEdit = () => {
		setEditingLabelText(data.stickyLabel || "HIZLI NOT // STICKER");
		setIsEditingLabel(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSaveLabel();
		} else if (e.key === "Escape") {
			handleCancelEdit();
		}
	};

	return (
		<div
			onClick={() => selectGoal(id)}
			className={`relative w-full h-full min-w-[180px] min-h-[160px] flex flex-col p-4 border-3 border-black transition-all duration-150 select-text cursor-pointer ${
				selected
					? "shadow-[8px_8px_0px_0px_#000] -translate-x-1 -translate-y-1"
					: "shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#000]"
			}`}
			style={{
				backgroundColor: currentColor,
				color: "#000000",
			}}
		>
			<NodeResizer
				isVisible={!!selected}
				minWidth={180}
				minHeight={160}
				handleClassName="!w-3.5 !h-3.5 !bg-black !border-2 !border-white !rounded-sm hover:!scale-125 !transition-transform"
				lineClassName="!border-black !border-dashed"
			/>

			<Handle
				type="target"
				position={Position.Top}
				className="!bg-black !border-2 !border-white !w-3 !h-3 !rounded-none"
			/>
			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-black !border-2 !border-white !w-3 !h-3 !rounded-none"
			/>
			<Handle
				type="target"
				position={Position.Left}
				id="left"
				className="!bg-black !border-2 !border-white !w-3 !h-3 !rounded-none"
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="right"
				className="!bg-black !border-2 !border-white !w-3 !h-3 !rounded-none"
			/>

			{/* Retro Neo-Brutalist Sticker Başlığı */}
			<div className="flex items-center justify-between pb-2 border-b-2 border-black flex-shrink-0">
				{isEditingLabel ? (
					<div className="inline-flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
						<input
							type="text"
							value={editingLabelText}
							onChange={(e) => setEditingLabelText(e.target.value)}
							onKeyDown={handleKeyDown}
							onBlur={handleSaveLabel}
							autoFocus
							className="bg-transparent border-none outline-none font-black uppercase text-[10px] w-32"
						/>
					</div>
				) : (
					<div
						onClick={handleLabelClick}
						className="inline-flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:shadow-[3px_3px_0px_0px_#000] transition-shadow"
						title="Label'ı düzenlemek için tıklayın"
					>
						<Sparkles className="w-3 h-3 text-black stroke-[3]" />
						<span>{data.stickyLabel || "HIZLI NOT // STICKER"}</span>
					</div>
				)}

				<div className="flex items-center gap-1">
					{colors.map((c, i) => (
						<button
							key={i}
							onClick={(e) => {
								e.stopPropagation();
								updateGoal(id, { stickyColor: c.bg });
							}}
							className="w-4 h-4 border-2 border-black hover:scale-125 transition-transform"
							style={{ backgroundColor: c.bg }}
							title={c.label}
						/>
					))}
					<button
						onClick={handleDelete}
						className="p-1 hover:bg-black hover:text-white border border-black rounded-none ml-1 transition-colors"
						title="Notu Sil"
					>
						<Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
					</button>
				</div>
			</div>

			{/* El Yazısı Not Metni */}
			<textarea
				value={data.stickyText || ""}
				onChange={(e) => updateGoal(id, { stickyText: e.target.value })}
				placeholder="Fikir, motivasyon veya hatırlatıcı..."
				className="w-full flex-1 mt-2.5 bg-transparent resize-none border-none outline-none font-handwriting text-2xl font-bold leading-relaxed placeholder-black/40 text-black focus:ring-0"
			/>
		</div>
	);
});

StickyNoteNode.displayName = "StickyNoteNode";
