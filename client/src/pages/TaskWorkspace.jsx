import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask } from '../services/taskService';
import SubtaskList from '../components/SubtaskList';
import AttachmentUploader from '../components/AttachmentUploader';
import FocusTimer from '../components/FocusTimer';
import AIAdvisorPanel from '../components/AIAdvisorPanel';
import CoinBadge from '../components/CoinBadge';
import DeadlineBadge from '../components/DeadlineBadge';
import SkillTagSelector from '../components/SkillTagSelector';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Helpers ────────────────────────────────────────── */
const STATUS_META = {
  TODO:        { label: 'To Do',       color: 'var(--col-todo)' },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--col-progress)' },
  DONE:        { label: 'Done',        color: 'var(--col-done)' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

/* ── Section wrapper ─────────────────────────────────── */
function WorkspaceSection({ title, icon, children, accent = 'var(--border)' }) {
  return (
    <section>
      <div
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           10,
          marginBottom:  14,
          paddingBottom: 10,
          borderBottom:  `1px solid var(--border)`,
        }}
      >
        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {title}
        </span>
        {icon}
      </div>
      {children}
    </section>
  );
}

/* ── Main component ─────────────────────────────────── */
export default function TaskWorkspace() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [task,       setTask]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  // Editable fields
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [notes,       setNotes]       = useState('');
  const [status,      setStatus]      = useState('TODO');
  const [dueDate,     setDueDate]     = useState('');
  const [skillIds,    setSkillIds]    = useState([]);

  // Notes auto-save debounce
  const notesSaveTimer = useRef(null);
  const [notesSaved,   setNotesSaved] = useState(false);

  /* ── Load task ── */
  const fetchTask = useCallback(async () => {
    try {
      const data = await getTask(id);
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setNotes(data.notes || '');
      setStatus(data.status);
      setDueDate(formatDateForInput(data.dueDate));
      setSkillIds(data.taskSkills?.map((ts) => ts.skillId) ?? []);
    } catch {
      setError('Task not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTask(); }, [fetchTask]);

  /* ── ESC to go back ── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/dashboard'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  /* ── Save main details ── */
  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await updateTask(id, {
        title: title.trim(),
        description: description.trim(),
        status,
        dueDate: dueDate || null,
        skillIds,
      });
      setTask((prev) => ({ ...prev, ...updated }));
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /* ── Auto-save notes on change (500 ms debounce) ── */
  const handleNotesChange = (val) => {
    setNotes(val);
    setNotesSaved(false);
    clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      try {
        await updateTask(id, { notes: val });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } catch { /* silent */ }
    }, 600);
  };

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <LoadingSpinner size={44} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
        <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-gradient" style={{ padding: '10px 24px' }}>← Back to Dashboard</button>
      </div>
    );
  }

  const meta = STATUS_META[status] || STATUS_META.TODO;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <header
        style={{
          position:       'sticky',
          top:            0,
          zIndex:         100,
          height:         58,
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          padding:        '0 24px',
          background:     'rgba(9,9,11,0.90)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter:'blur(18px)',
          borderBottom:   '1px solid var(--border)',
        }}
      >
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         6,
            padding:     '6px 12px',
            borderRadius:'var(--radius-md)',
            border:      '1px solid var(--border)',
            color:       'var(--text-muted)',
            background:  'transparent',
            fontSize:    '0.8rem',
            cursor:      'pointer',
            flexShrink:  0,
            transition:  'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Dashboard
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize:      '0.9rem',
              fontWeight:    700,
              color:         'var(--text)',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
              whiteSpace:    'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {task?.title}
          </p>
        </div>

        {/* Status badge */}
        <div
          style={{
            padding:      '4px 12px',
            borderRadius: 'var(--radius-full)',
            background:   `color-mix(in srgb, ${meta.color} 12%, transparent)`,
            border:       `1px solid color-mix(in srgb, ${meta.color} 35%, transparent)`,
            fontSize:     '0.72rem',
            fontWeight:   700,
            color:        meta.color,
            letterSpacing:'0.06em',
            textTransform:'uppercase',
            flexShrink:   0,
          }}
        >
          {meta.label}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient"
          style={{ padding: '7px 18px', flexShrink: 0, fontSize: '0.82rem' }}
        >
          {saving ? 'Saving…' : saveMsg || 'Save Changes'}
        </button>

        {/* ESC hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <kbd style={{ padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--surface-alt)', fontFamily: 'monospace' }}>
            ESC
          </kbd>
        </div>
      </header>

      {/* ── Two-panel body ── */}
      <div
        style={{
          flex:                1,
          display:             'grid',
          gridTemplateColumns: '1fr 340px',
          gap:                 0,
          maxWidth:            1600,
          width:               '100%',
          margin:              '0 auto',
          padding:             '0 0 60px',
        }}
      >

        {/* ── LEFT PANEL ─────────────────────────────── */}
        <div
          style={{
            padding:     '32px 40px',
            borderRight: '1px solid var(--border)',
            display:     'flex',
            flexDirection:'column',
            gap:         36,
            overflowY:   'auto',
          }}
        >
          {/* Title + description */}
          <WorkspaceSection title="Task Details" accent="var(--primary)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base"
                  style={{ fontSize: '1.05rem', fontWeight: 700, padding: '12px 14px' }}
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base"
                  placeholder="Describe the task..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
              </div>

              {/* Status + Due date + Meta row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 12, alignItems: 'start' }}>
                {/* Status segmented */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Status
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Object.entries(STATUS_META).map(([val, { label, color }]) => {
                      const active = status === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setStatus(val)}
                          style={{
                            padding:      '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border:       `1px solid ${active ? color : 'var(--border)'}`,
                            background:   active ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--surface-alt)',
                            color:        active ? color : 'var(--text-muted)',
                            fontSize:     '0.72rem',
                            fontWeight:   active ? 700 : 400,
                            cursor:       'pointer',
                            whiteSpace:   'nowrap',
                            transition:   'all var(--transition-sm)',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-base"
                    style={{ colorScheme: 'dark', padding: '6px 10px', fontSize: '0.83rem' }}
                  />
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 2 }}>
                  {task?.rewardCoins > 0 && (
                    <CoinBadge coins={task.rewardCoins} awarded={task.coinsAwarded} />
                  )}
                  {task?.dueDate && (
                    <DeadlineBadge dueDate={task.dueDate} status={task.status} />
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Skills
                </label>
                <SkillTagSelector selectedIds={skillIds} onChange={setSkillIds} />
              </div>
            </div>
          </WorkspaceSection>

          {/* Subtasks */}
          <WorkspaceSection title="Subtasks" accent="var(--col-progress)">
            <SubtaskList taskId={id} initialSubtasks={task?.subtasks || []} />
          </WorkspaceSection>

          {/* Notes */}
          <WorkspaceSection title="Notes" accent="var(--accent)">
            <div style={{ position: 'relative' }}>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Write development notes, ideas, observations, links..."
                className="input-base"
                rows={6}
                style={{ resize: 'vertical', minHeight: 140, lineHeight: 1.7, fontSize: '0.875rem' }}
              />
              {notesSaved && (
                <span
                  style={{
                    position:  'absolute',
                    bottom:    10,
                    right:     12,
                    fontSize:  '0.65rem',
                    color:     'var(--col-done)',
                    animation: 'fadeIn 0.3s ease',
                    pointerEvents: 'none',
                  }}
                >
                  ✓ Saved
                </span>
              )}
            </div>
          </WorkspaceSection>

          {/* Attachments */}
          <WorkspaceSection title="Attachments" accent="var(--col-todo)">
            <AttachmentUploader taskId={id} initialAttachments={task?.attachments || []} />
          </WorkspaceSection>

          {/* Focus Timer */}
          <WorkspaceSection title="Focus Timer" accent="var(--col-done)">
            <FocusTimer />
          </WorkspaceSection>
        </div>

        {/* ── RIGHT PANEL — AI Advisor ────────────────── */}
        <div
          style={{
            padding:        '32px 24px',
            display:        'flex',
            flexDirection:  'column',
            position:       'sticky',
            top:            58,
            height:         'calc(100vh - 58px)',
            overflowY:      'auto',
            background:     'var(--surface)',
          }}
        >
          {task && <AIAdvisorPanel task={task} />}
        </div>
      </div>
    </div>
  );
}
