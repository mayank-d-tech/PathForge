import { useEffect, useRef, useState } from 'react';
import Board from './components/Board.jsx';
import ComparisonTable from './components/ComparisonTable.jsx';
import Controls from './components/Controls.jsx';
import RunReport from './components/RunReport.jsx';
import Transport from './components/Transport.jsx';
import usePlayback from './hooks/usePlayback.js';
import {
  ALGORITHMS,
  CELL,
  DEFAULT_SIZE,
  WEIGHT_COST,
  createDemoGrid,
  createEmptyGrid,
  defaultEndpoints,
  generateMaze,
  nearestOpen,
  pathCost,
} from './algorithms/index.js';
import { compareAlgorithms } from './lib/compare.js';
import { loadState, saveState } from './lib/storage.js';

const LEGEND = [
  ['start', 'Start'],
  ['end', 'End'],
  ['wall', 'Wall'],
  ['weight', 'Weight'],
  ['visited', 'Explored'],
  ['path', 'Path'],
];

const KEY_MOVES = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const defaultState = () => ({
  size: DEFAULT_SIZE,
  grid: createDemoGrid(DEFAULT_SIZE),
  endpoints: defaultEndpoints(DEFAULT_SIZE),
  algoId: 'astar',
  tool: CELL.WALL,
  speed: 3,
});

export default function App() {
  // Restore the last board from localStorage (validated), else start from the demo layout.
  const [initial] = useState(() => loadState() ?? defaultState());
  const [size, setSize] = useState(initial.size);
  const [grid, setGrid] = useState(initial.grid);
  const [endpoints, setEndpoints] = useState(initial.endpoints);
  const [algoId, setAlgoId] = useState(initial.algoId);
  const [tool, setTool] = useState(initial.tool);
  const [speed, setSpeed] = useState(initial.speed);
  const [mazeId, setMazeId] = useState('division');

  const [comparison, setComparison] = useState(null);
  const [cursor, setCursor] = useState(null); // keyboard cursor [row, col]
  const [kbFocus, setKbFocus] = useState(false); // show the cursor only for keyboard users

  const playback = usePlayback(speed, size);
  const drag = useRef(null); // what the current pointer drag is doing

  // Save the board shortly after the last change.
  useEffect(() => {
    const id = setTimeout(() => saveState({ size, grid, endpoints, algoId, tool, speed }), 250);
    return () => clearTimeout(id);
  }, [size, grid, endpoints, algoId, tool, speed]);

  /* ---------- running algorithms ---------- */

  // Any change to the board makes the old run and comparison meaningless.
  const invalidateBoard = () => {
    playback.clear();
    setComparison(null);
  };

  const runAlgorithm = (id = algoId) => {
    const t0 = performance.now();
    const res = ALGORITHMS[id].run(grid, endpoints.start, endpoints.end);
    const ms = performance.now() - t0;
    playback.start({
      ...res,
      algoId: id,
      ms,
      cost: res.found ? pathCost(grid, res.path) : null,
    });
  };

  const handleCompare = () => {
    playback.clear();
    setComparison(compareAlgorithms(grid, endpoints.start, endpoints.end));
  };

  const handleReplay = (id) => {
    setAlgoId(id);
    runAlgorithm(id);
  };

  const handleToggle = () => {
    if (playback.playing) playback.pause();
    else if (playback.result) playback.play();
    else runAlgorithm();
  };

  /* ---------- board-level actions ---------- */

  const handleSize = (n) => {
    setSize(n);
    setGrid(createDemoGrid(n));
    setEndpoints(defaultEndpoints(n));
    invalidateBoard();
  };

  const handleClearBoard = () => {
    setGrid(createEmptyGrid(size));
    invalidateBoard();
  };

  const handleReset = () => {
    setGrid(createDemoGrid(size));
    setEndpoints(defaultEndpoints(size));
    invalidateBoard();
  };

  const handleMaze = () => {
    const maze = generateMaze(mazeId, size);
    // Keep the markers on open cells.
    const start = nearestOpen(maze, endpoints.start) ?? endpoints.start;
    const end = nearestOpen(maze, endpoints.end, start) ?? endpoints.end;
    setGrid(maze);
    setEndpoints({ start, end });
    invalidateBoard();
  };

  /* ---------- editing cells ---------- */

  const isMarker = (r, c) =>
    (r === endpoints.start[0] && c === endpoints.start[1]) ||
    (r === endpoints.end[0] && c === endpoints.end[1]);

  const paintCell = (r, c, mode, target) => {
    if (isMarker(r, c)) return;
    setGrid((g) => {
      const next = mode === 'erase' ? (g[r][c] === target ? CELL.EMPTY : g[r][c]) : target;
      if (next === g[r][c]) return g;
      return g.map((row, i) => (i === r ? row.map((v, j) => (j === c ? next : v)) : row));
    });
    invalidateBoard();
  };

  const moveMarker = (which, r, c) => {
    setEndpoints((prev) => {
      const other = which === 'start' ? prev.end : prev.start;
      const current = prev[which];
      if ((r === other[0] && c === other[1]) || (r === current[0] && c === current[1])) return prev;
      return { ...prev, [which]: [r, c] };
    });
    // A marker sitting on a wall or weight clears it.
    setGrid((g) =>
      g[r][c] === CELL.EMPTY
        ? g
        : g.map((row, i) => (i === r ? row.map((v, j) => (j === c ? CELL.EMPTY : v)) : row)),
    );
    invalidateBoard();
  };

  /* ---------- pointer input ---------- */

  const handleDown = (r, c) => {
    if (playback.playing) return;
    setKbFocus(false);
    if (r === endpoints.start[0] && c === endpoints.start[1]) {
      drag.current = { mode: 'start' };
      return;
    }
    if (r === endpoints.end[0] && c === endpoints.end[1]) {
      drag.current = { mode: 'end' };
      return;
    }
    // Pressing on a cell that already has the active tool starts an erase stroke.
    const mode = grid[r][c] === tool ? 'erase' : 'paint';
    drag.current = { mode, target: tool };
    paintCell(r, c, mode, tool);
  };

  const handleEnter = (r, c) => {
    const d = drag.current;
    if (!d || playback.playing) return;
    if (d.mode === 'start' || d.mode === 'end') moveMarker(d.mode, r, c);
    else paintCell(r, c, d.mode, d.target);
  };

  const handleUp = () => {
    drag.current = null;
  };

  /* ---------- keyboard input ---------- */

  const handleFocus = (e) => {
    if (e.currentTarget.matches(':focus-visible')) {
      setKbFocus(true);
      setCursor((c) => c ?? endpoints.start);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    setKbFocus(true);
    const here = cursor ?? endpoints.start;
    const move = KEY_MOVES[e.key];

    if (move) {
      e.preventDefault();
      const next = [clamp(here[0] + move[0], 0, size - 1), clamp(here[1] + move[1], 0, size - 1)];
      setCursor(next);
      if (e.shiftKey && !playback.playing) paintCell(next[0], next[1], 'paint', tool);
      return;
    }
    if (playback.playing) return;

    const [r, c] = here;
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        paintCell(r, c, grid[r][c] === tool ? 'erase' : 'paint', tool);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        paintCell(r, c, 'erase', grid[r][c]);
        break;
      case 's':
      case 'S':
        moveMarker('start', r, c);
        break;
      case 'e':
      case 'E':
        moveMarker('end', r, c);
        break;
      default:
    }
  };

  // Spoken description of the keyboard cursor, for screen readers.
  const describeCell = ([r, c]) => {
    const i = r * size + c;
    let what = 'open';
    if (r === endpoints.start[0] && c === endpoints.start[1]) what = 'start marker';
    else if (r === endpoints.end[0] && c === endpoints.end[1]) what = 'end marker';
    else if (grid[r][c] === CELL.WALL) what = 'wall';
    else {
      const parts = [];
      if (grid[r][c] === CELL.WEIGHT) parts.push(`weight, cost ${WEIGHT_COST}`);
      if (playback.marks.pathIdx[i] !== -1 && playback.marks.pathIdx[i] < playback.pathShown) parts.push('on the path');
      else if (playback.marks.visitIdx[i] !== -1 && playback.marks.visitIdx[i] < playback.visitedShown) parts.push('explored');
      if (parts.length) what = parts.join(', ');
    }
    return `Row ${r + 1}, column ${c + 1}: ${what}`;
  };

  return (
    <div className="app">
      <header className="masthead">
        <h1 className="wordmark">
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              d="M3 27h8v-8h8v-8h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="square"
            />
            <circle cx="27" cy="11" r="3.6" fill="var(--ember)" />
          </svg>
          PathForge
        </h1>
        <p className="tagline">
          Draw a maze, then watch four search algorithms find a way through it.
        </p>
      </header>

      <main className="workspace">
        <section className="stage" aria-label="Board">
          <Board
            size={size}
            grid={grid}
            start={endpoints.start}
            end={endpoints.end}
            visitIdx={playback.marks.visitIdx}
            pathIdx={playback.marks.pathIdx}
            visitedShown={playback.visitedShown}
            pathShown={playback.pathShown}
            locked={playback.playing}
            cursor={kbFocus ? cursor : null}
            onDown={handleDown}
            onEnter={handleEnter}
            onUp={handleUp}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => setKbFocus(false)}
          />
          <p className="sr-only" aria-live="polite">
            {kbFocus && cursor ? describeCell(cursor) : ''}
          </p>

          <Transport
            hasResult={playback.result !== null}
            playing={playback.playing}
            step={playback.step}
            total={playback.total}
            onToggle={handleToggle}
            onRestart={() => playback.seek(0)}
            onBack={() => playback.stepBy(-1)}
            onForward={() => playback.stepBy(1)}
            onEnd={() => playback.seek(playback.total)}
            onSeek={playback.seek}
          />

          <ul className="legend" aria-label="Legend">
            {LEGEND.map(([kind, label]) => (
              <li key={kind}>
                <span className={`swatch swatch-${kind}`} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          <RunReport
            result={playback.result}
            playing={playback.playing}
            step={playback.step}
            total={playback.total}
            explored={playback.explored}
            visitedShown={playback.visitedShown}
          />

          {comparison && <ComparisonTable rows={comparison} onReplay={handleReplay} />}
        </section>

        <Controls
          algoId={algoId}
          onAlgo={setAlgoId}
          tool={tool}
          onTool={setTool}
          size={size}
          onSize={handleSize}
          speed={speed}
          onSpeed={setSpeed}
          mazeId={mazeId}
          onMazeId={setMazeId}
          onRun={() => runAlgorithm()}
          onCompare={handleCompare}
          onMaze={handleMaze}
          onClearPath={playback.clear}
          onClearBoard={handleClearBoard}
          onReset={handleReset}
        />
      </main>

      <footer className="footer">
        Built with React by{' '}
        <a href="https://github.com/mayank-d-tech" target="_blank" rel="noreferrer">
          Mayank Dubey
        </a>
        . Your board is saved in this browser.
      </footer>
    </div>
  );
}
