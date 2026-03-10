export default function ErrorBox({ message }) {
  return (
    <div
      style={{
        padding: '11px 14px',
        background: 'var(--danger-bg)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--danger)',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'fadeInUp 0.3s var(--ease)',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  );
}
