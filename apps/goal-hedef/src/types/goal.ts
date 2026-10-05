export type GoalStatus = "not_started" | "in_progress" | "completed" | "on_hold";

export type GoalCategory = "career" | "health" | "finance" | "education" | "personal" | "creative";

export type GoalPriority = "p1_high" | "p2_medium" | "p3_low";

export type ItemModuleType =
	| "goal" // Hedef & OKR
	| "habit" // Alışkanlık & Streak
	| "book" // Kitap & Okuma
	| "dev" // Kod & Runbook
	| "finance" // Bütçe & Finans
	| "meeting" // Toplantı & Kararlar
	| "sticky" // Hızlı Post-it
	| "milestone"; // Kilometre Taşı

export interface SubTask {
	id: string;
	title: string;
	completed: boolean;
}

export interface HabitData {
	streak: number;
	bestStreak: number;
	completedToday: boolean;
	frequency: "daily" | "weekly";
	weekHistory: boolean[]; // [Pzt, Sal, Car, Per, Cum, Cmt, Paz]
	targetDays?: number; // Hedef süre (21 gün, 30 gün, 66 gün, 90 gün vb.)
	lastCompletedDate?: string | null;
	startDate?: string;
	cue?: string; // Tetikleyici / İşaret (Atomic Habits)
	routine?: string; // Rutin / Eylem
	reward?: string; // Ödül
	activityLog?: Record<string, number>; // GitHub Contribution tarzı: { "2026-10-04": 1, ... }
	stagesNotes?: string; // Alışkanlık edinme süreci & deneyim notları
}

export interface BookData {
	author: string;
	totalPages: number;
	readPages: number;
	rating?: number; // 1 - 5
	readingStatus: "want_to_read" | "reading" | "finished";
	isbn?: string;
}

export interface DevCodeData {
	language: string;
	codeSnippet: string;
	command?: string;
}

export interface FinanceData {
	amount: number;
	currency: string;
	transactionType: "income" | "expense" | "savings_goal";
	targetAmount?: number;
}

export interface MeetingData {
	attendees: string[];
	decisions: string[];
}

export interface GoalData extends Record<string, unknown> {
	id: string;
	title: string;
	description?: string;
	status: GoalStatus;
	category: GoalCategory;
	progress: number; // 0 - 100
	targetDate?: string;
	startDate?: string;

	// Modül Tipi (Varsayılan: 'goal')
	moduleType?: ItemModuleType;

	// Öncelik
	priority?: GoalPriority;

	// Sabitleme & Renk
	pinned?: boolean;
	cardColor?: string;
	coverImage?: string;

	// Çift Yönlü Bağlantılar
	linkedGoalIds?: string[];

	// Modül Verileri
	habit?: HabitData;
	book?: BookData;
	devCode?: DevCodeData;
	finance?: FinanceData;
	meeting?: MeetingData;

	// Metrik bazlı hedefler için
	metric?: {
		current: number;
		target: number;
		unit: string;
	};

	// Zengin not ve görevler
	richNotes?: string;
	tasks?: SubTask[];

	tags?: string[];
	parentId?: string;

	// Sticky Not alanları
	stickyText?: string;
	stickyColor?: string;
}

export interface InboxItem {
	id: string;
	text: string;
	category: "idea" | "link" | "note" | "task";
	createdAt: string;
}

export interface DrawingStroke {
	id: string;
	sessionId?: number;
	points: { x: number; y: number }[];
	color: string;
	width: number;
	isHighlighter: boolean;
	shapeType?:
		| "pen"
		| "rectangle"
		| "diamond"
		| "circle"
		| "arrow"
		| "line"
		| "text"
		| "image"
		| "web"
		| "frame";
	text?: string;
	fontSize?: number; // Metin boyutu (px)
	fill?: string;
	opacity?: number; // 0 - 100 Opaklık
	strokeStyle?: "solid" | "dashed" | "dotted"; // Kontur stili
	strokeRoughness?: "clean" | "wobbly" | "rough"; // Üstün körülük / el çizimi derecesi
	strokeEdges?: "sharp" | "rounded"; // Kenarlar (Köşeli / Yuvarlak)
	imageUrl?: string; // Görsel Ekle için
	imageData?: string; // Base64 upload için
	webUrl?: string; // Web Yerleştirme için
	frameLabel?: string; // Çerçeve aracı için
	controlPoint?: { x: number; y: number }; // Çizgi ve ok için eğme / kavis noktası
	rotation?: number; // 360 derece döndürme açısı
	// Şekillere veya çizgilere kilitli bağlantı noktaları (Binding / Anchor Points)
	startBinding?: {
		strokeId: string;
		anchor?:
			| "top"
			| "right"
			| "bottom"
			| "left"
			| "center"
			| "tl"
			| "tr"
			| "br"
			| "bl"
			| "custom"
			| "line";
		relativePoint?: { x: number; y: number }; // [0..1] normalize edilmiş şekil içi veya kenar noktası
		paramT?: number; // Çizgi üzerindeki [0..1] parametresi
	};
	endBinding?: {
		strokeId: string;
		anchor?:
			| "top"
			| "right"
			| "bottom"
			| "left"
			| "center"
			| "tl"
			| "tr"
			| "br"
			| "bl"
			| "custom"
			| "line";
		relativePoint?: { x: number; y: number }; // [0..1] normalize edilmiş şekil içi veya kenar noktası
		paramT?: number; // Çizgi üzerindeki [0..1] parametresi
	};
}

export interface CanvasTab {
	id: string;
	title: string;
	nodes: any[];
	edges: any[];
	drawingStrokes: DrawingStroke[];
}

export type ActiveOSView = "canvas" | "roadmap" | "habits";

export interface CanvasState {
	nodes: any[];
	edges: any[];
	selectedGoalId: string | null;
	activeView: ActiveOSView;
	isDrawingMode: boolean;
	drawingStrokes: DrawingStroke[];
	inboxItems: InboxItem[];
}
