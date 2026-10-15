import { buildPath, getNeighbors, toIndex } from './utils.js';

/**
 * Breadth-first search – explores in rings using a FIFO queue.
 * Time O(V + E). Finds the path with the fewest steps (ignores weights).
 *
 * @returns {{ visited: number[][], path: number[][], found: boolean }}
 */
export function bfs(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startIdx = toIndex(start[0], start[1], cols);
  const endIdx = toIndex(end[0], end[1], cols);

  const prev = new Int32Array(rows * cols).fill(-1);
  const seen = new Uint8Array(rows * cols);
  const visited = [];

  // An array + head pointer gives O(1) dequeue (Array#shift is O(n)).
  const queue = [start];
  let head = 0;
  seen[startIdx] = 1;

  while (head < queue.length) {
    const [r, c] = queue[head++];
    visited.push([r, c]);

    const idx = toIndex(r, c, cols);
    if (idx === endIdx) {
      return { visited, path: buildPath(prev, startIdx, endIdx, cols), found: true };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nIdx = toIndex(nr, nc, cols);
      if (seen[nIdx]) continue;
      seen[nIdx] = 1;
      prev[nIdx] = idx;
      queue.push([nr, nc]);
    }
  }

  return { visited, path: [], found: false };
}
