import { CELL } from './utils.js';

export const MIN_SIZE = 10;
export const MAX_SIZE = 30;
export const DEFAULT_SIZE = 20; // 20 × 20 = 400 nodes

/** A board with no walls or weights. */
export function createEmptyGrid(size) {
  return Array.from({ length: size }, () => new Array(size).fill(CELL.EMPTY));
}

/** Default start and end markers: middle row, a fifth in from each side. */
export function defaultEndpoints(size) {
  const row = Math.floor(size / 2);
  const inset = Math.floor(size / 5);
  return { start: [row, inset], end: [row, size - 1 - inset] };
}

/**
 * The starting layout: one vertical wall between the markers with two gaps,
 * so the first run already shows a detour.
 */
export function createDemoGrid(size) {
  const grid = createEmptyGrid(size);
  const wallCol = Math.floor(size / 2);
  const gapTop = Math.max(1, Math.floor(size * 0.2));
  const gapBottom = size - 1 - gapTop;
  for (let r = 0; r < size; r += 1) {
    if (r !== gapTop && r !== gapBottom) grid[r][wallCol] = CELL.WALL;
  }
  return grid;
}
