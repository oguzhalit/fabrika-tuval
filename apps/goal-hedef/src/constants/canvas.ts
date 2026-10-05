// Canvas positioning constants for consistent stage creation behavior
export const CANVAS_BOUNDS = {
	// Minimum position to prevent nodes from appearing too far left/top
	MIN_X: 200,
	MIN_Y: 150,
	// Maximum position to prevent nodes from appearing too far right/bottom
	MAX_X: 1200,
	MAX_Y: 800,
} as const;

// Drawer configuration
export const DRAWER_CONFIG = {
	// Width of the right sidebar drawer (from GoalDetailDrawer)
	WIDTH: 580,
	// Vertical offset for dropdown positioning relative to button
	DROPDOWN_OFFSET_Y: 50,
	// Horizontal offset for stage creation relative to drawer
	DROPDOWN_OFFSET_X: -290,
} as const;

// Toolbar configuration
export const TOOLBAR_CONFIG = {
	// Vertical offset above the toolbar for stage positioning
	POSITION_OFFSET_Y: -100,
} as const;

/**
 * Clamp a position value within canvas bounds
 */
export function clampCanvasPosition(
	value: number,
	isHorizontal: boolean,
): number {
	const min = isHorizontal ? CANVAS_BOUNDS.MIN_X : CANVAS_BOUNDS.MIN_Y;
	const max = isHorizontal ? CANVAS_BOUNDS.MAX_X : CANVAS_BOUNDS.MAX_Y;
	return Math.max(min, Math.min(max, value));
}
