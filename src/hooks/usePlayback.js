import { useEffect, useMemo, useState } from 'react';

const SPEED_DELAY_MS = { 1: 90, 2: 45, 3: 22, 4: 10, 5: 4 }; // ms per frame
const PATH_SLOWDOWN = 4; // the final path is drawn more slowly than the search

/**
 * Replays a finished search one frame at a time.
 *
 * An algorithm runs instantly and hands back `visited` (cells in the order it
 * explored them) and `path`. Playback is just a counter, `step`: frames
 * 0..explored-1 reveal explored cells, the rest reveal the path. Because the
 * whole run is a number, pausing, stepping and scrubbing are trivial.
 */
export default function usePlayback(speed, size) {
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const explored = result ? result.visited.length : 0;
  const total = result ? explored + result.path.length : 0;

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= total) {
      setPlaying(false);
      return undefined;
    }
    const base = SPEED_DELAY_MS[speed];
    const id = setTimeout(() => setStep((s) => s + 1), step >= explored ? base * PATH_SLOWDOWN : base);
    return () => clearTimeout(id);
  }, [playing, step, total, explored, speed]);

  // For every cell: the frame at which it is explored / joins the path (-1 = never).
  const marks = useMemo(() => {
    const visitIdx = new Int32Array(size * size).fill(-1);
    const pathIdx = new Int32Array(size * size).fill(-1);
    if (result) {
      result.visited.forEach(([r, c], i) => {
        visitIdx[r * size + c] = i;
      });
      result.path.forEach(([r, c], i) => {
        pathIdx[r * size + c] = i;
      });
    }
    return { visitIdx, pathIdx };
  }, [result, size]);

  const seek = (n) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(total, n)));
  };

  return {
    result,
    step,
    playing,
    total,
    explored,
    marks,
    visitedShown: Math.min(step, explored),
    pathShown: Math.max(0, step - explored),
    atEnd: result !== null && step >= total,

    /** Begin playing a freshly computed result from the first frame. */
    start(res) {
      setResult(res);
      setStep(0);
      setPlaying(true);
    },
    /** Play, or resume; from the final frame it replays from the beginning. */
    play() {
      if (!result) return;
      if (step >= total) setStep(0);
      setPlaying(true);
    },
    pause() {
      setPlaying(false);
    },
    seek,
    stepBy: (delta) => seek(step + delta),
    /** Throw the result away and show a plain board. */
    clear() {
      setPlaying(false);
      setResult(null);
      setStep(0);
    },
  };
}
