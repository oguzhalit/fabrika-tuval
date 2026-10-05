import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Connection,
	Edge,
	Node,
	OnEdgesChange,
	OnNodesChange,
} from "@xyflow/react";
import { create } from "zustand";
import {
	ActiveOSView,
	CanvasTab,
	DrawingStroke,
	GoalData,
	GoalStatus,
	SubTask,
} from "../types/goal";
import { triggerGoalCelebration, triggerSmallCelebration } from "../utils/confetti";

export interface ConfirmDialogOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	isDanger?: boolean;
	onConfirm: () => void;
}

interface GoalStore {
	nodes: Node<GoalData>[];
	edges: Edge[];
	selectedGoalId: string | null;
	activeView: ActiveOSView;

	// Neo-Brutalist Onay Modalı
	confirmModal: ({ isOpen: boolean } & ConfirmDialogOptions) | null;
	openConfirmDialog: (options: ConfirmDialogOptions) => void;
	closeConfirmDialog: () => void;

	// Notepad++ Tarzı Çoklu Tuval Sekmeleri
	tabs: CanvasTab[];
	activeTabId: string;
	addTab: (title?: string) => void;
	switchTab: (id: string) => void;
	closeTab: (id: string) => void;
	renameTab: (id: string, newTitle: string) => void;

	// Çizim Modu State & Metotları
	isDrawingMode: boolean;
	currentSessionId: number;
	drawingStrokes: DrawingStroke[];
	toggleDrawingMode: () => void;
	addDrawingStroke: (stroke: DrawingStroke) => void;
	deleteDrawingStroke: (id: string) => void;
	deleteLastSession: () => void;
	setDrawingStrokes: (strokes: DrawingStroke[]) => void;
	undoDrawingStroke: () => void;
	clearDrawingStrokes: () => void;

	// React Flow handlers
	onNodesChange: OnNodesChange<Node<GoalData>>;
	onEdgesChange: OnEdgesChange;
	onConnect: (connection: Connection) => void;

	// Seçim ve Görünüm
	selectGoal: (id: string | null) => void;
	setActiveView: (view: ActiveOSView) => void;

	// Node CRUD
	addGoal: (goal: Partial<GoalData>, position?: { x: number; y: number }) => string;
	addStickyNote: (text?: string, color?: string, position?: { x: number; y: number }) => string;
	addMilestone: (title: string, parentId?: string, position?: { x: number; y: number }) => string;
	updateGoal: (id: string, updates: Partial<GoalData>) => void;
	deleteGoal: (id: string) => void;

	// Sabitleme (Pin)
	togglePinGoal: (id: string) => void;

	// Çift Yönlü Bağlantı
	linkGoals: (sourceId: string, targetId: string) => void;

	// Görevler & Adımlar
	addSubTask: (goalId: string, title: string) => void;
	toggleSubTask: (goalId: string, taskId: string) => void;
	deleteSubTask: (goalId: string, taskId: string) => void;

	// İlerleme & Otomatik Roll-up
	updateProgress: (goalId: string, progress: number) => void;
	recalculateRollup: (parentId: string) => void;

	// Depolama & Aktarım
	saveToLocalStorage: () => void;
	loadFromLocalStorage: () => void;
	resetToTemplate: () => void;
}

const STORAGE_KEY = "GOAL_CANVAS_DATA_V4_CLEAN";

const INITIAL_NODES: Node<GoalData>[] = [
	{
		id: "goal-1",
		type: "goalNode",
		position: { x: 380, y: 120 },
		data: {
			id: "goal-1",
			title: "YAPAY ZEKA VE HEDEF PLATFORMU",
			description: "Sonsuz tuval serbestliği, zengin dokümantasyon ve görsel hedef takibi.",
			category: "career",
			status: "in_progress",
			progress: 75,
			priority: "p1_high",
			pinned: true,
			cardColor: "#FFFFFF",
			coverImage:
				"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
			targetDate: "2026-11-01",
			metric: {
				current: 3,
				target: 4,
				unit: "Faz",
			},
			tasks: [
				{ id: "t1", title: "Tasarım Sistemi & Arayüz Bileşenleri", completed: true },
				{ id: "t2", title: "Tablet / Stylus Serbest Çizim Katmanı", completed: true },
				{ id: "t3", title: "Hedefler Arası Bağlantı & İlişki Haritası", completed: true },
				{ id: "t4", title: "Görsel Kapaklar & Detay Dokümantasyonu", completed: false },
			],
			richNotes:
				"<h2>VİZYON DOKÜMANI</h2><p><strong>BOLD. LOUD. SYSTEMATIC. PLAYFUL.</strong></p><p>Hedefler görsel bağlamda serbestçe yönetilirken zengin metin desteği ile derinlemesine planlanır.</p>",
			tags: ["AI", "CANVAS", "TASARIM"],
		},
	},
	{
		id: "goal-2",
		type: "goalNode",
		position: { x: 60, y: 460 },
		data: {
			id: "goal-2",
			title: "MİKRO-ETKİLEŞİM & TABLET KALEMİ",
			description:
				"Tablet ve stylus desteği ile tuval üzerinde hassas el çizimleri ve fosforlu vurgular.",
			category: "creative",
			status: "completed",
			progress: 100,
			priority: "p2_medium",
			cardColor: "#D9F99D",
			coverImage:
				"https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80",
			targetDate: "2026-10-15",
			parentId: "goal-1",
			tasks: [
				{ id: "t2-1", title: "Fosforlu kalem ve çizgi kalınlığı ayarları", completed: true },
				{ id: "t2-2", title: "Akıllı silgi ve tuval senkronizasyonu", completed: true },
			],
			richNotes:
				"<p>Tüm çizimler tuval koordinatlarına bağlı kalarak tuvalle birlikte kayar ve yakınlaşır.</p>",
			tags: ["UX", "ÇİZİM"],
		},
	},
	{
		id: "goal-3",
		type: "goalNode",
		position: { x: 740, y: 440 },
		data: {
			id: "goal-3",
			title: "HAFTALIK 10KM TEMPOLU KOŞU",
			description: "Zihinsel berraklık ve yüksek üretkenlik için düzenli kardiyo.",
			category: "health",
			status: "in_progress",
			progress: 50,
			priority: "p1_high",
			cardColor: "#FED7AA",
			targetDate: "2026-12-31",
			metric: {
				current: 5,
				target: 10,
				unit: "KM",
			},
			tasks: [
				{ id: "t3-1", title: "Pazartesi: 3km Sabah Koşusu", completed: true },
				{ id: "t3-2", title: "Çarşamba: 3km Tempolu Koşu", completed: true },
				{ id: "t3-3", title: "Cumartesi: 4km Açık Hava Parkuru", completed: false },
			],
			richNotes: "<p>Nabız kontrolü ve bol su tüketimi esastır.</p>",
			tags: ["SPOR", "KARDİYO"],
		},
	},
	{
		id: "sticky-1",
		type: "stickyNode",
		position: { x: 70, y: 140 },
		data: {
			id: "sticky-1",
			title: "MOTİVASYON",
			category: "personal",
			status: "not_started",
			progress: 0,
			stickyText: 'LET\'S GO!\n"Büyük hedefler, küçük günlük adımların toplamıdır."',
			stickyColor: "#FFE600",
			stickyLabel: "HIZLI NOT // STICKER",
		},
	},
	{
		id: "sticky-2",
		type: "stickyNode",
		position: { x: 780, y: 130 },
		data: {
			id: "sticky-2",
			title: "NOT",
			category: "creative",
			status: "not_started",
			progress: 0,
			stickyText: "STAY POSITIVE\nTablet kalemiyle tuvale serbestçe çizim yapabilirsin!",
			stickyColor: "#FF3399",
			stickyLabel: "HIZLI NOT // STICKER",
		},
	},
];

const INITIAL_EDGES: Edge[] = [
	{
		id: "edge-1-2",
		source: "goal-1",
		target: "goal-2",
		animated: true,
		style: { stroke: "#000000", strokeWidth: 3.5 },
	},
];

export const useGoalStore = create<GoalStore>((set, get) => ({
	nodes: INITIAL_NODES,
	edges: INITIAL_EDGES,
	selectedGoalId: null,
	activeView: "canvas",

	// Neo-Brutalist Onay Modalı
	confirmModal: null,
	openConfirmDialog: (options) => {
		set({ confirmModal: { ...options, isOpen: true } });
	},
	closeConfirmDialog: () => {
		set({ confirmModal: null });
	},

	// Notepad++ Çoklu Tuval Sekmeleri
	tabs: [
		{
			id: "tab-1",
			title: "Ana Hedefler",
			nodes: INITIAL_NODES,
			edges: INITIAL_EDGES,
			drawingStrokes: [],
		},
	],
	activeTabId: "tab-1",

	addTab: (title) => {
		const { tabs, nodes, edges, drawingStrokes, activeTabId } = get();
		// Mevcut aktif sekmenin içeriğini kaydet
		const updatedTabs = tabs.map((t) =>
			t.id === activeTabId ? { ...t, nodes, edges, drawingStrokes } : t,
		);

		const newTabId = `tab-${Date.now()}`;
		const newTabTitle = title || `Tuval ${updatedTabs.length + 1}`;
		const newTab: CanvasTab = {
			id: newTabId,
			title: newTabTitle,
			nodes: [],
			edges: [],
			drawingStrokes: [],
		};

		set({
			tabs: [...updatedTabs, newTab],
			activeTabId: newTabId,
			nodes: [],
			edges: [],
			drawingStrokes: [],
			selectedGoalId: null,
		});
		get().saveToLocalStorage();
		triggerSmallCelebration();
	},

	switchTab: (id) => {
		const { tabs, nodes, edges, drawingStrokes, activeTabId } = get();
		if (id === activeTabId) return;

		// Önceki sekmenin durumunu sakla
		const updatedTabs = tabs.map((t) =>
			t.id === activeTabId ? { ...t, nodes, edges, drawingStrokes } : t,
		);

		const targetTab = updatedTabs.find((t) => t.id === id);
		if (!targetTab) return;

		set({
			tabs: updatedTabs,
			activeTabId: id,
			nodes: targetTab.nodes || [],
			edges: targetTab.edges || [],
			drawingStrokes: targetTab.drawingStrokes || [],
			selectedGoalId: null,
		});
		get().saveToLocalStorage();
	},

	closeTab: (id) => {
		const { tabs, activeTabId } = get();
		if (tabs.length <= 1) {
			alert("En az bir tuval sekmesi açık kalmalıdır.");
			return;
		}

		const remainingTabs = tabs.filter((t) => t.id !== id);
		let nextActiveTabId = activeTabId;
		let nextNodes = get().nodes;
		let nextEdges = get().edges;
		let nextStrokes = get().drawingStrokes;

		if (id === activeTabId) {
			const nextTab = remainingTabs[remainingTabs.length - 1];
			nextActiveTabId = nextTab.id;
			nextNodes = nextTab.nodes || [];
			nextEdges = nextTab.edges || [];
			nextStrokes = nextTab.drawingStrokes || [];
		}

		set({
			tabs: remainingTabs,
			activeTabId: nextActiveTabId,
			nodes: nextNodes,
			edges: nextEdges,
			drawingStrokes: nextStrokes,
			selectedGoalId: null,
		});
		get().saveToLocalStorage();
	},

	renameTab: (id, newTitle) => {
		set((state) => ({
			tabs: state.tabs.map((t) => (t.id === id ? { ...t, title: newTitle } : t)),
		}));
		get().saveToLocalStorage();
	},

	isDrawingMode: true,
	currentSessionId: Date.now(),
	drawingStrokes: [],

	toggleDrawingMode: () => {
		set((state) => ({
			isDrawingMode: !state.isDrawingMode,
			currentSessionId: !state.isDrawingMode ? Date.now() : state.currentSessionId,
		}));
	},

	addDrawingStroke: (stroke) => {
		const strokeWithSession = {
			...stroke,
			sessionId: stroke.sessionId || get().currentSessionId,
		};
		set((state) => ({
			drawingStrokes: [...state.drawingStrokes, strokeWithSession],
		}));
		get().saveToLocalStorage();
	},

	deleteDrawingStroke: (id) => {
		set((state) => ({
			drawingStrokes: state.drawingStrokes.filter((s) => s.id !== id),
		}));
		get().saveToLocalStorage();
	},

	deleteLastSession: () => {
		const { drawingStrokes } = get();
		if (drawingStrokes.length === 0) return;

		// En son çizilen stroke'un oturum ID'sini bul
		const lastSessionId = drawingStrokes[drawingStrokes.length - 1].sessionId;

		if (lastSessionId) {
			set({
				drawingStrokes: drawingStrokes.filter((s) => s.sessionId !== lastSessionId),
			});
		} else {
			// sessionId yoksa en son stroke'u sil
			set({
				drawingStrokes: drawingStrokes.slice(0, -1),
			});
		}
		get().saveToLocalStorage();
	},

	setDrawingStrokes: (strokes) => {
		set({ drawingStrokes: strokes });
		get().saveToLocalStorage();
	},

	undoDrawingStroke: () => {
		set((state) => ({
			drawingStrokes: state.drawingStrokes.slice(0, -1),
		}));
		get().saveToLocalStorage();
	},

	clearDrawingStrokes: () => {
		set({ drawingStrokes: [] });
		get().saveToLocalStorage();
	},

	onNodesChange: (changes) => {
		set({
			nodes: applyNodeChanges(changes, get().nodes as any) as Node<GoalData>[],
		});
		get().saveToLocalStorage();
	},

	onEdgesChange: (changes) => {
		set({
			edges: applyEdgeChanges(changes, get().edges),
		});
		get().saveToLocalStorage();
	},

	onConnect: (connection) => {
		set({
			edges: addEdge(
				{
					...connection,
					animated: true,
					style: { stroke: "#000000", strokeWidth: 3.5 },
				},
				get().edges,
			),
		});
		get().saveToLocalStorage();
	},

	selectGoal: (id) => {
		set({ selectedGoalId: id });
	},

	setActiveView: (view) => {
		set({ activeView: view });
	},

	addGoal: (goalData, position) => {
		const id = `goal-${Date.now()}`;
		const newNode: Node<GoalData> = {
			id,
			type: "goalNode",
			position: position || { x: 450 + Math.random() * 100, y: 300 + Math.random() * 100 },
			data: {
				id,
				title: goalData.title || "YENİ HEDEF",
				description: goalData.description || "Hedef açıklaması giriniz...",
				category: goalData.category || "career",
				status: goalData.status || "not_started",
				progress: goalData.progress || 0,
				priority: goalData.priority || "p2_medium",
				cardColor: goalData.cardColor || "#FFFFFF",
				coverImage: goalData.coverImage || "",
				targetDate: goalData.targetDate || "",
				tasks: goalData.tasks || [],
				richNotes:
					goalData.richNotes ||
					"<p>Bu hedefle ilgili detaylı strateji ve notlarınızı buraya yazın...</p>",
				tags: goalData.tags || ["YENİ"],
				metric: goalData.metric,
				parentId: goalData.parentId,
			},
		};

		set((state) => ({
			nodes: [...state.nodes, newNode],
			selectedGoalId: id,
		}));

		get().saveToLocalStorage();
		return id;
	},

	addStickyNote: (text, color, position) => {
		const id = `sticky-${Date.now()}`;
		const newNode: Node<GoalData> = {
			id,
			type: "stickyNode",
			position: position || { x: 250 + Math.random() * 80, y: 250 + Math.random() * 80 },
			data: {
				id,
				title: "HIZLI NOT",
				category: "creative",
				status: "not_started",
				progress: 0,
				stickyText: text || "Fikir veya hatırlatıcı...",
				stickyColor: color || "#FFE600",
				stickyLabel: "HIZLI NOT // STICKER",
			},
		};

		set((state) => ({
			nodes: [...state.nodes, newNode],
		}));

		get().saveToLocalStorage();
		return id;
	},

	addMilestone: (title, parentId, position) => {
		const id = `milestone-${Date.now()}`;
		const newNode: Node<GoalData> = {
			id,
			type: "milestoneNode",
			position: position || { x: 500, y: 450 },
			data: {
				id,
				title,
				category: "personal",
				status: "not_started",
				progress: 0,
				parentId,
			},
		};

		let newEdges = [...get().edges];
		if (parentId) {
			newEdges.push({
				id: `edge-${parentId}-${id}`,
				source: parentId,
				target: id,
				animated: true,
				style: { stroke: "#000000", strokeWidth: 3.5 },
			});
		}

		set((state) => ({
			nodes: [...state.nodes, newNode],
			edges: newEdges,
		}));

		get().saveToLocalStorage();
		return id;
	},

	updateGoal: (id, updates) => {
		set((state) => {
			const updatedNodes = state.nodes.map((node) => {
				if (node.id === id) {
					const updatedData = { ...node.data, ...updates };

					if (updates.status === "completed" && node.data.status !== "completed") {
						triggerGoalCelebration();
					}

					return { ...node, data: updatedData };
				}
				return node;
			});

			return { nodes: updatedNodes };
		});

		get().saveToLocalStorage();
	},

	deleteGoal: (id) => {
		set((state) => ({
			nodes: state.nodes.filter((node) => node.id !== id),
			edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
			selectedGoalId: state.selectedGoalId === id ? null : state.selectedGoalId,
		}));
		get().saveToLocalStorage();
	},

	togglePinGoal: (id) => {
		set((state) => ({
			nodes: state.nodes.map((node) => {
				if (node.id === id) {
					return {
						...node,
						data: {
							...node.data,
							pinned: !node.data.pinned,
						},
					};
				}
				return node;
			}),
		}));
		get().saveToLocalStorage();
	},

	linkGoals: (sourceId, targetId) => {
		if (sourceId === targetId) return;
		const { edges } = get();
		const edgeExists = edges.some(
			(e) =>
				(e.source === sourceId && e.target === targetId) ||
				(e.source === targetId && e.target === sourceId),
		);

		if (!edgeExists) {
			const newEdge: Edge = {
				id: `edge-link-${sourceId}-${targetId}`,
				source: sourceId,
				target: targetId,
				animated: true,
				style: { stroke: "#000000", strokeWidth: 3.5 },
			};
			set({ edges: [...edges, newEdge] });
			get().saveToLocalStorage();
			triggerSmallCelebration();
		}
	},

	addSubTask: (goalId, title) => {
		const newTask: SubTask = {
			id: `task-${Date.now()}`,
			title,
			completed: false,
		};

		set((state) => {
			const updatedNodes = state.nodes.map((node) => {
				if (node.id === goalId) {
					const currentTasks = node.data.tasks || [];
					const newTasks = [...currentTasks, newTask];

					const completedCount = newTasks.filter((t) => t.completed).length;
					const newProgress = Math.round((completedCount / newTasks.length) * 100);

					return {
						...node,
						data: {
							...node.data,
							tasks: newTasks,
							progress: newProgress,
							status: (newProgress === 100
								? "completed"
								: newProgress > 0
									? "in_progress"
									: node.data.status) as GoalStatus,
						},
					};
				}
				return node;
			});

			return { nodes: updatedNodes };
		});

		get().saveToLocalStorage();
	},

	toggleSubTask: (goalId, taskId) => {
		set((state) => {
			let shouldTriggerSmallConfetti = false;
			const updatedNodes = state.nodes.map((node) => {
				if (node.id === goalId) {
					const currentTasks = node.data.tasks || [];
					const newTasks = currentTasks.map((t) => {
						if (t.id === taskId) {
							const nextVal = !t.completed;
							if (nextVal) shouldTriggerSmallConfetti = true;
							return { ...t, completed: nextVal };
						}
						return t;
					});

					const completedCount = newTasks.filter((t) => t.completed).length;
					const newProgress =
						newTasks.length > 0
							? Math.round((completedCount / newTasks.length) * 100)
							: node.data.progress;

					const newStatus: GoalStatus =
						newProgress === 100 ? "completed" : newProgress > 0 ? "in_progress" : "not_started";

					if (newProgress === 100 && node.data.progress !== 100) {
						triggerGoalCelebration();
					} else if (shouldTriggerSmallConfetti) {
						triggerSmallCelebration();
					}

					return {
						...node,
						data: {
							...node.data,
							tasks: newTasks,
							progress: newProgress,
							status: newStatus,
						},
					};
				}
				return node;
			});

			return { nodes: updatedNodes };
		});

		get().saveToLocalStorage();
	},

	deleteSubTask: (goalId, taskId) => {
		set((state) => {
			const updatedNodes = state.nodes.map((node) => {
				if (node.id === goalId) {
					const newTasks = (node.data.tasks || []).filter((t) => t.id !== taskId);
					const completedCount = newTasks.filter((t) => t.completed).length;
					const newProgress =
						newTasks.length > 0 ? Math.round((completedCount / newTasks.length) * 100) : 0;

					return {
						...node,
						data: {
							...node.data,
							tasks: newTasks,
							progress: newProgress,
						},
					};
				}
				return node;
			});

			return { nodes: updatedNodes };
		});

		get().saveToLocalStorage();
	},

	updateProgress: (goalId, progress) => {
		const clamped = Math.min(100, Math.max(0, progress));
		const status: GoalStatus =
			clamped === 100 ? "completed" : clamped > 0 ? "in_progress" : "not_started";

		if (clamped === 100) {
			triggerGoalCelebration();
		}

		get().updateGoal(goalId, { progress: clamped, status });
	},

	recalculateRollup: (parentId) => {
		const { nodes } = get();
		const children = nodes.filter((n) => n.data.parentId === parentId);
		if (children.length === 0) return;

		const totalProgress = children.reduce((sum, child) => sum + (child.data.progress || 0), 0);
		const avgProgress = Math.round(totalProgress / children.length);

		get().updateGoal(parentId, { progress: avgProgress });
	},

	saveToLocalStorage: () => {
		try {
			const { tabs, activeTabId, nodes, edges, drawingStrokes } = get();
			// Aktif sekmenin en güncel halini tabs listesinde güncelle
			const updatedTabs = tabs.map((t) =>
				t.id === activeTabId ? { ...t, nodes, edges, drawingStrokes } : t,
			);

			const data = {
				tabs: updatedTabs,
				activeTabId,
				nodes,
				edges,
				drawingStrokes,
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.warn("LocalStorage save error:", e);
		}
	},

	loadFromLocalStorage: () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed.tabs && parsed.tabs.length > 0) {
					const currentTab =
						parsed.tabs.find((t: any) => t.id === parsed.activeTabId) || parsed.tabs[0];
					set({
						tabs: parsed.tabs,
						activeTabId: currentTab.id,
						nodes: currentTab.nodes || [],
						edges: currentTab.edges || [],
						drawingStrokes: currentTab.drawingStrokes || [],
					});
				} else if (parsed.nodes && parsed.edges) {
					set({
						nodes: parsed.nodes,
						edges: parsed.edges,
						drawingStrokes: parsed.drawingStrokes || [],
					});
				}
			}
		} catch (e) {
			console.warn("LocalStorage load error:", e);
		}
	},

	resetToTemplate: () => {
		set({
			nodes: INITIAL_NODES,
			edges: INITIAL_EDGES,
			drawingStrokes: [],
			selectedGoalId: null,
		});
		localStorage.removeItem(STORAGE_KEY);
	},
}));
