/**
 * Shared helpers for the pathfinding algorithms.
 *
 * The board is a 2D array of cell types. Every algorithm treats it as an
 * implicit graph: each non-wall cell is a vertex and each pair of
 * 4-directionally adjacent open cells is an edge. Entering a cell costs
 * 1, or WEIGHT_COST if the cell is a "weight" cell.
 */

export const CELL = Object.freeze({ EMPTY: 0, WALL: 1, WEIGHT: 2 });
export const WEIGHT_COST = 5;

// Neighbour order is fixed (up, right, down, left) so runs are deterministic.
const DIRECTIONS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

export const toIndex = (r, c, cols) => r * cols + c;

export const stepCost = (grid, r, c) =>
  grid[r][c] === CELL.WEIGHT ? WEIGHT_COST : 1;

/** Open (non-wall) neighbours of a cell, as [row, col] pairs. */
export function getNeighbors(grid, r, c) {
  const rows = grid.length;
  const cols = grid[0].length;
  const out = [];
  for (const [dr, dc] of DIRECTIONS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
    if (grid[nr][nc] === CELL.WALL) continue;
    out.push([nr, nc]);
  }
  return out;
}

/** Walk the `prev` links back from the end node to rebuild the path. */
export function buildPath(prev, startIdx, endIdx, cols) {
  const path = [];
  let cur = endIdx;
  while (cur !== -1) {
    path.push([Math.floor(cur / cols), cur % cols]);
    if (cur === startIdx) return path.reverse();
    cur = prev[cur];
  }
  return []; // end node was never reached
}

/** Total cost of a path (the start cell itself is free). */
export function pathCost(grid, path) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += stepCost(grid, path[i][0], path[i][1]);
  }
  return total;
}

/** Manhattan distance – an admissible heuristic on a 4-connected grid. */
export const manhattan = (r1, c1, r2, c2) =>
  Math.abs(r1 - r2) + Math.abs(c1 - c2);
