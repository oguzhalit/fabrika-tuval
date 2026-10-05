import { useReactFlow, useViewport } from "@xyflow/react";
import {
	ArrowRight,
	Check,
	Circle,
	Code2,
	Diamond,
	Eraser,
	Hand,
	Highlighter,
	Image as ImageIcon,
	Minus,
	MoreHorizontal,
	MousePointer,
	PenTool,
	RotateCcw,
	Square,
	Trash2,
	Type,
	Upload,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { useGoalStore } from "../../store/useGoalStore";
import { DrawingStroke } from "../../types/goal";

export type ExcaliToolType =
	| "select"
	| "hand"
	| "rectangle"
	| "diamond"
	| "circle"
	| "arrow"
	| "line"
	| "pen"
	| "highlighter"
	| "text"
	| "eraser";

// Excalidraw / Tablet Kalemi Stilleri (Kullanıcının paylaştığı paneldeki birebir özellikler)
const STROKE_COLORS = [
	{ hex: "#1E1E1E", label: "Siyah" },
	{ hex: "#E03131", label: "Kırmızı" },
	{ hex: "#2F9E44", label: "Yeşil" },
	{ hex: "#1971C2", label: "Mavi" },
	{ hex: "#F08C00", label: "Turuncu" },
	{ hex: "#099268", label: "Teal" },
];

const BG_COLORS = [
	{ hex: "transparent", label: "Saydam" },
	{ hex: "#FFC9C9", label: "Açık Kırmızı" },
	{ hex: "#B2F2BB", label: "Açık Yeşil" },
	{ hex: "#A5D8FF", label: "Açık Mavi" },
	{ hex: "#FFEC99", label: "Açık Sarı" },
	{ hex: "#FFFFFF", label: "Beyaz" },
];

const STROKE_WIDTHS = [
	{ width: 2, label: "İnce" },
	{ width: 4, label: "Orta" },
	{ width: 8, label: "Kalın" },
];

const ERASER_SIZES = [
	{ radius: 10, label: "Küçük" },
	{ radius: 22, label: "Orta" },
	{ radius: 40, label: "Büyük" },
];

// Bir serbest çizgiyi silgi noktasına göre parçalara ayırarak silen fonksiyon
function splitStrokeByEraser(
	stroke: DrawingStroke,
	eraserPoint: { x: number; y: number },
	eraserRadius: number,
): { changed: boolean; newStrokes: DrawingStroke[] } {
	// Geometrik şekil ise ve temas ediyorsa şekli komple sil
	if (stroke.shapeType && stroke.shapeType !== "pen") {
		const hasContact = stroke.points.some(
			(pt) => Math.hypot(pt.x - eraserPoint.x, pt.y - eraserPoint.y) <= eraserRadius + stroke.width,
		);
		if (hasContact) {
			return { changed: true, newStrokes: [] };
		}
		return { changed: false, newStrokes: [stroke] };
	}

	// Serbest çizgi noktalarını aralıklı parçalara ayırarak yoğunlaştır
	const densePoints: { x: number; y: number }[] = [];
	let touched = false;

	for (let i = 0; i < stroke.points.length; i++) {
		densePoints.push(stroke.points[i]);
		if (i < stroke.points.length - 1) {
			const p1 = stroke.points[i];
			const p2 = stroke.points[i + 1];
			const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
			const step = 3;
			if (dist > step) {
				const count = Math.floor(dist / step);
				for (let j = 1; j < count; j++) {
					const t = j / count;
					densePoints.push({
						x: p1.x + (p2.x - p1.x) * t,
						y: p1.y + (p2.y - p1.y) * t,
					});
				}
			}
		}
	}

	const effectiveRadius = eraserRadius + stroke.width / 2;
	const groups: { x: number; y: number }[][] = [];
	let currentGroup: { x: number; y: number }[] = [];

	for (const pt of densePoints) {
		const d = Math.hypot(pt.x - eraserPoint.x, pt.y - eraserPoint.y);
		if (d > effectiveRadius) {
			currentGroup.push(pt);
		} else {
			touched = true;
			if (currentGroup.length >= 2) {
				groups.push(currentGroup);
			}
			currentGroup = [];
		}
	}

	if (currentGroup.length >= 2) {
		groups.push(currentGroup);
	}

	if (!touched) {
		return { changed: false, newStrokes: [stroke] };
	}

	const resultStrokes = groups.map((pts, idx) => ({
		id: `${stroke.id}-part-${idx}-${Date.now()}`,
		points: pts,
		color: stroke.color,
		width: stroke.width,
		isHighlighter: stroke.isHighlighter,
		shapeType: "pen" as const,
	}));

	return { changed: true, newStrokes: resultStrokes };
}

const roughGen = rough.generator();

// Her çizim için sabit rastgelelik (seed) üreterek titremeyi engelle ve doğal el çizimi sağla
function getStrokeSeed(id?: string): number {
	if (!id) return 12345;
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash) || 12345;
}

// RoughJS Drawable nesnelerini Canvas Context'e pürüzsüzce çizen yürütücü
function drawRoughDrawable(ctx: CanvasRenderingContext2D, drawable: any) {
	if (!drawable || !drawable.sets) return;
	const options = drawable.options || {};

	for (const set of drawable.sets) {
		if (set.type === "path") {
			ctx.save();
			ctx.strokeStyle =
				options.stroke === "none" ? "transparent" : options.stroke || ctx.strokeStyle;
			ctx.lineWidth = options.strokeWidth || ctx.lineWidth;
			if (options.strokeLineDash && options.strokeLineDash.length > 0) {
				ctx.setLineDash(options.strokeLineDash);
			}
			ctx.beginPath();
			for (const op of set.ops) {
				const d = op.data;
				if (op.op === "move") ctx.moveTo(d[0], d[1]);
				else if (op.op === "bcurveTo") ctx.bezierCurveTo(d[0], d[1], d[2], d[3], d[4], d[5]);
				else if (op.op === "lineTo") ctx.lineTo(d[0], d[1]);
			}
			ctx.stroke();
			ctx.restore();
		} else if (set.type === "fillPath") {
			ctx.save();
			ctx.fillStyle = options.fill || ctx.fillStyle;
			ctx.beginPath();
			for (const op of set.ops) {
				const d = op.data;
				if (op.op === "move") ctx.moveTo(d[0], d[1]);
				else if (op.op === "bcurveTo") ctx.bezierCurveTo(d[0], d[1], d[2], d[3], d[4], d[5]);
				else if (op.op === "lineTo") ctx.lineTo(d[0], d[1]);
			}
			ctx.fill();
			ctx.restore();
		} else if (set.type === "fillSketch") {
			ctx.save();
			ctx.strokeStyle = options.fill || ctx.strokeStyle;
			ctx.lineWidth =
				options.fillWeight > 0 ? options.fillWeight : Math.max(1, (options.strokeWidth || 2) * 0.7);
			ctx.beginPath();
			for (const op of set.ops) {
				const d = op.data;
				if (op.op === "move") ctx.moveTo(d[0], d[1]);
				else if (op.op === "bcurveTo") ctx.bezierCurveTo(d[0], d[1], d[2], d[3], d[4], d[5]);
				else if (op.op === "lineTo") ctx.lineTo(d[0], d[1]);
			}
			ctx.stroke();
			ctx.restore();
		}
	}
}

// Metin boyutlarını hesaplama yardımcısı
function getTextDimensions(text: string, widthVal: number, customFontSize?: number) {
	const fontSize = customFontSize || ((widthVal || 2) <= 2 ? 20 : (widthVal || 2) <= 4 ? 26 : 34);
	const lines = (text || "Metin").split("\n");
	let maxLineLen = 0;
	lines.forEach((l) => {
		if (l.length > maxLineLen) maxLineLen = l.length;
	});
	const width = Math.max(24, maxLineLen * (fontSize * 0.58));
	const height = Math.max(24, lines.length * (fontSize * 1.25));
	return { fontSize, lines, width, height, lineHeight: fontSize * 1.25 };
}

// Şekil çizim yardımcıları (RoughJS ile Excalidraw gibi doğal, köşelerden taşan, üzerinden geçilmiş karalama efekti)
function drawShape(
	ctx: CanvasRenderingContext2D,
	shapeType: string,
	p1: { x: number; y: number },
	p2: { x: number; y: number },
	textValue?: string,
	controlPoint?: { x: number; y: number },
	rotation?: number,
	fillColor?: string,
	strokeStyle?: "solid" | "dashed" | "dotted",
	strokeEdges?: "sharp" | "rounded",
	strokeRoughness?: "clean" | "wobbly" | "rough",
	strokeSeed?: number,
	strokeColor?: string,
	strokeWidthVal?: number,
	customFontSize?: number,
) {
	ctx.save();

	// 360 Derece Döndürme Merkezi
	if (rotation && rotation !== 0) {
		let cx = (p1.x + p2.x) / 2;
		let cy = (p1.y + p2.y) / 2;
		if (shapeType === "text") {
			const dims = getTextDimensions(textValue || "", strokeWidthVal || 2, customFontSize);
			cx = p1.x + dims.width / 2;
			cy = p1.y + dims.height / 2;
		}
		ctx.translate(cx, cy);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-cx, -cy);
	}

	// Roughness parametreleri (Excalidraw gibi katmanlı, üzerinden geçilmiş çizgiler)
	// clean: düz, mimari ve net hatlar
	// wobbly: doğal el çizimi, hafif çift kontur
	// rough: karalama / taslak, köşelerden taşan, üzerinden 2-3 kez geçilmiş canlı eskiz
	const roughnessVal = strokeRoughness === "clean" ? 0.2 : strokeRoughness === "rough" ? 2.4 : 1.4;
	const bowingVal = strokeRoughness === "clean" ? 0 : strokeRoughness === "rough" ? 2.2 : 1.2;
	const seed = strokeSeed || 12345;
	const mainColor = strokeColor || (ctx.strokeStyle as string) || "#1E1E1E";
	const widthVal = strokeWidthVal || ctx.lineWidth || 2;

	let dashPattern: number[] | undefined = undefined;
	if (strokeStyle === "dashed") dashPattern = [8, 6];
	else if (strokeStyle === "dotted") dashPattern = [3, 5];

	const hasFill = fillColor && fillColor !== "transparent";
	const roughOptions: any = {
		seed,
		roughness: roughnessVal,
		bowing: bowingVal,
		stroke: mainColor,
		strokeWidth: widthVal,
		strokeLineDash: dashPattern,
		fill: hasFill ? fillColor : undefined,
		fillStyle: hasFill ? (strokeRoughness === "rough" ? "hachure" : "solid") : undefined,
		fillWeight: Math.max(1, widthVal * 0.65),
		hachureAngle: -41,
		hachureGap: strokeRoughness === "rough" ? 6 : 4,
		disableMultiStroke: strokeRoughness === "clean",
		curveFitting: 0.95,
	};

	const x = Math.min(p1.x, p2.x);
	const y = Math.min(p1.y, p2.y);
	const w = Math.max(2, Math.abs(p2.x - p1.x));
	const h = Math.max(2, Math.abs(p2.y - p1.y));

	if (shapeType === "rectangle") {
		if (strokeEdges === "rounded") {
			const radius = Math.min(16, w / 4, h / 4);
			// Yuvarlatılmış köşeler için SVG path tabanlı rough çizim
			const pathStr =
				`M ${x + radius} ${y} ` +
				`L ${x + w - radius} ${y} ` +
				`Q ${x + w} ${y} ${x + w} ${y + radius} ` +
				`L ${x + w} ${y + h - radius} ` +
				`Q ${x + w} ${y + h} ${x + w - radius} ${y + h} ` +
				`L ${x + radius} ${y + h} ` +
				`Q ${x} ${y + h} ${x} ${y + h - radius} ` +
				`L ${x} ${y + radius} ` +
				`Q ${x} ${y} ${x + radius} ${y} Z`;
			const drawable = roughGen.path(pathStr, roughOptions);
			drawRoughDrawable(ctx, drawable);
		} else {
			const drawable = roughGen.rectangle(x, y, w, h, roughOptions);
			drawRoughDrawable(ctx, drawable);
		}

		// Şekil içi metin (Excalidraw gibi ortalanmış el yazısı fontu)
		if (textValue && textValue.trim()) {
			const centerX = x + w / 2;
			const centerY = y + h / 2;
			const fontSize = customFontSize || 18;
			ctx.font = `600 ${fontSize}px "Kalam", "Caveat", "Space Grotesk", cursive, sans-serif`;
			ctx.fillStyle = mainColor;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			const lines = textValue.split("\n");
			const lineHeight = fontSize * 1.25;
			const totalH = lines.length * lineHeight;
			const startY = centerY - totalH / 2 + lineHeight / 2;
			lines.forEach((line, idx) => {
				ctx.fillText(line, centerX, startY + idx * lineHeight);
			});
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
		}
	} else if (shapeType === "circle") {
		const drawable = roughGen.ellipse(x + w / 2, y + h / 2, w, h, roughOptions);
		drawRoughDrawable(ctx, drawable);

		// Çember içi metin
		if (textValue && textValue.trim()) {
			const centerX = x + w / 2;
			const centerY = y + h / 2;
			const fontSize = customFontSize || 18;
			ctx.font = `600 ${fontSize}px "Kalam", "Caveat", "Space Grotesk", cursive, sans-serif`;
			ctx.fillStyle = mainColor;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			const lines = textValue.split("\n");
			const lineHeight = fontSize * 1.25;
			const totalH = lines.length * lineHeight;
			const startY = centerY - totalH / 2 + lineHeight / 2;
			lines.forEach((line, idx) => {
				ctx.fillText(line, centerX, startY + idx * lineHeight);
			});
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
		}
	} else if (shapeType === "diamond") {
		const points: [number, number][] = [
			[x + w / 2, y],
			[x + w, y + h / 2],
			[x + w / 2, y + h],
			[x, y + h / 2],
		];
		const drawable = roughGen.polygon(points, roughOptions);
		drawRoughDrawable(ctx, drawable);

		// Baklava içi metin
		if (textValue && textValue.trim()) {
			const centerX = x + w / 2;
			const centerY = y + h / 2;
			const fontSize = customFontSize || 18;
			ctx.font = `600 ${fontSize}px "Kalam", "Caveat", "Space Grotesk", cursive, sans-serif`;
			ctx.fillStyle = mainColor;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			const lines = textValue.split("\n");
			const lineHeight = fontSize * 1.25;
			const totalH = lines.length * lineHeight;
			const startY = centerY - totalH / 2 + lineHeight / 2;
			lines.forEach((line, idx) => {
				ctx.fillText(line, centerX, startY + idx * lineHeight);
			});
			ctx.textAlign = "left";
			ctx.textBaseline = "top";
		}
	} else if (shapeType === "line") {
		if (controlPoint) {
			// Kavisli yay / eğri
			const pathStr = `M ${p1.x} ${p1.y} Q ${controlPoint.x} ${controlPoint.y} ${p2.x} ${p2.y}`;
			const drawable = roughGen.path(pathStr, roughOptions);
			drawRoughDrawable(ctx, drawable);
		} else {
			const drawable = roughGen.line(p1.x, p1.y, p2.x, p2.y, roughOptions);
			drawRoughDrawable(ctx, drawable);
		}
	} else if (shapeType === "arrow") {
		let endAngle: number;
		if (controlPoint) {
			const pathStr = `M ${p1.x} ${p1.y} Q ${controlPoint.x} ${controlPoint.y} ${p2.x} ${p2.y}`;
			const drawable = roughGen.path(pathStr, roughOptions);
			drawRoughDrawable(ctx, drawable);
			endAngle = Math.atan2(p2.y - controlPoint.y, p2.x - controlPoint.x);
		} else {
			const drawable = roughGen.line(p1.x, p1.y, p2.x, p2.y, roughOptions);
			drawRoughDrawable(ctx, drawable);
			endAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
		}

		// Ok başı (Rough el çizimi ok kanatları)
		const headLen = 14;
		const a1x = p2.x - headLen * Math.cos(endAngle - Math.PI / 6);
		const a1y = p2.y - headLen * Math.sin(endAngle - Math.PI / 6);
		const a2x = p2.x - headLen * Math.cos(endAngle + Math.PI / 6);
		const a2y = p2.y - headLen * Math.sin(endAngle + Math.PI / 6);

		const arrowHeadOptions = {
			...roughOptions,
			disableMultiStroke: false,
			seed: seed + 99,
		};
		const head1 = roughGen.line(p2.x, p2.y, a1x, a1y, arrowHeadOptions);
		const head2 = roughGen.line(p2.x, p2.y, a2x, a2y, arrowHeadOptions);
		drawRoughDrawable(ctx, head1);
		drawRoughDrawable(ctx, head2);
	} else if (shapeType === "text") {
		const fontSize = customFontSize || (widthVal <= 2 ? 20 : widthVal <= 4 ? 26 : 34);
		ctx.font = `600 ${fontSize}px "Kalam", "Caveat", "Space Grotesk", cursive, sans-serif`;
		ctx.fillStyle = mainColor;
		ctx.textBaseline = "top";

		const lines = (textValue || "").split("\n");
		const lineHeight = fontSize * 1.25;
		lines.forEach((line, idx) => {
			ctx.fillText(line, p1.x, p1.y + idx * lineHeight);
		});
	}

	ctx.restore();
}

// Noktayı merkez etrafında döndür
function rotatePoint(
	p: { x: number; y: number },
	center: { x: number; y: number },
	angleDeg: number,
): { x: number; y: number } {
	if (!angleDeg) return p;
	const rad = (angleDeg * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const dx = p.x - center.x;
	const dy = p.y - center.y;
	return {
		x: center.x + dx * cos - dy * sin,
		y: center.y + dx * sin + dy * cos,
	};
}

// Şekil / Vuruş Sınır Kutusu (Bounding Box) Hesaplayıcı
function getStrokeBoundingBox(stroke: DrawingStroke) {
	if (!stroke.points || stroke.points.length === 0) return null;
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
	const allPts = [...stroke.points];
	if (stroke.controlPoint) {
		allPts.push(stroke.controlPoint);
	}
	allPts.forEach((p) => {
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
	});

	if (stroke.shapeType === "text") {
		const dims = getTextDimensions(stroke.text || "Metin", stroke.width || 2, stroke.fontSize);
		maxX = Math.max(maxX, minX + dims.width);
		maxY = Math.max(maxY, minY + dims.height);
	}

	// Çizgi ve oklarda tek düz çizgi için asgari alan ver
	if (maxX - minX < 14) {
		minX -= 7;
		maxX += 7;
	}
	if (maxY - minY < 14) {
		minY -= 7;
		maxY += 7;
	}

	return {
		rawMinX: minX,
		rawMinY: minY,
		rawMaxX: maxX,
		rawMaxY: maxY,
		width: maxX - minX,
		height: maxY - minY,
		centerX: (minX + maxX) / 2,
		centerY: (minY + maxY) / 2,
	};
}

// Noktanın doğru parçasına uzaklığı
function distToSegment(
	p: { x: number; y: number },
	v: { x: number; y: number },
	w: { x: number; y: number },
) {
	const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
	if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
	let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));
	return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

// Noktanın kuadratik bezier eğrisine yaklaşık uzaklığı
function distToQuadraticCurve(
	p: { x: number; y: number },
	p1: { x: number; y: number },
	cp: { x: number; y: number },
	p2: { x: number; y: number },
	steps = 20,
) {
	let minDist = Infinity;
	let prevX = p1.x;
	let prevY = p1.y;
	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const invT = 1 - t;
		const curX = invT * invT * p1.x + 2 * invT * t * cp.x + t * t * p2.x;
		const curY = invT * invT * p1.y + 2 * invT * t * cp.y + t * t * p2.y;
		const d = distToSegment(p, { x: prevX, y: prevY }, { x: curX, y: curY });
		if (d < minDist) minDist = d;
		prevX = curX;
		prevY = curY;
	}
	return minDist;
}

// Şekil Seçim Tespiti (Hit Testing) - Döndürülmüş şekiller, kavisli çizgiler ve tüm objeler için kusursuz seçim
function isPointInStroke(flowPos: { x: number; y: number }, stroke: DrawingStroke): boolean {
	const box = getStrokeBoundingBox(stroke);
	if (!box) return false;

	const rotation = stroke.rotation || 0;
	// Eğer şekil döndürülmüşse, tıklanan noktayı şeklin yerel koordinat sistemine ters döndür (unrotate)
	const center = { x: box.centerX, y: box.centerY };
	const testPoint = rotation !== 0 ? rotatePoint(flowPos, center, -rotation) : flowPos;

	// Çizgi veya Ok seçimi: Çizginin doğrudan üzerine veya yakınına tıklanması yeterli
	if (stroke.shapeType === "line" || stroke.shapeType === "arrow") {
		const p1 = stroke.points[0];
		const p2 = stroke.points[stroke.points.length - 1];
		const threshold = Math.max(stroke.width * 2, 24); // Cömert ve kolay tıklama alanı

		if (stroke.controlPoint) {
			return distToQuadraticCurve(testPoint, p1, stroke.controlPoint, p2) <= threshold;
		}
		return distToSegment(testPoint, p1, p2) <= threshold;
	}

	// Kapalı şekiller, metinler, görseller ve web embed için:
	// Şeklin sınır kutusuna tıklanması veya kenarlıklarına yakın olması yeterlidir
	if (
		["rectangle", "diamond", "circle", "text", "image", "web", "frame"].includes(
			stroke.shapeType || "",
		)
	) {
		const pad = Math.max(stroke.width, 14);
		return (
			testPoint.x >= box.rawMinX - pad &&
			testPoint.x <= box.rawMaxX + pad &&
			testPoint.y >= box.rawMinY - pad &&
			testPoint.y <= box.rawMaxY + pad
		);
	}

	// Serbest çizimler (pen / highlighter)
	const threshold = Math.max(stroke.width * 2, 20);
	for (let i = 0; i < stroke.points.length - 1; i++) {
		const d = distToSegment(testPoint, stroke.points[i], stroke.points[i + 1]);
		if (d <= threshold) {
			return true;
		}
	}

	return false;
}

// Şeklin veya Çizginin Bağlantı / Çapa Noktalarını (Anchor Points) Hesapla
export type ShapeAnchorType =
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

export interface ShapeAnchorPoint {
	strokeId: string;
	anchor: ShapeAnchorType;
	point: { x: number; y: number };
	relativePoint?: { x: number; y: number }; // [0..1] normalize yerel koordinat
	paramT?: number; // Çizgi üzerindeki [0..1] oranı
	isLine?: boolean;
}

// Bir noktanın doğru parçasına dik iz düşümünü ve t oranını hesapla
function projectPointOnSegment(
	p: { x: number; y: number },
	v: { x: number; y: number },
	w: { x: number; y: number },
) {
	const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
	if (l2 === 0) return { point: v, t: 0, dist: Math.hypot(p.x - v.x, p.y - v.y) };
	let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));
	const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
	return { point: proj, t, dist: Math.hypot(p.x - proj.x, p.y - proj.y) };
}

// Çizgi ve okun kavis/orta tutamaç noktasını hesapla (Bézier eğrisi üzerinde t=0.5 noktası)
export function getCurveHandlePosition(
	p1: { x: number; y: number },
	p2: { x: number; y: number },
	cp?: { x: number; y: number },
): { x: number; y: number } {
	if (!cp) {
		return {
			x: (p1.x + p2.x) / 2,
			y: (p1.y + p2.y) / 2,
		};
	}
	return {
		x: 0.25 * p1.x + 0.5 * cp.x + 0.25 * p2.x,
		y: 0.25 * p1.y + 0.5 * cp.y + 0.25 * p2.y,
	};
}

// Şekil için standart veya kenar noktalarını hesapla
function getShapeAnchorPoints(stroke: DrawingStroke): ShapeAnchorPoint[] {
	// 1. Çizgiler veya Oklar: Başlangıç, Bitiş, Orta nokta
	if (stroke.shapeType === "line" || stroke.shapeType === "arrow") {
		const p1 = stroke.points[0];
		const p2 = stroke.points[stroke.points.length - 1];
		const cp = stroke.controlPoint;
		const mid = getCurveHandlePosition(p1, p2, cp);

		return [
			{ strokeId: stroke.id, anchor: "tl", point: p1, paramT: 0, isLine: true },
			{ strokeId: stroke.id, anchor: "center", point: mid, paramT: 0.5, isLine: true },
			{ strokeId: stroke.id, anchor: "br", point: p2, paramT: 1, isLine: true },
		];
	}

	// 2. Kapalı şekiller, metinler, görseller, web ve çerçeve
	if (
		!["rectangle", "circle", "diamond", "text", "image", "web", "frame"].includes(
			stroke.shapeType || "",
		)
	) {
		return [];
	}

	const box = getStrokeBoundingBox(stroke);
	if (!box) return [];

	const rot = stroke.rotation || 0;
	const center = { x: box.centerX, y: box.centerY };

	let rawAnchors: {
		anchor: ShapeAnchorType;
		p: { x: number; y: number };
		rel?: { x: number; y: number };
	}[] = [];

	if (stroke.shapeType === "diamond") {
		// Baklava için 4 tepe noktası (Üst, Sağ, Alt, Sol) ve kenar çeyrekleri
		const pTop = { x: box.centerX, y: box.rawMinY };
		const pRight = { x: box.rawMaxX, y: box.centerY };
		const pBottom = { x: box.centerX, y: box.rawMaxY };
		const pLeft = { x: box.rawMinX, y: box.centerY };

		rawAnchors = [
			{ anchor: "top", p: pTop, rel: { x: 0.5, y: 0 } },
			{ anchor: "right", p: pRight, rel: { x: 1, y: 0.5 } },
			{ anchor: "bottom", p: pBottom, rel: { x: 0.5, y: 1 } },
			{ anchor: "left", p: pLeft, rel: { x: 0, y: 0.5 } },
			{ anchor: "center", p: center, rel: { x: 0.5, y: 0.5 } },
			// 4 Kenarın tam ortaları
			{
				anchor: "tr",
				p: { x: (pTop.x + pRight.x) / 2, y: (pTop.y + pRight.y) / 2 },
				rel: { x: 0.75, y: 0.25 },
			},
			{
				anchor: "br",
				p: { x: (pBottom.x + pRight.x) / 2, y: (pBottom.y + pRight.y) / 2 },
				rel: { x: 0.75, y: 0.75 },
			},
			{
				anchor: "bl",
				p: { x: (pBottom.x + pLeft.x) / 2, y: (pBottom.y + pLeft.y) / 2 },
				rel: { x: 0.25, y: 0.75 },
			},
			{
				anchor: "tl",
				p: { x: (pTop.x + pLeft.x) / 2, y: (pTop.y + pLeft.y) / 2 },
				rel: { x: 0.25, y: 0.25 },
			},
		];
	} else {
		// Dikdörtgen, Daire, Metin, vb. için kenarlar ve köşeler
		rawAnchors = [
			{ anchor: "top", p: { x: box.centerX, y: box.rawMinY }, rel: { x: 0.5, y: 0 } },
			{ anchor: "right", p: { x: box.rawMaxX, y: box.centerY }, rel: { x: 1, y: 0.5 } },
			{ anchor: "bottom", p: { x: box.centerX, y: box.rawMaxY }, rel: { x: 0.5, y: 1 } },
			{ anchor: "left", p: { x: box.rawMinX, y: box.centerY }, rel: { x: 0, y: 0.5 } },
			{ anchor: "center", p: center, rel: { x: 0.5, y: 0.5 } },
			{ anchor: "tl", p: { x: box.rawMinX, y: box.rawMinY }, rel: { x: 0, y: 0 } },
			{ anchor: "tr", p: { x: box.rawMaxX, y: box.rawMinY }, rel: { x: 1, y: 0 } },
			{ anchor: "br", p: { x: box.rawMaxX, y: box.rawMaxY }, rel: { x: 1, y: 1 } },
			{ anchor: "bl", p: { x: box.rawMinX, y: box.rawMaxY }, rel: { x: 0, y: 1 } },
		];
	}

	return rawAnchors.map((a) => ({
		strokeId: stroke.id,
		anchor: a.anchor,
		point: rot !== 0 ? rotatePoint(a.p, center, rot) : a.p,
		relativePoint: a.rel,
		isLine: false,
	}));
}

// İstenilen herhangi bir noktadan şekil sınırına en yakın serbest çapa noktasını hesapla
function getClosestPointOnShape(
	pos: { x: number; y: number },
	stroke: DrawingStroke,
	maxDist = 28,
): ShapeAnchorPoint | null {
	const box = getStrokeBoundingBox(stroke);
	if (!box) return null;

	const rot = stroke.rotation || 0;
	const center = { x: box.centerX, y: box.centerY };
	// Şekil döndürülmüşse, noktayı şeklin yerel eksenine çevir
	const localP = rot !== 0 ? rotatePoint(pos, center, -rot) : pos;

	// 1. Çizgi veya Ok üzerine kilitlenme (Çizgiyi çizgiye kilitleme)
	if (stroke.shapeType === "line" || stroke.shapeType === "arrow") {
		const p1 = stroke.points[0];
		const p2 = stroke.points[stroke.points.length - 1];
		const cp = stroke.controlPoint;

		if (cp) {
			// Kuadratik kavisli çizgi üzerinde en yakın noktayı ve parametre t'yi bul
			let bestT = 0;
			let bestDist = Infinity;
			let bestPt = p1;
			const steps = 30;
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const invT = 1 - t;
				const curX = invT * invT * p1.x + 2 * invT * t * cp.x + t * t * p2.x;
				const curY = invT * invT * p1.y + 2 * invT * t * cp.y + t * t * p2.y;
				const d = Math.hypot(pos.x - curX, pos.y - curY);
				if (d < bestDist) {
					bestDist = d;
					bestT = t;
					bestPt = { x: curX, y: curY };
				}
			}

			if (bestDist <= maxDist) {
				return {
					strokeId: stroke.id,
					anchor: "line",
					point: bestPt,
					paramT: bestT,
					isLine: true,
				};
			}
		} else {
			// Düz çizgi üzerinde en yakın projeksiyon noktası
			const proj = projectPointOnSegment(pos, p1, p2);
			if (proj.dist <= maxDist) {
				return {
					strokeId: stroke.id,
					anchor: "line",
					point: proj.point,
					paramT: proj.t,
					isLine: true,
				};
			}
		}
		return null;
	}

	// 2. Daire için: İstenilen açıdan çember çevresine kilitleme
	if (stroke.shapeType === "circle") {
		const radiusX = box.width / 2;
		const radiusY = box.height / 2;
		const angle = Math.atan2(localP.y - center.y, localP.x - center.x);
		const borderLocal = {
			x: center.x + radiusX * Math.cos(angle),
			y: center.y + radiusY * Math.sin(angle),
		};
		const distToBorder = Math.hypot(localP.x - borderLocal.x, localP.y - borderLocal.y);
		const distToCenter = Math.hypot(localP.x - center.x, localP.y - center.y);

		if (distToBorder <= maxDist) {
			const worldPoint = rot !== 0 ? rotatePoint(borderLocal, center, rot) : borderLocal;
			const relX = box.width > 0 ? (borderLocal.x - box.rawMinX) / box.width : 0.5;
			const relY = box.height > 0 ? (borderLocal.y - box.rawMinY) / box.height : 0.5;
			return {
				strokeId: stroke.id,
				anchor: "custom",
				point: worldPoint,
				relativePoint: { x: relX, y: relY },
				isLine: false,
			};
		} else if (distToCenter <= maxDist * 0.75) {
			return {
				strokeId: stroke.id,
				anchor: "center",
				point: rot !== 0 ? rotatePoint(center, center, rot) : center,
				relativePoint: { x: 0.5, y: 0.5 },
				isLine: false,
			};
		}
	}

	// 3. Baklava (Diamond) için: 4 kenar çizgisi üzerine tam projeksiyon
	if (stroke.shapeType === "diamond") {
		const pTop = { x: center.x, y: box.rawMinY };
		const pRight = { x: box.rawMaxX, y: center.y };
		const pBottom = { x: center.x, y: box.rawMaxY };
		const pLeft = { x: box.rawMinX, y: center.y };

		const segments: [{ x: number; y: number }, { x: number; y: number }][] = [
			[pTop, pRight],
			[pRight, pBottom],
			[pBottom, pLeft],
			[pLeft, pTop],
		];

		let bestProjPoint: { x: number; y: number } = pTop;
		let bestProjDist = Infinity;

		for (let i = 0; i < segments.length; i++) {
			const [v, w] = segments[i];
			const proj = projectPointOnSegment(localP, v, w);
			if (proj.dist < bestProjDist) {
				bestProjDist = proj.dist;
				bestProjPoint = proj.point;
			}
		}

		if (bestProjDist <= maxDist) {
			const borderLocal = bestProjPoint;
			const worldPoint = rot !== 0 ? rotatePoint(borderLocal, center, rot) : borderLocal;
			const relX = box.width > 0 ? (borderLocal.x - box.rawMinX) / box.width : 0.5;
			const relY = box.height > 0 ? (borderLocal.y - box.rawMinY) / box.height : 0.5;
			return {
				strokeId: stroke.id,
				anchor: "custom",
				point: worldPoint,
				relativePoint: { x: relX, y: relY },
				isLine: false,
			};
		}
	}

	// 4. Dikdörtgen, Metin, Resim, Çerçeve vb. için: 4 kenar ve iç alan
	if (["rectangle", "text", "image", "web", "frame"].includes(stroke.shapeType || "")) {
		// En yakın kenara izdüşüm
		const clampedX = Math.max(box.rawMinX, Math.min(box.rawMaxX, localP.x));
		const clampedY = Math.max(box.rawMinY, Math.min(box.rawMaxY, localP.y));

		// Kenarlara uzaklık
		const distToLeft = Math.abs(localP.x - box.rawMinX);
		const distToRight = Math.abs(localP.x - box.rawMaxX);
		const distToTop = Math.abs(localP.y - box.rawMinY);
		const distToBottom = Math.abs(localP.y - box.rawMaxY);

		const minDistEdge = Math.min(distToLeft, distToRight, distToTop, distToBottom);

		let borderLocal: { x: number; y: number };
		if (minDistEdge === distToLeft) {
			borderLocal = { x: box.rawMinX, y: clampedY };
		} else if (minDistEdge === distToRight) {
			borderLocal = { x: box.rawMaxX, y: clampedY };
		} else if (minDistEdge === distToTop) {
			borderLocal = { x: clampedX, y: box.rawMinY };
		} else {
			borderLocal = { x: clampedX, y: box.rawMaxY };
		}

		const distToBorder = Math.hypot(localP.x - borderLocal.x, localP.y - borderLocal.y);
		const distToCenter = Math.hypot(localP.x - center.x, localP.y - center.y);

		if (distToBorder <= maxDist) {
			const worldPoint = rot !== 0 ? rotatePoint(borderLocal, center, rot) : borderLocal;
			const relX = box.width > 0 ? (borderLocal.x - box.rawMinX) / box.width : 0.5;
			const relY = box.height > 0 ? (borderLocal.y - box.rawMinY) / box.height : 0.5;
			return {
				strokeId: stroke.id,
				anchor: "custom",
				point: worldPoint,
				relativePoint: { x: relX, y: relY },
				isLine: false,
			};
		} else if (distToCenter <= maxDist * 0.75) {
			return {
				strokeId: stroke.id,
				anchor: "center",
				point: rot !== 0 ? rotatePoint(center, center, rot) : center,
				relativePoint: { x: 0.5, y: 0.5 },
				isLine: false,
			};
		}
	}

	return null;
}

// Belirli bir koordinata en yakın çapa noktasını bul (Sabit Çapa veya Serbest Kenar/Çizgi Kilidi)
function findClosestAnchor(
	pos: { x: number; y: number },
	strokes: DrawingStroke[],
	excludeStrokeId?: string,
	maxDist = 26,
): ShapeAnchorPoint | null {
	let closest: ShapeAnchorPoint | null = null;
	let minDist = maxDist;

	// 1. Önce sabit çapa noktalarını kontrol et (Merkez, Köşeler, Kenar Ortaları)
	strokes.forEach((s) => {
		if (s.id === excludeStrokeId) return;
		const anchors = getShapeAnchorPoints(s);
		anchors.forEach((anch) => {
			const d = Math.hypot(anch.point.x - pos.x, anch.point.y - pos.y);
			if (d < minDist) {
				minDist = d;
				closest = anch;
			}
		});
	});

	// Eğer doğrudan bir sabit çapa noktasına çok yakınsak (örn: 14px) doğrudan ona kilitlen
	if (closest && minDist < 14) {
		return closest;
	}

	// 2. Şekillerin herhangi bir kenarına veya çizgilere serbest kilitleme (İstenilen noktadan kilitleme)
	strokes.forEach((s) => {
		if (s.id === excludeStrokeId) return;
		const dynamicSnap = getClosestPointOnShape(pos, s, maxDist);
		if (dynamicSnap) {
			const d = Math.hypot(dynamicSnap.point.x - pos.x, dynamicSnap.point.y - pos.y);
			if (d < minDist) {
				minDist = d;
				closest = dynamicSnap;
			}
		}
	});

	return closest;
}

// Belirli bir şekil ve kilitli bağlantı bilgisi için güncel dünya koordinatını hesapla
function getAnchorPosition(
	stroke: DrawingStroke,
	anchorInfo: {
		anchor?: ShapeAnchorType;
		relativePoint?: { x: number; y: number };
		paramT?: number;
	},
): { x: number; y: number } | null {
	// 1. Çizgiye kilitli ise (Parametrik t oranı)
	if (anchorInfo.anchor === "line" || stroke.shapeType === "line" || stroke.shapeType === "arrow") {
		const p1 = stroke.points[0];
		const p2 = stroke.points[stroke.points.length - 1];
		const cp = stroke.controlPoint;
		const t = anchorInfo.paramT !== undefined ? anchorInfo.paramT : 0.5;

		if (cp) {
			const invT = 1 - t;
			return {
				x: invT * invT * p1.x + 2 * invT * t * cp.x + t * t * p2.x,
				y: invT * invT * p1.y + 2 * invT * t * cp.y + t * t * p2.y,
			};
		}
		return {
			x: p1.x + t * (p2.x - p1.x),
			y: p1.y + t * (p2.y - p1.y),
		};
	}

	const box = getStrokeBoundingBox(stroke);
	if (!box) return null;

	const rot = stroke.rotation || 0;
	const center = { x: box.centerX, y: box.centerY };

	// 2. Serbest bağıl nokta (custom relative point: 0..1)
	if (anchorInfo.relativePoint) {
		const rawX = box.rawMinX + anchorInfo.relativePoint.x * box.width;
		const rawY = box.rawMinY + anchorInfo.relativePoint.y * box.height;
		return rot !== 0 ? rotatePoint({ x: rawX, y: rawY }, center, rot) : { x: rawX, y: rawY };
	}

	// 3. Standart çapa noktaları
	if (anchorInfo.anchor) {
		const anchors = getShapeAnchorPoints(stroke);
		const found = anchors.find((a) => a.anchor === anchorInfo.anchor);
		if (found) return found.point;
	}

	return center;
}

// Şekil veya çizgi taşındığında / boyutlandırıldığında ona kilitli olan tüm ok ve çizgileri anında takip ettir
function updateConnectedLines(allStrokes: DrawingStroke[], movedStrokeId: string): DrawingStroke[] {
	const targetStroke = allStrokes.find((s) => s.id === movedStrokeId);
	if (!targetStroke) return allStrokes;

	return allStrokes.map((s) => {
		if (s.shapeType !== "line" && s.shapeType !== "arrow") return s;

		let updated = false;
		let newP1 = { ...s.points[0] };
		let newP2 = { ...s.points[s.points.length - 1] };

		if (s.startBinding && s.startBinding.strokeId === movedStrokeId) {
			const pos = getAnchorPosition(targetStroke, s.startBinding);
			if (pos) {
				newP1 = pos;
				updated = true;
			}
		}

		if (s.endBinding && s.endBinding.strokeId === movedStrokeId) {
			const pos = getAnchorPosition(targetStroke, s.endBinding);
			if (pos) {
				newP2 = pos;
				updated = true;
			}
		}

		if (updated) {
			let newCp = s.controlPoint;
			if (newCp) {
				const oldP1 = s.points[0];
				const oldP2 = s.points[s.points.length - 1];
				const oldMid = { x: (oldP1.x + oldP2.x) / 2, y: (oldP1.y + oldP2.y) / 2 };
				const newMid = { x: (newP1.x + newP2.x) / 2, y: (newP1.y + newP2.y) / 2 };
				newCp = {
					x: newCp.x + (newMid.x - oldMid.x),
					y: newCp.y + (newMid.y - oldMid.y),
				};
			}
			return {
				...s,
				points: [newP1, newP2],
				controlPoint: newCp,
			};
		}

		return s;
	});
}

export const DrawingLayer: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const viewport = useViewport();
	const { screenToFlowPosition, setViewport } = useReactFlow();

	const isDrawingMode = useGoalStore((s) => s.isDrawingMode);
	const toggleDrawingMode = useGoalStore((s) => s.toggleDrawingMode);
	const drawingStrokes = useGoalStore((s) => s.drawingStrokes);
	const addDrawingStroke = useGoalStore((s) => s.addDrawingStroke);
	const deleteLastSession = useGoalStore((s) => s.deleteLastSession);
	const setDrawingStrokes = useGoalStore((s) => s.setDrawingStrokes);
	const undoDrawingStroke = useGoalStore((s) => s.undoDrawingStroke);

	// Excalidraw / Tablet Kalemi Araçları ve Stil Özellikleri
	const [tool, setTool] = useState<ExcaliToolType>("pen");
	const [currentColor, setCurrentColor] = useState("#1E1E1E");
	const [currentFill, setCurrentFill] = useState("transparent");
	const [currentWidth, setCurrentWidth] = useState(2);
	const [currentStrokeStyle, setCurrentStrokeStyle] = useState<"solid" | "dashed" | "dotted">(
		"solid",
	);
	const [currentRoughness, setCurrentRoughness] = useState<"clean" | "wobbly" | "rough">("wobbly");
	const [currentEdges, setCurrentEdges] = useState<"sharp" | "rounded">("rounded");
	const [currentOpacity, setCurrentOpacity] = useState(100);

	const [eraserRadius, setEraserRadius] = useState(22);
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

	// Çizim Durumu
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

	// Şekil Seçme & Taşıma Durumları (Select Tool)
	const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
	const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
	const [isDraggingShape, setIsDraggingShape] = useState(false);
	const [hoveredStrokeId, setHoveredStrokeId] = useState<string | null>(null);
	const lastDragPosRef = useRef<{ x: number; y: number } | null>(null);

	// Grupla Seçim (Marquee / Alan Seçimi)
	const [selectionBox, setSelectionBox] = useState<{
		startX: number;
		startY: number;
		currentX: number;
		currentY: number;
	} | null>(null);

	// El Aracı ile Tuvali Kaydırma Durumu (Hand Tool Pan)
	const [isPanning, setIsPanning] = useState(false);
	const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

	// Inline Metin Girişi (Popup yerine canvas üstünde doğrudan yazma)
	const [inlineText, setInlineText] = useState<{
		screenX: number;
		screenY: number;
		flowX: number;
		flowY: number;
		value: string;
		editingStrokeId: string | null;
		color?: string;
		fontSize?: number;
		rotation?: number;
		isShapeCenter?: boolean;
		shapeWidth?: number;
	} | null>(null);
	const inlineTextareaRef = useRef<HTMLTextAreaElement>(null);

	// Inline textarea açıldığında genişlik ve yüksekliği içeriğe göre otomatik ayarla
	useEffect(() => {
		if (inlineText && inlineTextareaRef.current) {
			const el = inlineTextareaRef.current;
			el.style.height = "auto";
			el.style.height = `${el.scrollHeight}px`;
			el.style.width = "auto";
			el.style.width = `${Math.max(60, el.scrollWidth + 10)}px`;
		}
	}, [inlineText?.editingStrokeId]);

	// Boyutlandırma (Resize), Kavis (Curve), Döndürme (Rotate) ve Çizgi Ucu (Endpoints) Durumları
	const [activeResizeHandle, setActiveResizeHandle] = useState<
		| "tl"
		| "tr"
		| "br"
		| "bl"
		| "top"
		| "bottom"
		| "left"
		| "right"
		| "rotate"
		| "curve"
		| "p1"
		| "p2"
		| null
	>(null);
	const [hoveredHandle, setHoveredHandle] = useState<
		| "tl"
		| "tr"
		| "br"
		| "bl"
		| "top"
		| "bottom"
		| "left"
		| "right"
		| "rotate"
		| "curve"
		| "p1"
		| "p2"
		| null
	>(null);
	// Çizgi çizerken veya uçlarını taşırken mıknatıslanan bağlantı noktası gösterimi
	const [activeSnapAnchor, setActiveSnapAnchor] = useState<ShapeAnchorPoint | null>(null);
	const lineStartAnchorRef = useRef<ShapeAnchorPoint | null>(null);
	const resizeInitialBoxRef = useRef<{
		rawMinX: number;
		rawMinY: number;
		rawMaxX: number;
		rawMaxY: number;
	} | null>(null);
	const resizeInitialPointsRef = useRef<{ x: number; y: number }[] | null>(null);
	const resizeInitialRotationRef = useRef<number>(0);
	const resizeInitialFontSizeRef = useRef<number>(20);

	// Silgi İmleç Konumu (Canvas üzerinde silgi göstergesi için)
	const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

	// Seçili Şekilleri Sil (Tekil veya Çoklu / Toplu Seçim)
	const deleteSelectedStroke = useCallback(() => {
		const idsToDelete = new Set<string>();
		if (selectedStrokeId) idsToDelete.add(selectedStrokeId);
		selectedStrokeIds.forEach((id) => idsToDelete.add(id));
		if (idsToDelete.size === 0) return;

		setDrawingStrokes(drawingStrokes.filter((s) => !idsToDelete.has(s.id)));
		setSelectedStrokeId(null);
		setSelectedStrokeIds([]);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes]);

	// Seçili Şekillerin Özelliklerini Güncelle (Tekil veya Çoklu / Toplu Seçim)
	const updateSelectedStroke = useCallback(
		(updates: Partial<DrawingStroke>) => {
			const idsToUpdate = new Set<string>();
			if (selectedStrokeId) idsToUpdate.add(selectedStrokeId);
			selectedStrokeIds.forEach((id) => idsToUpdate.add(id));
			if (idsToUpdate.size === 0) return;

			setDrawingStrokes(
				drawingStrokes.map((s) => (idsToUpdate.has(s.id) ? { ...s, ...updates } : s)),
			);
		},
		[selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes],
	);

	// Katman Sıralama (En Alta Gönder, Bir Alta, Bir Üste, En Üste Getir)
	const sendToBack = useCallback(() => {
		const ids =
			selectedStrokeIds.length > 0 ? selectedStrokeIds : selectedStrokeId ? [selectedStrokeId] : [];
		if (ids.length === 0) return;
		const selectedSet = new Set(ids);
		const selectedList = drawingStrokes.filter((s) => selectedSet.has(s.id));
		const others = drawingStrokes.filter((s) => !selectedSet.has(s.id));
		setDrawingStrokes([...selectedList, ...others]);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes]);

	const sendBackward = useCallback(() => {
		if (!selectedStrokeId && selectedStrokeIds.length === 0) return;
		const targetId = selectedStrokeId || selectedStrokeIds[0];
		const idx = drawingStrokes.findIndex((s) => s.id === targetId);
		if (idx <= 0) return;
		const copy = [...drawingStrokes];
		const [item] = copy.splice(idx, 1);
		copy.splice(idx - 1, 0, item);
		setDrawingStrokes(copy);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes]);

	const bringForward = useCallback(() => {
		if (!selectedStrokeId && selectedStrokeIds.length === 0) return;
		const targetId = selectedStrokeId || selectedStrokeIds[selectedStrokeIds.length - 1];
		const idx = drawingStrokes.findIndex((s) => s.id === targetId);
		if (idx < 0 || idx >= drawingStrokes.length - 1) return;
		const copy = [...drawingStrokes];
		const [item] = copy.splice(idx, 1);
		copy.splice(idx + 1, 0, item);
		setDrawingStrokes(copy);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes]);

	const bringToFront = useCallback(() => {
		const ids =
			selectedStrokeIds.length > 0 ? selectedStrokeIds : selectedStrokeId ? [selectedStrokeId] : [];
		if (ids.length === 0) return;
		const selectedSet = new Set(ids);
		const selectedList = drawingStrokes.filter((s) => selectedSet.has(s.id));
		const others = drawingStrokes.filter((s) => !selectedSet.has(s.id));
		setDrawingStrokes([...others, ...selectedList]);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes, setDrawingStrokes]);

	// Seçili obje değiştiğinde stil araç çubuğundaki değerleri seçili objeyle senkronize et
	useEffect(() => {
		const activeId =
			selectedStrokeId || (selectedStrokeIds.length > 0 ? selectedStrokeIds[0] : null);
		if (!activeId) return;
		const s = drawingStrokes.find((str) => str.id === activeId);
		if (!s) return;
		if (s.color) setCurrentColor(s.color);
		if (s.fill) setCurrentFill(s.fill);
		if (s.width) setCurrentWidth(s.width);
		if (s.strokeStyle) setCurrentStrokeStyle(s.strokeStyle);
		if (s.strokeRoughness) setCurrentRoughness(s.strokeRoughness);
		if (s.strokeEdges) setCurrentEdges(s.strokeEdges);
		if (s.opacity !== undefined) setCurrentOpacity(s.opacity);
	}, [selectedStrokeId, selectedStrokeIds, drawingStrokes]);

	// Görsel Ekle Modal State (Dosya Yükle veya URL Yaz)
	const [imageModalOpen, setImageModalOpen] = useState(false);
	const [imageUrlInput, setImageUrlInput] = useState("");
	const imageInputRef = useRef<HTMLInputElement>(null);

	// Web Yerleştirme modal state
	const [webEmbedModal, setWebEmbedModal] = useState(false);
	const [webEmbedUrl, setWebEmbedUrl] = useState("");

	// Canvas boyutlarını pencereye göre uyarla
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const updateSize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		updateSize();
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	// Tuval üzerindeki çizimleri ve şekilleri render et
	const redraw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		// ReactFlow pan ve zoom transformu
		ctx.translate(viewport.x, viewport.y);
		ctx.scale(viewport.zoom, viewport.zoom);

		// Kayıtlı tüm vuruşları çiz
		drawingStrokes.forEach((stroke) => {
			if (stroke.points.length === 0) return;
			// Eğer bu metin şu an inline olarak düzenleniyorsa, textarea altında çift görünmesin
			if (
				inlineText &&
				inlineText.editingStrokeId === stroke.id &&
				(stroke.shapeType === "text" || !stroke.shapeType)
			)
				return;

			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.lineWidth = stroke.width;

			const strokeAlpha = stroke.opacity !== undefined ? stroke.opacity / 100 : 1.0;
			if (stroke.isHighlighter) {
				ctx.strokeStyle = stroke.color;
				ctx.globalAlpha = 0.45 * strokeAlpha;
			} else {
				ctx.strokeStyle = stroke.color;
				ctx.globalAlpha = strokeAlpha;
			}

			const shape = stroke.shapeType || "pen";

			if (shape === "pen") {
				if (stroke.points.length < 2) return;
				const roughnessMode = stroke.strokeRoughness || "wobbly";
				if (roughnessMode === "clean" || stroke.isHighlighter) {
					ctx.beginPath();
					ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
					if (stroke.strokeStyle === "dashed") {
						ctx.setLineDash([8, 6]);
					} else if (stroke.strokeStyle === "dotted") {
						ctx.setLineDash([3, 5]);
					} else {
						ctx.setLineDash([]);
					}
					for (let i = 1; i < stroke.points.length; i++) {
						ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
					}
					ctx.stroke();
					ctx.setLineDash([]);
				} else {
					// Roughness: wobbly veya rough - Excalidraw karalama ve çift kontur el çizimi
					const roughnessVal = roughnessMode === "rough" ? 2.4 : 1.4;
					const bowingVal = roughnessMode === "rough" ? 2.2 : 1.2;
					const seed = getStrokeSeed(stroke.id);
					const ptsArray: [number, number][] = stroke.points.map((pt) => [pt.x, pt.y]);

					let dashPattern: number[] | undefined = undefined;
					if (stroke.strokeStyle === "dashed") dashPattern = [8, 6];
					else if (stroke.strokeStyle === "dotted") dashPattern = [3, 5];

					const drawable = roughGen.linearPath(ptsArray, {
						seed,
						roughness: roughnessVal,
						bowing: bowingVal,
						stroke: stroke.color,
						strokeWidth: stroke.width,
						strokeLineDash: dashPattern,
						disableMultiStroke: false,
						curveFitting: 0.95,
					});
					drawRoughDrawable(ctx, drawable);
				}
			} else if (shape === "image" && (stroke.imageData || stroke.imageUrl)) {
				// Görsel çizimi (base64 veya URL)
				const p1 = stroke.points[0];
				const p2 = stroke.points[stroke.points.length - 1];
				const imgW = Math.abs(p2.x - p1.x) || 200;
				const imgH = Math.abs(p2.y - p1.y) || 150;
				const minX = Math.min(p1.x, p2.x);
				const minY = Math.min(p1.y, p2.y);

				ctx.save();
				if (stroke.rotation) {
					const cx = minX + imgW / 2;
					const cy = minY + imgH / 2;
					ctx.translate(cx, cy);
					ctx.rotate((stroke.rotation * Math.PI) / 180);
					ctx.translate(-cx, -cy);
				}
				const img = new Image();
				img.src = stroke.imageData || stroke.imageUrl || "";
				ctx.globalAlpha = 1.0;
				ctx.drawImage(img, minX, minY, imgW, imgH);
				// Çerçeve
				ctx.strokeStyle = stroke.color;
				ctx.lineWidth = 2;
				ctx.strokeRect(minX, minY, imgW, imgH);
				ctx.restore();
			} else if (shape === "web") {
				// Web embed - dikdörtgen + url etiketi
				const p1 = stroke.points[0];
				const p2 = stroke.points[stroke.points.length - 1];
				const bx = Math.min(p1.x, p2.x);
				const by = Math.min(p1.y, p2.y);
				const bw = Math.abs(p2.x - p1.x) || 320;
				const bh = Math.abs(p2.y - p1.y) || 200;

				ctx.save();
				if (stroke.rotation) {
					const cx = bx + bw / 2;
					const cy = by + bh / 2;
					ctx.translate(cx, cy);
					ctx.rotate((stroke.rotation * Math.PI) / 180);
					ctx.translate(-cx, -cy);
				}
				ctx.globalAlpha = 1.0;
				// Arka plan
				ctx.fillStyle = "#F5F0E6";
				ctx.fillRect(bx, by, bw, bh);
				// Kenarlık
				ctx.strokeStyle = "#000000";
				ctx.lineWidth = 3;
				ctx.strokeRect(bx, by, bw, bh);
				// Üst bar (tarayıcı benzeri)
				ctx.fillStyle = "#E5E7EB";
				ctx.fillRect(bx, by, bw, 28);
				ctx.strokeRect(bx, by, bw, 28);
				// URL metni
				ctx.font = 'bold 11px "Inter", sans-serif';
				ctx.fillStyle = "#374151";
				ctx.fillText(stroke.webUrl || "URL", bx + 8, by + 18, bw - 16);
				ctx.font = '12px "Inter", sans-serif';
				ctx.fillStyle = "#6B7280";
				ctx.fillText("Web İçeriği", bx + bw / 2 - 35, by + bh / 2);
				ctx.restore();
			} else if (shape === "frame") {
				// Çerçeve aracı - kesik çizgili dikdörtgen + etiket
				const p1 = stroke.points[0];
				const p2 = stroke.points[stroke.points.length - 1];
				const bx = Math.min(p1.x, p2.x);
				const by = Math.min(p1.y, p2.y);
				const bw = Math.abs(p2.x - p1.x) || 200;
				const bh = Math.abs(p2.y - p1.y) || 150;

				ctx.save();
				if (stroke.rotation) {
					const cx = bx + bw / 2;
					const cy = by + bh / 2;
					ctx.translate(cx, cy);
					ctx.rotate((stroke.rotation * Math.PI) / 180);
					ctx.translate(-cx, -cy);
				}
				ctx.globalAlpha = 1.0;
				ctx.strokeStyle = stroke.color;
				ctx.lineWidth = 2;
				ctx.setLineDash([8, 4]);
				ctx.strokeRect(bx, by, bw, bh);
				ctx.setLineDash([]);
				// Etiket
				ctx.font = 'bold 12px "Inter", sans-serif';
				ctx.fillStyle = stroke.color;
				ctx.fillText(stroke.frameLabel || "Çerçeve", bx + 4, by - 5);
				ctx.restore();
			} else {
				const p1 = stroke.points[0];
				const p2 = stroke.points[stroke.points.length - 1];
				const textToRender =
					inlineText && inlineText.editingStrokeId === stroke.id ? undefined : stroke.text;
				drawShape(
					ctx,
					shape,
					p1,
					p2,
					textToRender,
					stroke.controlPoint,
					stroke.rotation,
					stroke.fill,
					stroke.strokeStyle,
					stroke.strokeEdges,
					stroke.strokeRoughness || "wobbly",
					getStrokeSeed(stroke.id),
					stroke.color,
					stroke.width,
					stroke.fontSize,
				);
			}

			ctx.globalAlpha = 1.0;
		});

		// Seçili şeklin Excalidraw tarzı mavi kesikli seçim çerçevesi ve köşe tutamaçları
		// Eğer bir metin şu an inline olarak düzenleniyorsa, seçim kutusunu gizle (çakışan çirkin kutuyu önle)
		if (selectedStrokeId && (!inlineText || inlineText.editingStrokeId !== selectedStrokeId)) {
			const selectedStroke = drawingStrokes.find((s) => s.id === selectedStrokeId);
			if (selectedStroke) {
				const box = getStrokeBoundingBox(selectedStroke);
				if (box) {
					ctx.save();
					if (selectedStroke.rotation) {
						const cx = box.centerX;
						const cy = box.centerY;
						ctx.translate(cx, cy);
						ctx.rotate((selectedStroke.rotation * Math.PI) / 180);
						ctx.translate(-cx, -cy);
					}

					const pad = 6;
					const rx = box.rawMinX - pad;
					const ry = box.rawMinY - pad;
					const rw = Math.max(box.rawMaxX - box.rawMinX + pad * 2, 12);
					const rh = Math.max(box.rawMaxY - box.rawMinY + pad * 2, 12);

					const isLineOrArrow =
						selectedStroke.shapeType === "line" || selectedStroke.shapeType === "arrow";

					if (!isLineOrArrow) {
						// Mavi kesikli seçim çerçevesi
						ctx.strokeStyle = "#2563EB";
						ctx.lineWidth = 2 / (viewport.zoom || 1);
						ctx.setLineDash([5 / (viewport.zoom || 1), 3 / (viewport.zoom || 1)]);
						ctx.strokeRect(rx, ry, rw, rh);

						// 8 Tutamaç (4 Köşe + 4 Kenar: Üst, Alt, Sol, Sağ)
						ctx.setLineDash([]);
						ctx.fillStyle = "#FFFFFF";
						ctx.strokeStyle = "#2563EB";
						ctx.lineWidth = 1.5 / (viewport.zoom || 1);
						const handleSize = 7 / (viewport.zoom || 1);

						const handles = [
							// 4 Köşe (tl, tr, br, bl)
							{ x: rx, y: ry },
							{ x: rx + rw, y: ry },
							{ x: rx + rw, y: ry + rh },
							{ x: rx, y: ry + rh },
							// 4 Kenar
							{ x: rx + rw / 2, y: ry },
							{ x: rx + rw / 2, y: ry + rh },
							{ x: rx, y: ry + rh / 2 },
							{ x: rx + rw, y: ry + rh / 2 },
						];

						handles.forEach((c) => {
							ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
							ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
						});

						// 360 Derece Döndürme Tutamacı (Üst kenarın yukarısında yuvarlak tutamaç)
						const rotHandleY = ry - 18 / (viewport.zoom || 1);
						ctx.beginPath();
						ctx.moveTo(rx + rw / 2, ry);
						ctx.lineTo(rx + rw / 2, rotHandleY);
						ctx.stroke();

						ctx.beginPath();
						ctx.arc(rx + rw / 2, rotHandleY, 4.5 / (viewport.zoom || 1), 0, Math.PI * 2);
						ctx.fillStyle = "#22C55E";
						ctx.fill();
						ctx.strokeStyle = "#000000";
						ctx.stroke();
					} else {
						// Çizgi veya Ok ise: Kavis / Kırma Tutamacı ve Uç Tutamaçları
						const p1 = selectedStroke.points[0];
						const p2 = selectedStroke.points[selectedStroke.points.length - 1];
						const curveHandlePos = getCurveHandlePosition(p1, p2, selectedStroke.controlPoint);

						ctx.beginPath();
						ctx.arc(curveHandlePos.x, curveHandlePos.y, 6 / (viewport.zoom || 1), 0, Math.PI * 2);
						ctx.fillStyle = "#FFE600";
						ctx.fill();
						ctx.strokeStyle = "#000000";
						ctx.lineWidth = 1.5 / (viewport.zoom || 1);
						ctx.stroke();

						// Çizgi ve Ok Uç Tutamaçları (p1 ve p2 kontrol noktaları)
						const pts = [
							{ id: "p1", p: p1, bound: selectedStroke.startBinding },
							{ id: "p2", p: p2, bound: selectedStroke.endBinding },
						];

						pts.forEach(({ p, bound }) => {
							ctx.beginPath();
							ctx.arc(p.x, p.y, (bound ? 7 : 5.5) / (viewport.zoom || 1), 0, Math.PI * 2);
							ctx.fillStyle = bound ? "#22C55E" : "#FFFFFF";
							ctx.fill();
							ctx.strokeStyle = bound ? "#000000" : "#2563EB";
							ctx.lineWidth = 2 / (viewport.zoom || 1);
							ctx.stroke();

							// Kilitli ise bağlantı ikonu / küçük yeşil kilit göstergesi
							if (bound) {
								ctx.beginPath();
								ctx.arc(p.x, p.y, 2.5 / (viewport.zoom || 1), 0, Math.PI * 2);
								ctx.fillStyle = "#000000";
								ctx.fill();
							}
						});
					}

					ctx.restore();
				}
			}
		}

		// ÇOKLU SEÇİM (Grupla Seçilen Nesnelerin Ortak Çerçevesi)
		if (selectedStrokeIds.length > 1) {
			let mMinX = Infinity,
				mMinY = Infinity,
				mMaxX = -Infinity,
				mMaxY = -Infinity;
			selectedStrokeIds.forEach((id) => {
				const s = drawingStrokes.find((str) => str.id === id);
				if (s) {
					const b = getStrokeBoundingBox(s);
					if (b) {
						mMinX = Math.min(mMinX, b.rawMinX);
						mMinY = Math.min(mMinY, b.rawMinY);
						mMaxX = Math.max(mMaxX, b.rawMaxX);
						mMaxY = Math.max(mMaxY, b.rawMaxY);
					}
				}
			});

			if (mMinX !== Infinity) {
				ctx.save();
				const pad = 8;
				const rx = mMinX - pad;
				const ry = mMinY - pad;
				const rw = mMaxX - mMinX + pad * 2;
				const rh = mMaxY - mMinY + pad * 2;

				ctx.strokeStyle = "#8B5CF6"; // Mor seçim kutusu (Çoklu grup seçimi)
				ctx.lineWidth = 2 / (viewport.zoom || 1);
				ctx.setLineDash([6 / (viewport.zoom || 1), 4 / (viewport.zoom || 1)]);
				ctx.strokeRect(rx, ry, rw, rh);

				// 4 Köşe Tutamacı
				ctx.setLineDash([]);
				ctx.fillStyle = "#8B5CF6";
				ctx.strokeStyle = "#FFFFFF";
				ctx.lineWidth = 1.5 / (viewport.zoom || 1);
				const handleSize = 7 / (viewport.zoom || 1);

				const corners = [
					{ x: rx, y: ry },
					{ x: rx + rw, y: ry },
					{ x: rx + rw, y: ry + rh },
					{ x: rx, y: ry + rh },
				];
				corners.forEach((c) => {
					ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
					ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
				});

				ctx.restore();
			}
		}

		// MARQUEE (Grupla Seçim Çizim Dikdörtgeni)
		if (selectionBox) {
			ctx.save();
			const sx = Math.min(selectionBox.startX, selectionBox.currentX);
			const sy = Math.min(selectionBox.startY, selectionBox.currentY);
			const sw = Math.abs(selectionBox.currentX - selectionBox.startX);
			const sh = Math.abs(selectionBox.currentY - selectionBox.startY);

			// Yarı saydam mor dolgu ve kesikli kenarlık
			ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
			ctx.fillRect(sx, sy, sw, sh);
			ctx.strokeStyle = "#7C3AED";
			ctx.lineWidth = 1.5 / (viewport.zoom || 1);
			ctx.setLineDash([4 / (viewport.zoom || 1), 3 / (viewport.zoom || 1)]);
			ctx.strokeRect(sx, sy, sw, sh);
			ctx.restore();
		}

		// Kilitli bağlantı noktalarını tüm tuvalde şık ve net göster (Bağlı uçlarda mıknatıs/kilit rozeti)
		drawingStrokes.forEach((s) => {
			if ((s.shapeType === "line" || s.shapeType === "arrow") && (s.startBinding || s.endBinding)) {
				const p1 = s.points[0];
				const p2 = s.points[s.points.length - 1];

				[
					{ p: p1, bound: s.startBinding },
					{ p: p2, bound: s.endBinding },
				].forEach(({ p, bound }) => {
					if (!bound) return;
					ctx.save();
					// Neo-Brutalist yeşil kilitli çapa noktası halkası
					ctx.beginPath();
					ctx.arc(p.x, p.y, 4.5 / (viewport.zoom || 1), 0, Math.PI * 2);
					ctx.fillStyle = "#22C55E";
					ctx.fill();
					ctx.strokeStyle = "#000000";
					ctx.lineWidth = 1.5 / (viewport.zoom || 1);
					ctx.stroke();
					ctx.restore();
				});
			}
		});

		// Çizgi çizerken, üzerine gelirken veya ucunu taşırken mıknatıslanan hedef şeklin çapa noktalarını göster
		if (activeSnapAnchor || tool === "line" || tool === "arrow") {
			drawingStrokes.forEach((s) => {
				// Çizgiler veya kapalı şekiller
				const anchors = getShapeAnchorPoints(s);
				anchors.forEach((anch) => {
					const isSnapped =
						activeSnapAnchor?.strokeId === s.id && activeSnapAnchor.anchor === anch.anchor;
					ctx.save();
					ctx.beginPath();
					ctx.arc(
						anch.point.x,
						anch.point.y,
						(isSnapped ? 7 : 4) / (viewport.zoom || 1),
						0,
						Math.PI * 2,
					);
					ctx.fillStyle = isSnapped ? "#FFE600" : "#FFFFFF";
					ctx.fill();
					ctx.strokeStyle = isSnapped ? "#000000" : "#22C55E";
					ctx.lineWidth = (isSnapped ? 2.5 : 1.5) / (viewport.zoom || 1);
					ctx.stroke();

					if (isSnapped) {
						// Dışa ikinci vurgu halkası
						ctx.beginPath();
						ctx.arc(anch.point.x, anch.point.y, 11 / (viewport.zoom || 1), 0, Math.PI * 2);
						ctx.strokeStyle = "#22C55E";
						ctx.lineWidth = 2 / (viewport.zoom || 1);
						ctx.stroke();
					}
					ctx.restore();
				});
			});

			// Eğer mıknatıslanan nokta serbest bir kenar veya çizgi üzerindeyse (custom / line snap), canlı çapa halkasını çiz
			if (
				activeSnapAnchor &&
				(activeSnapAnchor.anchor === "custom" || activeSnapAnchor.anchor === "line")
			) {
				ctx.save();
				ctx.beginPath();
				ctx.arc(
					activeSnapAnchor.point.x,
					activeSnapAnchor.point.y,
					7 / (viewport.zoom || 1),
					0,
					Math.PI * 2,
				);
				ctx.fillStyle = "#FFE600";
				ctx.fill();
				ctx.strokeStyle = "#000000";
				ctx.lineWidth = 2.5 / (viewport.zoom || 1);
				ctx.stroke();

				ctx.beginPath();
				ctx.arc(
					activeSnapAnchor.point.x,
					activeSnapAnchor.point.y,
					12 / (viewport.zoom || 1),
					0,
					Math.PI * 2,
				);
				ctx.strokeStyle = "#22C55E";
				ctx.lineWidth = 2 / (viewport.zoom || 1);
				ctx.stroke();
				ctx.restore();
			}
		}

		// Canlı çizilen geçici çizim veya şekil
		if (isDrawing && currentPoints.length > 0 && tool !== "eraser") {
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.lineWidth = tool === "highlighter" ? currentWidth * 2.5 : currentWidth;

			if (tool === "highlighter") {
				ctx.strokeStyle = currentColor;
				ctx.globalAlpha = 0.45;
			} else {
				ctx.strokeStyle = currentColor;
				ctx.globalAlpha = 1.0;
			}

			if (tool === "pen" || tool === "highlighter") {
				if (currentPoints.length > 1) {
					ctx.beginPath();
					ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
					for (let i = 1; i < currentPoints.length; i++) {
						ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
					}
					ctx.stroke();
				}
			} else {
				// Dikdörtgen, Elips, Baklava, Çizgi, Ok vb.
				const p1 = currentPoints[0];
				const p2 = currentPoints[currentPoints.length - 1];
				drawShape(
					ctx,
					tool,
					p1,
					p2,
					undefined,
					undefined,
					0,
					currentFill,
					currentStrokeStyle,
					currentEdges,
					currentRoughness,
					99999,
					currentColor,
					currentWidth,
				);
			}

			ctx.globalAlpha = 1.0;
		}

		ctx.restore();
	}, [
		viewport,
		drawingStrokes,
		isDrawing,
		currentPoints,
		tool,
		currentColor,
		currentWidth,
		currentFill,
		currentStrokeStyle,
		currentEdges,
		currentRoughness,
		selectedStrokeId,
		selectedStrokeIds,
		selectionBox,
		activeSnapAnchor,
		inlineText,
	]);

	useEffect(() => {
		redraw();
	}, [redraw]);

	// Kalem gibi parça parça silen akıllı silgi
	const eraseAtFlowPoint = useCallback(
		(flowPoint: { x: number; y: number }) => {
			const scaledRadius = eraserRadius / (viewport.zoom || 1);
			let anyChange = false;
			const nextStrokes: DrawingStroke[] = [];

			drawingStrokes.forEach((stroke) => {
				const { changed, newStrokes } = splitStrokeByEraser(stroke, flowPoint, scaledRadius);
				if (changed) {
					anyChange = true;
				}
				nextStrokes.push(...newStrokes);
			});

			if (anyChange) {
				setDrawingStrokes(nextStrokes);
				const remainingIds = new Set(nextStrokes.map((s) => s.id));
				if (selectedStrokeId && !remainingIds.has(selectedStrokeId)) {
					setSelectedStrokeId(null);
				}
				setSelectedStrokeIds((prev) => prev.filter((id) => remainingIds.has(id)));
			}
		},
		[drawingStrokes, eraserRadius, viewport.zoom, setDrawingStrokes, selectedStrokeId],
	);

	// Çizim & Taşıma Başlangıcı
	const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!isDrawingMode) return;

		// 1. EL ARACI: Tuvali tıklayıp kaydırmaya başla
		if (tool === "hand") {
			lastPanPointRef.current = { x: e.clientX, y: e.clientY };
			setIsPanning(true);
			return;
		}

		const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

		// 2. SEÇİM, TAŞIMA, BOYUTLANDIRMA, DÖNDÜRME VE KAVİS ARACI (SELECT TOOL)
		if (tool === "select") {
			// Önce seçili bir şekil varsa onun tutamaçlarına tıklandı mı kontrol et
			if (selectedStrokeId) {
				const selectedStroke = drawingStrokes.find((s) => s.id === selectedStrokeId);
				if (selectedStroke) {
					const box = getStrokeBoundingBox(selectedStroke);
					if (box) {
						const pad = 6;
						const rx = box.rawMinX - pad;
						const ry = box.rawMinY - pad;
						const rw = Math.max(box.rawMaxX - box.rawMinX + pad * 2, 12);
						const rh = Math.max(box.rawMaxY - box.rawMinY + pad * 2, 12);
						const handleRadius = 14 / (viewport.zoom || 1); // tıklama toleransı

						const rot = selectedStroke.rotation || 0;
						const center = { x: box.centerX, y: box.centerY };
						const localPos = rot !== 0 ? rotatePoint(flowPos, center, -rot) : flowPos;

						// 1. Çizgi veya Ok için Uç Tutamaçları (p1 ve p2) ve Kavis Tutamacı
						if (selectedStroke.shapeType === "line" || selectedStroke.shapeType === "arrow") {
							const p1 = selectedStroke.points[0];
							const p2 = selectedStroke.points[selectedStroke.points.length - 1];
							const curveHandlePos = getCurveHandlePosition(p1, p2, selectedStroke.controlPoint);

							// Başlangıç ucu (p1)
							if (Math.hypot(p1.x - localPos.x, p1.y - localPos.y) <= handleRadius + 4) {
								setActiveResizeHandle("p1");
								lastDragPosRef.current = flowPos;
								return;
							}

							// Bitiş ucu (p2)
							if (Math.hypot(p2.x - localPos.x, p2.y - localPos.y) <= handleRadius + 4) {
								setActiveResizeHandle("p2");
								lastDragPosRef.current = flowPos;
								return;
							}

							// Kavis tutamacı (curve)
							if (
								Math.hypot(curveHandlePos.x - localPos.x, curveHandlePos.y - localPos.y) <=
								handleRadius + 4
							) {
								setActiveResizeHandle("curve");
								lastDragPosRef.current = flowPos;
								return;
							}
						} else {
							// 2. 360 Derece Döndürme Tutamacı (Yalnızca şekiller, metinler, görseller için)
							const rotHandleY = ry - 18 / (viewport.zoom || 1);
							if (Math.hypot(rx + rw / 2 - localPos.x, rotHandleY - localPos.y) <= handleRadius) {
								setActiveResizeHandle("rotate");
								resizeInitialBoxRef.current = {
									rawMinX: box.rawMinX,
									rawMinY: box.rawMinY,
									rawMaxX: box.rawMaxX,
									rawMaxY: box.rawMaxY,
								};
								resizeInitialRotationRef.current = selectedStroke.rotation || 0;
								lastDragPosRef.current = flowPos;
								return;
							}

							// 3. 8 Yönlü Boyutlandırma Tutamaçları (4 Köşe + 4 Kenar)
							const handles: {
								id: "tl" | "tr" | "br" | "bl" | "top" | "bottom" | "left" | "right";
								x: number;
								y: number;
							}[] = [
								// Köşeler
								{ id: "tl", x: rx, y: ry },
								{ id: "tr", x: rx + rw, y: ry },
								{ id: "br", x: rx + rw, y: ry + rh },
								{ id: "bl", x: rx, y: ry + rh },
								// Kenarlar (Sağdan soldan aşağıdan yukarıdan tutma)
								{ id: "top", x: rx + rw / 2, y: ry },
								{ id: "bottom", x: rx + rw / 2, y: ry + rh },
								{ id: "left", x: rx, y: ry + rh / 2 },
								{ id: "right", x: rx + rw, y: ry + rh / 2 },
							];

							const clickedHandle = handles.find(
								(h) => Math.hypot(h.x - localPos.x, h.y - localPos.y) <= handleRadius,
							);
							if (clickedHandle) {
								setActiveResizeHandle(clickedHandle.id);
								resizeInitialBoxRef.current = {
									rawMinX: box.rawMinX,
									rawMinY: box.rawMinY,
									rawMaxX: box.rawMaxX,
									rawMaxY: box.rawMaxY,
								};
								resizeInitialPointsRef.current = selectedStroke.points.map((p) => ({ ...p }));
								resizeInitialFontSizeRef.current =
									selectedStroke.fontSize ||
									getTextDimensions(selectedStroke.text || "", selectedStroke.width || 2).fontSize;
								lastDragPosRef.current = flowPos;
								return;
							}
						}
					}
				}
			}

			// Tutamaç değilse şekil üstüne mi tıklandı
			let hitStroke: DrawingStroke | null = null;
			for (let i = drawingStrokes.length - 1; i >= 0; i--) {
				if (isPointInStroke(flowPos, drawingStrokes[i])) {
					hitStroke = drawingStrokes[i];
					break;
				}
			}

			if (hitStroke) {
				if (e.shiftKey) {
					// Shift ile çoklu seçime ekle/çıkar
					const isAlready =
						selectedStrokeIds.includes(hitStroke.id) || selectedStrokeId === hitStroke.id;
					if (isAlready) {
						const next = selectedStrokeIds.filter((id) => id !== hitStroke!.id);
						setSelectedStrokeIds(next);
						setSelectedStrokeId(next.length === 1 ? next[0] : null);
					} else {
						const next = Array.from(
							new Set([
								...selectedStrokeIds,
								...(selectedStrokeId ? [selectedStrokeId] : []),
								hitStroke.id,
							]),
						);
						setSelectedStrokeIds(next);
						setSelectedStrokeId(next.length === 1 ? next[0] : null);
					}
					setIsDraggingShape(false);
				} else {
					// Tıklanan obje halihazırda seçili gruptaysa grubu koru ve taşımaya başla
					if (selectedStrokeIds.includes(hitStroke.id)) {
						setIsDraggingShape(true);
						lastDragPosRef.current = flowPos;
					} else {
						setSelectedStrokeId(hitStroke.id);
						setSelectedStrokeIds([hitStroke.id]);
						setIsDraggingShape(true);
						lastDragPosRef.current = flowPos;
					}
				}
			} else {
				// Boş alana tıklandı: seçimi temizle ve toplu alan (marquee) seçimini başlat
				setSelectedStrokeId(null);
				setSelectedStrokeIds([]);
				setIsDraggingShape(false);
				lastDragPosRef.current = null;
				setSelectionBox({
					startX: flowPos.x,
					startY: flowPos.y,
					currentX: flowPos.x,
					currentY: flowPos.y,
				});
			}
			return;
		}

		// 3. SİLGİ ARACI
		if (tool === "eraser") {
			setIsDrawing(true);
			eraseAtFlowPoint(flowPos);
			return;
		}

		// 4. METİN ARACI - Inline (Excalidraw gibi: popup yok, doğal el yazısı fontu, saydam ve doğrudan canvas üstünde)
		if (tool === "text") {
			// Eğer halihazırda açık bir inlineText varsa önce onu kaydet
			if (inlineText) {
				commitInlineText();
			}

			// Tıklanan yerde zaten bir metin var mı?
			let existingTextStroke: DrawingStroke | null = null;
			for (let i = drawingStrokes.length - 1; i >= 0; i--) {
				const s = drawingStrokes[i];
				if (s.shapeType === "text" && isPointInStroke(flowPos, s)) {
					existingTextStroke = s;
					break;
				}
			}

			if (existingTextStroke) {
				startEditingText(existingTextStroke);
				return;
			} else {
				const fSize = currentWidth <= 2 ? 20 : currentWidth <= 4 ? 26 : 34;
				setInlineText({
					screenX: e.clientX,
					screenY: e.clientY,
					flowX: flowPos.x,
					flowY: flowPos.y,
					value: "",
					editingStrokeId: null,
					color: currentColor,
					fontSize: fSize,
				});
			}
			setTimeout(() => {
				if (inlineTextareaRef.current) {
					inlineTextareaRef.current.focus({ preventScroll: true });
				}
			}, 100);
			return;
		}

		// 5. ŞEKİLLER & KALEM ÇİZİMİ
		if (tool === "line" || tool === "arrow") {
			const snap = findClosestAnchor(flowPos, drawingStrokes, undefined, 24 / (viewport.zoom || 1));
			lineStartAnchorRef.current = snap;
			const startPt = snap ? snap.point : flowPos;
			setIsDrawing(true);
			setCurrentPoints([startPt, startPt]);
			setActiveSnapAnchor(snap);
			return;
		}

		lineStartAnchorRef.current = null;
		setIsDrawing(true);
		setCurrentPoints([flowPos]);
	};

	// Çizim & Taşıma Devamı
	const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!isDrawingMode) return;

		// Silgi konumu takibi (Özel Neo-Brutalist silgi imleci için)
		if (tool === "eraser") {
			setEraserPos({ x: e.clientX, y: e.clientY });
		} else if (eraserPos !== null) {
			setEraserPos(null);
		}

		// 1. EL ARACI İLE KAYDIRMA
		if (tool === "hand") {
			if (isPanning && lastPanPointRef.current) {
				const dx = e.clientX - lastPanPointRef.current.x;
				const dy = e.clientY - lastPanPointRef.current.y;
				lastPanPointRef.current = { x: e.clientX, y: e.clientY };
				setViewport({
					x: viewport.x + dx,
					y: viewport.y + dy,
					zoom: viewport.zoom,
				});
			}
			return;
		}

		const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

		// 2. SEÇİM ARACI: BOYUTLANDIRMA, DÖNDÜRME, KAVİS VEYA TAŞIMA
		if (tool === "select") {
			// 2A. ÇİZGİ/OK KAVİSLEME (CURVE CONTROL POINT)
			if (activeResizeHandle === "curve" && selectedStrokeId) {
				setDrawingStrokes(
					drawingStrokes.map((s) => {
						if (s.id !== selectedStrokeId) return s;
						const p1 = s.points[0];
						const p2 = s.points[s.points.length - 1];
						// Kuadratik Bézier tepe noktası: B(0.5) = 0.25*p1 + 0.5*cp + 0.25*p2 = flowPos
						// Buradan cp = 2*flowPos - (p1 + p2)/2
						const midChordX = (p1.x + p2.x) / 2;
						const midChordY = (p1.y + p2.y) / 2;
						return {
							...s,
							controlPoint: {
								x: 2 * flowPos.x - midChordX,
								y: 2 * flowPos.y - midChordY,
							},
						};
					}),
				);
				return;
			}

			// 2B. 360 DERECE DÖNDÜRME (ROTATE)
			if (activeResizeHandle === "rotate" && selectedStrokeId && resizeInitialBoxRef.current) {
				const initBox = resizeInitialBoxRef.current;
				const cx = (initBox.rawMinX + initBox.rawMaxX) / 2;
				const cy = (initBox.rawMinY + initBox.rawMaxY) / 2;
				// Açıyı hesapla: saat 12 yönü 0 derece olacak şekilde
				const rad = Math.atan2(flowPos.y - cy, flowPos.x - cx);
				let deg = Math.round((rad * 180) / Math.PI) + 90;
				if (deg < 0) deg += 360;
				deg = deg % 360;

				setDrawingStrokes(
					drawingStrokes.map((s) => {
						if (s.id !== selectedStrokeId) return s;
						return {
							...s,
							rotation: deg,
						};
					}),
				);
				return;
			}

			// 2C. 8 YÖNLÜ BOYUTLANDIRMA İŞLEMİ (RESIZE - KÖŞELER VE KENARLAR)
			if (
				activeResizeHandle &&
				selectedStrokeId &&
				resizeInitialBoxRef.current &&
				resizeInitialPointsRef.current
			) {
				const initBox = resizeInitialBoxRef.current;
				const currentStroke = drawingStrokes.find((s) => s.id === selectedStrokeId);
				const rot = currentStroke?.rotation || 0;
				const center = {
					x: (initBox.rawMinX + initBox.rawMaxX) / 2,
					y: (initBox.rawMinY + initBox.rawMaxY) / 2,
				};
				const localPos = rot !== 0 ? rotatePoint(flowPos, center, -rot) : flowPos;

				const origW = Math.max(initBox.rawMaxX - initBox.rawMinX, 10);
				const origH = Math.max(initBox.rawMaxY - initBox.rawMinY, 10);

				let newMinX = initBox.rawMinX;
				let newMinY = initBox.rawMinY;
				let newMaxX = initBox.rawMaxX;
				let newMaxY = initBox.rawMaxY;

				// Köşeler
				if (activeResizeHandle === "br") {
					newMaxX = Math.max(newMinX + 15, localPos.x);
					newMaxY = Math.max(newMinY + 15, localPos.y);
				} else if (activeResizeHandle === "bl") {
					newMinX = Math.min(newMaxX - 15, localPos.x);
					newMaxY = Math.max(newMinY + 15, localPos.y);
				} else if (activeResizeHandle === "tr") {
					newMaxX = Math.max(newMinX + 15, localPos.x);
					newMinY = Math.min(newMaxY - 15, localPos.y);
				} else if (activeResizeHandle === "tl") {
					newMinX = Math.min(newMaxX - 15, localPos.x);
					newMinY = Math.min(newMaxY - 15, localPos.y);
				}
				// Kenarlar: Sağdan, soldan, aşağıdan, yukarıdan çekme
				else if (activeResizeHandle === "right") {
					newMaxX = Math.max(newMinX + 15, localPos.x);
				} else if (activeResizeHandle === "left") {
					newMinX = Math.min(newMaxX - 15, localPos.x);
				} else if (activeResizeHandle === "bottom") {
					newMaxY = Math.max(newMinY + 15, localPos.y);
				} else if (activeResizeHandle === "top") {
					newMinY = Math.min(newMaxY - 15, localPos.y);
				}

				const newW = newMaxX - newMinX;
				const newH = newMaxY - newMinY;

				const resizedStrokes = drawingStrokes.map((s) => {
					if (s.id !== selectedStrokeId) return s;
					const initPts = resizeInitialPointsRef.current!;

					// Dikdörtgen, görsel, web embed, çember veya baklava için 2 köşe noktası
					if (
						["rectangle", "image", "web", "frame", "circle", "diamond"].includes(s.shapeType || "")
					) {
						return {
							...s,
							points: [
								{ x: newMinX, y: newMinY },
								{ x: newMaxX, y: newMaxY },
							],
						};
					}

					// Metin (Text) için orantılı font boyutu ve köşe ölçekleme
					if (s.shapeType === "text") {
						const initFontSize = resizeInitialFontSizeRef.current || 20;
						// Tutamaç tipine göre ölçek katsayısı
						const scaleX = newW / origW;
						const scaleY = newH / origH;
						let scale = 1;
						if (activeResizeHandle === "left" || activeResizeHandle === "right") {
							scale = scaleX;
						} else if (activeResizeHandle === "top" || activeResizeHandle === "bottom") {
							scale = scaleY;
						} else {
							// Köşelerden çekildiğinde en belirgin yönü al
							scale = Math.abs(scaleX - 1) > Math.abs(scaleY - 1) ? scaleX : scaleY;
						}
						const newFontSize = Math.max(
							10,
							Math.min(240, Math.round(initFontSize * Math.max(0.2, scale))),
						);

						// Eğer sağ veya alt kenar/köşe çekiliyorsa başlangıç konumu sabit kalır
						// Eğer sol veya üst kenar/köşe çekiliyorsa başlangıç konumu newMinX, newMinY'ye kayar
						const anchorX =
							activeResizeHandle === "tl" ||
							activeResizeHandle === "bl" ||
							activeResizeHandle === "left"
								? newMinX
								: initBox.rawMinX;
						const anchorY =
							activeResizeHandle === "tl" ||
							activeResizeHandle === "tr" ||
							activeResizeHandle === "top"
								? newMinY
								: initBox.rawMinY;

						return {
							...s,
							fontSize: newFontSize,
							points: [
								{ x: anchorX, y: anchorY },
								{ x: anchorX, y: anchorY },
							],
						};
					}

					// Çizgi ve serbest çizimler için orantılı ölçekleme
					return {
						...s,
						points: initPts.map((p) => {
							const normX = (p.x - initBox.rawMinX) / origW;
							const normY = (p.y - initBox.rawMinY) / origH;
							return {
								x: newMinX + normX * newW,
								y: newMinY + normY * newH,
							};
						}),
					};
				});

				// Şekil boyutlandırıldığında da ona kilitli tüm çizgileri/okları takip ettir
				const fullyUpdatedStrokes = updateConnectedLines(resizedStrokes, selectedStrokeId);
				setDrawingStrokes(fullyUpdatedStrokes);
				return;
			}

			// 2A-1. ÇİZGİ/OK UÇLARINI TAŞIMA VE ŞEKLE KİLİTLEME (P1 veya P2)
			if ((activeResizeHandle === "p1" || activeResizeHandle === "p2") && selectedStrokeId) {
				// En yakın şekil çapa noktasına veya çizgiye mıknatıslan (snap)
				const snap = findClosestAnchor(
					flowPos,
					drawingStrokes,
					selectedStrokeId,
					24 / (viewport.zoom || 1),
				);
				setActiveSnapAnchor(snap);

				const targetPos = snap ? snap.point : flowPos;

				setDrawingStrokes(
					drawingStrokes.map((s) => {
						if (s.id !== selectedStrokeId) return s;
						const p1 = s.points[0];
						const p2 = s.points[s.points.length - 1];

						const bindingData = snap
							? {
									strokeId: snap.strokeId,
									anchor: snap.anchor,
									relativePoint: snap.relativePoint,
									paramT: snap.paramT,
								}
							: undefined;

						let newCp = s.controlPoint;
						if (newCp) {
							const oldMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
							const targetP1 = activeResizeHandle === "p1" ? targetPos : p1;
							const targetP2 = activeResizeHandle === "p2" ? targetPos : p2;
							const newMid = { x: (targetP1.x + targetP2.x) / 2, y: (targetP1.y + targetP2.y) / 2 };
							newCp = {
								x: newCp.x + (newMid.x - oldMid.x),
								y: newCp.y + (newMid.y - oldMid.y),
							};
						}

						if (activeResizeHandle === "p1") {
							return {
								...s,
								points: [targetPos, p2],
								controlPoint: newCp,
								startBinding: bindingData,
							};
						} else {
							return {
								...s,
								points: [p1, targetPos],
								controlPoint: newCp,
								endBinding: bindingData,
							};
						}
					}),
				);
				return;
			}

			// 2D. ŞEKİL TAŞIMA (DRAG) - Tekil veya Çoklu / Gruplu Şekilleri Beraber Taşı
			if (isDraggingShape && lastDragPosRef.current) {
				const activeIds =
					selectedStrokeIds.length > 0
						? selectedStrokeIds
						: selectedStrokeId
							? [selectedStrokeId]
							: [];
				if (activeIds.length > 0) {
					const dx = flowPos.x - lastDragPosRef.current.x;
					const dy = flowPos.y - lastDragPosRef.current.y;
					lastDragPosRef.current = flowPos;

					const activeSet = new Set(activeIds);

					// Seçili tüm şekilleri hareket ettir
					let movedStrokes = drawingStrokes.map((s) => {
						if (!activeSet.has(s.id)) return s;
						return {
							...s,
							points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
							controlPoint: s.controlPoint
								? { x: s.controlPoint.x + dx, y: s.controlPoint.y + dy }
								: undefined,
						};
					});

					// Bağlı çizgileri/okları güncelle
					activeIds.forEach((id) => {
						movedStrokes = updateConnectedLines(movedStrokes, id);
					});

					setDrawingStrokes(movedStrokes);
					return;
				}
			}

			// 2D-2. MARQUEE / GRUPLA ALAN SEÇİMİ GÜNCELLEMESİ
			if (selectionBox) {
				setSelectionBox((prev) =>
					prev ? { ...prev, currentX: flowPos.x, currentY: flowPos.y } : null,
				);
				return;
			}

			// 2E. Tutamaç Hover Kontrolü (Handle Hover Check - Yöne göre cursor değişimi)
			let foundHoverHandle:
				| "tl"
				| "tr"
				| "br"
				| "bl"
				| "top"
				| "bottom"
				| "left"
				| "right"
				| "rotate"
				| "curve"
				| "p1"
				| "p2"
				| null = null;
			if (selectedStrokeId) {
				const selectedStroke = drawingStrokes.find((s) => s.id === selectedStrokeId);
				if (selectedStroke) {
					const box = getStrokeBoundingBox(selectedStroke);
					if (box) {
						const pad = 6;
						const rx = box.rawMinX - pad;
						const ry = box.rawMinY - pad;
						const rw = Math.max(box.rawMaxX - box.rawMinX + pad * 2, 12);
						const rh = Math.max(box.rawMaxY - box.rawMinY + pad * 2, 12);
						const handleRadius = 14 / (viewport.zoom || 1);

						const rot = selectedStroke.rotation || 0;
						const center = { x: box.centerX, y: box.centerY };
						const localPos = rot !== 0 ? rotatePoint(flowPos, center, -rot) : flowPos;

						// Çizgi veya Ok için Uç Tutamaçları (p1 ve p2) ve Kavis Tutamacı
						if (selectedStroke.shapeType === "line" || selectedStroke.shapeType === "arrow") {
							const p1 = selectedStroke.points[0];
							const p2 = selectedStroke.points[selectedStroke.points.length - 1];
							const curveHandlePos = getCurveHandlePosition(p1, p2, selectedStroke.controlPoint);

							if (Math.hypot(p1.x - localPos.x, p1.y - localPos.y) <= handleRadius + 4) {
								foundHoverHandle = "p1";
							} else if (Math.hypot(p2.x - localPos.x, p2.y - localPos.y) <= handleRadius + 4) {
								foundHoverHandle = "p2";
							} else if (
								Math.hypot(curveHandlePos.x - localPos.x, curveHandlePos.y - localPos.y) <=
								handleRadius + 4
							) {
								foundHoverHandle = "curve";
							}
						} else {
							// Rotate handle (yalnızca şekiller için)
							const rotHandleY = ry - 18 / (viewport.zoom || 1);
							if (Math.hypot(rx + rw / 2 - localPos.x, rotHandleY - localPos.y) <= handleRadius) {
								foundHoverHandle = "rotate";
							}

							// 8-way resize handles (yalnızca şekiller için)
							if (!foundHoverHandle) {
								const handles: {
									id: "tl" | "tr" | "br" | "bl" | "top" | "bottom" | "left" | "right";
									x: number;
									y: number;
								}[] = [
									{ id: "tl", x: rx, y: ry },
									{ id: "tr", x: rx + rw, y: ry },
									{ id: "br", x: rx + rw, y: ry + rh },
									{ id: "bl", x: rx, y: ry + rh },
									{ id: "top", x: rx + rw / 2, y: ry },
									{ id: "bottom", x: rx + rw / 2, y: ry + rh },
									{ id: "left", x: rx, y: ry + rh / 2 },
									{ id: "right", x: rx + rw, y: ry + rh / 2 },
								];
								const matched = handles.find(
									(h) => Math.hypot(h.x - localPos.x, h.y - localPos.y) <= handleRadius,
								);
								if (matched) {
									foundHoverHandle = matched.id;
								}
							}
						}
					}
				}
			}
			setHoveredHandle(foundHoverHandle);

			// Şekil Hover kontrolü
			let hitStroke: DrawingStroke | null = null;
			for (let i = drawingStrokes.length - 1; i >= 0; i--) {
				if (isPointInStroke(flowPos, drawingStrokes[i])) {
					hitStroke = drawingStrokes[i];
					break;
				}
			}
			setHoveredStrokeId(hitStroke ? hitStroke.id : null);
			return;
		}

		if (!isDrawing) {
			if (tool === "line" || tool === "arrow") {
				const snap = findClosestAnchor(
					flowPos,
					drawingStrokes,
					undefined,
					24 / (viewport.zoom || 1),
				);
				setActiveSnapAnchor(snap);
			}
			return;
		}

		// 3. SİLGİ İLE SİLME
		if (tool === "eraser") {
			eraseAtFlowPoint(flowPos);
			return;
		}

		// 4. KALEM VEYA FOSFORLU KALEM
		if (tool === "pen" || tool === "highlighter") {
			setCurrentPoints((prev) => [...prev, flowPos]);
			return;
		}

		// 5. ŞEKİLLER (DİKDÖRTGEN, DAİRE, BAKLAVA, ÇİZGİ, OK)
		if (tool === "line" || tool === "arrow") {
			const snap = findClosestAnchor(flowPos, drawingStrokes, undefined, 24 / (viewport.zoom || 1));
			setActiveSnapAnchor(snap);
			const targetPos = snap ? snap.point : flowPos;
			setCurrentPoints((prev) => [prev[0] || targetPos, targetPos]);
			return;
		}

		setCurrentPoints((prev) => [prev[0] || flowPos, flowPos]);
	};

	// Çizim & Taşıma Bitimi
	const handlePointerUp = () => {
		if (!isDrawingMode) return;

		if (tool === "hand") {
			setIsPanning(false);
			lastPanPointRef.current = null;
			return;
		}

		if (tool === "select") {
			setIsDraggingShape(false);
			setActiveResizeHandle(null);
			setActiveSnapAnchor(null);
			resizeInitialBoxRef.current = null;
			resizeInitialPointsRef.current = null;
			lastDragPosRef.current = null;

			// Marquee alan seçimini tamamla ve içine düşen objeleri toplu seç
			if (selectionBox) {
				const minX = Math.min(selectionBox.startX, selectionBox.currentX);
				const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
				const minY = Math.min(selectionBox.startY, selectionBox.currentY);
				const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

				const w = maxX - minX;
				const h = maxY - minY;

				// Yalnızca anlamlı bir sürükleme yapıldıysa (tıklama değilse)
				if (w > 5 || h > 5) {
					const matchedIds: string[] = [];
					drawingStrokes.forEach((s) => {
						const b = getStrokeBoundingBox(s);
						if (b) {
							// Bounding box kesişimi (AABB intersection)
							const intersects = !(
								b.rawMaxX < minX ||
								b.rawMinX > maxX ||
								b.rawMaxY < minY ||
								b.rawMinY > maxY
							);
							if (intersects) {
								matchedIds.push(s.id);
							}
						}
					});

					if (matchedIds.length > 0) {
						setSelectedStrokeIds(matchedIds);
						setSelectedStrokeId(matchedIds.length === 1 ? matchedIds[0] : null);
					} else {
						setSelectedStrokeIds([]);
						setSelectedStrokeId(null);
					}
				}
				setSelectionBox(null);
			}
			return;
		}

		if (!isDrawing) return;
		setIsDrawing(false);
		setActiveSnapAnchor(null);

		if (tool === "eraser") return;

		if (currentPoints.length > 0) {
			const shapeType = tool === "pen" || tool === "highlighter" ? "pen" : (tool as any);
			const newId = `stroke-${Date.now()}`;

			// Çizgi veya Ok ise uçlarının bir şekle veya çizgiye kilitlenip kilitlenmediğini hesapla
			let startBinding:
				| {
						strokeId: string;
						anchor?: ShapeAnchorType;
						relativePoint?: { x: number; y: number };
						paramT?: number;
				  }
				| undefined;
			let endBinding:
				| {
						strokeId: string;
						anchor?: ShapeAnchorType;
						relativePoint?: { x: number; y: number };
						paramT?: number;
				  }
				| undefined;

			let finalPoints = currentPoints;

			if (shapeType === "line" || shapeType === "arrow") {
				const p1 = currentPoints[0];
				const p2 = currentPoints[currentPoints.length - 1];

				const startSnap =
					lineStartAnchorRef.current ||
					findClosestAnchor(p1, drawingStrokes, undefined, 26 / (viewport.zoom || 1));
				const endSnap = findClosestAnchor(p2, drawingStrokes, undefined, 26 / (viewport.zoom || 1));
				lineStartAnchorRef.current = null;

				if (startSnap) {
					startBinding = {
						strokeId: startSnap.strokeId,
						anchor: startSnap.anchor,
						relativePoint: startSnap.relativePoint,
						paramT: startSnap.paramT,
					};
				}
				if (endSnap) {
					endBinding = {
						strokeId: endSnap.strokeId,
						anchor: endSnap.anchor,
						relativePoint: endSnap.relativePoint,
						paramT: endSnap.paramT,
					};
				}

				finalPoints = [startSnap ? startSnap.point : p1, endSnap ? endSnap.point : p2];
			}

			addDrawingStroke({
				id: newId,
				points: finalPoints,
				color: currentColor,
				width: tool === "highlighter" ? currentWidth * 2.5 : currentWidth,
				isHighlighter: tool === "highlighter",
				shapeType,
				fill: currentFill,
				opacity: currentOpacity,
				strokeStyle: currentStrokeStyle,
				strokeRoughness: currentRoughness,
				strokeEdges: currentEdges,
				startBinding,
				endBinding,
			});

			// Şekil çizildikten sonra otomatik Seçim (Select) moduna geçip yeni şekli seç
			if (tool !== "pen" && tool !== "highlighter") {
				setTool("select");
				setSelectedStrokeId(newId);
				setSelectedStrokeIds([newId]);
			}
		}

		setCurrentPoints([]);
	};

	// Klavye kısayolları (Excalidraw: V, H, R, D, O, A, L, P, T, E, Delete, Escape)
	useEffect(() => {
		if (!isDrawingMode) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
			const key = e.key.toLowerCase();

			if (key === "v") setTool("select");
			else if (key === "h") setTool("hand");
			else if (key === "r") setTool("rectangle");
			else if (key === "d") setTool("diamond");
			else if (key === "o") setTool("circle");
			else if (key === "a") setTool("arrow");
			else if (key === "l") setTool("line");
			else if (key === "p") setTool("pen");
			else if (key === "t") setTool("text");
			else if (key === "e") setTool("eraser");
			else if (e.key === "Backspace" || e.key === "Delete") {
				const idsToDelete = new Set<string>();
				if (selectedStrokeId) idsToDelete.add(selectedStrokeId);
				selectedStrokeIds.forEach((id) => idsToDelete.add(id));
				if (idsToDelete.size > 0) {
					setDrawingStrokes(drawingStrokes.filter((s) => !idsToDelete.has(s.id)));
					setSelectedStrokeId(null);
					setSelectedStrokeIds([]);
				}
			} else if (e.key === "Escape") {
				if (selectedStrokeId || selectedStrokeIds.length > 0) {
					setSelectedStrokeId(null);
					setSelectedStrokeIds([]);
				} else {
					toggleDrawingMode();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isDrawingMode,
		selectedStrokeId,
		selectedStrokeIds,
		drawingStrokes,
		setDrawingStrokes,
		toggleDrawingMode,
	]);

	// Inline metin girişini tuvale kaydet (Excalidraw gibi doğal ve doğrudan)
	const commitInlineText = useCallback(() => {
		if (!inlineText) return;
		const trimmed = inlineText.value.trim();
		if (trimmed) {
			if (inlineText.editingStrokeId) {
				// Mevcut metni güncelle
				setDrawingStrokes(
					drawingStrokes.map((s) =>
						s.id === inlineText.editingStrokeId
							? { ...s, text: inlineText.value, fontSize: inlineText.fontSize || s.fontSize }
							: s,
					),
				);
				setSelectedStrokeId(inlineText.editingStrokeId);
				setSelectedStrokeIds([inlineText.editingStrokeId]);
			} else {
				// Yeni el yazısı metin oluştur
				const flowPos = { x: inlineText.flowX, y: inlineText.flowY };
				const newId = `stroke-text-${Date.now()}`;
				addDrawingStroke({
					id: newId,
					points: [flowPos, flowPos],
					color: currentColor,
					width: currentWidth,
					fontSize: inlineText.fontSize || (currentWidth <= 2 ? 20 : currentWidth <= 4 ? 26 : 34),
					isHighlighter: false,
					shapeType: "text",
					text: inlineText.value,
					opacity: currentOpacity,
					strokeRoughness: currentRoughness,
				});
				setTool("select");
				setSelectedStrokeId(newId);
				setSelectedStrokeIds([newId]);
			}
		} else if (inlineText.editingStrokeId) {
			// Eğer metin tamamen silindiyse; şekil ise sadece metnini temizle, saf metin nesnesi ise sil
			const editingStroke = drawingStrokes.find((s) => s.id === inlineText.editingStrokeId);
			if (editingStroke && editingStroke.shapeType && editingStroke.shapeType !== "text") {
				setDrawingStrokes(
					drawingStrokes.map((s) =>
						s.id === inlineText.editingStrokeId ? { ...s, text: undefined } : s,
					),
				);
				setSelectedStrokeId(inlineText.editingStrokeId);
				setSelectedStrokeIds([inlineText.editingStrokeId]);
			} else {
				setDrawingStrokes(drawingStrokes.filter((s) => s.id !== inlineText.editingStrokeId));
				setSelectedStrokeId(null);
				setSelectedStrokeIds([]);
			}
		}
		setInlineText(null);
	}, [
		inlineText,
		currentColor,
		currentWidth,
		currentOpacity,
		currentRoughness,
		drawingStrokes,
		setDrawingStrokes,
		addDrawingStroke,
	]);

	// Metin veya şekil içi metni doğrudan ve kusursuz bir şekilde inline editlemeye başlatan yardımcı
	const startEditingText = useCallback(
		(stroke: DrawingStroke) => {
			const isShape = ["rectangle", "circle", "diamond"].includes(stroke.shapeType || "");
			const box = getStrokeBoundingBox(stroke);

			let flowX = stroke.points[0]?.x || 0;
			let flowY = stroke.points[0]?.y || 0;
			let currentFontSize = stroke.fontSize;

			if (isShape && box) {
				flowX = box.centerX;
				flowY = box.centerY;
				currentFontSize = stroke.fontSize || 18;
			} else {
				currentFontSize =
					stroke.fontSize || ((stroke.width || 2) <= 2 ? 20 : (stroke.width || 2) <= 4 ? 26 : 34);
			}

			const scrX = flowX * viewport.zoom + viewport.x;
			const scrY = flowY * viewport.zoom + viewport.y;

			// Düzenleme moduna girildiğinde seçili çerçeveyi gizlemek için seçimleri temizle
			setSelectedStrokeId(null);
			setSelectedStrokeIds([]);
			setIsDraggingShape(false);

			setInlineText({
				screenX: scrX,
				screenY: scrY,
				flowX,
				flowY,
				value: stroke.text || "",
				editingStrokeId: stroke.id,
				color: stroke.color || currentColor,
				fontSize: currentFontSize,
				rotation: stroke.rotation || 0,
				isShapeCenter: isShape,
				shapeWidth: box ? box.width : undefined,
			});

			setTimeout(() => {
				if (inlineTextareaRef.current) {
					inlineTextareaRef.current.focus({ preventScroll: true });
					// Cursor'ı metnin en sonuna taşı
					const len = inlineTextareaRef.current.value.length;
					inlineTextareaRef.current.setSelectionRange(len, len);
				}
			}, 20);
		},
		[viewport.zoom, viewport.x, viewport.y, currentColor],
	);

	// İmleç (Cursor) hesaplayıcı - Döndürme açısına ve tutamaç yönüne göre dinamik cursor
	const getCanvasCursor = (): string => {
		if (!isDrawingMode) return "default";
		if (tool === "hand") return isPanning ? "grabbing" : "grab";
		if (tool === "eraser") return "none";
		if (tool === "text") return "text";
		if (tool !== "select") return "crosshair";

		// Tool === 'select'
		const handle = activeResizeHandle || hoveredHandle;
		if (handle) {
			if (handle === "rotate") return activeResizeHandle ? "grabbing" : "grab";
			if (handle === "curve" || handle === "p1" || handle === "p2") return "crosshair";

			// Şeklin dönüş açısına göre yönü hesapla
			const selectedStroke = selectedStrokeId
				? drawingStrokes.find((s) => s.id === selectedStrokeId)
				: null;
			const rot = selectedStroke?.rotation || 0;

			// Temel açılar (saat yönünde, derece)
			const baseAngles: Record<string, number> = {
				top: 0,
				tr: 45,
				right: 90,
				br: 135,
				bottom: 180,
				bl: 225,
				left: 270,
				tl: 315,
			};

			const baseAngle = baseAngles[handle] ?? 0;
			let totalAngle = (baseAngle + rot) % 360;
			if (totalAngle < 0) totalAngle += 360;

			// 8 yöne eşle (her biri 45 derecelik dilim)
			if (totalAngle >= 337.5 || totalAngle < 22.5 || (totalAngle >= 157.5 && totalAngle < 202.5)) {
				return "ns-resize";
			} else if (
				(totalAngle >= 22.5 && totalAngle < 67.5) ||
				(totalAngle >= 202.5 && totalAngle < 247.5)
			) {
				return "nesw-resize";
			} else if (
				(totalAngle >= 67.5 && totalAngle < 112.5) ||
				(totalAngle >= 247.5 && totalAngle < 292.5)
			) {
				return "ew-resize";
			} else {
				return "nwse-resize";
			}
		}

		if (isDraggingShape) return "grabbing";
		if (hoveredStrokeId || selectedStrokeId || selectedStrokeIds.length > 0) return "move";
		return "default";
	};

	return (
		<>
			{/* Çizim Canvas Katmanı */}
			<canvas
				ref={canvasRef}
				onMouseDown={(e) => {
					// Metin aracında tıklandığında textarea'nın mousedown tarafından anında blur edilmesini engelle
					if (tool === "text") {
						e.preventDefault();
					}
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={() => setEraserPos(null)}
				onDoubleClick={(e) => {
					if (!isDrawingMode) return;
					const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
					// Çift tıklanan yerde bir metin veya şekil (dikdörtgen, daire, baklava) var mı?
					let hitStroke: DrawingStroke | null = null;
					for (let i = drawingStrokes.length - 1; i >= 0; i--) {
						const s = drawingStrokes[i];
						const editableShapes = ["text", "rectangle", "circle", "diamond"];
						if (editableShapes.includes(s.shapeType || "") && isPointInStroke(flowPos, s)) {
							hitStroke = s;
							break;
						}
					}
					if (hitStroke) {
						startEditingText(hitStroke);
					}
				}}
				style={{
					cursor: getCanvasCursor(),
				}}
				className={`absolute inset-0 z-20 ${!isDrawingMode ? "pointer-events-none" : ""}`}
			/>

			{/* Neo-Brutalist Özel Silgi İmleci Göstergesi */}
			{isDrawingMode && tool === "eraser" && eraserPos && (
				<div
					style={{
						position: "fixed",
						left: eraserPos.x - eraserRadius,
						top: eraserPos.y - eraserRadius,
						width: eraserRadius * 2,
						height: eraserRadius * 2,
					}}
					className="pointer-events-none z-[60] rounded-full border-2 border-black bg-[#FF3399]/25 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center transition-[width,height] duration-75"
				>
					{/* Silgi Merkez Noktası */}
					<div className="w-1.5 h-1.5 bg-[#FF3399] rounded-full border border-black" />
					{/* Silgi Mini İkon Rozeti */}
					<div className="absolute -top-3 -right-3 w-5 h-5 bg-[#FF3399] text-white rounded-md border-2 border-black shadow-[1px_1px_0px_0px_#000] flex items-center justify-center">
						<Eraser className="w-3 h-3 stroke-[2.5]" />
					</div>
				</div>
			)}

			{/* Inline Metin Giriş Alanı – Excalidraw gibi: Pop-up YOK, Çerçeve YOK, Tamamen saydam, Doğal Tuval Üstü Yazım */}
			{inlineText && (
				<textarea
					ref={inlineTextareaRef}
					value={inlineText.value}
					autoFocus
					onChange={(e) => {
						const val = e.target.value;
						setInlineText((prev) => (prev ? { ...prev, value: val } : null));
						// İçeriğe göre dinamik yükseklik ve genişlik ayarı
						e.target.style.height = "auto";
						e.target.style.height = `${e.target.scrollHeight}px`;
						e.target.style.width = "auto";
						e.target.style.width = `${Math.max(60, e.target.scrollWidth + 10)}px`;
					}}
					onKeyDown={(e) => {
						// Shift+Enter ile yeni satır eklenir; tek başına Enter veya Escape ile metin tamamlanır
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							commitInlineText();
						}
						if (e.key === "Escape") {
							setInlineText(null);
						}
					}}
					onBlur={commitInlineText}
					onWheel={(e) => e.stopPropagation()}
					placeholder="Yazmaya başla..."
					rows={1}
					style={{
						position: "fixed",
						left: inlineText.flowX * viewport.zoom + viewport.x,
						top: inlineText.flowY * viewport.zoom + viewport.y,
						minWidth: 60,
						maxWidth:
							inlineText.isShapeCenter && inlineText.shapeWidth
								? Math.max(80, (inlineText.shapeWidth - 16) * viewport.zoom)
								: undefined,
						fontSize: (inlineText.fontSize || 22) * viewport.zoom,
						color: inlineText.color || currentColor,
						fontFamily: '"Kalam", "Caveat", "Space Grotesk", cursive, sans-serif',
						fontWeight: 600,
						lineHeight: 1.25,
						textAlign: inlineText.isShapeCenter ? "center" : "left",
						padding: 0,
						margin: 0,
						background: "transparent",
						border: "none",
						outline: "none",
						boxShadow: "none",
						transform: inlineText.isShapeCenter
							? `translate(-50%, -50%) ${inlineText.rotation ? `rotate(${inlineText.rotation}deg)` : ""}`
							: inlineText.rotation
								? `rotate(${inlineText.rotation}deg)`
								: undefined,
						transformOrigin: inlineText.isShapeCenter ? "center center" : "top left",
						zIndex: 60,
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
						overflow: "hidden",
						resize: "none",
						boxSizing: "content-box",
					}}
					className="selection:bg-indigo-300/30 caret-indigo-600 transition-none"
					onClick={(e) => e.stopPropagation()}
					onMouseDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => e.stopPropagation()}
				/>
			)}

			{/* Gizli Dosya Seçici (Görsel Yükleme) */}
			<input
				ref={imageInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = (ev) => {
						const base64 = ev.target?.result as string;
						if (!base64) return;
						const newId = `stroke-image-${Date.now()}`;
						addDrawingStroke({
							id: newId,
							points: [
								{ x: 100, y: 100 },
								{ x: 420, y: 320 },
							],
							color: currentColor,
							width: 2,
							isHighlighter: false,
							shapeType: "image",
							imageData: base64,
						});
						setSelectedStrokeId(newId);
						setImageModalOpen(false);
					};
					reader.readAsDataURL(file);
					e.target.value = "";
				}}
			/>

			{/* Görsel Ekle Modal (Dosya Yükle VEYA URL Yaz) */}
			{imageModalOpen && (
				<>
					<div
						className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-xs"
						onClick={() => setImageModalOpen(false)}
					/>
					<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] p-5 space-y-4">
						<h3 className="text-sm font-black uppercase flex items-center gap-2">
							<ImageIcon className="w-4 h-4" /> GÖRSEL EKLE
						</h3>

						{/* Dosyadan Yükle Butonu */}
						<div>
							<button
								onClick={() => imageInputRef.current?.click()}
								className="w-full flex items-center justify-center gap-2 py-3 bg-[#FFE600] border-2 border-black rounded-xl text-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all"
							>
								<Upload className="w-4 h-4 stroke-[2.5]" />
								BİLGİSAYARDAN DOSYA SEÇ
							</button>
						</div>

						<div className="flex items-center gap-2">
							<div className="flex-1 h-[2px] bg-black/20" />
							<span className="text-[10px] font-black uppercase text-stone-500">VEYA URL İLE</span>
							<div className="flex-1 h-[2px] bg-black/20" />
						</div>

						{/* URL Girişi */}
						<div>
							<label className="text-[10px] font-black uppercase text-stone-600 block mb-1">
								Görsel Linki (URL)
							</label>
							<div className="flex gap-2">
								<input
									type="url"
									value={imageUrlInput}
									onChange={(e) => setImageUrlInput(e.target.value)}
									placeholder="https://... / image.png"
									className="flex-1 px-3 py-2 border-2 border-black rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#FFE600]"
								/>
								<button
									onClick={() => {
										if (imageUrlInput.trim()) {
											const newId = `stroke-image-${Date.now()}`;
											addDrawingStroke({
												id: newId,
												points: [
													{ x: 100, y: 100 },
													{ x: 420, y: 320 },
												],
												color: currentColor,
												width: 2,
												isHighlighter: false,
												shapeType: "image",
												imageUrl: imageUrlInput.trim(),
											});
											setSelectedStrokeId(newId);
											setImageUrlInput("");
											setImageModalOpen(false);
										}
									}}
									className="px-3 py-2 bg-[#22C55E] border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
								>
									EKLE
								</button>
							</div>
						</div>

						<div className="pt-2">
							<button
								onClick={() => setImageModalOpen(false)}
								className="w-full py-2 bg-stone-100 hover:bg-stone-200 border-2 border-black rounded-xl text-xs font-black uppercase"
							>
								İPTAL
							</button>
						</div>
					</div>
				</>
			)}

			{/* Web Yerleştirme Modal */}
			{webEmbedModal && (
				<>
					<div
						className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-xs"
						onClick={() => setWebEmbedModal(false)}
					/>
					<div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_#000] p-5">
						<h3 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
							<Code2 className="w-4 h-4" /> Web Yerleştirme
						</h3>
						<label className="text-[11px] font-black uppercase text-stone-600 block mb-1">
							Web Sayfası URL
						</label>
						<input
							type="url"
							value={webEmbedUrl}
							onChange={(e) => setWebEmbedUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									if (webEmbedUrl.trim()) {
										const newId = `stroke-web-${Date.now()}`;
										addDrawingStroke({
											id: newId,
											points: [
												{ x: 80, y: 80 },
												{ x: 420, y: 300 },
											],
											color: "#000000",
											width: 2,
											isHighlighter: false,
											shapeType: "web",
											webUrl: webEmbedUrl.trim(),
										});
										setSelectedStrokeId(newId);
									}
									setWebEmbedModal(false);
									setWebEmbedUrl("");
								}
								if (e.key === "Escape") setWebEmbedModal(false);
							}}
							autoFocus
							placeholder="https://example.com"
							className="w-full border-2 border-black rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#FFE600] mb-3"
						/>
						<div className="flex gap-2">
							<button
								onClick={() => {
									if (webEmbedUrl.trim()) {
										const newId = `stroke-web-${Date.now()}`;
										addDrawingStroke({
											id: newId,
											points: [
												{ x: 80, y: 80 },
												{ x: 420, y: 300 },
											],
											color: "#000000",
											width: 2,
											isHighlighter: false,
											shapeType: "web",
											webUrl: webEmbedUrl.trim(),
										});
										setSelectedStrokeId(newId);
									}
									setWebEmbedModal(false);
									setWebEmbedUrl("");
								}}
								className="flex-1 px-3 py-2.5 bg-[#22C55E] border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] transition-all"
							>
								EKLE
							</button>
							<button
								onClick={() => setWebEmbedModal(false)}
								className="px-4 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
							>
								İptal
							</button>
						</div>
					</div>
				</>
			)}

			{/* Tuval üzerindeki Web Embed Canlı Önizleme Kartları (iFrame + URL Önizleme) */}
			{isDrawingMode &&
				drawingStrokes
					.filter((s) => s.shapeType === "web" && s.webUrl)
					.map((stroke) => {
						const p1 = stroke.points[0];
						const p2 = stroke.points[stroke.points.length - 1];
						const bx = Math.min(p1.x, p2.x);
						const by = Math.min(p1.y, p2.y);
						const bw = Math.abs(p2.x - p1.x) || 320;
						const bh = Math.abs(p2.y - p1.y) || 200;

						// Flow koordinatlarını ekrandaki piksel koordinatlarına dönüştür
						const screenX = bx * viewport.zoom + viewport.x;
						const screenY = (by + 28) * viewport.zoom + viewport.y;
						const screenW = bw * viewport.zoom;
						const screenH = (bh - 28) * viewport.zoom;

						if (screenW <= 10 || screenH <= 10) return null;

						// URL normalize
						let embedSrc = stroke.webUrl || "";
						if (embedSrc && !embedSrc.startsWith("http://") && !embedSrc.startsWith("https://")) {
							embedSrc = `https://${embedSrc}`;
						}

						const isSelected = selectedStrokeId === stroke.id;

						return (
							<div
								key={stroke.id}
								style={{
									position: "fixed",
									left: screenX,
									top: screenY,
									width: screenW,
									height: screenH,
									zIndex: 22,
								}}
								className={`overflow-hidden border-b-2 border-x-2 border-black bg-white select-none ${
									isSelected ? "ring-2 ring-blue-500" : ""
								}`}
							>
								{/* Canlı iframe veya iframe kısıtlı siteler için akıllı zengin önizleme */}
								<iframe
									src={embedSrc}
									title={stroke.webUrl}
									sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
									loading="lazy"
									className="w-full h-full border-none pointer-events-auto"
								/>
							</div>
						);
					})}

			{/* Excalidraw Tarzı Üst Yüzen Neo-Brutalist Araç Çubuğu (Sadece Çizim Araçları) */}
			{isDrawingMode && (
				<div className="absolute top-[60px] sm:top-[68px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none max-w-full px-2">
					<aside
						aria-label="Çizim ve Şekil Araçları"
						className="flex items-center gap-1 p-1 sm:p-1.5 bg-white border-2.5 sm:border-3 border-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_0px_#000] sm:shadow-[5px_5px_0px_0px_#000] relative max-w-[calc(100vw-1rem)] overflow-x-auto touch-pan-x scrollbar-none"
					>
						{/* El Aracı (Hand - Tuvali Kaydır) */}
						<button
							onClick={() => setTool("hand")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "hand"
									? "bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Tuvali Taşı / Kaydır (H)"
						>
							<Hand className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">H</span>
						</button>

						{/* Seçim İbre (Select - V) */}
						<button
							onClick={() => setTool("select")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "select"
									? "bg-[#C084FC] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Şekil Seç ve Taşı (V)"
						>
							<MousePointer className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">V</span>
						</button>

						<div className="w-[2px] h-6 bg-black mx-0.5" />

						{/* Dikdörtgen (R) */}
						<button
							onClick={() => setTool("rectangle")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "rectangle"
									? "bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Dikdörtgen (R)"
						>
							<Square className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">R</span>
						</button>

						{/* Baklava / Eşkenar Dörtgen (D) */}
						<button
							onClick={() => setTool("diamond")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "diamond"
									? "bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Baklava Dilimi / Karar (D)"
						>
							<Diamond className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">D</span>
						</button>

						{/* Çember / Daire (O) */}
						<button
							onClick={() => setTool("circle")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "circle"
									? "bg-[#FFE600] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Daire / Elips (O)"
						>
							<Circle className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">O</span>
						</button>

						{/* Ok (Arrow - A) */}
						<button
							onClick={() => setTool("arrow")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "arrow"
									? "bg-[#00C2CB] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Ok / Bağlantı (A)"
						>
							<ArrowRight className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">A</span>
						</button>

						{/* Çizgi (Line - L) */}
						<button
							onClick={() => setTool("line")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "line"
									? "bg-[#00C2CB] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Düz Çizgi (L)"
						>
							<Minus className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">L</span>
						</button>

						{/* Serbest Kalem (Pen - P) */}
						<button
							onClick={() => setTool("pen")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "pen"
									? "bg-[#22C55E] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Serbest Kalem (P)"
						>
							<PenTool className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">P</span>
						</button>

						{/* Fosforlu Kalem */}
						<button
							onClick={() => setTool("highlighter")}
							className={`p-2 border-2 border-black rounded-xl transition-all ${
								tool === "highlighter"
									? "bg-[#00C2CB] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Fosforlu Vurgu Kalemi"
						>
							<Highlighter className="w-4 h-4 stroke-[2.5]" />
						</button>

						{/* Metin (Text - T) */}
						<button
							onClick={() => setTool("text")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "text"
									? "bg-[#FED7AA] text-black shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Metin Ekle (T)"
						>
							<Type className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">T</span>
						</button>

						{/* Silgi (Eraser - E) */}
						<button
							onClick={() => setTool("eraser")}
							className={`relative p-2 border-2 border-black rounded-xl transition-all ${
								tool === "eraser"
									? "bg-[#FF3399] text-white shadow-[2px_2px_0px_0px_#000]"
									: "bg-white hover:bg-[#F5F0E6]"
							}`}
							title="Noktasal / Parça Silgisi (E)"
						>
							<Eraser className="w-4 h-4 stroke-[2.5]" />
							<span className="absolute bottom-0.5 right-1 text-[8px] font-black">E</span>
						</button>

						<div className="w-[2px] h-6 bg-black mx-0.5" />

						{/* Daha Fazla Seçenek Menüsü (Excalidraw 3 Nokta Dropdown) */}
						<div className="relative">
							<button
								onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
								className={`p-2 border-2 border-black rounded-xl transition-all ${
									isMoreMenuOpen ? "bg-black text-white" : "bg-white hover:bg-[#F5F0E6] text-black"
								}`}
								title="Ek Araçlar ve Diyagram Oluşturucular"
							>
								<MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
							</button>

							{isMoreMenuOpen && (
								<>
									{/* Dışarı tıklayınca kapatan şeffaf perde */}
									<div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)} />
									<div className="absolute top-full right-0 mt-2 w-64 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] p-2 space-y-1 z-50">
										{/* 1. GÖRSEL EKLE (Modal: Dosya Seç veya URL Gir) */}
										<button
											onClick={() => {
												setImageModalOpen(true);
												setIsMoreMenuOpen(false);
											}}
											className="w-full flex items-center justify-between px-3 py-2 text-xs font-black uppercase hover:bg-[#FFE600] rounded-xl border border-transparent hover:border-black transition-all"
										>
											<span className="flex items-center gap-2">
												<ImageIcon className="w-4 h-4" /> Görsel ekle
											</span>
											<span className="text-[10px] text-stone-500">9</span>
										</button>

										{/* 2. WEB YERLEŞTİRME (URL Girişi) */}
										<button
											onClick={() => {
												setWebEmbedModal(true);
												setWebEmbedUrl("");
												setIsMoreMenuOpen(false);
											}}
											className="w-full flex items-center justify-between px-3 py-2 text-xs font-black uppercase hover:bg-[#00C2CB] rounded-xl border border-transparent hover:border-black transition-all"
										>
											<span className="flex items-center gap-2">
												<Code2 className="w-4 h-4" /> Web Yerleştirme
											</span>
											<span className="text-[10px] text-stone-500">URL</span>
										</button>
									</div>
								</>
							)}
						</div>

						{/* Seçili Objeyi/Objeleri Sil Butonu */}
						{(selectedStrokeId || selectedStrokeIds.length > 0) && (
							<button
								onClick={deleteSelectedStroke}
								className="flex items-center gap-1.5 px-3 py-2 border-2 border-black rounded-xl bg-[#FF6B35] hover:bg-red-600 text-white font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all animate-in fade-in zoom-in-95 duration-150"
								title={`Seçili ${selectedStrokeIds.length > 1 ? selectedStrokeIds.length + " Objeyi" : "Şekli"} Sil (Delete / Backspace)`}
							>
								<Trash2 className="w-4 h-4 stroke-[2.5]" />
								<span>
									SİL {selectedStrokeIds.length > 1 ? `(${selectedStrokeIds.length})` : ""}
								</span>
							</button>
						)}

						<div className="w-[2px] h-6 bg-black mx-0.5" />

						{/* Kapat / Tamam */}
						<button
							onClick={toggleDrawingMode}
							className="flex items-center gap-1 px-3 py-2 border-2 border-black rounded-xl bg-[#22C55E] text-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ml-0.5"
						>
							<Check className="w-4 h-4 stroke-[3]" />
							<span>BİTTİ</span>
						</button>
					</aside>
				</div>
			)}

			{/* Excalidraw / Tablet Kalemi Sol Özellikler Paneli (Kullanıcının paylaştığı birebir panel) */}
			{isDrawingMode && (
				<aside
					aria-label="Çizim Özellikleri"
					className="absolute top-[68px] left-4 z-40 w-60 max-h-[85vh] overflow-y-auto flex flex-col gap-3 p-3.5 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_#000] select-none text-black scrollbar-none"
				>
					{tool === "eraser" ? (
						<div>
							<span className="text-[11px] font-black uppercase text-stone-600 block mb-1.5">
								Silgi Boyutu
							</span>
							<div className="flex items-center gap-1.5">
								{ERASER_SIZES.map((s) => (
									<button
										key={s.radius}
										onClick={() => setEraserRadius(s.radius)}
										className={`flex-1 py-1.5 border-2 border-black rounded-xl text-xs font-black uppercase transition-all ${
											eraserRadius === s.radius
												? "bg-black text-white shadow-[2px_2px_0px_0px_#000]"
												: "bg-white hover:bg-[#F5F0E6]"
										}`}
									>
										{s.label}
									</button>
								))}
							</div>
						</div>
					) : (
						<>
							{/* 1. KONTUR (Çizgi Rengi) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Kontur
								</span>
								<div className="flex items-center gap-1.5">
									{STROKE_COLORS.map((c) => (
										<button
											key={c.hex}
											onClick={() => {
												setCurrentColor(c.hex);
												updateSelectedStroke({ color: c.hex });
											}}
											className={`w-7 h-7 rounded-lg border-2 border-black transition-all ${
												currentColor === c.hex
													? "ring-2 ring-black scale-110 shadow-[1.5px_1.5px_0px_0px_#000]"
													: "hover:scale-105"
											}`}
											style={{ backgroundColor: c.hex }}
											title={c.label}
										/>
									))}
								</div>
							</div>

							{/* 2. ARKA PLAN (Dolgu Rengi) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Arka plan
								</span>
								<div className="flex items-center gap-1.5">
									{BG_COLORS.map((c) => (
										<button
											key={c.hex}
											onClick={() => {
												setCurrentFill(c.hex);
												updateSelectedStroke({ fill: c.hex });
											}}
											className={`w-7 h-7 rounded-lg border-2 border-black relative overflow-hidden transition-all ${
												currentFill === c.hex
													? "ring-2 ring-black scale-110 shadow-[1.5px_1.5px_0px_0px_#000]"
													: "hover:scale-105"
											}`}
											style={{ backgroundColor: c.hex === "transparent" ? "#FFFFFF" : c.hex }}
											title={c.label}
										>
											{c.hex === "transparent" && (
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="w-full h-0.5 bg-rose-500 rotate-45" />
												</div>
											)}
										</button>
									))}
								</div>
							</div>

							{/* 3. KONTUR GENİŞLİĞİ (İnce, Orta, Kalın Çizgi) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Kontur genişliği
								</span>
								<div className="grid grid-cols-3 gap-1.5">
									{STROKE_WIDTHS.map((s) => (
										<button
											key={s.width}
											onClick={() => {
												setCurrentWidth(s.width);
												updateSelectedStroke({ width: s.width });
											}}
											className={`h-9 border-2 border-black rounded-xl flex items-center justify-center transition-all ${
												currentWidth === s.width
													? "bg-[#EDE9FE] shadow-[2px_2px_0px_0px_#000]"
													: "bg-white hover:bg-stone-50"
											}`}
											title={s.label}
										>
											<div
												className="bg-black rounded-full"
												style={{
													width: 20,
													height: s.width === 2 ? 2.5 : s.width === 4 ? 4.5 : 7,
												}}
											/>
										</button>
									))}
								</div>
							</div>

							{/* 4. KONTUR STİLİ (Düz, Kesikli, Noktalı) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Kontur stili
								</span>
								<div className="grid grid-cols-3 gap-1.5">
									{[
										{ id: "solid", label: "Düz Çizgi", dash: "solid" },
										{ id: "dashed", label: "Kesikli Çizgi", dash: "dashed" },
										{ id: "dotted", label: "Noktalı Çizgi", dash: "dotted" },
									].map((style) => (
										<button
											key={style.id}
											onClick={() => {
												setCurrentStrokeStyle(style.id as any);
												updateSelectedStroke({ strokeStyle: style.id as any });
											}}
											className={`h-9 border-2 border-black rounded-xl flex items-center justify-center transition-all ${
												currentStrokeStyle === style.id
													? "bg-[#EDE9FE] shadow-[2px_2px_0px_0px_#000]"
													: "bg-white hover:bg-stone-50"
											}`}
											title={style.label}
										>
											<div
												className="w-5"
												style={{
													borderTop: "2.5px " + style.dash + " black",
												}}
											/>
										</button>
									))}
								</div>
							</div>

							{/* 5. ÜSTÜN KÖRÜLÜK / ROUGHNESS (Mimar, El Çizimi, Karalama Estetiği) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Üstün körülük
								</span>
								<div className="grid grid-cols-3 gap-1.5">
									{[
										{ id: "clean", label: "Düz / Kesin", curve: "M2 8 C 8 4, 14 12, 20 8" },
										{ id: "wobbly", label: "Doğal / El Çizimi", curve: "M2 9 Q 7 3, 11 8 T 20 7" },
										{
											id: "rough",
											label: "Karalama / Taslak",
											curve: "M2 8 Q 6 2, 10 9 T 16 6 T 20 9",
										},
									].map((r) => (
										<button
											key={r.id}
											onClick={() => {
												setCurrentRoughness(r.id as any);
												updateSelectedStroke({ strokeRoughness: r.id as any });
											}}
											className={`h-9 border-2 border-black rounded-xl flex items-center justify-center transition-all ${
												currentRoughness === r.id
													? "bg-[#EDE9FE] shadow-[2px_2px_0px_0px_#000]"
													: "bg-white hover:bg-stone-50"
											}`}
											title={r.label}
										>
											<svg
												width="22"
												height="16"
												viewBox="0 0 22 16"
												className="stroke-black fill-none"
											>
												<path
													d={r.curve}
													strokeWidth={r.id === "rough" ? 3 : 2}
													strokeLinecap="round"
												/>
											</svg>
										</button>
									))}
								</div>
							</div>

							{/* 6. KENARLAR (Köşeli / Keskin veya Yuvarlatılmış Köşeler) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Kenarlar
								</span>
								<div className="grid grid-cols-2 gap-1.5">
									<button
										onClick={() => {
											setCurrentEdges("sharp");
											updateSelectedStroke({ strokeEdges: "sharp" });
										}}
										className={`h-9 border-2 border-black rounded-xl flex items-center justify-center transition-all ${
											currentEdges === "sharp"
												? "bg-[#EDE9FE] shadow-[2px_2px_0px_0px_#000]"
												: "bg-white hover:bg-stone-50"
										}`}
										title="Keskin Köşeli"
									>
										<div className="w-5 h-5 border-2 border-dashed border-black" />
									</button>

									<button
										onClick={() => {
											setCurrentEdges("rounded");
											updateSelectedStroke({ strokeEdges: "rounded" });
										}}
										className={`h-9 border-2 border-black rounded-xl flex items-center justify-center transition-all ${
											currentEdges === "rounded"
												? "bg-[#EDE9FE] shadow-[2px_2px_0px_0px_#000]"
												: "bg-white hover:bg-stone-50"
										}`}
										title="Yuvarlak Köşeli"
									>
										<div className="w-5 h-5 border-2 border-dashed border-black rounded-lg" />
									</button>
								</div>
							</div>

							{/* 7. OPAKLIK (0 - 100 Slider) */}
							<div>
								<div className="flex items-center justify-between mb-1">
									<span className="text-[11px] font-black uppercase text-stone-700">Opaklık</span>
									<span className="text-xs font-black font-mono">{currentOpacity}</span>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={currentOpacity}
									onChange={(e) => {
										const val = Number(e.target.value);
										setCurrentOpacity(val);
										updateSelectedStroke({ opacity: val });
									}}
									className="w-full accent-black cursor-pointer h-2 bg-stone-200 rounded-lg"
								/>
								<div className="flex justify-between text-[9px] font-black text-stone-400 mt-1">
									<span>0</span>
									<span>100</span>
								</div>
							</div>

							{/* 8. KATMANLAR (Katman Sıralama: En Alta, Bir Alta, Bir Üste, En Üste) */}
							<div>
								<span className="text-[11px] font-black uppercase text-stone-700 block mb-1.5">
									Katmanlar
								</span>
								<div className="grid grid-cols-4 gap-1.5">
									<button
										onClick={sendToBack}
										disabled={!selectedStrokeId}
										className="h-9 border-2 border-black rounded-xl flex items-center justify-center bg-white hover:bg-[#F5F0E6] disabled:opacity-40 disabled:hover:bg-white shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all font-black text-xs"
										title="En Alta Gönder"
									>
										<span className="text-sm">⤓</span>
									</button>

									<button
										onClick={sendBackward}
										disabled={!selectedStrokeId}
										className="h-9 border-2 border-black rounded-xl flex items-center justify-center bg-white hover:bg-[#F5F0E6] disabled:opacity-40 disabled:hover:bg-white shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all font-black text-xs"
										title="Bir Katman Alta Gönder"
									>
										<span className="text-sm">↓</span>
									</button>

									<button
										onClick={bringForward}
										disabled={!selectedStrokeId}
										className="h-9 border-2 border-black rounded-xl flex items-center justify-center bg-white hover:bg-[#F5F0E6] disabled:opacity-40 disabled:hover:bg-white shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all font-black text-xs"
										title="Bir Katman Üste Getir"
									>
										<span className="text-sm">↑</span>
									</button>

									<button
										onClick={bringToFront}
										disabled={!selectedStrokeId}
										className="h-9 border-2 border-black rounded-xl flex items-center justify-center bg-white hover:bg-[#F5F0E6] disabled:opacity-40 disabled:hover:bg-white shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all font-black text-xs"
										title="En Üste Getir"
									>
										<span className="text-sm">⤒</span>
									</button>
								</div>
							</div>
						</>
					)}

					<div className="w-full h-[2px] bg-black/10 my-0.5" />

					{/* Geri Al & Oturum Sil */}
					<div className="flex items-center gap-1.5">
						<button
							onClick={undoDrawingStroke}
							className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border-2 border-black rounded-xl bg-white hover:bg-[#F5F0E6] text-xs font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
							title="Geri Al (⌘Z)"
						>
							<RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
							<span>Geri Al</span>
						</button>

						<button
							onClick={deleteLastSession}
							className="p-1.5 border-2 border-black rounded-xl bg-white hover:bg-[#FF6B35] hover:text-white text-xs font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
							title="Son Çizim Oturumunu Sil"
						>
							<Trash2 className="w-4 h-4 stroke-[2.5]" />
						</button>
					</div>
				</aside>
			)}

			{/* Alt Kısayol Bilgi İpucu (Çizim modunda ekranın altında temiz görünüm) */}
			{isDrawingMode && (
				<div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/95 border-2 border-black rounded-xl text-[11px] font-black text-black shadow-[3px_3px_0px_0px_#000] backdrop-blur-sm pointer-events-none select-none">
					<span>
						Tuvali kaydırmak için{" "}
						<span className="bg-[#FFE600] px-1.5 py-0.5 border border-black rounded font-black">
							El (H)
						</span>{" "}
						veya{" "}
						<span className="bg-[#FFE600] px-1.5 py-0.5 border border-black rounded font-black">
							Boşluk (Space)
						</span>{" "}
						• Şekil silmek için{" "}
						<span className="bg-[#FFE600] px-1.5 py-0.5 border border-black rounded font-black">
							Delete
						</span>
					</span>
				</div>
			)}
		</>
	);
};
