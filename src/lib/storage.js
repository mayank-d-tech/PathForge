import { ALGORITHMS, CELL, MAX_SIZE, MIN_SIZE } from '../algorithms/index.js';

const KEY = 'pathforge:v1';

const isInt = (n) => Number.isInteger(n);
const inBounds = (p, size) =>
  Array.isArray(p) && p.length === 2 && isInt(p[0]) && isInt(p[1]) &&
  p[0] >= 0 && p[1] >= 0 && p[0] < size && p[1] < size;

/** Compact, JSON-safe form of the app state: each grid row becomes a string of digits. */
export function serializeState({ size, grid, endpoints, algoId, tool, speed }) {
  return JSON.stringify({
    version: 1,
    size,
    grid: grid.map((row) => row.join('')),
    start: endpoints.start,
    end: endpoints.end,
    algoId,
    tool,
    speed,
  });
}

/** Parse and validate saved state. Returns null for anything that does not look right. */
export function parseState(raw) {
  try {
    const d = JSON.parse(raw);
    if (!d || d.version !== 1) return null;
    const { size } = d;
    if (!isInt(size) || size < MIN_SIZE || size > MAX_SIZE) return null;
    if (!Array.isArray(d.grid) || d.grid.length !== size) return null;
    const grid = [];
    for (const row of d.grid) {
      if (typeof row !== 'string' || row.length !== size || !/^[012]+$/.test(row)) return null;
      grid.push([...row].map(Number));
    }
    if (!inBounds(d.start, size) || !inBounds(d.end, size)) return null;
    if (d.start[0] === d.end[0] && d.start[1] === d.end[1]) return null;
    if (grid[d.start[0]][d.start[1]] === CELL.WALL || grid[d.end[0]][d.end[1]] === CELL.WALL) return null;
    if (!ALGORITHMS[d.algoId]) return null;
    if (d.tool !== CELL.WALL && d.tool !== CELL.WEIGHT) return null;
    if (!isInt(d.speed) || d.speed < 1 || d.speed > 5) return null;
    return {
      size,
      grid,
      endpoints: { start: d.start, end: d.end },
      algoId: d.algoId,
      tool: d.tool,
      speed: d.speed,
    };
  } catch {
    return null;
  }
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage can be blocked (private mode, strict cookie settings)
  }
}

export function loadState(storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? parseState(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state, storage = defaultStorage()) {
  try {
    storage?.setItem(KEY, serializeState(state));
  } catch {
    /* ignore quota / blocked storage – saving is a convenience only */
  }
}
