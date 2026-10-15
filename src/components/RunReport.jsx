import { ALGORITHMS } from '../algorithms/index.js';

const formatTime = (ms) => (ms < 0.01 ? '< 0.01 ms' : `${ms.toFixed(2)} ms`);

export default function RunReport({ result, playing, step, total, explored, visitedShown }) {
  let headline = 'Ready. Draw some walls, then run an algorithm.';
  if (result && playing) {
    headline = step < explored
      ? `Exploring: ${visitedShown} of ${explored} cells`
      : 'Tracing the path…';
  } else if (result && step < total) {
    headline = `Paused at step ${step} of ${total}.`;
  } else if (result && result.found) {
    headline = `${ALGORITHMS[result.algoId].fullName} found a path.`;
  } else if (result) {
    headline = 'No path. The end is walled off. Erase a wall and run again.';
  }

  return (
    // Announce only when the run settles, not on every animation frame.
    <section className="report" aria-live={playing ? 'off' : 'polite'} aria-label="Run report">
      <p className="report-headline">{headline}</p>
      {result && (
        <dl className="report-grid">
          <div>
            <dt>Cells explored</dt>
            <dd>{result.visited.length}</dd>
          </div>
          <div>
            <dt>Path length</dt>
            <dd>{result.found ? `${result.path.length} cells` : 'none'}</dd>
          </div>
          <div>
            <dt>Path cost</dt>
            <dd>{result.found ? result.cost : 'none'}</dd>
          </div>
          <div>
            <dt>Compute time</dt>
            <dd>{formatTime(result.ms)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
