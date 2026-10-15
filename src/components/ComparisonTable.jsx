import { ALGORITHMS } from '../algorithms/index.js';
import { highlights } from '../lib/compare.js';

const formatTime = (ms) => (ms < 0.01 ? '< 0.01 ms' : `${ms.toFixed(2)} ms`);

/** Side-by-side numbers for all four algorithms on the current board. */
export default function ComparisonTable({ rows, onReplay }) {
  const marks = highlights(rows);
  const anyFound = rows.some((r) => r.found);

  return (
    <section className="compare" aria-label="Algorithm comparison">
      <h2>Comparison on this board</h2>
      {!anyFound && (
        <p className="compare-note">No algorithm can reach the end, so there is no path to compare. Cells explored are still shown.</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Algorithm</th>
              <th scope="col">Cells explored</th>
              <th scope="col">Path</th>
              <th scope="col">Cost</th>
              <th scope="col">Time</th>
              <th scope="col">
                <span className="sr-only">Replay</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const algo = ALGORITHMS[r.algoId];
              return (
                <tr key={r.algoId}>
                  <th scope="row">
                    {algo.name}
                    {marks[r.algoId].length > 0 && <span className="tags">{marks[r.algoId].join(', ')}</span>}
                  </th>
                  <td>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${(r.explored / r.openCells) * 100}%` }} />
                    </span>
                    {r.explored}
                  </td>
                  <td>{r.found ? `${r.pathLength} cells` : 'none'}</td>
                  <td>{r.found ? r.cost : 'none'}</td>
                  <td>{formatTime(r.ms)}</td>
                  <td>
                    <button type="button" className="btn btn-small" onClick={() => onReplay(r.algoId)}>
                      Replay<span className="sr-only"> {algo.name}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="compare-note">Times are the average of 25 runs on this board. Bars show cells explored as a share of all open cells.</p>
    </section>
  );
}
