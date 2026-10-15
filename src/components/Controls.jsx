import { ALGORITHMS, ALGORITHM_LIST, CELL, MAX_SIZE, MAZE_LIST, MIN_SIZE, WEIGHT_COST } from '../algorithms/index.js';

const SPEED_LABELS = ['Slow', 'Relaxed', 'Medium', 'Quick', 'Fast'];

export default function Controls({
  algoId,
  onAlgo,
  tool,
  onTool,
  size,
  onSize,
  speed,
  onSpeed,
  mazeId,
  onMazeId,
  onRun,
  onCompare,
  onMaze,
  onClearPath,
  onClearBoard,
  onReset,
}) {
  const algo = ALGORITHMS[algoId];

  return (
    <aside className="controls" aria-label="Controls">
      <fieldset className="group">
        <legend>Algorithm</legend>
        <div className="segmented segmented-2x2">
          {ALGORITHM_LIST.map((a) => (
            <label key={a.id} className="seg">
              <input
                type="radio"
                name="algorithm"
                value={a.id}
                checked={algoId === a.id}
                onChange={() => onAlgo(a.id)}
              />
              <span>{a.name}</span>
            </label>
          ))}
        </div>

        <div className="algo-note">
          <h2>{algo.fullName}</h2>
          <p>{algo.summary}</p>
          <dl>
            <dt>Data structure</dt>
            <dd>{algo.structure}</dd>
            <dt>Time</dt>
            <dd>{algo.complexity}</dd>
            <dt>Finds</dt>
            <dd>{algo.shortest}</dd>
          </dl>
        </div>
      </fieldset>

      <div className="group stack">
        <button type="button" className="btn btn-primary" onClick={onRun}>
          Run {algo.name}
        </button>
        <button type="button" className="btn" onClick={onCompare}>
          Compare all four
        </button>
      </div>

      <fieldset className="group">
        <legend>Draw</legend>
        <div className="segmented">
          <label className="seg">
            <input
              type="radio"
              name="tool"
              value="wall"
              checked={tool === CELL.WALL}
              onChange={() => onTool(CELL.WALL)}
            />
            <span>Wall</span>
          </label>
          <label className="seg">
            <input
              type="radio"
              name="tool"
              value="weight"
              checked={tool === CELL.WEIGHT}
              onChange={() => onTool(CELL.WEIGHT)}
            />
            <span>Weight</span>
          </label>
        </div>
        <p className="hint">
          Click or drag on the board. Draw over a cell again to erase it. Drag the green and red markers to move them.{' '}
          {algo.usesWeights
            ? `A weight costs ${WEIGHT_COST} to cross instead of 1.`
            : `${algo.name} ignores weights. Try Dijkstra's or A*.`}
        </p>
        <details className="keys">
          <summary>Keyboard controls</summary>
          <dl>
            <dt>Arrow keys</dt>
            <dd>Move around the board</dd>
            <dt>Space or Enter</dt>
            <dd>Draw or erase with the selected tool</dd>
            <dt>Shift + arrows</dt>
            <dd>Draw while moving</dd>
            <dt>S or E</dt>
            <dd>Put the start or end here</dd>
            <dt>Delete</dt>
            <dd>Erase this cell</dd>
          </dl>
        </details>
      </fieldset>

      <fieldset className="group">
        <legend>Maze</legend>
        <div className="maze-row">
          <select
            aria-label="Maze style"
            value={mazeId}
            onChange={(e) => onMazeId(e.target.value)}
          >
            {MAZE_LIST.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={onMaze}>
            Generate
          </button>
        </div>
      </fieldset>

      <div className="group">
        <div className="slider">
          <label htmlFor="size">
            Grid size <output htmlFor="size">{size} × {size}</output>
          </label>
          <input
            id="size"
            type="range"
            min={MIN_SIZE}
            max={MAX_SIZE}
            step="1"
            value={size}
            onChange={(e) => onSize(Number(e.target.value))}
          />
          <span className="slider-sub">{size * size} nodes</span>
        </div>
        <div className="slider">
          <label htmlFor="speed">Animation speed</label>
          <input
            id="speed"
            type="range"
            min="1"
            max="5"
            step="1"
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
          />
          <span className="slider-sub">{SPEED_LABELS[speed - 1]}</span>
        </div>
      </div>

      <div className="group btn-row">
        <button type="button" className="btn" onClick={onClearPath}>
          Clear path
        </button>
        <button type="button" className="btn" onClick={onClearBoard}>
          Clear board
        </button>
        <button type="button" className="btn" onClick={onReset}>
          Reset board
        </button>
      </div>
    </aside>
  );
}
