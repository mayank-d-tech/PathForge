import { memo, useRef } from 'react';
import { CELL } from '../algorithms/index.js';

// One grid cell. It only re-renders when its own class string changes,
// so animating a search across a 30 × 30 board stays cheap.
const Cell = memo(function Cell({ r, c, cls }) {
  return <div className={cls} data-r={r} data-c={c} />;
});

/**
 * The interactive grid.
 *  - Pointer events (mouse, touch, pen) become down / enter / up callbacks.
 *  - The board is also keyboard-focusable; key handling lives in the parent.
 */
export default function Board({
  size,
  grid,
  start,
  end,
  visitIdx,
  pathIdx,
  visitedShown,
  pathShown,
  locked,
  cursor,
  onDown,
  onEnter,
  onUp,
  onKeyDown,
  onFocus,
  onBlur,
}) {
  const lastCell = useRef('');

  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el && el.closest('[data-r]');
    return cell ? [Number(cell.dataset.r), Number(cell.dataset.c)] : null;
  };

  const handlePointerDown = (e) => {
    if (locked || e.button > 0) return;
    const cell = cellAt(e);
    if (!cell) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastCell.current = cell.join(',');
    onDown(cell[0], cell[1]);
  };

  const handlePointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const cell = cellAt(e);
    if (!cell) return;
    const key = cell.join(',');
    if (key === lastCell.current) return;
    lastCell.current = key;
    onEnter(cell[0], cell[1]);
  };

  const handlePointerEnd = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    lastCell.current = '';
    onUp();
  };

  const cells = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const i = r * size + c;
      let cls = 'cell';
      if (r === start[0] && c === start[1]) {
        cls += ' start';
      } else if (r === end[0] && c === end[1]) {
        cls += ' end';
      } else if (grid[r][c] === CELL.WALL) {
        cls += ' wall';
      } else {
        if (grid[r][c] === CELL.WEIGHT) cls += ' weight';
        if (visitIdx[i] !== -1 && visitIdx[i] < visitedShown) cls += ' visited';
        if (pathIdx[i] !== -1 && pathIdx[i] < pathShown) cls += ' path';
      }
      if (cursor && cursor[0] === r && cursor[1] === c) cls += ' cursor';
      cells.push(<Cell key={i} r={r} c={c} cls={cls} />);
    }
  }

  return (
    <div
      className={`board${locked ? ' is-locked' : ''}`}
      style={{ '--n': size }}
      tabIndex={0}
      role="application"
      aria-label={`Pathfinding board, ${size} by ${size}. Use the arrow keys to move, Space to draw, S and E to place the start and end.`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onDragStart={(e) => e.preventDefault()}
    >
      {cells}
    </div>
  );
}
