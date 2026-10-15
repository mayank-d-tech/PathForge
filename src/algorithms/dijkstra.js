import MinHeap from './minHeap.js';
import { buildPath, getNeighbors, stepCost, toIndex } from './utils.js';

/**
 * Dijkstra's algorithm – always expands the cheapest unfinished node,
 * using a min-heap as the priority queue.
 * Time O((V + E) log V). Finds the cheapest path and respects weights.
 *
 * Stale heap entries are skipped when popped ("lazy deletion") instead of
 * being decreased in place.
 *
 * @returns {{ visited: number[][], path: number[][], found: boolean }}
 */
export function dijkstra(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startIdx = toIndex(start[0], start[1], cols);
  const endIdx = toIndex(end[0], end[1], cols);

  const dist = new Float64Array(rows * cols).fill(Infinity);
  const prev = new Int32Array(rows * cols).fill(-1);
  const done = new Uint8Array(rows * cols);
  const visited = [];

  const heap = new MinHeap((a, b) => a[0] - b[0]); // [distance, index]
  dist[startIdx] = 0;
  heap.push([0, startIdx]);

  while (heap.size > 0) {
    const [d, idx] = heap.pop();
    if (done[idx]) continue;
    done[idx] = 1;

    const r = Math.floor(idx / cols);
    const c = idx % cols;
    visited.push([r, c]);

    if (idx === endIdx) {
      return { visited, path: buildPath(prev, startIdx, endIdx, cols), found: true };
    }

    for (const [nr, nc] of getNeighbors(grid, r, c)) {
      const nIdx = toIndex(nr, nc, cols);
      if (done[nIdx]) continue;
      const nd = d + stepCost(grid, nr, nc);
      if (nd < dist[nIdx]) {
        dist[nIdx] = nd;
        prev[nIdx] = idx;
        heap.push([nd, nIdx]);
      }
    }
  }

  return { visited, path: [], found: false };
}
