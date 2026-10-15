const Icon = ({ children }) => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
    {children}
  </svg>
);

const icons = {
  restart: (
    <Icon>
      <rect x="3" y="3.5" width="2.5" height="13" />
      <path d="M17 3.5v13L7.5 10z" />
    </Icon>
  ),
  back: (
    <Icon>
      <path d="M14 3.5v13L4.5 10z" />
    </Icon>
  ),
  play: (
    <Icon>
      <path d="M5 3.5v13L16.5 10z" />
    </Icon>
  ),
  pause: (
    <Icon>
      <rect x="4.5" y="3.5" width="4" height="13" />
      <rect x="11.5" y="3.5" width="4" height="13" />
    </Icon>
  ),
  forward: (
    <Icon>
      <path d="M6 3.5v13L15.5 10z" />
    </Icon>
  ),
  end: (
    <Icon>
      <path d="M3 3.5v13L12.5 10z" />
      <rect x="14.5" y="3.5" width="2.5" height="13" />
    </Icon>
  ),
};

/** Play / pause, single-step and scrub controls for the replay. */
export default function Transport({
  hasResult,
  playing,
  step,
  total,
  onToggle,
  onRestart,
  onBack,
  onForward,
  onEnd,
  onSeek,
}) {
  return (
    <div className="transport" role="group" aria-label="Playback">
      <div className="transport-buttons">
        <button type="button" className="icon-btn" aria-label="Restart" title="Restart" disabled={!hasResult} onClick={onRestart}>
          {icons.restart}
        </button>
        <button type="button" className="icon-btn" aria-label="Step back" title="Step back" disabled={!hasResult} onClick={onBack}>
          {icons.back}
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-main"
          aria-label={playing ? 'Pause' : 'Play'}
          title={playing ? 'Pause' : 'Play'}
          onClick={onToggle}
        >
          {playing ? icons.pause : icons.play}
        </button>
        <button type="button" className="icon-btn" aria-label="Step forward" title="Step forward" disabled={!hasResult} onClick={onForward}>
          {icons.forward}
        </button>
        <button type="button" className="icon-btn" aria-label="Jump to end" title="Jump to end" disabled={!hasResult} onClick={onEnd}>
          {icons.end}
        </button>
      </div>

      <input
        className="timeline"
        type="range"
        min="0"
        max={Math.max(total, 1)}
        step="1"
        value={hasResult ? step : 0}
        disabled={!hasResult}
        aria-label="Timeline"
        aria-valuetext={hasResult ? `Step ${step} of ${total}` : 'No run yet'}
        onChange={(e) => onSeek(Number(e.target.value))}
      />

      <p className="transport-label">{hasResult ? `Step ${step} of ${total}` : 'Run an algorithm to use the timeline'}</p>
    </div>
  );
}
