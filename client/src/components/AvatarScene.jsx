import {
  ProgrammingLayer,
  LearningLayer,
  BusinessLayer,
  CreativityLayer,
  DisciplineLayer,
  CommunicationLayer,
  FitnessBodyMod,
  FitnessExtras,
} from './AvatarUpgradeRenderer';

export default function AvatarScene({ userSkills = [] }) {
  /* Build levels map keyed by skill name */
  const lvl = {};
  userSkills.forEach((us) => { lvl[us.skill.name] = us.level; });

  const prog  = lvl['Programming']   || 0;
  const learn = lvl['Learning']      || 0;
  const biz   = lvl['Business']      || 0;
  const fit   = lvl['Fitness']       || 0;
  const cre   = lvl['Creativity']    || 0;
  const disc  = lvl['Discipline']    || 0;
  const comm  = lvl['Communication'] || 0;

  const { bonus: shoulderBonus } = FitnessBodyMod({ level: fit });

  return (
    <svg
      viewBox="0 0 520 380"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#09090f" />
          <stop offset="100%" stopColor="#0e0e18" />
        </linearGradient>
        <linearGradient id="deskTopGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e1e30" />
          <stop offset="100%" stopColor="#141422" />
        </linearGradient>
        <linearGradient id="deskFrontGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0e0e1c" />
          <stop offset="100%" stopColor="#09090e" />
        </linearGradient>
        <linearGradient id="chairGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#0e0e1c" />
          <stop offset="50%"  stopColor="#151528" />
          <stop offset="100%" stopColor="#0e0e1c" />
        </linearGradient>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#09090d" />
          <stop offset="100%" stopColor="#060608" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#f0c040" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f0c040" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="screenAmbient" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0d2a70" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0d2a70" stopOpacity="0"   />
        </radialGradient>
        <linearGradient id="ceilingLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      {/* ── Background wall ── */}
      <rect width="520" height="380" fill="url(#wallGrad)" />

      {/* Subtle wall panel lines */}
      <line x1="0" y1="215" x2="520" y2="215" stroke="#0c0c18" strokeWidth="1" />
      <line x1="0" y1="0"   x2="0"   y2="215" stroke="#0c0c18" strokeWidth="0.5" />
      <line x1="519" y1="0" x2="519" y2="215" stroke="#0c0c18" strokeWidth="0.5" />

      {/* Corner shadow vignette */}
      <rect width="80"  height="215" fill="url(#floorGrad)" opacity="0.4" />
      <rect x="440" width="80" height="215" fill="url(#floorGrad)" opacity="0.4" />

      {/* ── WALL ITEMS — back layers ── */}
      <LearningLayer      level={learn} />
      <DisciplineLayer    level={disc}  />
      <CreativityLayer    level={cre}   />
      <BusinessLayer      level={biz}   />

      {/* ── CHAIR BACK ── */}
      <rect x="188" y="84" width="144" height="140" rx="14" fill="url(#chairGrad)" stroke="#181830" strokeWidth="1" />
      <rect x="196" y="92" width="128" height="124" rx="11" fill="#111122" />
      {/* Leather tufting */}
      {[210, 230, 250, 270, 290, 310].map((x) => (
        <line key={x} x1={x} y1="94" x2={x} y2="212" stroke="#0d0d1e" strokeWidth="0.6" />
      ))}
      {[120, 150, 180].map((y) => (
        <line key={y} x1="196" y1={y} x2="324" y2={y} stroke="#0d0d1e" strokeWidth="0.6" />
      ))}
      {/* Chair headrest */}
      <rect x="206" y="84" width="108" height="34" rx="12" fill="#161628" />
      {/* Chair armrests */}
      <rect x="170" y="180" width="22" height="50" rx="8" fill="#0e0e1c" />
      <rect x="328" y="180" width="22" height="50" rx="8" fill="#0e0e1c" />

      {/* ── SCREEN AMBIENT (behind character) ── */}
      {prog >= 1 && (
        <ellipse cx="260" cy="150" rx="170" ry="70" fill="url(#screenAmbient)" />
      )}

      {/* ── CHARACTER ── */}

      {/* Body — width scales with Fitness */}
      <ellipse
        cx="260" cy="148"
        rx={42 + shoulderBonus} ry="16"
        fill="#141428"
      />
      <rect
        x={218 - shoulderBonus} y="148"
        width={84 + shoulderBonus * 2} height="65"
        rx="10"
        fill="#141428"
      />
      {/* Shirt collar detail */}
      <path
        d="M248,130 L252,130 L258,148 L250,154 L242,148 Z"
        fill="#1c1c30"
      />

      {/* Suit jacket lapels */}
      <path
        d={`M${218 - shoulderBonus},148 Q230,160 242,148`}
        fill="#101022" stroke="#1a1a30" strokeWidth="0.5"
      />
      <path
        d={`M${302 + shoulderBonus},148 Q290,160 278,148`}
        fill="#101022" stroke="#1a1a30" strokeWidth="0.5"
      />

      {/* Arms (upper) */}
      <rect x={172 - shoulderBonus} y="148" width={44 + shoulderBonus} height="50" rx="12" fill="#131326" />
      <rect x={304}                  y="148" width={44 + shoulderBonus} height="50" rx="12" fill="#131326" />

      {/* Head */}
      <ellipse cx="260" cy="108" rx="23" ry="26" fill="#1e1e32" />
      {/* Hair */}
      <ellipse cx="260" cy="88"  rx="23" ry="12" fill="#0d0d1c" />
      {/* Face highlight (very subtle) */}
      <ellipse cx="260" cy="112" rx="13" ry="15" fill="#222236" opacity="0.5" />
      {/* Eye glints */}
      <circle cx="253" cy="108" r="2" fill="#252538" />
      <circle cx="267" cy="108" r="2" fill="#252538" />

      {/* Business extras (tie clip) */}
      <BusinessLayer level={biz} />

      {/* ── DESK ── */}
      {/* Desk top surface (perspective trapezoid) */}
      <polygon points="44,210 476,210 444,248 76,248" fill="url(#deskTopGrad)" />
      {/* Desk edge highlight */}
      <line x1="44" y1="210" x2="476" y2="210" stroke="#262640" strokeWidth="1.5" />
      {/* Desk front face */}
      <polygon points="76,248 444,248 438,272 82,272" fill="url(#deskFrontGrad)" />
      {/* Desk legs */}
      <rect x="88"  y="272" width="14" height="90" rx="2" fill="#0c0c18" />
      <rect x="418" y="272" width="14" height="90" rx="2" fill="#0c0c18" />

      {/* ── FOREARMS on desk (creates depth illusion) ── */}
      <rect x={180 - shoulderBonus} y="207" width={36 + shoulderBonus * 0.5} height="18" rx="8" fill="#131326" />
      <rect x={304}                  y="207" width={36 + shoulderBonus * 0.5} height="18" rx="8" fill="#131326" />

      {/* ── DESK ITEMS ── */}
      <ProgrammingLayer   level={prog} />
      <LearningLayer      level={learn} />
      <CommunicationLayer level={comm}  />
      <CreativityLayer    level={cre}   />
      <DisciplineLayer    level={disc}  />
      <FitnessExtras      level={fit}   />

      {/* ── DESK LAMP (always) ── */}
      {/* Base */}
      <ellipse cx="428" cy="213" rx="16" ry="5" fill="#111128" />
      {/* Arm */}
      <line x1="428" y1="210" x2="406" y2="172" stroke="#111128" strokeWidth="5" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="400" cy="168" rx="20" ry="11" fill="#141428" />
      <ellipse cx="400" cy="170" rx="14" ry="7"  fill="#1a1a36" />
      {/* Lamp glow cone */}
      <ellipse cx="370" cy="220" rx="70" ry="22" fill="url(#lampGlow)" />

      {/* ── FLOOR ── */}
      <rect x="0" y="318" width="520" height="62" fill="url(#floorGrad)" />
      {/* Baseboard */}
      <rect x="0" y="316" width="520" height="5" fill="#0b0b16" />
      {/* Chair shadow on floor */}
      <ellipse cx="260" cy="330" rx="130" ry="18" fill="#050508" opacity="0.8" />
      {/* Desk shadow */}
      <ellipse cx="260" cy="323" rx="220" ry="10" fill="#050508" opacity="0.6" />

      {/* ── AMBIENT floor reflections ── */}
      {prog >= 1 && (
        <ellipse cx="255" cy="322" rx="160" ry="8" fill="#071530" opacity="0.35" />
      )}
    </svg>
  );
}
