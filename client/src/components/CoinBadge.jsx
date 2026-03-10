export default function CoinBadge({ coins, awarded }) {
  return (
    <div
      title={awarded ? 'Coins already earned' : `Earn ${coins} coins on completion`}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        4,
        padding:    '2px 7px',
        borderRadius: 'var(--radius-full)',
        background: awarded
          ? 'rgba(255, 200, 0, 0.08)'
          : 'rgba(255, 200, 0, 0.05)',
        border: `1px solid ${awarded ? 'rgba(255,200,0,0.25)' : 'rgba(255,200,0,0.12)'}`,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill={awarded ? '#f59e0b' : 'none'} stroke={awarded ? '#f59e0b' : '#a16207'} strokeWidth="1.5" />
        <text x="10" y="14" textAnchor="middle" fontSize="10" fill={awarded ? '#1a0a00' : '#a16207'} fontWeight="700" fontFamily="sans-serif">¢</text>
      </svg>
      <span
        style={{
          fontSize:   '0.65rem',
          fontWeight: 600,
          color:      awarded ? '#f59e0b' : '#a16207',
          lineHeight: 1,
        }}
      >
        {coins}
      </span>
    </div>
  );
}
