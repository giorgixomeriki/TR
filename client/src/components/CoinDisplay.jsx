export default function CoinDisplay({ totalCoins }) {
  return (
    <div
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        8,
        padding:    '8px 14px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(251,191,36,0.06) 100%)',
        border:     '1px solid rgba(245,158,11,0.22)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Coin icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="rgba(245,158,11,0.20)" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="12" y="16.5" textAnchor="middle" fontSize="11" fill="#f59e0b" fontWeight="800" fontFamily="sans-serif">¢</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          style={{
            fontSize:   '1rem',
            fontWeight: 800,
            color:      '#f59e0b',
            letterSpacing: '-0.02em',
          }}
        >
          {totalCoins.toLocaleString()}
        </span>
        <span
          style={{
            fontSize:      '0.6rem',
            color:         'rgba(245,158,11,0.55)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          coins
        </span>
      </div>
    </div>
  );
}
