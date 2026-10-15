import { CELL } from './utils.js';
import { createEmptyGrid } from './board.js';

/**
 * Maze generators. Each takes (size, rng) and returns a fresh size × size grid
 * of CELL.WALL / CELL.EMPTY. `rng` is any () => number in [0, 1), so tests can
 * pass a seeded generator.
 *
 * The three "perfect" mazes (division, backtracker, Prim's) always leave every
 * open cell reachable from every other one. They work on a lattice of cells at
 * even row/column indices, with the odd indices acting as walls or passages.
 */

const filledGrid = (size) =>
  Array.from({ length: size }, () => new Array(size).fill(CELL.WALL));

const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

function shuffle(items, rng) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const JUMPS = [
  [-2, 0],
  [0, 2],
  [2, 0],
  [0, -2],
];

/** Scatter walls at random. Not guaranteed solvable – good for "no path" demos. */
export function scatter(size, rng = Math.random, density = 0.28) {
  const grid = createEmptyGrid(size);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (rng() < density) grid[r][c] = CELL.WALL;
    }
  }
  return grid;
}

/**
 * Recursive division: start with an open room, split it with a wall that has
 * one gap, then recurse into both halves. Walls sit on odd rows/columns and
 * gaps on even ones, so a gap can never be blocked by a later wall.
 */
export function recursiveDivision(size, rng = Math.random) {
  const grid = createEmptyGrid(size);

  function divide(r0, c0, r1, c1) {
    const h = r1 - r0 + 1;
    const w = c1 - c0 + 1;
    if (h < 3 || w < 3) return;

    const horizontal = h === w ? rng() < 0.5 : h > w;
    if (horizontal) {
      const wallRow = r0 + 1 + 2 * randInt(rng, 0, Math.floor((h - 3) / 2));
      const gap = c0 + 2 * randInt(rng, 0, Math.floor((w - 1) / 2));
      for (let c = c0; c <= c1; c += 1) if (c !== gap) grid[wallRow][c] = CELL.WALL;
      divide(r0, c0, wallRow - 1, c1);
      divide(wallRow + 1, c0, r1, c1);
    } else {
      const wallCol = c0 + 1 + 2 * randInt(rng, 0, Math.floor((w - 3) / 2));
      const gap = r0 + 2 * randInt(rng, 0, Math.floor((h - 1) / 2));
      for (let r = r0; r <= r1; r += 1) if (r !== gap) grid[r][wallCol] = CELL.WALL;
      divide(r0, c0, r1, wallCol - 1);
      divide(r0, wallCol + 1, r1, c1);
    }
  }

  divide(0, 0, size - 1, size - 1);
  return grid;
}

/**
 * Recursive backtracker: a randomized depth-first walk that carves a passage
 * to each unvisited lattice cell and backtracks at dead ends. Produces long,
 * winding corridors.
 */
export function recursiveBacktracker(size, rng = Math.random) {
  const grid = filledGrid(size);

  function carve(r, c) {
    grid[r][c] = CELL.EMPTY;
    for (const [dr, dc] of shuffle([...JUMPS], rng)) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < size && nc < size && nr >= 0 && nc >= 0 && grid[nr][nc] === CELL.WALL) {
        grid[r + dr / 2][c + dc / 2] = CELL.EMPTY;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);
  return grid;
}

/**
 * Randomized Prim's algorithm: grow the maze outwards from one cell by
 * repeatedly joining a random frontier cell to the maze. Produces short
 * dead ends and a bushier, more branching look.
 */
export function prim(size, rng = Math.random) {
  const grid = filledGrid(size);
  const queued = new Set();
  const frontier = [];

  const addFrontier = (r, c) => {
    for (const [dr, dc] of JUMPS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = nr * size + nc;
      if (nr >= 0 && nc >= 0 && nr < size && nc < size && grid[nr][nc] === CELL.WALL && !queued.has(key)) {
        queued.add(key);
        frontier.push([nr, nc]);
      }
    }
  };

  grid[0][0] = CELL.EMPTY;
  addFrontier(0, 0);

  while (frontier.length > 0) {
    const pick = Math.floor(rng() * frontier.length);
    [frontier[pick], frontier[frontier.length - 1]] = [frontier[frontier.length - 1], frontier[pick]];
    const [r, c] = frontier.pop();

    const joined = JUMPS.filter(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr >= 0 && nc >= 0 && nr < size && nc < size && grid[nr][nc] === CELL.EMPTY;
    });
    const [dr, dc] = joined[Math.floor(rng() * joined.length)];
    grid[r + dr / 2][c + dc / 2] = CELL.EMPTY;
    grid[r][c] = CELL.EMPTY;
    addFrontier(r, c);
  }
  return grid;
}

/** Registry used by the UI. */
export const MAZES = {
  division: { id: 'division', name: 'Recursive division', generate: recursiveDivision },
  backtracker: { id: 'backtracker', name: 'Recursive backtracker', generate: recursiveBacktracker },
  prim: { id: 'prim', name: "Prim's algorithm", generate: prim },
  scatter: { id: 'scatter', name: 'Random walls', generate: scatter },
};
export const MAZE_LIST = Object.values(MAZES);

export const generateMaze = (id, size, rng = Math.random) => MAZES[id].generate(size, rng);

/**
 * The open cell closest to `point` (ignoring walls while measuring distance).
 * Used to move the start/end markers off walls after a maze is generated.
 */
export function nearestOpen(grid, point, avoid = null) {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Uint8Array(rows * cols);
  const queue = [point];
  let head = 0;
  seen[point[0] * cols + point[1]] = 1;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    const isAvoided = avoid && avoid[0] === r && avoid[1] === c;
    if (grid[r][c] !== CELL.WALL && !isAvoided) return [r, c];
    for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr * cols + nc]) continue;
      seen[nr * cols + nc] = 1;
      queue.push([nr, nc]);
    }
  }
  return null;
}
