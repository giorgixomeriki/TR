export default function SkillProgressBar({ progress, color = 'var(--primary)', height = 5 }) {
  return (
    <div style={{ height, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div
        style={{
          height:     '100%',
          width:      `${Math.min(1, Math.max(0, progress)) * 100}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  );
}
