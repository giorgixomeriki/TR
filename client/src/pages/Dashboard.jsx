import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import LoadingSpinner from '../components/LoadingSpinner';
import CoinDisplay from '../components/CoinDisplay';
import CoinToast from '../components/CoinToast';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService';
import { getCoins } from '../services/userService';
import { getFocusStats } from '../services/focusService';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDeadlineCounts(tasks) {
  const now     = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  let overdue = 0;
  let dueToday = 0;

  tasks.forEach((t) => {
    if (!t.dueDate || t.status === 'DONE') return;
    const due   = new Date(t.dueDate);
    const dueMs = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
    if (dueMs < todayMs)       overdue++;
    else if (dueMs === todayMs) dueToday++;
  });

  return { overdue, dueToday };
}

/* ── Stat chip ─────────────────────────────────────── */
function StatChip({ label, value, color }) {
  return (
    <div
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '7px 14px',
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        animation:    'fadeInUp 0.4s var(--ease) both',
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: 700, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

function fmtFocusTime(mins) {
  if (mins === 0) return '0m';
  if (mins < 60)  return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;
}

/* ── Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();

  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultCol,  setDefaultCol]  = useState('TODO');
  const [totalCoins,  setTotalCoins]  = useState(0);
  const [toast,       setToast]       = useState(null); // { coins: number }
  const [focusStats,  setFocusStats]  = useState({ todayMinutes: 0, todaySessions: 0, streak: 0 });

  /* ── Data fetching ── */
  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      setError('Failed to load tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    getCoins().then(setTotalCoins).catch(() => {});
  }, []);

  useEffect(() => {
    getFocusStats().then(setFocusStats).catch(() => {});
  }, []);

  /* ── CRUD handlers ── */
  const handleCreate = async (taskData) => {
    const task = await createTask(taskData);
    setTasks((prev) => [task, ...prev]);
    setShowModal(false);
  };

  const handleUpdate = async (taskData) => {
    const updated = await updateTask(editingTask.id, taskData);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (updated.coinsEarned > 0) {
      setTotalCoins((c) => c + updated.coinsEarned);
      setToast({ coins: updated.coinsEarned });
    }
    setEditingTask(null);
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  /* ── Drag-and-drop status change (optimistic) ── */
  const handleStatusChange = async (id, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    try {
      const updated = await updateTask(id, { status: newStatus });
      // Sync server state (coinsAwarded flag may have changed)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (updated.coinsEarned > 0) {
        setTotalCoins((c) => c + updated.coinsEarned);
        setToast({ coins: updated.coinsEarned });
      }
    } catch {
      fetchTasks(); // revert on failure
    }
  };

  /* ── Modal helpers ── */
  const openCreate = (status = 'TODO') => {
    setDefaultCol(status);
    setShowModal(true);
  };
  const openEdit  = (task) => setEditingTask(task);
  const closeModal = () => { setShowModal(false); setEditingTask(null); };

  /* ── Derived stats ── */
  const total                    = tasks.length;
  const done                     = tasks.filter((t) => t.status === 'DONE').length;
  const { overdue, dueToday }    = getDeadlineCounts(tasks);
  const firstName                = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, padding: '28px 24px 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>

        {/* ── Page header ── */}
        <header style={{ marginBottom: 28, animation: 'fadeInDown 0.35s var(--ease)' }}>
          <div
            style={{
              display:        'flex',
              alignItems:     'flex-end',
              justifyContent: 'space-between',
              gap:            16,
              marginBottom:   20,
              flexWrap:       'wrap',
            }}
          >
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                {getGreeting()}, {firstName}
              </p>
              <h1
                style={{
                  fontSize:      'clamp(1.5rem, 3.5vw, 2.1rem)',
                  fontWeight:    800,
                  color:         'var(--text)',
                  letterSpacing: '-0.03em',
                  lineHeight:    1.1,
                }}
              >
                Your Workspace
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <CoinDisplay totalCoins={totalCoins} />
              <button
                onClick={() => openCreate('TODO')}
                className="btn-gradient"
                style={{ padding: '10px 20px' }}
              >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
                New Task
              </button>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatChip label="Total"     value={total} />
            <StatChip label="Done"      value={done}     color="var(--col-done)" />
            {overdue  > 0 && <StatChip label="Overdue"   value={overdue}   color="var(--danger)" />}
            {dueToday > 0 && <StatChip label="Due Today" value={dueToday}  color="var(--col-progress)" />}
          </div>

          {/* ── Focus stats row ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          6,
                padding:      '5px 12px',
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                animation:    'fadeInUp 0.45s var(--ease) both',
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>⚡</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                {fmtFocusTime(focusStats.todayMinutes)}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Focus Today
              </span>
            </div>
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          6,
                padding:      '5px 12px',
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                animation:    'fadeInUp 0.45s 0.05s var(--ease) both',
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)' }}>
                {focusStats.todaySessions}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Session{focusStats.todaySessions !== 1 ? 's' : ''}
              </span>
            </div>
            {focusStats.streak > 0 && (
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          5,
                  padding:      '5px 12px',
                  background:   'rgba(245,158,11,0.06)',
                  border:       '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 'var(--radius-md)',
                  animation:    'fadeInUp 0.45s 0.10s var(--ease) both',
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>🔥</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>
                  {focusStats.streak}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(245,158,11,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Day Streak
                </span>
              </div>
            )}
          </div>
        </header>

        {/* ── Error banner ── */}
        {error && (
          <div
            style={{
              padding:      '13px 16px',
              background:   'var(--danger-bg)',
              border:       '1px solid rgba(239,68,68,0.22)',
              borderRadius: 'var(--radius-md)',
              color:        'var(--danger)',
              fontSize:     '0.875rem',
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Board ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={openCreate}
          />
        )}
      </main>

      {/* ── Modals ── */}
      {showModal && (
        <TaskModal
          defaultStatus={defaultCol}
          onSave={handleCreate}
          onClose={closeModal}
        />
      )}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onSave={handleUpdate}
          onClose={closeModal}
        />
      )}

      {toast && (
        <CoinToast coins={toast.coins} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
