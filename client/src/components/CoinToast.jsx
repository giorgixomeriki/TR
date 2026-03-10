import { useEffect, useState } from 'react';

export default function CoinToast({ coins, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300); // wait for fade-out
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     28,
        right:      24,
        zIndex:     1000,
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        padding:    '12px 18px',
        background: 'linear-gradient(135deg, #1c1400 0%, #0f0900 100%)',
        border:     '1px solid rgba(245,158,11,0.35)',
        borderRadius: 'var(--radius-md)',
        boxShadow:  '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.08)',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        animation:  'coinToastIn 0.35s var(--ease)',
        pointerEvents: 'none',
      }}
    >
      {/* Animated coin */}
      <div style={{ animation: 'coinSpin 0.5s ease' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="rgba(245,158,11,0.22)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="11" fill="#f59e0b" fontWeight="800" fontFamily="sans-serif">¢</text>
        </svg>
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
          +{coins} coins earned!
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(245,158,11,0.55)' }}>
          Task completed
        </div>
      </div>
    </div>
  );
}
