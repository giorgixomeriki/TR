import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask }            from '../services/taskService';
import { startFocusSession, getFocusStats } from '../services/focusService';
import SubtaskList          from './SubtaskList';
import FocusSessionSummary  from './FocusSessionSummary';
import AvatarTrainingPanel  from './AvatarTrainingPanel';
import CircularTimerDial    from './CircularTimerDial';
import LoadingSpinner       from './LoadingSpinner';

/* ── Constants ────────────────────────────────────────── */
const WORK_SECS  = 25 * 60;
const BREAK_SECS =  5 * 60;

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

/* ── Section label ────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize:      '0.58rem',
      fontWeight:    700,
      color:         'rgba(255,255,255,0.2)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      marginBottom:  10,
    }}>
      {children}
    </p>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function FocusArenaLayout() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* Task */
  const [task,       setTask]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notes,      setNotes]      = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const notesTimer = useRef(null);

  /* Stats */
  const [stats, setStats] = useState({ todayMinutes: 0, todaySessions: 0, streak: 0, totalSessions: 0 });

  /* Timer */
  const [phase,    setPhase]    = useState('work');
  const totalSecs  = phase === 'work' ? WORK_SECS : BREAK_SECS;
  const [timeLeft, setTimeLeft] = useState(WORK_SECS);
  const [running,  setRunning]  = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef(null);

  /* Session */
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  /* Modal */
  const [showModal,          setShowModal]          = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const [completedDuration,  setCompletedDuration]  = useState(WORK_SECS);

  /* Cleanup notes timer on unmount */
  useEffect(() => { return () => clearTimeout(notesTimer.current); }, []);

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

  /* ── Notification permission ── */
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
      if (Notification.permission === 'granted') {
        new Notification('Arena Session Complete! ⚔️', {
          body: 'Great training. Claim your rewards.',
        });
      }
      setCompletedSessionId(sessionIdRef.current);
      setCompletedDuration(WORK_SECS);
      setSessionId(null);
      setShowModal(true);
    } else {
      setPhase('work');
      setTimeLeft(WORK_SECS);
    }
  }, [timerDone, phase]);

  /* ── Timer controls ── */
  const handleStart = async () => {
    if (!sessionId && phase === 'work') {
      try {
        const sess = await startFocusSession(id);
        setSessionId(sess.id);
      } catch { /* allow timer to run */ }
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
    if (phase === 'break')                        return 'var(--col-done)';
    if (timeLeft === 0)                           return 'var(--col-done)';
    if (phase === 'work' && timeLeft < 5 * 60)    return '#f59e0b';
    return 'var(--primary)';
  })();

  const timerLabel = (() => {
    if (!started)       return phase === 'work' ? 'Ready' : 'Break Ready';
    if (running)        return phase === 'work' ? 'Focusing' : 'Break';
    if (timeLeft === 0) return 'Complete';
    return 'Paused';
  })();

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
        minHeight:    '100vh',
        background:   '#05050a',
        display:      'flex',
        flexDirection:'column',
        overflow:     'hidden',
        animation:    'focusModeIn 0.4s var(--ease)',
      }}
    >
      {/* Ambient orbs */}
      <Orb top={-100} right={-100}  color="rgba(124,58,237,0.06)" size={600} />
      <Orb bottom={-180} left={-60} color="rgba(59,130,246,0.05)" size={500} />

      {/* ── Header ── */}
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

        {/* Arena badge */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '4px 10px',
            background:   'rgba(124,58,237,0.1)',
            border:       '1px solid rgba(124,58,237,0.2)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <span style={{ fontSize: '0.7rem' }}>⚔️</span>
          <span
            style={{
              fontSize:      '0.62rem',
              fontWeight:    700,
              color:         '#a78bfa',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {running ? 'Training' : 'Focus Arena'}
          </span>
          <div
            style={{
              width:        5,
              height:       5,
              borderRadius: '50%',
              background:   running ? '#10b981' : 'rgba(255,255,255,0.15)',
              boxShadow:    running ? '0 0 6px #10b981' : 'none',
              transition:   'all 0.35s ease',
            }}
          />
        </div>

        {/* Task title */}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <p
            style={{
              fontSize:     '0.83rem',
              fontWeight:   600,
              color:        'rgba(255,255,255,0.6)',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {task?.title}
          </p>
        </div>

        {/* Stats pills */}
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
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>
                {stats.streak}d
              </span>
            </div>
          )}
          <div
            style={{
              padding:      '3px 10px',
              borderRadius: 'var(--radius-full)',
              background:   'rgba(124,58,237,0.08)',
              border:       '1px solid rgba(124,58,237,0.18)',
            }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#a78bfa' }}>
              {stats.todaySessions} session{stats.todaySessions !== 1 ? 's' : ''} today
            </span>
          </div>
        </div>

        {/* ESC hint */}
        {!running && (
          <kbd style={{ padding:'2px 6px', borderRadius:4, border:'1px solid rgba(255,255,255,0.08)', fontSize:'0.58rem', color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.03)', fontFamily:'monospace', flexShrink:0 }}>
            ESC
          </kbd>
        )}
      </header>

      {/* ── Three-panel body ── */}
      <div
        style={{
          flex:                1,
          display:             'grid',
          gridTemplateColumns: '300px 1fr 360px',
          position:            'relative',
          zIndex:              1,
          minHeight:           0,
        }}
      >
        {/* ── LEFT: Task content ── */}
        <div
          style={{
            padding:       '32px 28px 48px',
            borderRight:   '1px solid rgba(255,255,255,0.04)',
            overflowY:     'auto',
            display:       'flex',
            flexDirection: 'column',
            gap:           28,
          }}
        >
          {/* Task header */}
          <div>
            <SectionLabel>Current Task</SectionLabel>
            <h1
              style={{
                fontSize:      'clamp(1.1rem, 1.8vw, 1.4rem)',
                fontWeight:    800,
                color:         '#fff',
                letterSpacing: '-0.03em',
                lineHeight:    1.25,
                marginBottom:  task?.description ? 8 : 0,
              }}
            >
              {task?.title}
            </h1>
            {task?.description && (
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                {task.description}
              </p>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <SectionLabel>Subtasks</SectionLabel>
            <SubtaskList taskId={id} initialSubtasks={task?.subtasks || []} />
          </div>

          {/* Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <SectionLabel>Notes</SectionLabel>
              {notesSaved && (
                <span style={{ fontSize: '0.62rem', color: 'var(--col-done)', animation: 'fadeIn 0.3s ease', marginTop: -10 }}>
                  ✓ Saved
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Capture thoughts, blockers, breakthroughs..."
              rows={6}
              style={{
                width:        '100%',
                background:   'rgba(255,255,255,0.025)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderRadius: 'var(--radius-lg)',
                padding:      '12px 14px',
                color:        'rgba(255,255,255,0.72)',
                fontSize:     '0.84rem',
                lineHeight:   1.7,
                resize:       'vertical',
                minHeight:    130,
                outline:      'none',
                transition:   'border-color var(--transition)',
                fontFamily:   'inherit',
                boxSizing:    'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            />
          </div>
        </div>

        {/* ── CENTER: Timer ── */}
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '40px 32px',
            gap:            24,
            position:       'sticky',
            top:            52,
            height:         'calc(100vh - 52px)',
            borderRight:    '1px solid rgba(255,255,255,0.04)',
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
              { key: 'work',  label: 'Focus', mins: 25 },
              { key: 'break', label: 'Break', mins: 5  },
            ].map(({ key, label, mins }) => {
              const active = phase === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePhaseSwitch(key)}
                  disabled={running}
                  style={{
                    padding:      '6px 20px',
                    borderRadius: 'var(--radius-full)',
                    border:       'none',
                    background:   active
                      ? (key === 'work' ? 'rgba(124,58,237,0.2)' : 'rgba(16,185,129,0.18)')
                      : 'transparent',
                    color: active
                      ? (key === 'work' ? '#a78bfa' : 'var(--col-done)')
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
            size={220}
            label={timerLabel}
            arenaStyle={true}
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
                  padding:        '12px 32px',
                  borderRadius:   'var(--radius-full)',
                  border:         'none',
                  background:     phase === 'work'
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : '#10b981',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     700,
                  cursor:         'pointer',
                  letterSpacing:  '0.02em',
                  boxShadow:      phase === 'work'
                    ? '0 4px 24px rgba(124,58,237,0.5)'
                    : '0 4px 20px rgba(16,185,129,0.35)',
                  transition:     'all var(--transition-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {started
                  ? 'Resume'
                  : phase === 'work'
                    ? 'Enter Arena'
                    : 'Start Break'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            8,
                  padding:        '12px 32px',
                  borderRadius:   'var(--radius-full)',
                  border:         '1px solid rgba(255,255,255,0.12)',
                  background:     'rgba(255,255,255,0.05)',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     600,
                  cursor:         'pointer',
                  transition:     'all var(--transition-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
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

          {/* Today's stats */}
          <div
            style={{
              width:        '100%',
              maxWidth:     300,
              background:   'rgba(255,255,255,0.025)',
              border:       '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)',
              padding:      '14px 20px',
            }}
          >
            <p style={{ fontSize: '0.56rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
              Today's Training
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {stats.todaySessions}
                </p>
                <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Sessions</p>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>
                  {Math.floor(stats.todayMinutes / 60) > 0
                    ? `${Math.floor(stats.todayMinutes / 60)}h${stats.todayMinutes % 60 > 0 ? ` ${stats.todayMinutes % 60}m` : ''}`
                    : `${stats.todayMinutes}m`}
                </p>
                <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Focus</p>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: stats.streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)', lineHeight: 1 }}>
                  {stats.streak > 0 ? `🔥${stats.streak}` : '—'}
                </p>
                <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Streak</p>
              </div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>
                Session earns{' '}
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>+10 coins</span>
                {task?.taskSkills?.length > 0 && (
                  <> + <span style={{ color: '#a78bfa', fontWeight: 600 }}>+50 XP</span> per skill</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Avatar Training Panel ── */}
        <div
          style={{
            position:   'sticky',
            top:        52,
            height:     'calc(100vh - 52px)',
            overflowY:  'auto',
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(124,58,237,0.015)',
          }}
        >
          <AvatarTrainingPanel task={task} running={running} stats={stats} />
        </div>
      </div>

      {/* ── Session complete modal ── */}
      {showModal && (
        <FocusSessionSummary
          sessionId={completedSessionId}
          duration={completedDuration}
          onSave={handleModalSave}
          onStartBreak={handleModalBreak}
        />
      )}
    </div>
  );
}
