import assert from 'node:assert/strict';
import { CELL, manhattan } from '../src/algorithms/index.js';

/** Small seeded PRNG so random tests are reproducible. */
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A valid path starts at start, ends at end, moves one cell at a time and avoids walls. */
export function assertValidPath(grid, path, start, end) {
  assert.deepEqual(path[0], start, 'path should begin at the start cell');
  assert.deepEqual(path[path.length - 1], end, 'path should finish at the end cell');
  path.forEach(([r, c], i) => {
    assert.notEqual(grid[r][c], CELL.WALL, `path crosses a wall at ${r},${c}`);
    if (i > 0) assert.equal(manhattan(r, c, path[i - 1][0], path[i - 1][1]), 1, 'path has a jump');
  });
}

/** Number of open cells reachable from `from` (4-directional flood fill). */
export function reachableCount(grid, from) {
  const size = grid.length;
  const seen = new Set([from[0] * size + from[1]]);
  const stack = [from];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      if (grid[nr][nc] === CELL.WALL || seen.has(nr * size + nc)) continue;
      seen.add(nr * size + nc);
      stack.push([nr, nc]);
    }
  }
  return seen.size;
}

export const openCount = (grid) => grid.flat().filter((v) => v !== CELL.WALL).length;
