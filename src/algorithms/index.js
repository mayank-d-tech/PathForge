import { astar } from './astar.js';
import { bfs } from './bfs.js';
import { dfs } from './dfs.js';
import { dijkstra } from './dijkstra.js';

/** Registry used by the UI: one entry per algorithm. */
export const ALGORITHMS = {
  bfs: {
    id: 'bfs',
    name: 'BFS',
    fullName: 'Breadth-first search',
    run: bfs,
    structure: 'Queue (FIFO)',
    complexity: 'O(V + E)',
    shortest: 'Fewest steps',
    usesWeights: false,
    summary: 'Explores in rings around the start, one step at a time.',
  },
  dfs: {
    id: 'dfs',
    name: 'DFS',
    fullName: 'Depth-first search',
    run: dfs,
    structure: 'Recursion (call stack)',
    complexity: 'O(V + E)',
    shortest: 'Not guaranteed',
    usesWeights: false,
    summary: 'Dives down one route until it hits a dead end, then backtracks.',
  },
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's",
    fullName: "Dijkstra's algorithm",
    run: dijkstra,
    structure: 'Priority queue (min-heap)',
    complexity: 'O((V + E) log V)',
    shortest: 'Lowest cost',
    usesWeights: true,
    summary: 'Always expands the cheapest unfinished cell, so weights are respected.',
  },
  astar: {
    id: 'astar',
    name: 'A*',
    fullName: 'A* search',
    run: astar,
    structure: 'Priority queue + Manhattan heuristic',
    complexity: 'O((V + E) log V)',
    shortest: 'Lowest cost',
    usesWeights: true,
    summary: 'Dijkstra with a sense of direction, so it usually explores far fewer cells.',
  },
};

export const ALGORITHM_LIST = Object.values(ALGORITHMS);
export * from './utils.js';
export * from './board.js';
export * from './mazes.js';
