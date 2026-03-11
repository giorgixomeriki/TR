import { useRef, useEffect, useState } from 'react';

/* ── Unique filter IDs per instance (prevents SVG filter conflicts) ── */
let _counter = 0;

/* ── Time formatter ── */
function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/*
 * CircularTimerDial
 *
 * Props:
 *   timeLeft      – number  – seconds remaining
 *   maxTime       – number  – total seconds for current phase
 *   running       – boolean – is the timer counting down
 *   ringColor     – string  – CSS color for the progress arc & knob
 *   onTimeChange  – fn(s)   – called with new integer timeLeft while dragging
 *   size          – number  – SVG canvas size in px (240 or 220)
 *   label         – string  – status label shown below the clock
 *   arenaStyle    – boolean – show outer dashed tick ring (arena mode)
 */
export default function CircularTimerDial({
  timeLeft,
  maxTime,
  running,
  ringColor = 'var(--primary)',
  onTimeChange,
  size = 240,
  label = '',
  arenaStyle = false,
}) {
  /* Stable unique filter id for this instance */
  const [uid] = useState(() => `ctd-${++_counter}`);

  /* Cursor state (needs re-render so useState, not ref) */
  const [dragging, setDragging] = useState(false);

  const svgRef     = useRef(null);
  const isDragging = useRef(false);
  const prevAngle  = useRef(0);
  const liveTime   = useRef(timeLeft); // accumulates fractional seconds during drag

  /* Sync liveTime from prop whenever we're NOT mid-drag */
  useEffect(() => {
    if (!isDragging.current) liveTime.current = timeLeft;
  }, [timeLeft]);

  /* ── Geometry ── */
  const cx    = size / 2;
  const cy    = size / 2;
  const R     = size / 2 - 30;          // 90 @ 240px, 80 @ 220px
  const CIRC  = 2 * Math.PI * R;
  const trackW = size >= 240 ? 8 : 7;
  const arcW   = size >= 240 ? 6 : 5;

  const progress   = maxTime > 0 ? timeLeft / maxTime : 0;
  const dashOffset = CIRC * (1 - progress);

  /* Knob at the arc's leading edge (clockwise from top) */
  const kAngleRad = (progress * 360 - 90) * (Math.PI / 180);
  const kx = cx + R * Math.cos(kAngleRad);
  const ky = cy + R * Math.sin(kAngleRad);

  /* ── Angle util (0° = top, clockwise positive) ── */
  function getAngle(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width)  * size;
    const y = ((clientY - rect.top)  / rect.height) * size;
    let a = Math.atan2(x - cx, -(y - cy)) * (180 / Math.PI);
    return a < 0 ? a + 360 : a;
  }

  /* ── Pointer handlers ── */
  function onPointerDown(e) {
    if (running) return;
    isDragging.current = true;
    setDragging(true);
    prevAngle.current = getAngle(e.clientX, e.clientY);
    liveTime.current  = timeLeft;
    svgRef.current.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging.current) return;
    const angle = getAngle(e.clientX, e.clientY);
    let delta   = angle - prevAngle.current;
    /* Normalize delta to ±180° — handles 0°/360° boundary crossing */
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    prevAngle.current = angle;

    /* Clockwise (+delta) → more time; counter-clockwise → less */
    const ds = (delta / 360) * maxTime;
    liveTime.current = Math.min(maxTime, Math.max(1, liveTime.current + ds));
    onTimeChange(Math.round(liveTime.current));
  }

  function onPointerUp(e) {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDragging(false);
    svgRef.current.releasePointerCapture(e.pointerId);
  }

  /* ── Render ── */
  return (
    <div
      style={{
        position:       'relative',
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          cursor:      running ? 'default' : dragging ? 'grabbing' : 'grab',
          userSelect:  'none',
          touchAction: 'none',
          overflow:    'visible',
        }}
      >
        <defs>
          <filter id={uid} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Arena outer dashed ring */}
        {arenaStyle && (
          <circle
            cx={cx} cy={cy} r={R + 15}
            fill="none"
            stroke={running ? ringColor : 'rgba(255,255,255,0.03)'}
            strokeWidth="1"
            strokeDasharray="4 8"
            style={{ transition: 'stroke 0.5s ease', opacity: 0.5 }}
          />
        )}

        {/* Track */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={trackW}
        />

        {/* Glow (blurred duplicate, only while running) */}
        {running && (
          <circle
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            opacity="0.22"
            filter={`url(#${uid})`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
        )}

        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={ringColor}
          strokeWidth={arcW}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: running
              ? 'stroke-dashoffset 1s linear, stroke 0.5s ease'
              : 'stroke 0.5s ease',
          }}
        />

        {/* Knob — outer shadow */}
        <circle cx={kx} cy={ky} r={11} fill="rgba(0,0,0,0.5)" />
        {/* Knob — dark body */}
        <circle
          cx={kx} cy={ky} r={9}
          fill="#0f0f1a"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        {/* Knob — colored center dot */}
        <circle
          cx={kx} cy={ky} r={3.5}
          fill={ringColor}
          style={{
            transition: 'fill 0.5s ease',
            filter: `drop-shadow(0 0 5px ${ringColor})`,
          }}
        />
      </svg>

      {/* Center display (no pointer events so it doesn't block drag) */}
      <div
        style={{
          position:       'absolute',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            4,
          pointerEvents:  'none',
        }}
      >
        <span
          style={{
            fontFamily:         '"SF Mono","Fira Code","Cascadia Code",ui-monospace,monospace',
            fontSize:           size >= 240 ? '2.8rem' : '2.6rem',
            fontWeight:         700,
            color:              running ? '#fff' : 'rgba(255,255,255,0.65)',
            letterSpacing:      '-0.04em',
            lineHeight:         1,
            transition:         'color 0.3s ease',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtTime(timeLeft)}
        </span>

        <span
          style={{
            fontSize:      '0.62rem',
            fontWeight:    700,
            color:         ringColor,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            opacity:       0.85,
          }}
        >
          {label}
        </span>

        {/* Drag hint — only when idle and time is non-zero */}
        {!running && timeLeft > 0 && (
          <span
            style={{
              fontSize:      '0.52rem',
              color:         'rgba(255,255,255,0.18)',
              marginTop:     2,
              letterSpacing: '0.06em',
            }}
          >
            drag to adjust
          </span>
        )}
      </div>
    </div>
  );
}
