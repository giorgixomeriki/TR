import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkillTagSelector from './SkillTagSelector';

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'To Do',       color: 'var(--col-todo)' },
  { value: 'IN_PROGRESS', label: 'In Progress',  color: 'var(--col-progress)' },
  { value: 'DONE',        label: 'Done',         color: 'var(--col-done)' },
];

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0]; // "2024-03-15T00:00:00.000Z" → "2024-03-15"
}

export default function TaskModal({ task, defaultStatus = 'TODO', onSave, onClose }) {
  const isEdit = Boolean(task);

  const [title,       setTitle]       = useState(task?.title       || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status,      setStatus]      = useState(task?.status      || defaultStatus);
  const [dueDate,     setDueDate]     = useState(formatDateForInput(task?.dueDate));
  const [rewardCoins, setRewardCoins] = useState(task?.rewardCoins ?? 10);
  const [skillIds,    setSkillIds]    = useState(() => task?.taskSkills?.map((ts) => ts.skillId) ?? []);
  const [error,       setError]       = useState('');
  const [saving,      setSaving]      = useState(false);

  const titleRef = useRef(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 60);

    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())            { setError('Title is required.');                    return; }
    if (title.trim().length > 200) { setError('Title must be under 200 characters.'); return; }

    setSaving(true);
    setError('');
    try {
      await onSave({
        title:       title.trim(),
        description: description.trim(),
        status,
        dueDate:     dueDate || null,
        rewardCoins: Number(rewardCoins),
        skillIds,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        background:     'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        animation:      'fadeIn 0.18s ease',
      }}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     500,
          background:   'var(--bg-elevated)',
          border:       '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-xl)',
          padding:      '28px 28px 24px',
          boxShadow:    '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          animation:    'modalIn 0.25s var(--ease)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
              {isEdit ? 'Edit Task' : 'New Task'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isEdit ? 'Update your task details.' : 'What needs to get done?'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width:         30,
              height:        30,
              borderRadius:  'var(--radius-sm)',
              color:         'var(--text-muted)',
              background:    'var(--surface-alt)',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              transition:    'all var(--transition-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface-alt)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title */}
          <FieldGroup label="Title *">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="e.g. Finish the quarterly report"
              className="input-base"
              maxLength={200}
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or notes..."
              rows={3}
              className="input-base"
              style={{ resize: 'vertical', minHeight: 76 }}
            />
          </FieldGroup>

          {/* Status + Due Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Status segmented control */}
            <FieldGroup label="Status">
              <div style={{ display: 'flex', gap: 4 }}>
                {STATUS_OPTIONS.map(({ value, label, color }) => {
                  const active = status === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      style={{
                        flex:         1,
                        padding:      '7px 4px',
                        borderRadius: 'var(--radius-sm)',
                        border:       `1px solid ${active ? color : 'var(--border)'}`,
                        background:   active ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--surface-alt)',
                        color:        active ? color : 'var(--text-muted)',
                        fontSize:     '0.68rem',
                        fontWeight:   active ? 700 : 400,
                        letterSpacing:'0.03em',
                        cursor:       'pointer',
                        transition:   'all var(--transition-sm)',
                        whiteSpace:   'nowrap',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>

            {/* Due date */}
            <FieldGroup label="Due Date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-base"
                style={{ colorScheme: 'dark' }}
              />
            </FieldGroup>
          </div>

          {/* Reward coins */}
          {!task?.coinsAwarded && (
            <FieldGroup label="Reward Coins">
              <div className="coin-input-wrap">
                <span className="coin-prefix">¢</span>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={rewardCoins}
                  onChange={(e) => setRewardCoins(Math.max(0, Math.min(10000, parseInt(e.target.value, 10) || 0)))}
                  className="input-base"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </FieldGroup>
          )}

          {/* Skill tags */}
          <FieldGroup label="Skills">
            <SkillTagSelector selectedIds={skillIds} onChange={setSkillIds} />
          </FieldGroup>

          {/* Error */}
          {error && (
            <div
              style={{
                padding:      '9px 13px',
                background:   'var(--danger-bg)',
                border:       '1px solid rgba(239,68,68,0.22)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--danger)',
                fontSize:     '0.83rem',
                display:      'flex',
                alignItems:   'center',
                gap:          7,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex:         1,
                padding:      '11px',
                borderRadius: 'var(--radius-md)',
                border:       '1px solid var(--border)',
                color:        'var(--text-secondary)',
                background:   'transparent',
                fontSize:     '0.875rem',
                fontWeight:   500,
                cursor:       'pointer',
                transition:   'all var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient"
              style={{ flex: 2, padding: '11px' }}
            >
              {saving ? <LoadingSpinner size={17} /> : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize:      '0.72rem',
          fontWeight:    600,
          color:         'var(--text-muted)',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
