import MinHeap from './minHeap.js';
import { buildPath, getNeighbors, manhattan, stepCost, toIndex } from './utils.js';

/**
 * A* search – Dijkstra's algorithm steered by a heuristic.
 * Priority f(n) = g(n) + h(n), where g is the cost so far and h is the
 * Manhattan distance to the goal. That heuristic never overestimates on a
 * 4-connected grid (every step costs at least 1), so the path is optimal.
 * Worst case O((V + E) log V), but usually explores far fewer nodes.
 *
 * @returns {{ visited: number[][], path: number[][], found: boolean }}
 */
export function astar(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startIdx = toIndex(start[0], start[1], cols);
  const endIdx = toIndex(end[0], end[1], cols);
  const [er, ec] = end;

  const g = new Float64Array(rows * cols).fill(Infinity);
  const prev = new Int32Array(rows * cols).fill(-1);
  const closed = new Uint8Array(rows * cols);
  const visited = [];

  // Entries are [f, h, index]; ties on f prefer the node closer to the goal.
  const heap = new MinHeap((a, b) => a[0] - b[0] || a[1] - b[1]);
  g[startIdx] = 0;
  const h0 = manhattan(start[0], start[1], er, ec);
  heap.push([h0, h0, startIdx]);

  while (heap.size > 0) {
    const [, , idx] = heap.pop();
    if (closed[idx]) continue;
    closed[idx] = 1;

    const r = Math.floor(idx / cols);
    const c = idx % cols;
    visited.push([r, c]);

    if (idx === endIdx) {
      return { visited, path: buildPath(prev, startIdx, endIdx, cols), found: true };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nIdx = toIndex(nr, nc, cols);
      if (closed[nIdx]) continue;
      const tentative = g[idx] + stepCost(grid, nr, nc);
      if (tentative < g[nIdx]) {
        g[nIdx] = tentative;
        prev[nIdx] = idx;
        const h = manhattan(nr, nc, er, ec);
        heap.push([tentative + h, h, nIdx]);
      }
    }
  }

  return { visited, path: [], found: false };
}
