import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path:  '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path:  '/finance',
    label: 'Finance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    path:  '/habits',
    label: 'Habits',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
  },
  {
    path:  '/gym',
    label: 'Gym',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
        <path d="M3 9.5h2v5H3z" /><path d="M19 9.5h2v5h-2z" />
        <path d="M1 11.5h2" /><path d="M21 11.5h2" />
      </svg>
    ),
  },
  {
    path:  '/skills',
    label: 'Skills',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function Sidebar({ open }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <nav
      style={{
        width:          220,
        height:         '100%',
        background:     'var(--surface)',
        borderRight:    '1px solid var(--border)',
        display:        'flex',
        flexDirection:  'column',
        padding:        '16px 10px',
        gap:            4,
        overflowY:      'auto',
        overflowX:      'hidden',
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontSize:      '0.55rem',
          fontWeight:    700,
          color:         'var(--text-muted)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding:       '4px 10px 8px',
          opacity:       0.6,
        }}
      >
        Navigation
      </p>

      {/* Nav items */}
      {NAV_ITEMS.map(({ path, label, icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '9px 12px',
              borderRadius: 'var(--radius-md)',
              border:       'none',
              background:   active ? 'rgba(124,58,237,0.14)' : 'transparent',
              color:        active ? '#a78bfa' : 'var(--text-muted)',
              fontSize:     '0.85rem',
              fontWeight:   active ? 600 : 400,
              cursor:       'pointer',
              textAlign:    'left',
              width:        '100%',
              transition:   'all var(--transition-sm)',
              boxShadow:    active ? 'inset 2px 0 0 #7c3aed' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            {icon}
            {label}
          </button>
        );
      })}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />

      {/* App version / footer */}
      <p
        style={{
          fontSize:   '0.6rem',
          color:      'var(--text-muted)',
          opacity:    0.35,
          textAlign:  'center',
          padding:    '8px 0',
          letterSpacing: '0.06em',
        }}
      >
        TaskFlow
      </p>
    </nav>
  );
}
