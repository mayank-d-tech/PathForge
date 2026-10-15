import { buildPath, getNeighbors, toIndex } from './utils.js';

/**
 * Depth-first search, written recursively so the call stack is the stack.
 * Time O(V + E). It finds *a* path, not necessarily the shortest one.
 *
 * Recursion depth is at most the number of cells (900 on the largest
 * 30 × 30 board), which is well inside the JavaScript call-stack limit.
 *
 * @returns {{ visited: number[][], path: number[][], found: boolean }}
 */
export function dfs(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startIdx = toIndex(start[0], start[1], cols);
  const endIdx = toIndex(end[0], end[1], cols);

  const prev = new Int32Array(rows * cols).fill(-1);
  const seen = new Uint8Array(rows * cols);
  const visited = [];

  function visit(r, c) {
    const idx = toIndex(r, c, cols);
    seen[idx] = 1;
    visited.push([r, c]);
    if (idx === endIdx) return true;

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nIdx = toIndex(nr, nc, cols);
      if (seen[nIdx]) continue;
      prev[nIdx] = idx;
      if (visit(nr, nc)) return true;
    }
    return false;
  }

  const found = visit(start[0], start[1]);
  return {
    visited,
    path: found ? buildPath(prev, startIdx, endIdx, cols) : [],
    found,
  };
}
