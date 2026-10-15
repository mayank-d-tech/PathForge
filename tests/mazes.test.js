import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CELL, MAX_SIZE, MIN_SIZE, MAZE_LIST, MAZES, createEmptyGrid, generateMaze, nearestOpen,
  ALGORITHMS, defaultEndpoints,
} from '../src/algorithms/index.js';
import { mulberry32, openCount, reachableCount } from './helpers.js';

const PERFECT = ['division', 'backtracker', 'prim'];

describe('maze generators', () => {
  it('registers every generator', () => {
    assert.deepEqual(MAZE_LIST.map((m) => m.id).sort(), ['backtracker', 'division', 'prim', 'scatter']);
  });

  for (const id of Object.keys(MAZES)) {
    it(`${id}: returns a square grid of valid cell values for every size`, () => {
      for (let size = MIN_SIZE; size <= MAX_SIZE; size += 1) {
        const grid = generateMaze(id, size, mulberry32(size));
        assert.equal(grid.length, size);
        for (const row of grid) {
          assert.equal(row.length, size);
          for (const v of row) assert.ok(v === CELL.EMPTY || v === CELL.WALL);
        }
      }
    });
  }

  for (const id of PERFECT) {
    it(`${id}: every open cell is reachable from every other (sizes 10-30, 10 seeds each)`, () => {
      for (let size = MIN_SIZE; size <= MAX_SIZE; size += 1) {
        for (let seed = 1; seed <= 10; seed += 1) {
          const grid = generateMaze(id, size, mulberry32(seed * 101 + size));
          const open = openCount(grid);
          assert.ok(open > size, `${id} ${size}x${size} seed ${seed} is mostly walls`);
          const firstOpen = [0, 0];
          assert.equal(grid[0][0], CELL.EMPTY, 'top-left corner should be open');
          assert.equal(
            reachableCount(grid, firstOpen), open,
            `${id} ${size}x${size} seed ${seed} has disconnected regions`,
          );
        }
      }
    });
  }

  it('backtracker and Prim carve a spanning tree (open cells = lattice cells + passages)', () => {
    for (const id of ['backtracker', 'prim']) {
      const size = 21;
      const grid = generateMaze(id, size, mulberry32(7));
      const lattice = 11 * 11;
      assert.equal(openCount(grid), lattice + (lattice - 1), id);
    }
  });

  it('is deterministic for a given seed and varies between seeds', () => {
    for (const id of Object.keys(MAZES)) {
      const a = generateMaze(id, 20, mulberry32(5));
      const b = generateMaze(id, 20, mulberry32(5));
      const c = generateMaze(id, 20, mulberry32(6));
      assert.deepEqual(a, b, id);
      assert.notDeepEqual(a, c, id);
    }
  });

  it('scatter respects the density roughly', () => {
    const grid = generateMaze('scatter', 30, mulberry32(3));
    const walls = 900 - openCount(grid);
    assert.ok(walls > 150 && walls < 350, `wall count ${walls}`);
  });
});

describe('nearestOpen', () => {
  it('returns the point itself when it is open', () => {
    assert.deepEqual(nearestOpen(createEmptyGrid(10), [3, 4]), [3, 4]);
  });

  it('moves a marker off a wall to the closest open cell', () => {
    const grid = createEmptyGrid(10);
    grid[5][5] = CELL.WALL;
    const found = nearestOpen(grid, [5, 5]);
    assert.equal(Math.abs(found[0] - 5) + Math.abs(found[1] - 5), 1);
  });

  it('honours the avoid cell', () => {
    const grid = createEmptyGrid(10);
    const found = nearestOpen(grid, [2, 2], [2, 2]);
    assert.notDeepEqual(found, [2, 2]);
  });

  it('returns null when the whole board is walls', () => {
    const grid = createEmptyGrid(10).map((row) => row.map(() => CELL.WALL));
    assert.equal(nearestOpen(grid, [0, 0]), null);
  });
});

describe('mazes + markers + algorithms', () => {
  it('after snapping markers, every algorithm solves every perfect maze', () => {
    for (const id of PERFECT) {
      for (const size of [10, 20, 30]) {
        const grid = generateMaze(id, size, mulberry32(size * 7));
        const ends = defaultEndpoints(size);
        const start = nearestOpen(grid, ends.start);
        const end = nearestOpen(grid, ends.end, start);
        for (const algo of Object.values(ALGORITHMS)) {
          assert.ok(algo.run(grid, start, end).found, `${algo.name} on ${id} ${size}x${size}`);
        }
      }
    }
  });
});
