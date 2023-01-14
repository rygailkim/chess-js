/**
 * Shifts the current piece appropriately for move generation
 */
function MOVE(from, to, captured, promoted, flag) {
	return (from | (to << 7) | (captured << 14) | (promoted << 20) | flag);
}