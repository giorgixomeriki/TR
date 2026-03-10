export default function LoadingSpinner({ fullScreen = false, size = 40 }) {
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid rgba(139, 92, 246, 0.2)`,
          borderTopColor: '#8b5cf6',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      {fullScreen && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          Loading...
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
