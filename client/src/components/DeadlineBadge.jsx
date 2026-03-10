// Returns 'overdue' | 'today' | 'upcoming' | 'done' | null
function getDeadlineStatus(dueDate, taskStatus) {
  if (!dueDate) return null;
  if (taskStatus === 'DONE') return 'done';

  const now     = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due     = new Date(dueDate);
  const dueMs   = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());

  if (dueMs < todayMs) return 'overdue';
  if (dueMs === todayMs) return 'today';
  return 'upcoming';
}

function formatDueDate(dueDate) {
  return new Date(dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    timeZone: 'UTC',
  });
}

export default function DeadlineBadge({ dueDate, status }) {
  const state = getDeadlineStatus(dueDate, status);
  if (!state) return null;

  const formatted = formatDueDate(dueDate);

  const configs = {
    overdue:  { color: 'var(--danger)',   bg: 'var(--danger-bg)',   icon: '⚠', text: `Overdue · ${formatted}` },
    today:    { color: 'var(--warning)',  bg: 'var(--warning-bg)',  icon: '◎', text: `Due Today · ${formatted}` },
    upcoming: { color: 'var(--text-muted)', bg: 'transparent',      icon: '◷', text: formatted },
    done:     { color: 'var(--text-muted)', bg: 'transparent',      icon: '◷', text: formatted },
  };

  const { color, bg, icon, text } = configs[state];

  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          4,
        fontSize:     '0.72rem',
        fontWeight:   state === 'overdue' || state === 'today' ? 600 : 400,
        color,
        background:   bg,
        borderRadius: 'var(--radius-sm)',
        padding:      bg !== 'transparent' ? '2px 7px' : '0',
        letterSpacing: '0.01em',
      }}
    >
      {icon} {text}
    </span>
  );
}
