import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '50 min', seconds: 50 * 60 },
];

function pad(n) { return String(n).padStart(2, '0'); }

export default function FocusTimer() {
  const [preset,    setPreset]    = useState(0);   // index into PRESETS
  const [total,     setTotal]     = useState(PRESETS[0].seconds);
  const [remaining, setRemaining] = useState(PRESETS[0].seconds);
  const [running,   setRunning]   = useState(false);
  const [done,      setDone]      = useState(false);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setRemaining(total);
    setDone(false);
  }, [stop, total]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Focus session complete!', { body: 'Time to take a break.' });
            }
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const selectPreset = (idx) => {
    stop();
    setPreset(idx);
    setTotal(PRESETS[idx].seconds);
    setRemaining(PRESETS[idx].seconds);
    setDone(false);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = (total - remaining) / total; // 0 → 1

  // SVG ring
  const R  = 48;
  const C  = 2 * Math.PI * R;
  const dashOffset = C * (1 - progress);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      {/* Preset selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {PRESETS.map(({ label }, idx) => {
          const active = preset === idx;
          return (
            <button
              key={label}
              onClick={() => selectPreset(idx)}
              style={{
                padding:      '5px 14px',
                borderRadius: 'var(--radius-full)',
                border:       `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                background:   active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color:        active ? 'var(--primary-light)' : 'var(--text-muted)',
                fontSize:     '0.75rem',
                fontWeight:   active ? 700 : 400,
                cursor:       'pointer',
                transition:   'all var(--transition-sm)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Ring + time */}
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="65" cy="65" r={R} fill="none" stroke="var(--border)" strokeWidth="5" />
          {/* Progress ring */}
          <circle
            cx="65" cy="65" r={R}
            fill="none"
            stroke={done ? 'var(--col-done)' : 'var(--primary)'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div
          style={{
            position:      'absolute',
            inset:         0,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            justifyContent:'center',
          }}
        >
          <span
            style={{
              fontSize:      '1.6rem',
              fontWeight:    800,
              letterSpacing: '-0.03em',
              color:         done ? 'var(--col-done)' : 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pad(mins)}:{pad(secs)}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {done ? 'Complete' : running ? 'Focusing' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!done && (
          <button
            onClick={() => { requestNotificationPermission(); setRunning((r) => !r); }}
            className="btn-gradient"
            style={{ padding: '9px 22px', minWidth: 110 }}
          >
            {running ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                {remaining < total ? 'Resume' : 'Start Focus'}
              </>
            )}
          </button>
        )}
        {(running || remaining < total || done) && (
          <button
            onClick={reset}
            style={{
              padding:      '9px 18px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border)',
              color:        'var(--text-secondary)',
              background:   'transparent',
              fontSize:     '0.85rem',
              cursor:       'pointer',
              transition:   'all var(--transition-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Reset
          </button>
        )}
        {done && (
          <button
            onClick={reset}
            className="btn-gradient"
            style={{ padding: '9px 22px' }}
          >
            New Session
          </button>
        )}
      </div>

      {done && (
        <p style={{ fontSize: '0.8rem', color: 'var(--col-done)', fontWeight: 600 }}>
          Session complete. Well done.
        </p>
      )}
    </div>
  );
}
