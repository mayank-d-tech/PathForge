import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CELL, createDemoGrid, createEmptyGrid, defaultEndpoints } from '../src/algorithms/index.js';
import { compareAlgorithms, highlights } from '../src/lib/compare.js';
import { loadState, parseState, saveState, serializeState } from '../src/lib/storage.js';

const sample = () => ({
  size: 20,
  grid: createDemoGrid(20),
  endpoints: defaultEndpoints(20),
  algoId: 'dijkstra',
  tool: CELL.WEIGHT,
  speed: 4,
});

const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
};

describe('storage', () => {
  it('round-trips the app state', () => {
    const state = sample();
    assert.deepEqual(parseState(serializeState(state)), state);
  });

  it('saves to and loads from a storage object', () => {
    const storage = fakeStorage();
    saveState(sample(), storage);
    assert.deepEqual(loadState(storage), sample());
  });

  it('returns null for missing, corrupt or tampered data', () => {
    assert.equal(loadState(fakeStorage()), null);
    assert.equal(parseState('not json'), null);
    assert.equal(parseState('null'), null);
    const good = JSON.parse(serializeState(sample()));
    const bad = (patch) => parseState(JSON.stringify({ ...good, ...patch }));
    assert.equal(bad({ version: 2 }), null);
    assert.equal(bad({ size: 99 }), null);
    assert.equal(bad({ size: 5 }), null);
    assert.equal(bad({ grid: good.grid.slice(1) }), null);
    assert.equal(bad({ grid: good.grid.map((r) => r.slice(1)) }), null);
    assert.equal(bad({ grid: good.grid.map((r) => r.replace(/0/g, '9')) }), null);
    assert.equal(bad({ start: [0, 0], end: [0, 0] }), null);
    assert.equal(bad({ start: [-1, 0] }), null);
    assert.equal(bad({ start: [1.5, 2] }), null);
    assert.equal(bad({ end: [20, 3] }), null);
    assert.equal(bad({ algoId: 'bogosort' }), null);
    assert.equal(bad({ tool: 0 }), null);
    assert.equal(bad({ speed: 9 }), null);
  });

  it('rejects a start or end marker that sits on a wall', () => {
    const state = sample();
    state.grid[state.endpoints.start[0]][state.endpoints.start[1]] = CELL.WALL;
    assert.equal(parseState(serializeState(state)), null);
  });

  it('never throws when storage is unavailable or broken', () => {
    assert.equal(loadState(null), null);
    assert.doesNotThrow(() => saveState(sample(), null));
    const throwing = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('quota'); },
    };
    assert.equal(loadState(throwing), null);
    assert.doesNotThrow(() => saveState(sample(), throwing));
  });
});

describe('compareAlgorithms', () => {
  const { start, end } = defaultEndpoints(20);

  it('returns one comparable row per algorithm', () => {
    const rows = compareAlgorithms(createEmptyGrid(20), start, end, { reps: 2 });
    assert.deepEqual(rows.map((r) => r.algoId), ['bfs', 'dfs', 'dijkstra', 'astar']);
    for (const r of rows) {
      assert.ok(r.found);
      assert.equal(r.openCells, 400);
      assert.ok(r.ms >= 0);
    }
  });

  it('uses the injected clock to average timings', () => {
    let t = 0;
    const rows = compareAlgorithms(createEmptyGrid(10), [0, 0], [9, 9], {
      reps: 5,
      now: () => { t += 10; return t; }, // every now() call advances 10 ms
    });
    for (const r of rows) assert.equal(r.ms, 2); // (10 ms between calls) / 5 reps
  });

  it('highlights the cheapest path and the fewest explored cells', () => {
    const rows = compareAlgorithms(createEmptyGrid(20), start, end, { reps: 1 });
    const marks = highlights(rows);
    assert.ok(marks.astar.includes('Cheapest path'));
    assert.ok(marks.astar.includes('Fewest explored') || marks.dfs.includes('Fewest explored'));
    assert.ok(marks.dfs.length <= marks.astar.length + 1);
  });

  it('reports no path and no highlights when the end is walled off', () => {
    const grid = createEmptyGrid(20);
    for (const [r, c] of [[end[0] - 1, end[1]], [end[0] + 1, end[1]], [end[0], end[1] - 1], [end[0], end[1] + 1]]) {
      grid[r][c] = CELL.WALL;
    }
    const rows = compareAlgorithms(grid, start, end, { reps: 1 });
    assert.ok(rows.every((r) => !r.found && r.cost === null && r.pathLength === null));
    assert.ok(Object.values(highlights(rows)).every((list) => list.length === 0));
  });
});
