/* ── AvatarTrainingPanel ──────────────────────────────────────
   Right-side panel in Focus Arena. Shows:
   - Arena level badge
   - Animated SVG workspace scene (evolves with level + category)
   - Skill XP bars for task's tagged skills
   - Session streak info
   ─────────────────────────────────────────────────────────── */

const XP_PER_LEVEL = 500;

/* ── Category config ─────────────────────────────────── */
const CATEGORY_CONFIG = {
  programming:  { color: '#60a5fa', glow: 'rgba(96,165,250,0.18)',   label: 'Dev'      },
  development:  { color: '#60a5fa', glow: 'rgba(96,165,250,0.18)',   label: 'Dev'      },
  coding:       { color: '#60a5fa', glow: 'rgba(96,165,250,0.18)',   label: 'Coding'   },
  learning:     { color: '#34d399', glow: 'rgba(52,211,153,0.18)',   label: 'Learning' },
  education:    { color: '#34d399', glow: 'rgba(52,211,153,0.18)',   label: 'Learning' },
  business:     { color: '#a78bfa', glow: 'rgba(167,139,250,0.18)', label: 'Business' },
  management:   { color: '#a78bfa', glow: 'rgba(167,139,250,0.18)', label: 'Business' },
  fitness:      { color: '#fb923c', glow: 'rgba(251,146,60,0.18)',   label: 'Fitness'  },
  health:       { color: '#fb923c', glow: 'rgba(251,146,60,0.18)',   label: 'Health'   },
  design:       { color: '#f472b6', glow: 'rgba(244,114,182,0.18)', label: 'Design'   },
  general:      { color: '#94a3b8', glow: 'rgba(148,163,184,0.18)', label: 'Focus'    },
};

function getCategoryConfig(taskSkills = []) {
  const priority = ['programming', 'development', 'coding', 'learning', 'education', 'design', 'business', 'management', 'fitness', 'health'];
  for (const p of priority) {
    if (taskSkills.some((ts) => ts.skill?.category?.toLowerCase().includes(p))) {
      return CATEGORY_CONFIG[p];
    }
  }
  const firstCat = taskSkills[0]?.skill?.category?.toLowerCase() || 'general';
  return CATEGORY_CONFIG[firstCat] || CATEGORY_CONFIG.general;
}

/* ── Arena level from total sessions ─────────────────── */
function getArenaLevel(totalSessions = 0) {
  if (totalSessions < 3)   return 1;
  if (totalSessions < 8)   return 2;
  if (totalSessions < 16)  return 3;
  if (totalSessions < 28)  return 4;
  if (totalSessions < 45)  return 5;
  if (totalSessions < 68)  return 6;
  if (totalSessions < 98)  return 7;
  if (totalSessions < 135) return 8;
  if (totalSessions < 180) return 9;
  return 10;
}

const LEVEL_LABELS = ['', 'Rookie', 'Apprentice', 'Journeyman', 'Adept', 'Professional', 'Expert', 'Veteran', 'Elite', 'Master', 'Legend'];

/* ── Screen content by category ─────────────────────── */
function ScreenContent({ cat, running, color, x, y, w, h }) {
  const mid = { x: x + w / 2, y: y + h / 2 };

  if (cat === 'programming' || cat === 'development' || cat === 'coding') {
    return (
      <g opacity={running ? 1 : 0.75} style={{ transition: 'opacity 0.5s ease' }}>
        <text x={x + 6} y={y + 14} fontSize={7} fill={color} opacity={0.9} fontFamily="monospace">{'const solve = () => {'}</text>
        <text x={x + 12} y={y + 24} fontSize={7} fill={color} opacity={0.55} fontFamily="monospace">{'  return answer'}</text>
        <text x={x + 6} y={y + 34} fontSize={7} fill={color} opacity={0.9} fontFamily="monospace">{'}'}</text>
        <text x={x + 6} y={y + 46} fontSize={6} fill="rgba(255,255,255,0.2)" fontFamily="monospace">{'// deep work mode'}</text>
        {running && (
          <rect x={x + 6} y={y + 49} width={2} height={8} fill={color} opacity={0.9}>
            <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
          </rect>
        )}
      </g>
    );
  }

  if (cat === 'learning' || cat === 'education') {
    return (
      <g opacity={running ? 1 : 0.75} style={{ transition: 'opacity 0.5s ease' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={x + 6} y={y + 10 + i * 10} width={w - 12 - (i % 3) * 8} height={4} rx={2}
            fill={i % 2 === 0 ? color : 'rgba(255,255,255,0.15)'} opacity={0.7} />
        ))}
        <circle cx={mid.x} cy={y + h - 14} r={8} fill="none" stroke={color} strokeWidth={1.5} opacity={0.5} />
        <line x1={mid.x} y1={y + h - 22} x2={mid.x} y2={y + h - 6} stroke={color} strokeWidth={1.5} opacity={0.5} />
      </g>
    );
  }

  if (cat === 'business' || cat === 'management') {
    const bars = [0.4, 0.7, 0.55, 0.85, 0.6];
    const barW  = (w - 16) / bars.length - 4;
    return (
      <g opacity={running ? 1 : 0.75} style={{ transition: 'opacity 0.5s ease' }}>
        <line x1={x + 6} y1={y + 8} x2={x + 6} y2={y + h - 14} stroke={color} strokeWidth={1} opacity={0.3} />
        <line x1={x + 6} y1={y + h - 14} x2={x + w - 8} y2={y + h - 14} stroke={color} strokeWidth={1} opacity={0.3} />
        {bars.map((frac, i) => {
          const bh = (h - 28) * frac;
          return (
            <rect key={i} x={x + 10 + i * (barW + 4)} y={y + h - 14 - bh}
              width={barW} height={bh} rx={1} fill={color}
              opacity={0.55 + 0.15 * (i % 2)} />
          );
        })}
      </g>
    );
  }

  if (cat === 'fitness' || cat === 'health') {
    const radius  = Math.min(w, h) / 2 - 10;
    const circ    = 2 * Math.PI * radius;
    const pct     = running ? 0.72 : 0.55;
    return (
      <g>
        <circle cx={mid.x} cy={mid.y} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
        <circle cx={mid.x} cy={mid.y} r={radius} fill="none" stroke={color}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          transform={`rotate(-90 ${mid.x} ${mid.y})`}
          opacity={0.8}
          style={{ transition: 'stroke-dashoffset 1.2s var(--ease)' }}
        />
        <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} opacity={0.9}>
          {Math.round(pct * 100)}%
        </text>
      </g>
    );
  }

  if (cat === 'design') {
    return (
      <g opacity={running ? 1 : 0.75}>
        <rect x={x + 8} y={y + 8} width={w - 16} height={h - 24} rx={3} fill="none"
          stroke={color} strokeWidth={1} opacity={0.4} strokeDasharray="3 3" />
        <circle cx={mid.x - 10} cy={mid.y} r={10} fill={color} opacity={0.2} />
        <circle cx={mid.x + 10} cy={mid.y} r={8}  fill={color} opacity={0.15} />
        <circle cx={mid.x}      cy={mid.y - 8} r={6} fill={color} opacity={0.25} />
      </g>
    );
  }

  // General
  return (
    <g opacity={running ? 1 : 0.75}>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={x + 12} cy={y + 12 + i * 16} r={3} fill={color} opacity={0.7} />
          <rect x={x + 20} y={y + 10 + i * 16} width={w - 30 - i * 6} height={4} rx={2}
            fill={color} opacity={0.35} />
        </g>
      ))}
    </g>
  );
}

/* ── Main SVG Scene ──────────────────────────────────── */
function AvatarScene({ level, cat, catConfig, running }) {
  const color   = catConfig.color;
  const hasTwo  = level >= 5;
  const hasThree = level >= 8;
  const hasBigDesk = level >= 3;
  const hasDecor  = level >= 4;
  const hasAward  = level >= 7;

  /* Monitor positions */
  const mon1 = hasTwo
    ? { x: 100, y: 50, w: 72, h: 52 }   // left monitor
    : { x: 128, y: 50, w: 85, h: 58 };  // single (centered-ish)

  const mon2 = { x: 184, y: 54, w: 68, h: 48 }; // right monitor (level 5+)
  const mon3 = { x: 256, y: 58, w: 50, h: 40 }; // far right (level 8+)

  /* Screen dimensions (inner) = mon - 3px inset */
  function screen(m) {
    return { x: m.x + 3, y: m.y + 3, w: m.w - 6, h: m.h - 10 };
  }

  return (
    <svg
      viewBox="0 0 310 210"
      width="100%"
      style={{ display: 'block', maxHeight: 210 }}
    >
      <defs>
        {/* Room background */}
        <linearGradient id="ap-room" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#07071c" />
          <stop offset="100%" stopColor="#0d0d1e" />
        </linearGradient>

        {/* Floor */}
        <linearGradient id="ap-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a1a" />
          <stop offset="100%" stopColor="#060610" />
        </linearGradient>

        {/* Category glow (ambient when running) */}
        <radialGradient id="ap-glow" cx="55%" cy="50%" r="55%">
          <stop offset="0%"   stopColor={color} stopOpacity={running ? 0.14 : 0.04} style={{ transition: 'stop-opacity 0.8s ease' }} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>

        {/* Screen glow */}
        <filter id="ap-screen-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>

        {/* Desk gradient */}
        <linearGradient id="ap-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a1a35" />
          <stop offset="100%" stopColor="#101028" />
        </linearGradient>
      </defs>

      {/* ── Background ── */}
      <rect width="310" height="210" fill="url(#ap-room)" />

      {/* Wall */}
      <rect width="310" height="130" fill="rgba(15,15,32,0.5)" />

      {/* Ambient category glow */}
      <rect width="310" height="210" fill="url(#ap-glow)" />

      {/* ── Wall decorations ── */}
      {/* Window (level 2+) */}
      {level >= 2 && (
        <g>
          <rect x={250} y={18} width={48} height={62} rx={4}
            fill="rgba(60,90,200,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
          {/* Window pane cross */}
          <line x1={274} y1={18} x2={274} y2={80} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <line x1={250} y1={49} x2={298} y2={49} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          {/* Window glow */}
          <rect x={252} y={20} width={44} height={28} rx={2}
            fill={running ? 'rgba(100,150,255,0.06)' : 'rgba(100,150,255,0.02)'}
            style={{ transition: 'fill 0.8s ease' }} />
        </g>
      )}

      {/* Bookshelf (level 3+) */}
      {level >= 3 && (
        <g>
          <rect x={6} y={40} width={60} height={72} rx={2}
            fill="#0f0f25" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          {/* Shelf lines */}
          <line x1={6}  y1={64}  x2={66} y2={64}  stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <line x1={6}  y1={88}  x2={66} y2={88}  stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          {/* Books */}
          {[
            { x:10, h:20, c:'#1d3a6e' }, { x:18, h:22, c:'#1a3550' }, { x:26, h:18, c:'#2a1a50' },
            { x:34, h:21, c:'#1a2e4a' }, { x:42, h:19, c:'#1e2e1e' }, { x:50, h:22, c:'#3a1a2e' },
          ].map((b, i) => (
            <rect key={i} x={b.x} y={63 - b.h} width={6} height={b.h} rx={0.5} fill={b.c} />
          ))}
          {[
            { x:10, h:18, c:'#1e1e50' }, { x:18, h:22, c:'#1a3a2e' }, { x:26, h:20, c:'#2e1e3a' },
            { x:34, h:19, c:'#1a2a1a' }, { x:42, h:21, c:'#1e2e3a' }, { x:50, h:17, c:'#3a2a1a' },
          ].map((b, i) => (
            <rect key={i} x={b.x} y={87 - b.h} width={6} height={b.h} rx={0.5} fill={b.c} />
          ))}
        </g>
      )}

      {/* Achievement frames (level 7+) */}
      {hasAward && (
        <>
          <rect x={80} y={18} width={32} height={22} rx={2}
            fill="#0d0d22" stroke={color} strokeWidth={0.8} opacity={0.6} />
          <text x={96} y={33} textAnchor="middle" fontSize={10} fill={color} opacity={0.7}>★</text>
          <rect x={118} y={20} width={26} height={18} rx={2}
            fill="#0d0d22" stroke="rgba(245,158,11,0.4)" strokeWidth={0.8} />
          <text x={131} y={33} textAnchor="middle" fontSize={8} fill="#f59e0b" opacity={0.7}>🏆</text>
        </>
      )}

      {/* ── Desk ── */}
      <rect
        x={hasBigDesk ? 72 : 80}
        y={128}
        width={hasBigDesk ? 232 : 224}
        height={10}
        rx={2}
        fill="url(#ap-desk)"
      />
      {/* Desk front face */}
      <rect
        x={hasBigDesk ? 72 : 80}
        y={137}
        width={hasBigDesk ? 232 : 224}
        height={16}
        fill="#0f0f28"
      />
      {/* Desk legs */}
      <rect x={76}  y={153} width={4} height={50} fill="#0d0d22" />
      <rect x={298} y={153} width={4} height={50} fill="#0d0d22" />

      {/* ── Keyboard ── */}
      <rect x={95} y={122} width={62} height={10} rx={2} fill="#111126" />
      <rect x={97} y={123} width={58} height={7}  rx={1} fill="#16162e" />
      <line x1={102} y1={125} x2={150} y2={125} stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
      <line x1={102} y1={128} x2={150} y2={128} stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />

      {/* Mouse */}
      <rect x={164} y={124} width={14} height={9} rx={4} fill="#111126" />
      <line x1={171} y1={124} x2={171} y2={133} stroke="rgba(255,255,255,0.07)" strokeWidth={0.8} />

      {/* ── Desk items by level ── */}
      {/* Coffee cup (level 1+) */}
      <rect x={82} y={118} width={9} height={11} rx={1} fill="#0f0f24" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
      <path d="M91,121 Q95,121 95,124 Q95,127 91,127" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
      <rect x={84} y={118} width={5} height={2} rx={0.5} fill={running ? color : 'rgba(255,255,255,0.1)'}
        opacity={0.6} style={{ transition: 'fill 0.5s ease' }} />

      {/* Plant (level 4+) */}
      {hasDecor && (
        <g>
          <rect x={286} y={112} width={10} height={16} rx={1} fill="#111122" />
          <ellipse cx={291} cy={112} rx={9}  ry={7}  fill="#0f2a0f" />
          <ellipse cx={285} cy={108} rx={6}  ry={5}  fill="#0a200a" />
          <ellipse cx={297} cy={109} rx={5}  ry={4}  fill="#0a200a" />
        </g>
      )}

      {/* Water bottle (level 5+ fitness) */}
      {level >= 5 && (
        <g opacity={0.7}>
          <rect x={276} y={116} width={8} height={14} rx={2} fill="#0d1e2e" stroke="rgba(96,165,250,0.2)" strokeWidth={0.8} />
          <rect x={278} y={114} width={4} height={4} rx={1} fill="#111126" />
        </g>
      )}

      {/* ── Monitors ── */}

      {/* Primary monitor */}
      <g>
        {/* Stand */}
        <rect x={mon1.x + mon1.w/2 - 3} y={mon1.y + mon1.h} width={6} height={18} fill="#0d0d1e" />
        <rect x={mon1.x + mon1.w/2 - 12} y={mon1.y + mon1.h + 16} width={24} height={4} rx={1} fill="#0d0d1e" />

        {/* Bezel */}
        <rect x={mon1.x} y={mon1.y} width={mon1.w} height={mon1.h} rx={3} fill="#0a0a1e" />

        {/* Screen glow (blur) */}
        {running && (
          <rect x={screen(mon1).x} y={screen(mon1).y}
            width={screen(mon1).w} height={screen(mon1).h}
            rx={1} fill={color} opacity={0.12}
            filter="url(#ap-screen-blur)" />
        )}

        {/* Screen */}
        <rect x={screen(mon1).x} y={screen(mon1).y}
          width={screen(mon1).w} height={screen(mon1).h}
          rx={1} fill="#040416" />

        {/* Screen content */}
        <ScreenContent
          cat={cat} running={running} color={color}
          x={screen(mon1).x} y={screen(mon1).y}
          w={screen(mon1).w} h={screen(mon1).h}
        />

        {/* Status LED */}
        <circle cx={mon1.x + mon1.w - 6} cy={mon1.y + mon1.h - 4} r={2}
          fill={running ? '#10b981' : 'rgba(255,255,255,0.15)'}>
          {running && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />}
        </circle>
      </g>

      {/* Second monitor (level 5+) */}
      {hasTwo && (
        <g>
          <rect x={mon2.x + mon2.w/2 - 3} y={mon2.y + mon2.h} width={5} height={16} fill="#0d0d1e" />
          <rect x={mon2.x + mon2.w/2 - 10} y={mon2.y + mon2.h + 14} width={20} height={3} rx={1} fill="#0d0d1e" />
          <rect x={mon2.x} y={mon2.y} width={mon2.w} height={mon2.h} rx={3} fill="#090918" />
          {running && (
            <rect x={mon2.x + 3} y={mon2.y + 3}
              width={mon2.w - 6} height={mon2.h - 10}
              rx={1} fill={color} opacity={0.08}
              filter="url(#ap-screen-blur)" />
          )}
          <rect x={mon2.x + 3} y={mon2.y + 3} width={mon2.w - 6} height={mon2.h - 10} rx={1} fill="#030312" />
          {/* Second screen shows a different view */}
          <g opacity={running ? 0.8 : 0.5} style={{ transition: 'opacity 0.5s ease' }}>
            {[0,1,2].map((i) => (
              <rect key={i} x={mon2.x + 6} y={mon2.y + 8 + i * 10} width={mon2.w - 28 - i * 5} height={3} rx={1}
                fill={color} opacity={0.4} />
            ))}
          </g>
        </g>
      )}

      {/* Third monitor (level 8+) */}
      {hasThree && (
        <g opacity={0.75}>
          <rect x={mon3.x + mon3.w/2 - 2} y={mon3.y + mon3.h} width={4} height={14} fill="#0d0d1e" />
          <rect x={mon3.x + mon3.w/2 - 8} y={mon3.y + mon3.h + 12} width={16} height={3} rx={1} fill="#0d0d1e" />
          <rect x={mon3.x} y={mon3.y} width={mon3.w} height={mon3.h} rx={2} fill="#080816" />
          <rect x={mon3.x + 2} y={mon3.y + 2} width={mon3.w - 4} height={mon3.h - 8} rx={1} fill="#020210" />
          <g opacity={running ? 0.7 : 0.35}>
            <rect x={mon3.x + 4} y={mon3.y + 8}  width={mon3.w - 16} height={3} rx={1} fill={color} opacity={0.35} />
            <rect x={mon3.x + 4} y={mon3.y + 14} width={mon3.w - 22} height={3} rx={1} fill={color} opacity={0.25} />
            <rect x={mon3.x + 4} y={mon3.y + 20} width={mon3.w - 18} height={3} rx={1} fill={color} opacity={0.3}  />
          </g>
        </g>
      )}

      {/* ── Avatar (side view, seated, facing right/monitors) ── */}
      {/* Chair back */}
      <rect x={34} y={82} width={9}  height={50} rx={2} fill="#111128" />
      <rect x={26} y={80} width={24} height={8}  rx={3} fill="#191935" />

      {/* Chair seat */}
      <ellipse cx={52} cy={145} rx={22} ry={6} fill="#111128" />

      {/* Chair legs */}
      <line x1={32} y1={151} x2={26} y2={170} stroke="#0d0d22" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={72} y1={151} x2={78} y2={170} stroke="#0d0d22" strokeWidth={2.5} strokeLinecap="round" />

      {/* Body / torso */}
      <path d="M38,115 L52,110 L66,112 L68,145 L36,145 Z" fill="#161630" />

      {/* Shoulders */}
      <ellipse cx={38} cy={113} rx={8}  ry={5} fill="#1e1e3c" />
      <ellipse cx={66} cy={112} rx={7}  ry={5} fill="#1e1e3c" />

      {/* Right arm extending toward keyboard */}
      <path d="M64,118 Q85,125 104,130" stroke="#161630" strokeWidth={9} strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x={48} y={97} width={8} height={14} rx={2} fill="#1c1c38" />

      {/* Head */}
      <circle cx={54} cy={82} r={17} fill="#1e1e3c" />

      {/* Face (right side brighter, facing monitors) */}
      <path d="M54,65 A17,17 0 0,1 71,82 A17,17 0 0,1 54,99 Z" fill="#282850" />

      {/* Hair */}
      <ellipse cx={50} cy={71} rx={16} ry={10} fill="#111128" />
      <ellipse cx={64} cy={69} rx={6}  ry={5}  fill="#111128" />

      {/* Ear */}
      <ellipse cx={38} cy={83} rx={4} ry={6} fill="#1e1e3c" />

      {/* Eye highlight */}
      <circle cx={63} cy={81} r={2.5} fill={running ? color : 'rgba(255,255,255,0.2)'}
        opacity={0.7}
        style={{ transition: 'fill 0.5s ease' }}>
        {running && <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />}
      </circle>

      {/* Headphones (level 3+) */}
      {level >= 3 && (
        <g>
          <path d="M38,72 Q40,60 54,58 Q68,60 70,72" fill="none"
            stroke="#1a1a38" strokeWidth={4} strokeLinecap="round" />
          <rect x={35} y={72} width={6} height={10} rx={2} fill="#111128" />
          <rect x={68} y={72} width={6} height={10} rx={2} fill="#111128" />
        </g>
      )}

      {/* Running pulse effect on person */}
      {running && (
        <circle cx={54} cy={82} r={20} fill="none" stroke={color} strokeWidth={1} opacity={0.15}>
          <animate attributeName="r"       values="18;26;18" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* ── Floor ── */}
      <rect y={170} width="310" height={40} fill="url(#ap-floor)" />
      <line x1={0} y1={170} x2={310} y2={170} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
    </svg>
  );
}

/* ── Skill XP bar ────────────────────────────────────── */
function SkillBar({ ts }) {
  const xp      = ts.userSkill?.xp    ?? 0;
  const level   = ts.userSkill?.level ?? 1;
  const inLevel = xp % XP_PER_LEVEL;
  const pct     = Math.min(100, (inLevel / XP_PER_LEVEL) * 100);
  const color   = ts.skill?.color || '#3b82f6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.9rem' }}>{ts.skill?.icon}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            {ts.skill?.name}
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          Lv {level}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            height:       '100%',
            width:        `${pct}%`,
            background:   color,
            borderRadius: 'var(--radius-full)',
            boxShadow:    `0 0 6px ${color}60`,
            transition:   'width 0.6s var(--ease)',
          }}
        />
      </div>
    </div>
  );
}

/* ── Level badge ─────────────────────────────────────── */
function LevelBadge({ level, color }) {
  const filledCount = Math.min(level, 10);
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '10px 14px',
        background:     'rgba(255,255,255,0.02)',
        border:         '1px solid rgba(255,255,255,0.06)',
        borderRadius:   'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width:          32,
            height:         32,
            borderRadius:   '50%',
            background:     `linear-gradient(135deg, ${color}22, ${color}44)`,
            border:         `1px solid ${color}55`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '0.72rem',
            fontWeight:     900,
            color,
          }}
        >
          {level}
        </div>
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
            Arena Level {level}
          </p>
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
            {LEVEL_LABELS[Math.min(level, 10)]}
          </p>
        </div>
      </div>

      {/* Level pip track */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   i < filledCount % 5 || (filledCount === 10)
                ? color
                : 'rgba(255,255,255,0.08)',
              boxShadow:    i < filledCount % 5 ? `0 0 6px ${color}80` : 'none',
              transition:   'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────── */
export default function AvatarTrainingPanel({ task, running, stats }) {
  const taskSkills   = task?.taskSkills ?? [];
  const catConfig    = getCategoryConfig(taskSkills);
  const cat          = Object.keys(CATEGORY_CONFIG).find((k) => CATEGORY_CONFIG[k] === catConfig) || 'general';
  const arenaLevel   = getArenaLevel(stats?.totalSessions ?? 0);

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        gap:            16,
        height:         '100%',
        padding:        '32px 24px',
        overflowY:      'auto',
      }}
    >
      {/* Level badge */}
      <LevelBadge level={arenaLevel} color={catConfig.color} />

      {/* SVG scene */}
      <div
        style={{
          background:   'rgba(255,255,255,0.015)',
          border:       `1px solid ${running ? catConfig.color + '30' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow:     'hidden',
          transition:   'border-color 0.6s ease',
          boxShadow:    running ? `0 0 24px ${catConfig.glow}` : 'none',
          transition:   'box-shadow 0.8s ease, border-color 0.6s ease',
        }}
      >
        <AvatarScene
          level={arenaLevel}
          cat={cat}
          catConfig={catConfig}
          running={running}
        />
      </div>

      {/* Category label */}
      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize:     '0.62rem',
            fontWeight:   700,
            color:        catConfig.color,
            letterSpacing:'0.1em',
            textTransform:'uppercase',
            opacity:      0.8,
          }}
        >
          {running ? `Training · ${catConfig.label}` : catConfig.label}
        </span>
      </div>

      {/* Skill XP bars */}
      {taskSkills.length > 0 && (
        <div
          style={{
            background:   'rgba(255,255,255,0.02)',
            border:       '1px solid rgba(255,255,255,0.05)',
            borderRadius: 'var(--radius-md)',
            padding:      '14px 16px',
            display:      'flex',
            flexDirection:'column',
            gap:          14,
          }}
        >
          <p
            style={{
              fontSize:      '0.58rem',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.22)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  2,
            }}
          >
            Skill Training
          </p>
          {taskSkills.map((ts) => (
            <SkillBar key={ts.skillId} ts={ts} />
          ))}
          <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', marginTop: 2 }}>
            Complete a session to earn +50 XP per skill
          </p>
        </div>
      )}

      {/* Session streak */}
      {(stats?.streak > 0 || stats?.todaySessions > 0) && (
        <div
          style={{
            display:      'flex',
            gap:          8,
          }}
        >
          {stats.todaySessions > 0 && (
            <div
              style={{
                flex:         1,
                padding:      '10px 12px',
                background:   'rgba(59,130,246,0.06)',
                border:       '1px solid rgba(59,130,246,0.14)',
                borderRadius: 'var(--radius-md)',
                textAlign:    'center',
              }}
            >
              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>
                {stats.todaySessions}
              </p>
              <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>
                Today
              </p>
            </div>
          )}
          {stats.streak > 0 && (
            <div
              style={{
                flex:         1,
                padding:      '10px 12px',
                background:   'rgba(245,158,11,0.06)',
                border:       '1px solid rgba(245,158,11,0.14)',
                borderRadius: 'var(--radius-md)',
                textAlign:    'center',
              }}
            >
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                🔥{stats.streak}
              </p>
              <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>
                Day Streak
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next bonus hint */}
      {stats?.todaySessions !== undefined && (
        <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
          {3 - (stats.todaySessions % 3)} session{3 - (stats.todaySessions % 3) !== 1 ? 's' : ''} until{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>+20 streak bonus</span>
        </p>
      )}
    </div>
  );
}
