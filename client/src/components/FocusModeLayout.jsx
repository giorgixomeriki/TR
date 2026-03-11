import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask }       from '../services/taskService';
import { startFocusSession, getFocusStats } from '../services/focusService';
import SubtaskList        from './SubtaskList';
import FocusSessionModal  from './FocusSessionModal';
import CircularTimerDial  from './CircularTimerDial';
import LoadingSpinner     from './LoadingSpinner';

/* ── Constants ────────────────────────────────────────── */
const WORK_SECS  = 25 * 60;
const BREAK_SECS =  5 * 60;

/* ── Helpers ──────────────────────────────────────────── */
function fmtFocusTime(mins) {
  if (mins === 0) return '0m';
  if (mins < 60)  return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
}

/* ── Ambient orb ──────────────────────────────────────── */
function Orb({ top, right, bottom, left, color, size = 500 }) {
  return (
    <div
      style={{
        position:     'fixed',
        top, right, bottom, left,
        width:        size,
        height:       size,
        borderRadius: '50%',
        background:   `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        pointerEvents:'none',
        zIndex:       0,
      }}
    />
  );
}

/* ── Main component ───────────────────────────────────── */
export default function FocusModeLayout() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Task */
  const [task,     setTask]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notes,    setNotes]    = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimer = useRef(null);

  /* Stats */
  const [stats, setStats] = useState({ todayMinutes: 0, todaySessions: 0, streak: 0 });

  /* Timer */
  const [phase,   setPhase]   = useState('work'); // 'work' | 'break'
  const totalSecs = phase === 'work' ? WORK_SECS : BREAK_SECS;
  const [timeLeft, setTimeLeft] = useState(WORK_SECS);
  const [running,  setRunning]  = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef(null);

  /* Session */
  const [sessionId,     setSessionId]     = useState(null);
  const sessionIdRef = useRef(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  /* Modal */
  const [showModal,         setShowModal]         = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const [completedDuration,  setCompletedDuration]  = useState(WORK_SECS);

  /* ── Cleanup notes debounce on unmount ── */
  useEffect(() => {
    return () => clearTimeout(notesTimer.current);
  }, []);

  /* ── Load task ── */
  useEffect(() => {
    getTask(id)
      .then((data) => { setTask(data); setNotes(data.notes || ''); })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /* ── Load stats ── */
  const fetchStats = useCallback(() => {
    getFocusStats().then(setStats).catch(() => {});
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── ESC to exit (only when not running) ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !running && !showModal) navigate('/dashboard'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, running, showModal]);

  /* ── Request notification permission ── */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* ── Timer countdown ── */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setTimerDone(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running]);

  /* ── Handle timer completion ── */
  useEffect(() => {
    if (!timerDone) return;
    setTimerDone(false);

    if (phase === 'work') {
      // Notify
      if (Notification.permission === 'granted') {
        new Notification('Focus Session Complete! 🎯', {
          body: 'Great work. Save your session to earn +10 coins.',
        });
      }
      // Open session modal — modal will call completeFocusSession
      setCompletedSessionId(sessionIdRef.current);
      setCompletedDuration(WORK_SECS);
      setSessionId(null); // clear so a fresh session starts next time
      setShowModal(true);
    } else {
      // Break finished — reset to work phase
      setPhase('work');
      setTimeLeft(WORK_SECS);
    }
  }, [timerDone, phase]);

  /* ── Start / Pause / Reset ── */
  const handleStart = async () => {
    if (!sessionId && phase === 'work') {
      try {
        const sess = await startFocusSession(id);
        setSessionId(sess.id);
      } catch { /* allow timer to run anyway */ }
    }
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setSessionId(null);
    setTimeLeft(phase === 'work' ? WORK_SECS : BREAK_SECS);
  };

  const handlePhaseSwitch = (newPhase) => {
    if (running) return;
    setPhase(newPhase);
    setTimeLeft(newPhase === 'work' ? WORK_SECS : BREAK_SECS);
    setSessionId(null);
  };

  /* ── Notes auto-save ── */
  const handleNotesChange = (val) => {
    setNotes(val);
    setNotesSaved(false);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      try {
        await updateTask(id, { notes: val });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch { /* silent */ }
    }, 600);
  };

  /* ── Modal callbacks ── */
  const handleModalSave = () => {
    setShowModal(false);
    setCompletedSessionId(null);
    fetchStats();
  };

  const handleModalBreak = () => {
    setShowModal(false);
    setCompletedSessionId(null);
    fetchStats();
    handlePhaseSwitch('break');
  };

  /* ── Derived ── */
  const started = timeLeft < totalSecs;

  const ringColor = (() => {
    if (phase === 'break')              return 'var(--col-done)';
    if (timeLeft === 0)                 return 'var(--col-done)';
    if (phase === 'work' && timeLeft < 5 * 60) return 'var(--col-progress)';
    return 'var(--primary)';
  })();

  const timerLabel = (() => {
    if (!started)  return phase === 'work' ? 'Ready' : 'Break Ready';
    if (running)   return phase === 'work' ? 'Focusing' : 'Break';
    if (timeLeft === 0) return 'Complete';
    return 'Paused';
  })();

  const breakColor = 'rgba(16,185,129,0.08)';
  const workColor  = 'rgba(59,130,246,0.06)';

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#05050a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={44} />
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div
      style={{
        minHeight:   '100vh',
        background:  '#05050a',
        display:     'flex',
        flexDirection:'column',
        animation:   'focusModeIn 0.4s var(--ease)',
        overflow:    'hidden',
      }}
    >
      {/* Ambient orbs */}
      <Orb top={-120} right={-80}  color={phase === 'break' ? breakColor : workColor} size={600} />
      <Orb bottom={-180} left={-60} color="rgba(124,58,237,0.04)"                     size={500} />

      {/* ── Top bar ── */}
      <header
        style={{
          position:       'sticky',
          top:            0,
          zIndex:         10,
          height:         52,
          display:        'flex',
          alignItems:     'center',
          gap:            16,
          padding:        '0 24px',
          background:     'rgba(5,5,10,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Exit */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '5px 12px',
            borderRadius: 'var(--radius-md)',
            border:       '1px solid rgba(255,255,255,0.08)',
            color:        'rgba(255,255,255,0.38)',
            background:   'transparent',
            fontSize:     '0.78rem',
            cursor:       'pointer',
            flexShrink:   0,
            transition:   'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Exit
        </button>

        {/* Live indicator + mode label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   running ? 'var(--col-done)' : 'rgba(255,255,255,0.18)',
              boxShadow:    running ? '0 0 8px var(--col-done)' : 'none',
              transition:   'all 0.35s ease',
            }}
          />
          <span
            style={{
              fontSize:      '0.62rem',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {running ? (phase === 'work' ? 'Focusing' : 'On Break') : 'Smart Focus Mode'}
          </span>
        </div>

        {/* Task title (center) */}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <p
            style={{
              fontSize:     '0.83rem',
              fontWeight:   600,
              color:        'rgba(255,255,255,0.62)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {task?.title}
          </p>
        </div>

        {/* Streak + sessions pills */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {stats.streak > 0 && (
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          4,
                padding:      '3px 10px',
                borderRadius: 'var(--radius-full)',
                background:   'rgba(245,158,11,0.08)',
                border:       '1px solid rgba(245,158,11,0.18)',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>🔥</span>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#f59e0b' }}>
                {stats.streak}d
              </span>
            </div>
          )}
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          4,
              padding:      '3px 10px',
              borderRadius: 'var(--radius-full)',
              background:   'rgba(59,130,246,0.08)',
              border:       '1px solid rgba(59,130,246,0.18)',
            }}
          >
            <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--primary-light)' }}>
              {stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today
            </span>
          </div>
        </div>

        {/* ESC hint */}
        {!running && (
          <kbd
            style={{
              padding:    '2px 6px',
              borderRadius: 4,
              border:     '1px solid rgba(255,255,255,0.08)',
              fontSize:   '0.58rem',
              color:      'rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.03)',
              fontFamily: 'monospace',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        )}
      </header>

      {/* ── Two-panel body ── */}
      <div
        style={{
          flex:                1,
          display:             'grid',
          gridTemplateColumns: '1fr 400px',
          position:            'relative',
          zIndex:              1,
        }}
      >

        {/* ── LEFT: Task content ── */}
        <div
          style={{
            padding:       '40px 48px 64px',
            borderRight:   '1px solid rgba(255,255,255,0.04)',
            overflowY:     'auto',
            display:       'flex',
            flexDirection: 'column',
            gap:           36,
          }}
        >
          {/* Task header */}
          <div>
            <p
              style={{
                fontSize:      '0.6rem',
                fontWeight:    700,
                color:         'rgba(255,255,255,0.22)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom:  10,
              }}
            >
              Current Task
            </p>
            <h1
              style={{
                fontSize:      'clamp(1.5rem, 2.8vw, 2rem)',
                fontWeight:    800,
                color:         '#fff',
                letterSpacing: '-0.03em',
                lineHeight:    1.2,
                marginBottom:  task?.description ? 10 : 0,
              }}
            >
              {task?.title}
            </h1>
            {task?.description && (
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>
                {task.description}
              </p>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <p
              style={{
                fontSize:      '0.6rem',
                fontWeight:    700,
                color:         'rgba(255,255,255,0.22)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom:  12,
              }}
            >
              Subtasks
            </p>
            <SubtaskList taskId={id} initialSubtasks={task?.subtasks || []} />
          </div>

          {/* Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <p
                style={{
                  fontSize:      '0.6rem',
                  fontWeight:    700,
                  color:         'rgba(255,255,255,0.22)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Notes
              </p>
              {notesSaved && (
                <span style={{ fontSize: '0.65rem', color: 'var(--col-done)', animation: 'fadeIn 0.3s ease' }}>
                  ✓ Saved
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Capture your thoughts, ideas, blockers, breakthroughs..."
              rows={7}
              style={{
                width:        '100%',
                background:   'rgba(255,255,255,0.025)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: 'var(--radius-lg)',
                padding:      '14px 16px',
                color:        'rgba(255,255,255,0.72)',
                fontSize:     '0.88rem',
                lineHeight:   1.72,
                resize:       'vertical',
                minHeight:    160,
                outline:      'none',
                transition:   'border-color var(--transition)',
                fontFamily:   'inherit',
                boxSizing:    'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.28)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            />
          </div>
        </div>

        {/* ── RIGHT: Timer panel ── */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '40px 32px',
            gap:            26,
            position:       'sticky',
            top:            52,
            height:         'calc(100vh - 52px)',
            overflowY:      'auto',
          }}
        >
          {/* Phase selector */}
          <div
            style={{
              display:      'flex',
              gap:          4,
              background:   'rgba(255,255,255,0.04)',
              padding:      4,
              borderRadius: 'var(--radius-full)',
              border:       '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[
              { key: 'work',  label: 'Focus',  mins: 25 },
              { key: 'break', label: 'Break',  mins: 5  },
            ].map(({ key, label, mins }) => {
              const active = phase === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePhaseSwitch(key)}
                  disabled={running}
                  style={{
                    padding:      '6px 18px',
                    borderRadius: 'var(--radius-full)',
                    border:       'none',
                    background:   active
                      ? (key === 'work' ? 'rgba(59,130,246,0.18)' : 'rgba(16,185,129,0.18)')
                      : 'transparent',
                    color: active
                      ? (key === 'work' ? 'var(--primary-light)' : 'var(--col-done)')
                      : 'rgba(255,255,255,0.28)',
                    fontSize:   '0.78rem',
                    fontWeight: active ? 700 : 400,
                    cursor:     running ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-sm)',
                    opacity:    running ? 0.5 : 1,
                  }}
                >
                  {label} · {mins}m
                </button>
              );
            })}
          </div>

          {/* Circular timer dial */}
          <CircularTimerDial
            timeLeft={timeLeft}
            maxTime={totalSecs}
            running={running}
            ringColor={ringColor}
            onTimeChange={setTimeLeft}
            size={240}
            label={timerLabel}
          />

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!running ? (
              <button
                onClick={handleStart}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            8,
                  padding:        '12px 30px',
                  borderRadius:   'var(--radius-full)',
                  border:         'none',
                  background:     phase === 'work' ? 'var(--primary)' : '#10b981',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     700,
                  cursor:         'pointer',
                  letterSpacing:  '0.02em',
                  boxShadow:      phase === 'work'
                    ? '0 4px 20px rgba(59,130,246,0.42)'
                    : '0 4px 20px rgba(16,185,129,0.35)',
                  transition:     'all var(--transition-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {started
                  ? 'Resume'
                  : phase === 'work'
                    ? 'Start Focus'
                    : 'Start Break'
                }
              </button>
            ) : (
              <button
                onClick={handlePause}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            8,
                  padding:        '12px 30px',
                  borderRadius:   'var(--radius-full)',
                  border:         '1px solid rgba(255,255,255,0.14)',
                  background:     'rgba(255,255,255,0.06)',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     600,
                  cursor:         'pointer',
                  transition:     'all var(--transition-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </button>
            )}

            {started && (
              <button
                onClick={handleReset}
                title="Reset timer"
                style={{
                  width:          40,
                  height:         40,
                  borderRadius:   '50%',
                  border:         '1px solid rgba(255,255,255,0.08)',
                  background:     'transparent',
                  color:          'rgba(255,255,255,0.28)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  transition:     'all var(--transition-sm)',
                  flexShrink:     0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Today's stats card */}
          <div
            style={{
              width:        '100%',
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)',
              padding:      '16px 20px',
            }}
          >
            <p
              style={{
                fontSize:      '0.58rem',
                fontWeight:    700,
                color:         'rgba(255,255,255,0.2)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textAlign:     'center',
                marginBottom:  14,
              }}
            >
              Today's Progress
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {stats.todaySessions}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  Sessions
                </p>
              </div>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>
                  {fmtFocusTime(stats.todayMinutes)}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  Focus Time
                </p>
              </div>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: stats.streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>
                  {stats.streak > 0 ? `🔥${stats.streak}` : '—'}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                  Streak
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop:    14,
                paddingTop:   12,
                borderTop:    '1px solid rgba(255,255,255,0.04)',
                textAlign:    'center',
              }}
            >
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)' }}>
                Complete a session to earn{' '}
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>+10 coins</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Session complete modal ── */}
      {showModal && (
        <FocusSessionModal
          sessionId={completedSessionId}
          duration={completedDuration}
          onSave={handleModalSave}
          onStartBreak={handleModalBreak}
        />
      )}
    </div>
  );
}
