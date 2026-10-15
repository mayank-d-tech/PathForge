import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import MinHeap from '../src/algorithms/minHeap.js';
import {
  ALGORITHMS, CELL, createDemoGrid, createEmptyGrid, defaultEndpoints,
  getNeighbors, manhattan, pathCost,
} from '../src/algorithms/index.js';
import { assertValidPath, mulberry32 } from './helpers.js';

const size = 20;
const { start, end } = defaultEndpoints(size);

describe('MinHeap', () => {
  it('pops items in sorted order', () => {
    const rng = mulberry32(1);
    const heap = new MinHeap((a, b) => a - b);
    const values = Array.from({ length: 500 }, () => Math.floor(rng() * 1000));
    values.forEach((v) => heap.push(v));
    const popped = [];
    while (heap.size) popped.push(heap.pop());
    assert.deepEqual(popped, [...values].sort((a, b) => a - b));
  });

  it('returns undefined when empty and supports peek', () => {
    const heap = new MinHeap((a, b) => a - b);
    assert.equal(heap.pop(), undefined);
    heap.push(5);
    heap.push(2);
    assert.equal(heap.peek(), 2);
    assert.equal(heap.size, 2);
  });
});

describe('every algorithm', () => {
  it('finds a valid path on an empty board', () => {
    const grid = createEmptyGrid(size);
    for (const algo of Object.values(ALGORITHMS)) {
      const res = algo.run(grid, start, end);
      assert.ok(res.found, `${algo.name} should find a path`);
      assertValidPath(grid, res.path, start, end);
    }
  });

  it('routes through the gap in the demo wall', () => {
    const grid = createDemoGrid(size);
    for (const algo of Object.values(ALGORITHMS)) {
      const res = algo.run(grid, start, end);
      assert.ok(res.found, algo.name);
      assertValidPath(grid, res.path, start, end);
    }
  });

  it('reports "no path" when the end is walled in', () => {
    const grid = createEmptyGrid(size);
    for (const [nr, nc] of getNeighbors(grid, end[0], end[1])) grid[nr][nc] = CELL.WALL;
    for (const algo of Object.values(ALGORITHMS)) {
      const res = algo.run(grid, start, end);
      assert.equal(res.found, false, algo.name);
      assert.deepEqual(res.path, []);
    }
  });

  it('lists the start cell first and never repeats a cell', () => {
    const grid = createDemoGrid(size);
    for (const algo of Object.values(ALGORITHMS)) {
      const { visited } = algo.run(grid, start, end);
      assert.deepEqual(visited[0], start, algo.name);
      assert.equal(new Set(visited.map(([r, c]) => r * size + c)).size, visited.length, algo.name);
    }
  });

  it('handles start and end next to each other', () => {
    const grid = createEmptyGrid(size);
    for (const algo of Object.values(ALGORITHMS)) {
      const res = algo.run(grid, [5, 5], [5, 6]);
      assert.ok(res.found, algo.name);
      assertValidPath(grid, res.path, [5, 5], [5, 6]);
      // DFS is not a shortest-path algorithm, so only the others are pinned to 2 cells.
      if (algo.id !== 'dfs') assert.equal(res.path.length, 2, algo.name);
    }
  });
});

describe('optimality', () => {
  it('BFS, Dijkstra and A* find the shortest path on an open board', () => {
    const grid = createEmptyGrid(size);
    const shortest = manhattan(...start, ...end) + 1;
    for (const id of ['bfs', 'dijkstra', 'astar']) {
      assert.equal(ALGORITHMS[id].run(grid, start, end).path.length, shortest, id);
    }
  });

  it('A* explores fewer cells than Dijkstra on an open board', () => {
    const grid = createEmptyGrid(size);
    const a = ALGORITHMS.astar.run(grid, start, end).visited.length;
    const d = ALGORITHMS.dijkstra.run(grid, start, end).visited.length;
    assert.ok(a < d, `A* ${a} should be < Dijkstra ${d}`);
  });

  it('Dijkstra and A* detour around a thick weighted band; BFS ignores the weights', () => {
    const grid = createEmptyGrid(size);
    const col = Math.floor(size / 2);
    const gapRow = start[0] - 2;
    for (let r = 0; r < size; r += 1) {
      if (r === gapRow) continue;
      for (let c = col - 1; c <= col + 1; c += 1) grid[r][c] = CELL.WEIGHT;
    }
    const bfs = ALGORITHMS.bfs.run(grid, start, end);
    const dij = ALGORITHMS.dijkstra.run(grid, start, end);
    const ast = ALGORITHMS.astar.run(grid, start, end);
    assert.ok(pathCost(grid, dij.path) < pathCost(grid, bfs.path));
    assert.equal(pathCost(grid, dij.path), pathCost(grid, ast.path));
    assert.ok(bfs.path.length < dij.path.length, 'BFS takes fewer steps but pays more');
    assert.equal(pathCost(grid, dij.path), manhattan(...start, ...end) + 4);
  });

  it('agrees across 300 random weighted boards', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 300; i += 1) {
      const grid = createEmptyGrid(size);
      for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
          const roll = rng();
          if (roll < 0.25) grid[r][c] = CELL.WALL;
          else if (roll < 0.4) grid[r][c] = CELL.WEIGHT;
        }
      }
      grid[start[0]][start[1]] = CELL.EMPTY;
      grid[end[0]][end[1]] = CELL.EMPTY;

      const bfs = ALGORITHMS.bfs.run(grid, start, end);
      const dfs = ALGORITHMS.dfs.run(grid, start, end);
      const dij = ALGORITHMS.dijkstra.run(grid, start, end);
      const ast = ALGORITHMS.astar.run(grid, start, end);

      assert.equal(bfs.found, dij.found);
      assert.equal(dij.found, ast.found);
      assert.equal(dfs.found, bfs.found);
      if (!bfs.found) continue;

      for (const res of [bfs, dfs, dij, ast]) assertValidPath(grid, res.path, start, end);
      assert.equal(pathCost(grid, dij.path), pathCost(grid, ast.path));
      assert.ok(pathCost(grid, dij.path) <= pathCost(grid, bfs.path));
      assert.ok(bfs.path.length <= dij.path.length);
      assert.ok(bfs.path.length <= dfs.path.length);
    }
  });
});

describe('DFS recursion', () => {
  it('survives the largest board (30 × 30) even on a long snaking path', () => {
    const big = 30;
    const grid = createEmptyGrid(big);
    // Alternating full-width walls with a gap at alternating ends force one long snake.
    for (let r = 1; r < big; r += 2) {
      for (let c = 0; c < big; c += 1) grid[r][c] = CELL.WALL;
      grid[r][(r / 2 | 0) % 2 === 0 ? big - 1 : 0] = CELL.EMPTY;
    }
    const res = ALGORITHMS.dfs.run(grid, [0, 0], [big - 2, 0]);
    assert.ok(res.found);
    assert.ok(res.visited.length > 400, 'should have walked deep');
  });
});
