import { ALGORITHM_LIST, CELL, pathCost } from '../algorithms/index.js';

/**
 * Run every algorithm on the same board and collect comparable numbers.
 * Times are the average of `reps` extra runs, because a single run on a small
 * grid is too quick to measure reliably.
 */
export function compareAlgorithms(grid, start, end, { reps = 25, now = () => performance.now() } = {}) {
  const openCells = grid.reduce((n, row) => n + row.filter((v) => v !== CELL.WALL).length, 0);

  return ALGORITHM_LIST.map((algo) => {
    const res = algo.run(grid, start, end);
    const t0 = now();
    for (let i = 0; i < reps; i += 1) algo.run(grid, start, end);
    const ms = (now() - t0) / reps;
    return {
      algoId: algo.id,
      found: res.found,
      explored: res.visited.length,
      pathLength: res.found ? res.path.length : null,
      cost: res.found ? pathCost(grid, res.path) : null,
      ms,
      openCells,
    };
  });
}

/** Which rows deserve a highlight, as { algoId: ['Fewest cells explored', ...] }. */
export function highlights(rows) {
  const found = rows.filter((r) => r.found);
  const out = Object.fromEntries(rows.map((r) => [r.algoId, []]));
  if (found.length === 0) return out;

  const minExplored = Math.min(...found.map((r) => r.explored));
  const minCost = Math.min(...found.map((r) => r.cost));
  for (const r of found) {
    if (r.explored === minExplored) out[r.algoId].push('Fewest explored');
    if (r.cost === minCost) out[r.algoId].push('Cheapest path');
  }
  return out;
}
