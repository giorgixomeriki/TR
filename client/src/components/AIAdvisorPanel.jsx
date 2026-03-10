import { useState } from 'react';
import { getTaskAdvice } from '../services/aiService';

function Section({ title, children, color = 'var(--primary-light)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function AIAdvisorPanel({ task }) {
  const [advice,  setAdvice]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getTaskAdvice({ title: task.title, description: task.description });
      setAdvice(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get AI advice. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height:        '100%',
        display:       'flex',
        flexDirection: 'column',
        gap:           20,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {/* AI spark icon */}
          <div
            style={{
              width:        32,
              height:       32,
              borderRadius: 'var(--radius-sm)',
              background:   'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(139,92,246,0.10))',
              border:       '1px solid rgba(99,102,241,0.25)',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              fontSize:      16,
            }}
          >
            ✦
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>AI Advisor</p>
            <p style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Powered by Claude</p>
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--border)', marginTop: 12 }} />
      </div>

      {/* Content */}
      {!advice && !loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', padding: '0 8px' }}>
          <div style={{ fontSize: 32 }}>✦</div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              Get task guidance
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              AI will analyze your task and provide step-by-step advice, time estimates, and skill recommendations.
            </p>
          </div>
          {error && (
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', width: '100%' }}>
              {error}
            </p>
          )}
          <button
            onClick={handleFetch}
            className="btn-gradient"
            style={{ padding: '10px 24px', width: '100%' }}
          >
            Get AI Advice
          </button>
        </div>
      )}

      {loading && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div
            style={{
              width:        36,
              height:       36,
              borderRadius: '50%',
              border:       '3px solid var(--border)',
              borderTopColor:'var(--accent)',
              animation:    'spin 0.8s linear infinite',
            }}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzing task...</p>
        </div>
      )}

      {advice && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {/* Breakdown */}
          <Section title="Task Breakdown" color="var(--primary-light)">
            <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {advice.breakdown}
            </p>
          </Section>

          {/* Steps */}
          {advice.steps?.length > 0 && (
            <Section title="Suggested Steps" color="var(--col-progress)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {advice.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        flexShrink:   0,
                        width:        20,
                        height:       20,
                        borderRadius: '50%',
                        background:   'rgba(245,158,11,0.10)',
                        border:       '1px solid rgba(245,158,11,0.25)',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent:'center',
                        fontSize:     '0.65rem',
                        fontWeight:   700,
                        color:        'var(--col-progress)',
                        marginTop:    2,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{step}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Time estimate */}
          {advice.timeEstimate && (
            <Section title="Time Estimate" color="var(--col-done)">
              <div
                style={{
                  display:     'inline-flex',
                  alignItems:  'center',
                  gap:         8,
                  padding:     '8px 14px',
                  background:  'rgba(16,185,129,0.08)',
                  border:      '1px solid rgba(16,185,129,0.20)',
                  borderRadius:'var(--radius-md)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--col-done)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--col-done)' }}>
                  {advice.timeEstimate}
                </span>
              </div>
            </Section>
          )}

          {/* Skills */}
          {advice.skills?.length > 0 && (
            <Section title="Skills Developed" color="var(--accent-light)">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {advice.skills.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      padding:      '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background:   'rgba(99,102,241,0.10)',
                      border:       '1px solid rgba(99,102,241,0.20)',
                      fontSize:     '0.75rem',
                      color:        'var(--accent-light)',
                      fontWeight:   500,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Refresh */}
          <button
            onClick={handleFetch}
            style={{
              padding:      '8px 14px',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border)',
              color:        'var(--text-muted)',
              background:   'transparent',
              fontSize:     '0.78rem',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              justifyContent:'center',
              transition:   'all var(--transition-sm)',
              marginTop:    'auto',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Regenerate Advice
          </button>
        </div>
      )}
    </div>
  );
}
