import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/*
 * Props:
 *   onToggleSidebar  – called when the burger button is clicked
 *   sidebarOpen      – current sidebar state (controls burger icon style)
 *
 * Both props are optional so Navbar stays safe in any standalone context.
 */
export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const [hoverLogout, setHoverLogout] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <nav
      style={{
        position:           'sticky',
        top:                0,
        zIndex:             100,
        background:         'rgba(13, 10, 31, 0.85)',
        backdropFilter:     'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom:       '1px solid var(--border)',
        padding:            '0 20px',
        height:             64,
        display:            'flex',
        alignItems:         'center',
        justifyContent:     'space-between',
        animation:          'fadeInDown 0.4s var(--ease) both',
        gap:                12,
      }}
    >
      {/* Left: burger + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Burger / sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            style={{
              display:        'flex',
              flexDirection:  'column',
              justifyContent: 'center',
              alignItems:     'center',
              gap:            5,
              width:          36,
              height:         36,
              borderRadius:   'var(--radius-md)',
              border:         '1px solid rgba(255,255,255,0.07)',
              background:     sidebarOpen ? 'rgba(124,58,237,0.1)' : 'transparent',
              cursor:         'pointer',
              padding:        0,
              flexShrink:     0,
              transition:     'all var(--transition-sm)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = sidebarOpen ? 'rgba(124,58,237,0.1)' : 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            {/* Three-line hamburger that morphs to × when open */}
            <span
              style={{
                display:    'block',
                width:      14,
                height:     1.5,
                background: sidebarOpen ? '#a78bfa' : 'var(--text-muted)',
                borderRadius: 2,
                transformOrigin: 'center',
                transform:  sidebarOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }}
            />
            <span
              style={{
                display:    'block',
                width:      14,
                height:     1.5,
                background: sidebarOpen ? '#a78bfa' : 'var(--text-muted)',
                borderRadius: 2,
                opacity:    sidebarOpen ? 0 : 1,
                transition: 'opacity 0.2s ease, background 0.2s ease',
              }}
            />
            <span
              style={{
                display:    'block',
                width:      14,
                height:     1.5,
                background: sidebarOpen ? '#a78bfa' : 'var(--text-muted)',
                borderRadius: 2,
                transformOrigin: 'center',
                transform:  sidebarOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }}
            />
          </button>
        )}

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width:        34,
              height:       34,
              borderRadius: 10,
              background:   'var(--gradient-primary)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     16,
              boxShadow:    '0 4px 16px rgba(124,58,237,0.4)',
              flexShrink:   0,
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize:    '1.15rem',
              fontWeight:  800,
              letterSpacing: '-0.02em',
              background:  'var(--gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TaskFlow
          </span>
        </div>
      </div>

      {/* Right: avatar + name + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width:        36,
              height:       36,
              borderRadius: '50%',
              background:   'var(--gradient-primary)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '0.75rem',
              fontWeight:   700,
              color:        '#fff',
              boxShadow:    '0 2px 12px rgba(124,58,237,0.35)',
              flexShrink:   0,
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
              {user?.name}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user?.email}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

        {/* Logout */}
        <button
          onClick={logout}
          onMouseEnter={() => setHoverLogout(true)}
          onMouseLeave={() => setHoverLogout(false)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            padding:      '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize:     '0.85rem',
            fontWeight:   500,
            color:        hoverLogout ? 'var(--danger)' : 'var(--text-muted)',
            background:   hoverLogout ? 'var(--danger-bg)' : 'transparent',
            border:       `1px solid ${hoverLogout ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
            transition:   'all var(--transition)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
