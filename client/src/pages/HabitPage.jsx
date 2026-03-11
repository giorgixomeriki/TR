import { useState, useEffect, useCallback } from 'react';
import {
  getHabits, createHabit, updateHabit, deleteHabit,
  completeHabit, getHabitStats, getHabitHeatmap,
} from '../services/habitService';
import { getAllSkills } from '../services/skillService';

/* ────────────────────────────────────────────────────────
   Constants / helpers
──────────────────────────────────────────────────────── */
const DIFFICULTIES = [
  { value: 'EASY',   label: 'Easy',   xp: 3,  color: '#10b981' },
  { value: 'MEDIUM', label: 'Medium', xp: 5,  color: '#f59e0b' },
  { value: 'HARD',   label: 'Hard',   xp: 10, color: '#ef4444' },
];

const CATEGORIES = [
  'General', 'Health & Fitness', 'Learning', 'Productivity',
  'Mindfulness', 'Finance', 'Social', 'Creative',
];

function diffMeta(d) {
  return DIFFICULTIES.find((x) => x.value === d) || DIFFICULTIES[1];
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ────────────────────────────────────────────────────────
   Heatmap
──────────────────────────────────────────────────────── */
function heatColor(count) {
  if (count === 0) return 'rgba(255,255,255,0.06)';
  if (count === 1) return 'rgba(16,185,129,0.28)';
  if (count === 2) return 'rgba(16,185,129,0.50)';
  if (count === 3) return 'rgba(16,185,129,0.70)';
  return 'rgba(16,185,129,0.92)';
}

function HabitHeatmap({ data }) {
  if (!data.length) return null;

  /* Organise data into columns of 7 (Mon→Sun) */
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const map = {};
  for (const d of data) map[d.date] = d.count;

  /* Start on Monday of the first week */
  const firstDate = new Date(data[0].date + 'T00:00:00Z');
  const dayOfWeek = firstDate.getUTCDay(); // 0=Sun
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const gridStart = new Date(firstDate.getTime() - offsetToMonday * 86_400_000);

  const totalDays  = Math.ceil((today.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  const weeks = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date    = new Date(gridStart.getTime() + (w * 7 + d) * 86_400_000);
      const key     = date.toISOString().split('T')[0];
      const future  = date.getTime() > today.getTime();
      week.push({ key, count: future ? -1 : (map[key] ?? 0), future });
    }
    weeks.push(week);
  }

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4, paddingTop: 0 }}>
          {DAY_LABELS.map((l, i) => (
            <div key={i} style={{ width: 10, height: 10, fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {l}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={cell.future ? '' : `${cell.key}: ${cell.count} completed`}
                  style={{
                    width:        10,
                    height:       10,
                    borderRadius: 2,
                    background:   cell.future ? 'transparent' : heatColor(cell.count),
                    flexShrink:   0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)' }}>Less</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(n) }} />
        ))}
        <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)' }}>More</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Stat card
──────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, accent = '#3b82f6' }) {
  return (
    <div
      style={{
        flex:         1,
        minWidth:     140,
        background:   'rgba(255,255,255,0.03)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-lg)',
        padding:      '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{sub}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   XP flash toast
──────────────────────────────────────────────────────── */
function XpToast({ xpResult, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!xpResult) return null;
  return (
    <div
      style={{
        position:     'fixed',
        bottom:       32,
        right:        32,
        zIndex:       999,
        background:   'rgba(16,16,28,0.96)',
        border:       `1px solid ${xpResult.skillColor || '#3b82f6'}`,
        borderRadius: 'var(--radius-lg)',
        padding:      '14px 20px',
        animation:    'fadeInDown 0.35s var(--ease)',
        minWidth:     220,
      }}
    >
      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Habit complete</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>{xpResult.skillIcon}</span>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            +{xpResult.xpGained} XP → {xpResult.skillName}
          </p>
          {xpResult.leveled && (
            <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>
              Level up! → Lv {xpResult.newLevel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Add / Edit form
──────────────────────────────────────────────────────── */
function HabitForm({ initial, skills, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title:      initial?.title      || '',
    category:   initial?.category   || 'General',
    difficulty: initial?.difficulty || 'MEDIUM',
    skillId:    initial?.skillId    || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, skillId: form.skillId || null });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width:        '100%',
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-md)',
    padding:      '9px 12px',
    color:        '#fff',
    fontSize:     '0.85rem',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   'inherit',
    transition:   'border-color var(--transition-sm)',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title */}
        <input
          autoFocus
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Habit name…"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        />

        {/* Category + Difficulty row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={form.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label} (+{d.xp} XP)</option>
            ))}
          </select>
        </div>

        {/* Skill */}
        <select
          value={form.skillId}
          onChange={(e) => set('skillId', e.target.value)}
          style={inputStyle}
        >
          <option value="">No skill connection</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            style={{
              padding:      '8px 20px',
              borderRadius: 'var(--radius-md)',
              border:       'none',
              background:   'linear-gradient(135deg,#7c3aed,#4f46e5)',
              color:        '#fff',
              fontSize:     '0.82rem',
              fontWeight:   700,
              cursor:       saving ? 'not-allowed' : 'pointer',
              opacity:      saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Habit'}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ────────────────────────────────────────────────────────
   Habit card
──────────────────────────────────────────────────────── */
function HabitCard({ habit, skills, onToggle, onDelete, onUpdate }) {
  const [editing,   setEditing]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [toggling,  setToggling]  = useState(false);

  const diff = diffMeta(habit.difficulty);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try { await onToggle(habit.id); }
    finally { setToggling(false); }
  };

  const handleUpdate = async (data) => {
    await onUpdate(habit.id, data);
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        style={{
          background:   'rgba(124,58,237,0.06)',
          border:       '1px solid rgba(124,58,237,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding:      '16px 18px',
        }}
      >
        <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Edit Habit
        </p>
        <HabitForm
          initial={habit}
          skills={skills}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          14,
        background:   habit.completedToday
          ? 'rgba(16,185,129,0.05)'
          : 'rgba(255,255,255,0.025)',
        border:       `1px solid ${habit.completedToday ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 'var(--radius-lg)',
        padding:      '14px 16px',
        transition:   'all var(--transition-sm)',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        style={{
          width:        28,
          height:       28,
          borderRadius: 8,
          border:       `2px solid ${habit.completedToday ? '#10b981' : 'rgba(255,255,255,0.18)'}`,
          background:   habit.completedToday ? '#10b981' : 'transparent',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          cursor:       toggling ? 'not-allowed' : 'pointer',
          flexShrink:   0,
          transition:   'all var(--transition-sm)',
        }}
      >
        {habit.completedToday && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize:        '0.92rem',
              fontWeight:      600,
              color:           habit.completedToday ? 'rgba(255,255,255,0.45)' : '#fff',
              textDecoration:  habit.completedToday ? 'line-through' : 'none',
              transition:      'all var(--transition-sm)',
            }}
          >
            {habit.title}
          </span>

          {/* Difficulty badge */}
          <span
            style={{
              fontSize:      '0.6rem',
              fontWeight:    700,
              color:         diff.color,
              background:    `${diff.color}18`,
              border:        `1px solid ${diff.color}30`,
              padding:       '1px 7px',
              borderRadius:  'var(--radius-full)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexShrink:    0,
            }}
          >
            {diff.label} +{diff.xp}XP
          </span>

          {/* Skill badge */}
          {habit.skill && (
            <span
              style={{
                fontSize:      '0.65rem',
                fontWeight:    600,
                color:         habit.skill.color || '#3b82f6',
                background:    `${habit.skill.color || '#3b82f6'}15`,
                border:        `1px solid ${habit.skill.color || '#3b82f6'}25`,
                padding:       '1px 8px',
                borderRadius:  'var(--radius-full)',
                flexShrink:    0,
              }}
            >
              {habit.skill.icon} {habit.skill.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5 }}>
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>
            {habit.category}
          </span>
          {habit.currentStreak > 0 && (
            <span style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 600 }}>
              🔥 {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
            </span>
          )}
          {habit.bestStreak > 0 && (
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)' }}>
              Best: {habit.bestStreak}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {/* Edit */}
        <button
          onClick={() => { setEditing(true); setConfirmDel(false); }}
          title="Edit"
          style={{
            width:      30,
            height:     30,
            borderRadius: 'var(--radius-md)',
            border:     '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            color:      'rgba(255,255,255,0.28)',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor:     'pointer',
            transition: 'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Delete */}
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            title="Delete"
            style={{
              width:      30,
              height:     30,
              borderRadius: 'var(--radius-md)',
              border:     '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              color:      'rgba(255,255,255,0.28)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:     'pointer',
              transition: 'all var(--transition-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => onDelete(habit.id)}
            style={{
              padding:      '4px 10px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid rgba(239,68,68,0.4)',
              background:   'rgba(239,68,68,0.12)',
              color:        '#ef4444',
              fontSize:     '0.7rem',
              fontWeight:   700,
              cursor:       'pointer',
            }}
          >
            Confirm?
          </button>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Main page
──────────────────────────────────────────────────────── */
export default function HabitPage() {
  const [habits,    setHabits]    = useState([]);
  const [stats,     setStats]     = useState({ completedToday: 0, totalHabits: 0, bestCurrentStreak: 0, bestEverStreak: 0 });
  const [heatmap,   setHeatmap]   = useState([]);
  const [skills,    setSkills]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [xpToast,   setXpToast]   = useState(null);
  const [filter,    setFilter]    = useState('all'); // 'all' | 'done' | 'remaining'

  /* ── Fetch all data ── */
  const fetchAll = useCallback(async () => {
    try {
      const [h, s, hm] = await Promise.all([getHabits(), getHabitStats(), getHabitHeatmap(16)]);
      setHabits(h);
      setStats(s);
      setHeatmap(hm);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchAll(), getAllSkills().then(setSkills).catch(() => {})])
      .finally(() => setLoading(false));
  }, [fetchAll]);

  /* ── Handlers ── */
  const handleCreate = async (data) => {
    const habit = await createHabit(data);
    setHabits((prev) => [...prev, { ...habit, completedToday: false }]);
    setStats((s) => ({ ...s, totalHabits: s.totalHabits + 1 }));
    setShowAdd(false);
  };

  const handleUpdate = async (id, data) => {
    const updated = await updateHabit(id, data);
    setHabits((prev) => prev.map((h) => h.id === id ? { ...h, ...updated, completedToday: h.completedToday } : h));
  };

  const handleDelete = async (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setStats((s) => ({ ...s, totalHabits: Math.max(0, s.totalHabits - 1) }));
    try { await deleteHabit(id); }
    catch { fetchAll(); }
  };

  const handleToggle = async (id) => {
    /* Optimistic update */
    let prevHabits = habits;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, completedToday: !h.completedToday, currentStreak: h.completedToday ? Math.max(0, h.currentStreak - 1) : h.currentStreak + 1 }
          : h,
      ),
    );

    try {
      const result = await completeHabit(id);
      /* Sync real values from server */
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, completedToday: result.completedToday, currentStreak: result.currentStreak, bestStreak: result.bestStreak ?? h.bestStreak }
            : h,
        ),
      );
      setStats((s) => ({
        ...s,
        completedToday: result.completedToday ? s.completedToday + 1 : Math.max(0, s.completedToday - 1),
        bestCurrentStreak: Math.max(s.bestCurrentStreak, result.currentStreak),
        bestEverStreak:    Math.max(s.bestEverStreak, result.bestStreak ?? 0),
      }));

      /* Show XP toast if skill connected and just completed */
      if (result.completedToday && result.xpResult) {
        setXpToast(result.xpResult);
      }
    } catch {
      setHabits(prevHabits);
    }
  };

  /* ── Filter ── */
  const filteredHabits = habits.filter((h) => {
    if (filter === 'done')      return h.completedToday;
    if (filter === 'remaining') return !h.completedToday;
    return true;
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.5rem' }}>🔁</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              Habit Tracker
            </h1>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>{todayLabel()}</p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard
            icon="✅"
            label="Today"
            value={`${stats.completedToday} / ${stats.totalHabits}`}
            sub={stats.totalHabits === 0 ? 'No habits yet' : stats.completedToday === stats.totalHabits && stats.totalHabits > 0 ? 'All done!' : 'habits completed'}
          />
          <StatCard
            icon="🔥"
            label="Best streak"
            value={stats.bestCurrentStreak > 0 ? `${stats.bestCurrentStreak}d` : '—'}
            sub="Current longest"
          />
          <StatCard
            icon="🏆"
            label="All-time record"
            value={stats.bestEverStreak > 0 ? `${stats.bestEverStreak}d` : '—'}
            sub="Best ever streak"
          />
        </div>

        {/* ── Heatmap ── */}
        {heatmap.length > 0 && (
          <div
            style={{
              background:   'rgba(255,255,255,0.025)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--radius-lg)',
              padding:      '20px 24px',
              marginBottom: 28,
            }}
          >
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Completion History · 16 Weeks
            </p>
            <HabitHeatmap data={heatmap} />
          </div>
        )}

        {/* ── Habits section ── */}
        <div>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                Today's Habits
              </h2>
              {habits.length > 0 && (
                <div
                  style={{
                    display:      'flex',
                    background:   'rgba(255,255,255,0.04)',
                    borderRadius: 'var(--radius-full)',
                    border:       '1px solid rgba(255,255,255,0.07)',
                    overflow:     'hidden',
                  }}
                >
                  {[
                    { key: 'all',       label: 'All' },
                    { key: 'remaining', label: 'Todo' },
                    { key: 'done',      label: 'Done' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      style={{
                        padding:    '4px 12px',
                        border:     'none',
                        background: filter === key ? 'rgba(124,58,237,0.25)' : 'transparent',
                        color:      filter === key ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                        fontSize:   '0.72rem',
                        fontWeight: filter === key ? 700 : 400,
                        cursor:     'pointer',
                        transition: 'all var(--transition-sm)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add habit button */}
            <button
              onClick={() => { setShowAdd((v) => !v); }}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          6,
                padding:      '8px 16px',
                borderRadius: 'var(--radius-full)',
                border:       'none',
                background:   showAdd ? 'rgba(124,58,237,0.15)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                color:        showAdd ? '#a78bfa' : '#fff',
                fontSize:     '0.82rem',
                fontWeight:   700,
                cursor:       'pointer',
                transition:   'all var(--transition-sm)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {showAdd
                  ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>
                }
              </svg>
              {showAdd ? 'Cancel' : 'New Habit'}
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div
              style={{
                background:   'rgba(124,58,237,0.05)',
                border:       '1px solid rgba(124,58,237,0.18)',
                borderRadius: 'var(--radius-lg)',
                padding:      '18px 20px',
                marginBottom: 14,
                animation:    'fadeIn 0.2s ease',
              }}
            >
              <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                New Habit
              </p>
              <HabitForm
                skills={skills}
                onSubmit={handleCreate}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}

          {/* Habits list */}
          {habits.length === 0 ? (
            <div
              style={{
                textAlign:    'center',
                padding:      '60px 24px',
                background:   'rgba(255,255,255,0.02)',
                border:       '1px dashed rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>🔁</div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                No habits yet
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)' }}>
                Add your first habit to start building streaks.
              </p>
            </div>
          ) : filteredHabits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
              {filter === 'done' ? 'No completed habits yet today.' : 'All habits completed!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  skills={skills}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── XP info footer ── */}
        {habits.length > 0 && (
          <div
            style={{
              marginTop:    28,
              padding:      '14px 20px',
              background:   'rgba(255,255,255,0.02)',
              border:       '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-lg)',
              display:      'flex',
              gap:          24,
              flexWrap:     'wrap',
            }}
          >
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
              XP rewards — <span style={{ color: '#10b981' }}>Easy +3</span>  ·  <span style={{ color: '#f59e0b' }}>Medium +5</span>  ·  <span style={{ color: '#ef4444' }}>Hard +10</span>
            </p>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>
              Completing habits with a connected skill awards XP to that skill.
            </p>
          </div>
        )}
      </div>

      {/* ── XP toast ── */}
      {xpToast && <XpToast xpResult={xpToast} onDone={() => setXpToast(null)} />}
    </div>
  );
}
