import SkillProgressBar from './SkillProgressBar';
import { calcLevel, levelProgress, xpToNextLevel, LEVEL_NAMES, MAX_LEVEL, XP_PER_LEVEL } from '../utils/xp';

export default function SkillCard({ userSkill }) {
  const { skill, xp = 0 } = userSkill;
  const level    = calcLevel(xp);
  const progress = levelProgress(xp);
  const toNext   = xpToNextLevel(xp);
  const levelName = LEVEL_NAMES[level] || '';
  const isMax    = level >= MAX_LEVEL;

  return (
    <div
      style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding:      '20px 22px',
        display:      'flex',
        flexDirection:'column',
        gap:          14,
        transition:   'border-color var(--transition), box-shadow var(--transition)',
        position:     'relative',
        overflow:     'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${skill.color}40`;
        e.currentTarget.style.boxShadow   = `0 0 0 1px ${skill.color}20, 0 8px 32px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Top glow accent */}
      <div
        style={{
          position:   'absolute',
          top:        0,
          left:       0,
          right:      0,
          height:     2,
          background: isMax
            ? `linear-gradient(90deg, ${skill.color}, #f59e0b, ${skill.color})`
            : skill.color,
          opacity:    0.7,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width:        42,
            height:       42,
            borderRadius: 'var(--radius-md)',
            background:   `${skill.color}18`,
            border:       `1px solid ${skill.color}30`,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            fontSize:      22,
            flexShrink:   0,
          }}
        >
          {skill.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {skill.name}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
            {skill.category}
          </p>
        </div>

        {/* Level badge */}
        <div
          style={{
            padding:     '3px 10px',
            borderRadius:'var(--radius-full)',
            background:  `${skill.color}18`,
            border:      `1px solid ${skill.color}35`,
            textAlign:   'center',
            flexShrink:  0,
          }}
        >
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: skill.color, letterSpacing: '0.04em' }}>
            LVL {level}
          </p>
          {isMax && (
            <p style={{ fontSize: '0.55rem', color: '#f59e0b', letterSpacing: '0.06em' }}>MAX</p>
          )}
        </div>
      </div>

      {/* Level name */}
      <p style={{ fontSize: '0.75rem', color: skill.color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {levelName}
      </p>

      {/* XP progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {xp} XP total
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isMax ? 'Maxed out' : `${toNext} XP to level ${level + 1}`}
          </span>
        </div>
        <SkillProgressBar progress={progress} color={skill.color} height={6} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.6 }}>
            {isMax ? '' : `${xp % XP_PER_LEVEL} / ${XP_PER_LEVEL}`}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.6 }}>
            {isMax ? '★ Grandmaster' : `Level ${level + 1}`}
          </span>
        </div>
      </div>
    </div>
  );
}
