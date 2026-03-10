import { useState, useEffect } from 'react';
import { completeFocusSession } from '../services/focusService';
import LoadingSpinner from './LoadingSpinner';

const XP_PER_LEVEL = 500;

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

/* ── XP progress bar ──────────────────────────────────── */
function XpBar({ gain, animate }) {
  const xpInLevel   = gain.newXp % XP_PER_LEVEL;
  const pct          = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);
  const prevXp       = gain.newXp - gain.xpGained;
  const prevPct      = Math.min(100, ((prevXp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: '1rem' }}>{gain.skillIcon}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {gain.skillName}
          </span>
          {gain.leveled && (
            <span
              style={{
                fontSize:     '0.62rem',
                fontWeight:   700,
                color:        '#f59e0b',
                background:   'rgba(245,158,11,0.12)',
                border:       '1px solid rgba(245,158,11,0.25)',
                borderRadius: 'var(--radius-full)',
                padding:      '1px 7px',
                letterSpacing:'0.04em',
                animation:    'scaleIn 0.4s 0.3s var(--ease) both',
              }}
            >
              LVL UP!
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize:   '0.72rem',
              fontWeight: 700,
              color:      gain.skillColor || 'var(--primary-light)',
              animation:  animate ? 'fadeIn 0.4s 0.2s both' : 'none',
            }}
          >
            +{gain.xpGained} XP
          </span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
            Lv {gain.newLevel}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div
        style={{
          height:       5,
          background:   'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-full)',
          overflow:     'hidden',
        }}
      >
        {/* Previous fill (static) */}
        <div
          style={{
            height:       '100%',
            width:        `${prevPct}%`,
            background:   `${gain.skillColor || '#3b82f6'}55`,
            borderRadius: 'var(--radius-full)',
          }}
        />
        {/* New fill (animated) */}
        <div
          style={{
            height:       '100%',
            width:        animate ? `${pct}%` : `${prevPct}%`,
            background:   gain.skillColor || '#3b82f6',
            borderRadius: 'var(--radius-full)',
            marginTop:    -5,
            boxShadow:    `0 0 8px ${gain.skillColor || '#3b82f6'}80`,
            transition:   animate ? 'width 0.8s cubic-bezier(0.16,1,0.3,1)' : 'none',
          }}
        />
      </div>

      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
        {xpInLevel} / {XP_PER_LEVEL} XP to Lv {gain.newLevel + 1}
      </p>
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function FocusSessionSummary({ sessionId, duration, onSave, onStartBreak }) {
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [result,  setResult]  = useState(null); // null = input state, object = success state
  const [animate, setAnimate] = useState(false);

  /* Trigger bar animations shortly after result appears */
  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setAnimate(true), 120);
      return () => clearTimeout(t);
    }
  }, [result]);

  const doComplete = async (noteText, thenBreak = false) => {
    setSaving(true);
    let afterSave = null;
    try {
      if (sessionId) {
        const data = await completeFocusSession(sessionId, duration, noteText || null);
        if (thenBreak) {
          afterSave = () => onStartBreak();
        } else {
          setResult(data);
          afterSave = () => setTimeout(() => onSave(data), 2400);
        }
      } else {
        afterSave = thenBreak ? () => onStartBreak() : () => onSave({ coinsEarned: 0, bonusCoins: 0, xpGains: [] });
      }
    } catch {
      afterSave = thenBreak ? () => onStartBreak() : () => onSave({ coinsEarned: 0, bonusCoins: 0, xpGains: [] });
    } finally {
      setSaving(false);
    }
    afterSave?.();
  };

  const totalCoins = result ? result.coinsEarned + (result.bonusCoins ?? 0) : 0;

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         500,
        background:     'rgba(0,0,0,0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        animation:      'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     500,
          background:   '#0c0c16',
          border:       '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding:      '36px 32px',
          boxShadow:    '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.02)',
          animation:    'modalIn 0.35s var(--ease)',
          maxHeight:    '90vh',
          overflowY:    'auto',
        }}
      >
        {result ? (
          /* ── Success state ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeInUp 0.35s var(--ease)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width:          56,
                  height:         56,
                  borderRadius:   '50%',
                  background:     'rgba(16,185,129,0.1)',
                  border:         '1px solid rgba(16,185,129,0.22)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       '1.5rem',
                  margin:         '0 auto 14px',
                  animation:      'scaleIn 0.4s var(--ease)',
                }}
              >
                🏆
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Arena Session Complete
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                {fmtDuration(duration)} of deep work
              </p>
            </div>

            {/* Rewards */}
            <div
              style={{
                background:   'rgba(245,158,11,0.06)',
                border:       '1px solid rgba(245,158,11,0.14)',
                borderRadius: 'var(--radius-lg)',
                padding:      '18px 20px',
                display:      'flex',
                flexDirection:'column',
                gap:          10,
              }}
            >
              <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
                Rewards Earned
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>🪙</span>
                <div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>+{result.coinsEarned}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>focus coins</span>
                </div>
              </div>

              {result.bonusCoins > 0 && (
                <div
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                    padding:      '10px 14px',
                    background:   'rgba(245,158,11,0.1)',
                    border:       '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    animation:    'scaleIn 0.4s 0.2s var(--ease) both',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>🔥</span>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>+{result.bonusCoins}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(245,158,11,0.7)', marginLeft: 6, fontWeight: 600 }}>
                      session streak bonus!
                    </span>
                  </div>
                </div>
              )}

              {totalCoins > result.coinsEarned && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                    Total: +{totalCoins} coins
                  </span>
                </div>
              )}
            </div>

            {/* XP Gains */}
            {result.xpGains?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Skill XP Gained
                </p>
                {result.xpGains.map((gain) => (
                  <XpBar key={gain.skillId} gain={gain} animate={animate} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Input state ── */
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 12, lineHeight: 1 }}>⚔️</div>
              <h2
                style={{
                  fontSize:      '1.15rem',
                  fontWeight:    800,
                  color:         '#fff',
                  letterSpacing: '-0.03em',
                  marginBottom:  6,
                }}
              >
                Arena Session Complete
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                {fmtDuration(duration)} of focused training
              </p>
              {sessionId && (
                <div
                  style={{
                    display:      'inline-flex',
                    alignItems:   'center',
                    gap:          6,
                    padding:      '5px 14px',
                    background:   'rgba(245,158,11,0.08)',
                    border:       '1px solid rgba(245,158,11,0.18)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>🪙</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f59e0b' }}>
                    +10 coins + skill XP on save
                  </span>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />

            {/* Note */}
            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  display:       'block',
                  fontSize:      '0.62rem',
                  fontWeight:    700,
                  color:         'rgba(255,255,255,0.28)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom:  9,
                }}
              >
                What did you accomplish?
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Pushed through the hard part, fixed that edge case, understood the concept..."
                rows={4}
                autoFocus
                style={{
                  width:        '100%',
                  background:   'rgba(255,255,255,0.04)',
                  border:       '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding:      '12px 14px',
                  color:        'rgba(255,255,255,0.8)',
                  fontSize:     '0.875rem',
                  lineHeight:   1.65,
                  resize:       'vertical',
                  minHeight:    96,
                  outline:      'none',
                  fontFamily:   'inherit',
                  boxSizing:    'border-box',
                  transition:   'border-color 0.15s ease',
                }}
                onFocus={(e)  => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                onBlur={(e)   => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
              <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', marginTop: 6 }}>
                Optional — earns bonus XP and builds your session journal
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => doComplete(note, true)}
                disabled={saving}
                style={{
                  flex:         1,
                  padding:      '11px',
                  borderRadius: 'var(--radius-md)',
                  border:       '1px solid rgba(255,255,255,0.09)',
                  color:        'rgba(255,255,255,0.45)',
                  background:   'transparent',
                  fontSize:     '0.85rem',
                  fontWeight:   500,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                  transition:   'all var(--transition)',
                }}
                onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
              >
                💤 Take a Break
              </button>

              <button
                onClick={() => doComplete(note, false)}
                disabled={saving}
                style={{
                  flex:           2,
                  padding:        '11px',
                  borderRadius:   'var(--radius-md)',
                  border:         'none',
                  background:     'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     700,
                  cursor:         saving ? 'not-allowed' : 'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            6,
                  boxShadow:      '0 4px 20px rgba(124,58,237,0.4)',
                  transition:     'all var(--transition)',
                  opacity:        saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,58,237,0.56)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'; }}
              >
                {saving ? <LoadingSpinner size={16} /> : '⚔️ Complete Session'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
