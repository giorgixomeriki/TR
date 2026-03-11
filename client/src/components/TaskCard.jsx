import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeadlineBadge from './DeadlineBadge';
import CoinBadge from './CoinBadge';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

const STATUS_STRIPE = {
  TODO:        'var(--col-todo)',
  IN_PROGRESS: 'var(--col-progress)',
  DONE:        'var(--col-done)',
};

/* ── Grip handle icon ───────────────────────────────── */
function GripIcon() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
      <circle cx="3" cy="3"  r="1.5" />
      <circle cx="9" cy="3"  r="1.5" />
      <circle cx="3" cy="8"  r="1.5" />
      <circle cx="9" cy="8"  r="1.5" />
      <circle cx="3" cy="13" r="1.5" />
      <circle cx="9" cy="13" r="1.5" />
    </svg>
  );
}

/* ── Small icon button ──────────────────────────────── */
function IconButton({ onClick, title, color, hoverBg, disabled, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:         28,
        height:        28,
        borderRadius:  'var(--radius-sm)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        color:         hovered ? color : 'var(--text-muted)',
        background:    hovered ? hoverBg : 'transparent',
        transition:    'all var(--transition-sm)',
        cursor:        disabled ? 'wait' : 'pointer',
        flexShrink:    0,
      }}
    >
      {children}
    </button>
  );
}

/* ── Task card ──────────────────────────────────────── */
export default function TaskCard({
  task,
  onEdit,
  onDelete,
  dragListeners,
  isDragging  = false,
  overlay     = false,
}) {
  const [hovered,  setHovered]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    await onDelete(task.id);
  };

  const stripeColor = STATUS_STRIPE[task.status] || 'var(--border)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:      'relative',
        background:    hovered && !overlay ? 'var(--surface-hover)' : 'var(--surface-alt)',
        border:        `1px solid ${hovered && !overlay ? 'var(--border-hover)' : 'var(--border)'}`,
        borderLeft:    `3px solid ${stripeColor}`,
        borderRadius:  'var(--radius-md)',
        padding:       '12px 12px 12px 10px',
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
        transition:    'background var(--transition), border-color var(--transition), box-shadow var(--transition)',
        boxShadow:     hovered && !overlay ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        animation:     overlay ? 'none' : 'staggerIn 0.25s var(--ease) both',
        cursor:        overlay ? 'grabbing' : 'default',
        userSelect:    'none',
      }}
    >
      {/* Top row: grip + title + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>

        {/* Drag handle */}
        {!overlay && (
          <div
            {...dragListeners}
            style={{
              color:      'var(--text-muted)',
              paddingTop: 2,
              cursor:     isDragging ? 'grabbing' : 'grab',
              flexShrink: 0,
              opacity:    hovered ? 1 : 0.4,
              transition: 'opacity var(--transition)',
            }}
          >
            <GripIcon />
          </div>
        )}

        {/* Title — click to open workspace */}
        <h3
          onClick={() => navigate(`/task/${task.id}`)}
          title="Open task workspace"
          style={{
            flex:          1,
            fontSize:      '0.9rem',
            fontWeight:    600,
            color:         task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text)',
            textDecoration:task.status === 'DONE' ? 'line-through' : 'none',
            lineHeight:    1.45,
            wordBreak:     'break-word',
            cursor:        'pointer',
          }}
          onMouseEnter={(e) => { if (task.status !== 'DONE') e.currentTarget.style.color = 'var(--primary-light)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text)'; }}
        >
          {task.title}
        </h3>

        {/* Focus / Edit / Delete — visible on hover */}
        {!overlay && (
          <div
            style={{
              display:  'flex',
              gap:      2,
              opacity:  hovered ? 1 : 0,
              transition:'opacity var(--transition)',
              flexShrink:0,
            }}
          >
            <IconButton
              onClick={() => navigate(`/focus/${task.id}`)}
              title="Start Focus Session"
              color="var(--col-progress)"
              hoverBg="rgba(245,158,11,0.12)"
            >
              {/* Zap / lightning icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </IconButton>

            <IconButton
              onClick={() => navigate(`/arena/${task.id}`)}
              title="Enter Focus Arena"
              color="#a78bfa"
              hoverBg="rgba(124,58,237,0.14)"
            >
              {/* Shield / arena icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </IconButton>

            <IconButton
              onClick={() => onEdit(task)}
              title="Edit task"
              color="var(--primary-light)"
              hoverBg="rgba(59,130,246,0.12)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </IconButton>

            <IconButton
              onClick={handleDelete}
              title="Delete task"
              color="var(--danger)"
              hoverBg="var(--danger-bg)"
              disabled={deleting}
            >
              {deleting ? (
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--danger)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              )}
            </IconButton>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p
          style={{
            fontSize:           '0.8rem',
            color:              'var(--text-muted)',
            lineHeight:         1.55,
            paddingLeft:        20,
            display:            '-webkit-box',
            WebkitLineClamp:    2,
            WebkitBoxOrient:    'vertical',
            overflow:           'hidden',
          }}
        >
          {task.description}
        </p>
      )}

      {/* Footer: deadline + created date */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingLeft:    20,
          marginTop:      2,
          flexWrap:       'wrap',
          gap:            6,
        }}
      >
        <DeadlineBadge dueDate={task.dueDate} status={task.status} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.rewardCoins > 0 && (
            <CoinBadge coins={task.rewardCoins} awarded={task.coinsAwarded} />
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {formatDate(task.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
