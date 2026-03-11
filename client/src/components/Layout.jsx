import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar  from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        minHeight:     '100vh',
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--bg)',
      }}
    >
      {/* Top navbar — full width */}
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Below navbar: sidebar + main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar column — animates width */}
        <div
          style={{
            width:      sidebarOpen ? 220 : 0,
            flexShrink: 0,
            overflow:   'hidden',
            transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <Sidebar open={sidebarOpen} />
        </div>

        {/* Page content */}
        <main
          style={{
            flex:     1,
            overflowY: 'auto',
            minWidth:  0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
