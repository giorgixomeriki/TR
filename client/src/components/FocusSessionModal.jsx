import { useState } from 'react';
import { completeFocusSession } from '../services/focusService';
import LoadingSpinner from './LoadingSpinner';

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

export default function FocusSessionModal({ sessionId, duration, onSave, onStartBreak }) {
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [earned, setEarned] = useState(0);

  const doComplete = async (noteText, thenBreak = false) => {
    setSaving(true);
    let afterSave = null; // callback to run after finally, so we don't setState on unmounted component
    try {
      if (sessionId) {
        const result = await completeFocusSession(sessionId, duration, noteText || null);
        if (thenBreak) {
          afterSave = () => onStartBreak();
        } else {
          setEarned(result.coinsEarned);
          setSaved(true);
          afterSave = () => setTimeout(() => onSave({ coinsEarned: result.coinsEarned }), 1800);
        }
      } else {
        afterSave = thenBreak ? () => onStartBreak() : () => onSave({ coinsEarned: 0 });
      }
    } catch {
      afterSave = thenBreak ? () => onStartBreak() : () => onSave({ coinsEarned: 0 });
    } finally {
      setSaving(false);
    }
    afterSave?.();
  };

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         500,
        background:     'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
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
          maxWidth:     460,
          background:   '#0c0c14',
          border:       '1px solid rgba(255,255,255,0.09)',
          borderRadius: '22px',
          padding:      '36px 30px',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)',
          animation:    'modalIn 0.3s var(--ease)',
        }}
      >
        {saved ? (
          /* ── Success state ── */
          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              gap:           18,
              textAlign:     'center',
              animation:     'scaleIn 0.3s var(--ease)',
            }}
          >
            <div
              style={{
                width:        60,
                height:       60,
                borderRadius: '50%',
                background:   'rgba(16,185,129,0.12)',
                border:       '1px solid rgba(16,185,129,0.25)',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                fontSize:     '1.6rem',
              }}
            >
              ✓
            </div>
            <div>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
                Session Saved
              </p>
              <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)' }}>
                Keep building — great things compound.
              </p>
            </div>
            {earned > 0 && (
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          8,
                  padding:      '10px 22px',
                  background:   'rgba(245,158,11,0.1)',
                  border:       '1px solid rgba(245,158,11,0.22)',
                  borderRadius: 'var(--radius-full)',
                  animation:    'scaleIn 0.35s 0.15s var(--ease) both',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🪙</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
                  +{earned} coins
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ── Input state ── */
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 12, lineHeight: 1 }}>🎯</div>
              <h2
                style={{
                  fontSize:      '1.2rem',
                  fontWeight:    800,
                  color:         '#fff',
                  letterSpacing: '-0.03em',
                  marginBottom:  6,
                }}
              >
                Focus Session Complete
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', marginBottom: 14 }}>
                {fmtDuration(duration)} of deep work finished
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
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
                    +10 coins on save
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 22 }} />

            {/* Accomplishment note */}
            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  display:       'block',
                  fontSize:      '0.65rem',
                  fontWeight:    700,
                  color:         'rgba(255,255,255,0.3)',
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
                placeholder="Finished the auth module, fixed the login bug, reviewed PRs..."
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
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                Optional — builds your session journal over time
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
                  background:     'var(--primary)',
                  color:          '#fff',
                  fontSize:       '0.9rem',
                  fontWeight:     700,
                  cursor:         saving ? 'not-allowed' : 'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            6,
                  boxShadow:      '0 4px 16px rgba(59,130,246,0.35)',
                  transition:     'all var(--transition)',
                  opacity:        saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.boxShadow = '0 6px 22px rgba(59,130,246,0.48)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.35)'; }}
              >
                {saving ? <LoadingSpinner size={16} /> : '✓ Save & Complete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
