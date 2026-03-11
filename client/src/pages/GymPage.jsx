import { useState, useEffect, useRef } from 'react';
import CircularTimerDial from '../components/CircularTimerDial';
import LoadingSpinner    from '../components/LoadingSpinner';
import {
  getWorkouts, createWorkout, updateWorkout, deleteWorkout,
  getExercises, createSession, completeSession,
  getGymStats, getBodyStats, addBodyStat,
} from '../services/gymService';

/* ── Constants ─────────────────────────────────────────── */
const DAYS      = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MUSCLES   = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
const REST_SECS = 90; // default rest timer

/* ── Helpers ───────────────────────────────────────────── */
function todayDayName() {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
}

function fmtDuration(mins) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;
}

/* ── Small components ───────────────────────────────────── */
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px', flex: 1,
    }}>
      <p style={{ fontSize: '1.6rem', fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function MuscleTag({ group }) {
  const colors = {
    Chest: '#3b82f6', Back: '#8b5cf6', Shoulders: '#f59e0b',
    Arms: '#ef4444', Legs: '#10b981', Core: '#06b6d4',
  };
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: 'var(--radius-full)', background: `${colors[group] || '#6b7280'}22`,
      color: colors[group] || '#6b7280', border: `1px solid ${colors[group] || '#6b7280'}44`,
    }}>
      {group}
    </span>
  );
}

/* ── Workout Form Modal ─────────────────────────────────── */
function WorkoutFormModal({ workout, exercises, onSave, onClose }) {
  const [title,      setTitle]      = useState(workout?.title || '');
  const [dayOfWeek,  setDayOfWeek]  = useState(workout?.dayOfWeek || '');
  const [lines,      setLines]      = useState(
    workout?.exercises?.map(we => ({
      exerciseId: we.exerciseId,
      sets:  we.sets,
      reps:  we.reps,
      weight: we.weight ?? '',
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) &&
    !lines.find(l => l.exerciseId === e.id)
  );

  const addExercise = (ex) => {
    setLines(prev => [...prev, { exerciseId: ex.id, sets: 3, reps: 10, weight: '' }]);
    setSearch('');
  };

  const removeExercise = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const updateLine = (idx, field, val) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title:     title.trim(),
        dayOfWeek: dayOfWeek || null,
        exercises: lines.map(l => ({
          exerciseId: l.exerciseId,
          sets:   Number(l.sets)   || 3,
          reps:   Number(l.reps)   || 10,
          weight: l.weight !== '' ? Number(l.weight) : null,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 580,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            {workout ? 'Edit Workout' : 'New Workout'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Title *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Push Day A"
              style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Day */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Scheduled Day</label>
            <select
              value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}
              style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">No scheduled day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Exercise search */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Add Exercise</label>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              style={{ width: '100%', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
            {search && filtered.length > 0 && (
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                {filtered.slice(0, 8).map(ex => (
                  <button key={ex.id} onClick={() => addExercise(ex)} style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none',
                    color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ flex: 1 }}>{ex.name}</span>
                    <MuscleTag group={ex.muscleGroup} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Exercise lines */}
          {lines.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exercises ({lines.length})</p>
              {lines.map((line, idx) => {
                const ex = exMap[line.exerciseId];
                return (
                  <div key={idx} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex?.name}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {[['Sets', 'sets', 1, 20], ['Reps', 'reps', 1, 100]].map(([lbl, field, min, max]) => (
                          <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {lbl}
                            <input type="number" min={min} max={max} value={line[field]}
                              onChange={e => updateLine(idx, field, e.target.value)}
                              style={{ width: 46, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', fontSize: '0.78rem', textAlign: 'center', outline: 'none' }}
                            />
                          </label>
                        ))}
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          kg
                          <input type="number" min={0} step={0.5} value={line.weight}
                            onChange={e => updateLine(idx, 'weight', e.target.value)}
                            placeholder="—"
                            style={{ width: 52, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', fontSize: '0.78rem', textAlign: 'center', outline: 'none' }}
                          />
                        </label>
                      </div>
                    </div>
                    <button onClick={() => removeExercise(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-gradient" style={{ padding: '9px 20px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : (workout ? 'Save Changes' : 'Create Workout')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Workout Session Modal ───────────────────────────────── */
function WorkoutSessionModal({ session, workout, onComplete, onClose }) {
  const exercises = workout?.exercises ?? [];

  // sets state: { [exerciseId]: { [setIdx]: { reps, weight, done } } }
  const [setsState,   setSetsState]   = useState(() => {
    const init = {};
    exercises.forEach(we => {
      init[we.exerciseId] = Array.from({ length: we.sets }, () => ({
        reps:   we.reps   ?? '',
        weight: we.weight ?? '',
        done:   false,
      }));
    });
    return init;
  });

  const [notes,       setNotes]       = useState('');
  const [restTime,    setRestTime]    = useState(REST_SECS);
  const [restRunning, setRestRunning] = useState(false);
  const [completing,  setCompleting]  = useState(false);
  const startedAt = useRef(Date.now());

  const toggleSet = (exId, setIdx) => {
    setSetsState(prev => {
      const updated = prev[exId].map((s, i) => i === setIdx ? { ...s, done: !s.done } : s);
      return { ...prev, [exId]: updated };
    });
    // Start rest timer when marking a set done
    const wasDone = setsState[exId]?.[setIdx]?.done;
    if (!wasDone) {
      setRestTime(REST_SECS);
      setRestRunning(true);
    }
  };

  const updateSet = (exId, setIdx, field, val) => {
    setSetsState(prev => {
      const updated = prev[exId].map((s, i) => i === setIdx ? { ...s, [field]: val } : s);
      return { ...prev, [exId]: updated };
    });
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const durationMin = Math.round((Date.now() - startedAt.current) / 60000);
      const sets = [];
      exercises.forEach(we => {
        (setsState[we.exerciseId] || []).forEach((s, i) => {
          sets.push({
            exerciseId: we.exerciseId,
            setNumber:  i + 1,
            reps:       s.reps   !== '' ? Number(s.reps)   : null,
            weight:     s.weight !== '' ? Number(s.weight) : null,
            completed:  s.done,
          });
        });
      });
      await onComplete(session.id, { durationMin, notes, sets });
    } finally {
      setCompleting(false);
    }
  };

  const doneCount = Object.values(setsState).reduce((acc, arr) => acc + arr.filter(s => s.done).length, 0);
  const totalSets = Object.values(setsState).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 2000,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}>✕</button>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Session</p>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{workout?.title || 'Custom Workout'}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {doneCount}/{totalSets} sets
          </span>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="btn-gradient"
            style={{ padding: '9px 20px', opacity: completing ? 0.6 : 1 }}
          >
            {completing ? 'Saving…' : 'Complete Workout ✓'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* Exercise log — left */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {exercises.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 60 }}>
              No exercises in this workout.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' }}>
            {exercises.map(we => (
              <div key={we.exerciseId} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Exercise header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', flex: 1 }}>{we.exercise?.name}</p>
                  <MuscleTag group={we.exercise?.muscleGroup} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {we.sets}×{we.reps}{we.weight ? ` @ ${we.weight}kg` : ''}
                  </span>
                </div>

                {/* Sets table */}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 40px', gap: 8, alignItems: 'center', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                    {['Set', 'Notes', 'Reps', 'kg', '✓'].map(h => (
                      <span key={h} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>{h}</span>
                    ))}
                  </div>

                  {(setsState[we.exerciseId] || []).map((s, setIdx) => (
                    <div key={setIdx} style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 40px', gap: 8,
                      alignItems: 'center', opacity: s.done ? 0.6 : 1, transition: 'opacity 0.2s',
                    }}>
                      <span style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{setIdx + 1}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {we.reps} reps{we.weight ? ` × ${we.weight}kg` : ''}
                      </span>
                      {['reps', 'weight'].map(field => (
                        <input
                          key={field}
                          type="number"
                          min={0}
                          step={field === 'weight' ? 0.5 : 1}
                          value={s[field]}
                          onChange={e => updateSet(we.exerciseId, setIdx, field, e.target.value)}
                          placeholder={field === 'reps' ? we.reps : (we.weight || '—')}
                          style={{
                            background: 'var(--surface-alt)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '6px 8px', color: 'var(--text)',
                            fontSize: '0.85rem', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box',
                          }}
                        />
                      ))}
                      <button
                        onClick={() => toggleSet(we.exerciseId, setIdx)}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          border: `2px solid ${s.done ? 'var(--col-done)' : 'var(--border)'}`,
                          background: s.done ? 'var(--col-done)' : 'transparent',
                          color: s.done ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                          transition: 'all 0.15s',
                        }}
                      >
                        {s.done ? '✓' : ''}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Session Notes</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="How did it go? PR's, observations…"
                rows={3}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        {/* Rest timer — right panel */}
        <div style={{
          width: 280, flexShrink: 0, borderLeft: '1px solid var(--border)',
          background: 'var(--surface)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '32px 20px', gap: 20,
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4 }}>Rest Timer</p>
          </div>

          <CircularTimerDial
            timeLeft={restTime}
            maxTime={REST_SECS}
            running={restRunning}
            ringColor="#10b981"
            onTimeChange={setRestTime}
            size={200}
            label="rest"
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setRestRunning(r => !r); }}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer',
              }}
            >
              {restRunning ? 'Pause' : 'Start'}
            </button>
            {[60, 90, 120, 180].map(s => (
              <button key={s} onClick={() => { setRestTime(s); setRestRunning(true); }}
                style={{
                  padding: '6px 10px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer',
                }}
              >
                {s < 60 ? `${s}s` : `${s/60}m`}
              </button>
            ))}
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, textAlign: 'center' }}>Progress</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sets completed</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--col-done)' }}>{doneCount}/{totalSets}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${totalSets > 0 ? (doneCount / totalSets) * 100 : 0}%`, background: 'var(--col-done)', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Body Stat Form ─────────────────────────────────────── */
function BodyStatForm({ onSave, onClose }) {
  const [form, setForm] = useState({ weight: '', bodyFat: '', chest: '', arms: '', waist: '' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    const data = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') data[k] = Number(v); });
    if (!Object.keys(data).length) return;
    setSaving(true);
    try { await onSave(data); } finally { setSaving(false); }
  };

  const fields = [
    { key: 'weight',  label: 'Body Weight', unit: 'kg' },
    { key: 'bodyFat', label: 'Body Fat',    unit: '%'  },
    { key: 'chest',   label: 'Chest',       unit: 'cm' },
    { key: 'arms',    label: 'Arms',        unit: 'cm' },
    { key: 'waist',   label: 'Waist',       unit: 'cm' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 420 }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>Log Body Stats</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(({ key, label, unit }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: 'var(--text)' }}>
              <span style={{ flex: 1, color: 'var(--text-muted)' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" min={0} step={0.1} value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder="—"
                  style={{ width: 80, background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '7px 10px', color: 'var(--text)', fontSize: '0.9rem', textAlign: 'right', outline: 'none' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 24 }}>{unit}</span>
              </div>
            </label>
          ))}
        </div>
        <div style={{ padding: '14px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gradient" style={{ padding: '8px 18px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Measurements'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main GymPage ───────────────────────────────────────── */
export default function GymPage() {
  const [tab,            setTab]           = useState('dashboard');
  const [workouts,       setWorkouts]      = useState([]);
  const [exercises,      setExercises]     = useState([]);
  const [bodyStats,      setBodyStats]     = useState([]);
  const [stats,          setStats]         = useState({ streak: 0, weeklySessions: 0, totalSessions: 0 });
  const [loading,        setLoading]       = useState(true);
  const [showWorkoutForm,setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [activeSession,  setActiveSession]  = useState(null); // { session, workout }
  const [showBodyForm,   setShowBodyForm]   = useState(false);
  const [xpToast,        setXpToast]        = useState(null);
  const [muscleFilter,   setMuscleFilter]   = useState('All');
  const [libSearch,      setLibSearch]      = useState('');

  useEffect(() => {
    Promise.all([getWorkouts(), getExercises(), getBodyStats(), getGymStats()])
      .then(([w, e, b, s]) => {
        setWorkouts(w);
        setExercises(e);
        setBodyStats(b);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Workout CRUD ── */
  const handleCreateWorkout = async (data) => {
    const w = await createWorkout(data);
    setWorkouts(prev => [...prev, w]);
    setShowWorkoutForm(false);
  };

  const handleUpdateWorkout = async (data) => {
    const w = await updateWorkout(editingWorkout.id, data);
    setWorkouts(prev => prev.map(x => x.id === w.id ? w : x));
    setEditingWorkout(null);
  };

  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Delete this workout plan?')) return;
    await deleteWorkout(id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  /* ── Session ── */
  const handleStartWorkout = async (workout) => {
    const session = await createSession(workout.id);
    setActiveSession({ session, workout });
  };

  const handleCompleteSession = async (sessionId, data) => {
    const result = await completeSession(sessionId, data);
    setActiveSession(null);
    setStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      weeklySessions: prev.weeklySessions + 1,
    }));
    setXpToast(result.xpEarned);
    setTimeout(() => setXpToast(null), 3000);
  };

  /* ── Body stats ── */
  const handleAddBodyStat = async (data) => {
    const stat = await addBodyStat(data);
    setBodyStats(prev => [stat, ...prev]);
    setShowBodyForm(false);
  };

  const today      = todayDayName();
  const todayPlan  = workouts.find(w => w.dayOfWeek === today);

  const filteredLib = exercises.filter(e => {
    const matchesMuscle = muscleFilter === 'All' || e.muscleGroup === muscleFilter;
    const matchesSearch = e.name.toLowerCase().includes(libSearch.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
        <LoadingSpinner size={44} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: 28, animation: 'fadeInDown 0.35s var(--ease)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Fitness Tracking
          </p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Gym & Workout
          </h1>
        </header>

        {/* ── Tab nav ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'workouts',  label: 'Workouts'  },
            { key: 'body',      label: 'Body Stats' },
            { key: 'library',   label: 'Library'   },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: tab === key ? 700 : 400,
              color:       tab === key ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1, transition: 'all var(--transition-sm)',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Dashboard tab ── */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <StatCard label="Day Streak"      value={stats.streak}         color={stats.streak > 0 ? '#f59e0b' : 'var(--text)'} sub={stats.streak > 0 ? '🔥 Keep it up!' : 'Start your first session'} />
              <StatCard label="This Week"       value={stats.weeklySessions} color="var(--primary-light)" sub="sessions completed" />
              <StatCard label="Total Sessions"  value={stats.totalSessions}  color="var(--col-done)" />
            </div>

            {/* Today's plan */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px 24px' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                Today — {today}
              </p>
              {todayPlan ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{todayPlan.title}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {todayPlan.exercises.length} exercise{todayPlan.exercises.length !== 1 ? 's' : ''} · {todayPlan.exercises.reduce((s, we) => s + we.sets, 0)} total sets
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartWorkout(todayPlan)}
                    className="btn-gradient"
                    style={{ padding: '10px 22px', flexShrink: 0 }}
                  >
                    ▶ Start Workout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    No workout scheduled for today. Rest day or go free-form!
                  </p>
                  <button onClick={() => setTab('workouts')} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
                    View Plans
                  </button>
                </div>
              )}
            </div>

            {/* Weekly plan overview */}
            {workouts.filter(w => w.dayOfWeek).length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 22px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Weekly Schedule</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DAYS.map(day => {
                    const plan = workouts.find(w => w.dayOfWeek === day);
                    const isToday = day === today;
                    return (
                      <div key={day} style={{
                        flex: 1, minWidth: 90, padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        border: `1px solid ${isToday ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
                        background: isToday ? 'rgba(59,130,246,0.06)' : 'var(--surface-alt)',
                      }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: isToday ? 'var(--primary-light)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{day.slice(0,3)}</p>
                        <p style={{ fontSize: '0.78rem', color: plan ? 'var(--text)' : 'var(--text-muted)', fontWeight: plan ? 600 : 400 }}>
                          {plan ? plan.title : 'Rest'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Workouts tab ── */}
        {tab === 'workouts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{workouts.length} workout plan{workouts.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowWorkoutForm(true)} className="btn-gradient" style={{ padding: '9px 18px' }}>
                + New Workout
              </button>
            </div>

            {workouts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>🏋️</p>
                <p style={{ fontSize: '0.9rem' }}>No workout plans yet. Create your first one!</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {workouts.map(w => (
                <div key={w.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Card header */}
                  <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{w.title}</h3>
                      {w.dayOfWeek && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px',
                          borderRadius: 'var(--radius-full)',
                          background: w.dayOfWeek === today ? 'rgba(59,130,246,0.15)' : 'var(--surface-alt)',
                          color: w.dayOfWeek === today ? 'var(--primary-light)' : 'var(--text-muted)',
                          border: `1px solid ${w.dayOfWeek === today ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                          flexShrink: 0,
                        }}>
                          {w.dayOfWeek}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''} · {w.exercises.reduce((s, we) => s + we.sets, 0)} sets
                    </p>
                  </div>

                  {/* Exercise list preview */}
                  <div style={{ padding: '10px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {w.exercises.slice(0, 4).map(we => (
                      <div key={we.exerciseId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{we.exercise?.name}</span>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{we.sets}×{we.reps}</span>
                      </div>
                    ))}
                    {w.exercises.length > 4 && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{w.exercises.length - 4} more</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleStartWorkout(w)}
                      className="btn-gradient"
                      style={{ flex: 1, padding: '8px 0', fontSize: '0.82rem' }}
                    >
                      ▶ Start
                    </button>
                    <button onClick={() => setEditingWorkout(w)} style={{ padding: '8px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDeleteWorkout(w.id)} style={{ padding: '8px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Body Stats tab ── */}
        {tab === 'body' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Track your measurements over time</p>
              <button onClick={() => setShowBodyForm(true)} className="btn-gradient" style={{ padding: '9px 18px' }}>+ Log Measurements</button>
            </div>

            {bodyStats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 12 }}>📏</p>
                <p style={{ fontSize: '0.9rem' }}>No measurements yet. Log your first entry!</p>
              </div>
            )}

            {bodyStats.length > 0 && (
              <>
                {/* Latest */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 22px' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Latest Measurements</p>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { key: 'weight',  label: 'Weight',   unit: 'kg' },
                      { key: 'bodyFat', label: 'Body Fat',  unit: '%' },
                      { key: 'chest',   label: 'Chest',    unit: 'cm' },
                      { key: 'arms',    label: 'Arms',     unit: 'cm' },
                      { key: 'waist',   label: 'Waist',    unit: 'cm' },
                    ].map(({ key, label, unit }) => {
                      const val = bodyStats[0]?.[key];
                      return val != null ? (
                        <div key={key} style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>{val}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span></p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* History */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>History</p>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Date', 'Weight (kg)', 'Body Fat (%)', 'Chest (cm)', 'Arms (cm)', 'Waist (cm)'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bodyStats.map(stat => (
                          <tr key={stat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(stat.createdAt).toLocaleDateString()}</td>
                            {['weight', 'bodyFat', 'chest', 'arms', 'waist'].map(k => (
                              <td key={k} style={{ padding: '10px 14px', color: stat[k] != null ? 'var(--text)' : 'var(--text-muted)' }}>
                                {stat[k] ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Library tab ── */}
        {tab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={libSearch} onChange={e => setLibSearch(e.target.value)}
                placeholder="Search exercises…"
                style={{ flex: 1, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {MUSCLES.map(m => (
                  <button key={m} onClick={() => setMuscleFilter(m)} style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                    background: muscleFilter === m ? 'var(--primary)' : 'transparent',
                    color: muscleFilter === m ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.78rem', cursor: 'pointer', transition: 'all var(--transition-sm)',
                  }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {filteredLib.map(ex => (
                <div key={ex.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{ex.name}</p>
                    <MuscleTag group={ex.muscleGroup} />
                  </div>
                  {ex.description && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ex.description}</p>
                  )}
                </div>
              ))}
            </div>

            {filteredLib.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 40, fontSize: '0.88rem' }}>No exercises found.</p>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {(showWorkoutForm || editingWorkout) && (
        <WorkoutFormModal
          workout={editingWorkout}
          exercises={exercises}
          onSave={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
          onClose={() => { setShowWorkoutForm(false); setEditingWorkout(null); }}
        />
      )}

      {activeSession && (
        <WorkoutSessionModal
          session={activeSession.session}
          workout={activeSession.workout}
          onComplete={handleCompleteSession}
          onClose={() => setActiveSession(null)}
        />
      )}

      {showBodyForm && (
        <BodyStatForm
          onSave={handleAddBodyStat}
          onClose={() => setShowBodyForm(false)}
        />
      )}

      {/* ── XP Toast ── */}
      {xpToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeInUp 0.3s var(--ease)',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: '1.1rem' }}>💪</span>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>Workout Complete!</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(16,185,129,0.8)' }}>+{xpToast} XP to Fitness skill</p>
          </div>
        </div>
      )}
    </div>
  );
}
