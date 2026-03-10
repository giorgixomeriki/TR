/* ─────────────────────────────────────────────────────────────
   AvatarUpgradeRenderer
   Renders conditional SVG layers based on skill levels.
   All coordinates are relative to the 520×380 viewBox.
   ──────────────────────────────────────────────────────────── */

/* Programming: screen glow, laptop → monitor → multi-monitor */
export function ProgrammingLayer({ level }) {
  if (level < 1) return null;
  return (
    <>
      {/* Screen glow on back wall */}
      <ellipse cx="255" cy="155" rx="160" ry="65" fill="#0d2a5a" opacity={0.35 + level * 0.03} />

      {/* Laptop (level 1+) */}
      <g>
        <rect x="186" y="166" width="90" height="56" rx="3" fill="#060612" />
        <rect x="188" y="168" width="86" height="52" rx="2" fill="#06111e" />
        {[0,1,2,3,4,5].map((i) => (
          <rect key={i} x={192} y={173 + i * 7} width={i % 3 === 0 ? 58 : 42 - (i%2)*8} height="2.5"
            rx="1" fill={i === 0 ? '#1a4fbb' : '#0d2035'} opacity="0.9" />
        ))}
        <rect x="182" y="220" width="98" height="5" rx="2" fill="#111128" />
        <ellipse cx="231" cy="222" rx="44" ry="6" fill="#07193a" opacity="0.55" />
      </g>

      {/* Monitor (level 4+) */}
      {level >= 4 && (
        <g>
          <rect x="284" y="143" width="104" height="72" rx="3" fill="#040410" />
          <rect x="286" y="145" width="100" height="68" rx="2" fill="#050f1c" />
          {[0,1,2,3,4,5,6,7].map((i) => (
            <rect key={i} x={290} y={150 + i * 7} width={i % 4 === 0 ? 72 : 55 - (i%3)*6}
              height="2.5" rx="1" fill={i%3===0 ? '#1e55cc' : '#0d2035'} opacity="0.85" />
          ))}
          <rect x="328" y="215" width="18" height="7" fill="#0e0e1c" />
          <rect x="320" y="221" width="34" height="4" rx="2" fill="#0e0e1c" />
          <ellipse cx="337" cy="222" rx="30" ry="5" fill="#07193a" opacity="0.45" />
        </g>
      )}

      {/* Second monitor (level 7+) */}
      {level >= 7 && (
        <g>
          <rect x="78" y="148" width="92" height="65" rx="3" fill="#040410" />
          <rect x="80" y="150" width="88" height="61" rx="2" fill="#050f1c" />
          {[0,1,2,3,4,5,6].map((i) => (
            <rect key={i} x={84} y={155 + i * 7} width={i%3===0 ? 68 : 50-(i%2)*10}
              height="2.5" rx="1" fill={i%4===0 ? '#1e55cc' : '#0d2035'} opacity="0.8" />
          ))}
          <rect x="116" y="213" width="16" height="7" fill="#0e0e1c" />
          <rect x="108" y="219" width="32" height="4" rx="2" fill="#0e0e1c" />
        </g>
      )}

      {/* Third monitor (level 10) */}
      {level >= 10 && (
        <g>
          <rect x="394" y="152" width="82" height="58" rx="3" fill="#040410" />
          <rect x="396" y="154" width="78" height="54" rx="2" fill="#050f1c" />
          {[0,1,2,3,4].map((i) => (
            <rect key={i} x={400} y={159 + i * 8} width={60-(i%2)*12} height="2.5"
              rx="1" fill={i===0?'#1e55cc':'#0d2035'} opacity="0.75" />
          ))}
          <rect x="426" y="210" width="14" height="6" fill="#0e0e1c" />
          <rect x="420" y="215" width="26" height="4" rx="2" fill="#0e0e1c" />
        </g>
      )}
    </>
  );
}

/* Learning: books on desk → bookshelf on wall */
export function LearningLayer({ level }) {
  if (level < 1) return null;
  const bookColors = ['#3b2f8c','#8b3a3a','#2a6b3a','#8b6b3a','#6b3a8b','#3a6b8b','#c05a3a'];
  return (
    <>
      {/* Books on desk (level 1+) */}
      <g>
        <rect x="84" y="194" width="13" height="21" rx="1.5" fill={bookColors[0]} />
        <rect x="97" y="197" width="11" height="18" rx="1.5" fill={bookColors[1]} />
      </g>

      {/* More books on desk (level 3+) */}
      {level >= 3 && (
        <g>
          <rect x="108" y="199" width="14" height="16" rx="1.5" fill={bookColors[2]} />
          <rect x="122" y="202" width="10" height="13" rx="1.5" fill={bookColors[3]} />
        </g>
      )}

      {/* Wall bookshelf (level 6+) */}
      {level >= 6 && (
        <g>
          {/* Shelf unit */}
          <rect x="26" y="68" width="98" height="118" rx="3" fill="#0c0c1c" stroke="#161628" strokeWidth="0.8" />
          {/* Shelf boards */}
          <rect x="26" y="106" width="98" height="4"  fill="#141428" />
          <rect x="26" y="140" width="98" height="4"  fill="#141428" />
          <rect x="26" y="174" width="98" height="4"  fill="#141428" />
          {/* Row 1 books */}
          {[['#3b2f8c',10],['#8b3a3a',8],['#2a6b3a',12],['#8b6b3a',9],['#6b3a8b',11],['#3a6b8b',8]].map(([c,w],i)=>{
            const x = 30 + [0,10,18,30,39,50][i];
            return <rect key={i} x={x} y={73} width={w} height={31} rx="1" fill={c} />;
          })}
          {/* Row 2 books */}
          {[['#c04a4a',9],['#4a8bc0',11],['#c07a4a',7],['#4ac07a',10],['#a04ac0',8]].map(([c,w],i)=>{
            const x = 30 + [0,9,20,27,37][i];
            return <rect key={i} x={x} y={112} width={w} height={26} rx="1" fill={c} />;
          })}
          {/* Row 3 books (level 9+) */}
          {level >= 9 && [['#d4af37',10],['#7a4a8b',8],['#3a8b7a',11],['#8b7a3a',9]].map(([c,w],i)=>{
            const x = 30 + [0,10,18,29][i];
            return <rect key={i} x={x} y={146} width={w} height={26} rx="1" fill={c} />;
          })}
        </g>
      )}
    </>
  );
}

/* Business: documents → briefcase → trophy */
export function BusinessLayer({ level }) {
  if (level < 1) return null;
  return (
    <>
      {/* Documents on desk (level 1+) */}
      <g>
        <rect x="328" y="192" width="58" height="7" rx="1" fill="#1a1a32" stroke="#22224a" strokeWidth="0.4"/>
        <rect x="326" y="196" width="58" height="7" rx="1" fill="#1c1c38" />
        <rect x="324" y="200" width="58" height="7" rx="1" fill="#1e1e3e" />
        {[0,1,2].map(i=>(
          <line key={i} x1="330" y1={201.5+i*2} x2={366-i*5} y2={201.5+i*2} stroke="#2a2a50" strokeWidth="0.6"/>
        ))}
      </g>

      {/* Gold tie clip on character (level 3+) */}
      {level >= 3 && (
        <polygon points="248,135 252,135 255,158 250,162 245,158" fill="#c9a227" opacity="0.75" />
      )}

      {/* Trophy on shelf (level 7+) */}
      {level >= 7 && (
        <g transform="translate(444,102)">
          <rect x="0" y="22" width="28" height="4" rx="1" fill="#c9a227" opacity="0.75" />
          <rect x="7" y="6" width="14" height="18" rx="2" fill="#c9a227" opacity="0.7" />
          <path d="M2,8 Q0,2 7,2 Q7,10 7,6" fill="#c9a227" opacity="0.65"/>
          <path d="M26,8 Q28,2 21,2 Q21,10 21,6" fill="#c9a227" opacity="0.65"/>
          <ellipse cx="14" cy="3" rx="7" ry="4" fill="#c9a227" opacity="0.7" />
        </g>
      )}

      {/* Award certificates on wall (level 10) */}
      {level >= 10 && (
        <g>
          <rect x="360" y="70" width="56" height="42" rx="3" fill="#0e0e1c" stroke="#c9a22730"/>
          <rect x="363" y="73" width="50" height="36" rx="2" fill="#0f0f1e" />
          <line x1="367" y1="82" x2="407" y2="82" stroke="#c9a227" strokeWidth="0.8" opacity="0.5"/>
          <line x1="367" y1="87" x2="400" y2="87" stroke="#c9a227" strokeWidth="0.6" opacity="0.4"/>
          <line x1="367" y1="92" x2="404" y2="92" stroke="#c9a227" strokeWidth="0.6" opacity="0.4"/>
          <ellipse cx="388" cy="98" rx="9" ry="7" fill="none" stroke="#c9a227" strokeWidth="0.8" opacity="0.5"/>
        </g>
      )}
    </>
  );
}

/* Creativity: sketchpad → pencil holder → design board */
export function CreativityLayer({ level }) {
  if (level < 1) return null;
  return (
    <>
      {/* Sketchpad on desk (level 1+) */}
      <g>
        <rect x="146" y="201" width="30" height="22" rx="2" fill="#1a1a2e" stroke="#252545" strokeWidth="0.5"/>
        <line x1="150" y1="207" x2="172" y2="207" stroke="#2a2a50" strokeWidth="0.6"/>
        <line x1="150" y1="211" x2="168" y2="211" stroke="#2a2a50" strokeWidth="0.6"/>
        <line x1="150" y1="215" x2="170" y2="215" stroke="#2a2a50" strokeWidth="0.6"/>
        {/* Pencil */}
        <rect x="177" y="200" width="5" height="20" rx="1.5" fill="#d4a017" transform="rotate(8,179,210)"/>
      </g>

      {/* Pencil holder (level 4+) */}
      {level >= 4 && (
        <g>
          <rect x="142" y="200" width="14" height="18" rx="3" fill="#111128" stroke="#1a1a38" strokeWidth="0.5"/>
          {[0,1,2].map((i)=>(
            <line key={i} x1={145+i*3} y1="200" x2={145+i*3} y2={186+i*2}
              stroke={['#d4a017','#3b82f6','#ef4444'][i]} strokeWidth="2.5" strokeLinecap="round"/>
          ))}
        </g>
      )}

      {/* Design board on wall (level 7+) */}
      {level >= 7 && (
        <g>
          <rect x="360" y="68" width="108" height="88" rx="4" fill="#0c0c1c" stroke="#1a1a2e" strokeWidth="0.8"/>
          {['#3b82f6','#ec4899','#f59e0b','#10b981','#8b5cf6','#ef4444'].map((c,i)=>(
            <rect key={i} x={365+i*17} y={76} width="13" height="13" rx="3" fill={c} opacity="0.65"/>
          ))}
          <line x1="366" y1="98"  x2="462" y2="98"  stroke="#1e1e34" strokeWidth="2"/>
          <line x1="366" y1="107" x2="450" y2="107" stroke="#1e1e34" strokeWidth="2"/>
          <line x1="366" y1="116" x2="456" y2="116" stroke="#1e1e34" strokeWidth="2"/>
          <line x1="366" y1="125" x2="445" y2="125" stroke="#1e1e34" strokeWidth="2"/>
          {/* Pin */}
          <circle cx="467" cy="76" r="3" fill="#ef4444" opacity="0.7"/>
        </g>
      )}
    </>
  );
}

/* Fitness: character body width scales, dumbbell at level 8+ */
export function FitnessBodyMod({ level }) {
  // Returns shoulder/body width bonus (0–18 px per side)
  if (level < 5) return { bonus: 0 };
  if (level < 8) return { bonus: 8 };
  return { bonus: 16 };
}

export function FitnessExtras({ level }) {
  if (level < 8) return null;
  return (
    /* Dumbbell in corner */
    <g>
      <rect x="458" y="282" width="36" height="8" rx="3" fill="#111120" />
      <rect x="455" y="279" width="9"  height="14" rx="2" fill="#1a1a2e" />
      <rect x="490" y="279" width="9"  height="14" rx="2" fill="#1a1a2e" />
      <ellipse cx="474" cy="290" rx="18" ry="5" fill="#07070e" opacity="0.5"/>
    </g>
  );
}

/* Discipline: wall clock → planner → focused accent light */
export function DisciplineLayer({ level }) {
  if (level < 1) return null;
  return (
    <>
      {/* Organized document tray (level 1+) */}
      <rect x="393" y="204" width="42" height="8" rx="2" fill="#0e0e1c" stroke="#181830" strokeWidth="0.5"/>

      {/* Wall clock (level 4+) */}
      {level >= 4 && (
        <g>
          <circle cx="468" cy="118" r="24" fill="#0e0e1c" stroke="#181830" strokeWidth="1.5"/>
          <circle cx="468" cy="118" r="20" fill="#0b0b1a"/>
          {[0,1,2,3,4,5,6,7,8,9,10,11].map((i)=>{
            const a = i * 30 * Math.PI / 180;
            const r1=16, r2=18;
            return <line key={i} x1={468+r1*Math.sin(a)} y1={118-r1*Math.cos(a)}
              x2={468+r2*Math.sin(a)} y2={118-r2*Math.cos(a)} stroke="#252540" strokeWidth="1"/>;
          })}
          <line x1="468" y1="118" x2="468" y2="103" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="468" y1="118" x2="480" y2="118" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="468" cy="118" r="2.5" fill="#3b82f6"/>
        </g>
      )}

      {/* Accent ceiling light beam (level 8+) */}
      {level >= 8 && (
        <polygon points="220,0 280,0 320,210 170,210" fill="url(#ceilingLight)" opacity="0.06"/>
      )}
    </>
  );
}

/* Communication: phone → headset → professional mic */
export function CommunicationLayer({ level }) {
  if (level < 1) return null;
  return (
    <>
      {/* Phone on desk (level 1+) */}
      <g>
        <rect x="143" y="204" width="22" height="14" rx="3" fill="#111128" stroke="#1c1c38" strokeWidth="0.5"/>
        <rect x="145" y="206" width="18" height="10" rx="2" fill="#090918" opacity="0.9"/>
      </g>

      {/* Headset beside monitor (level 4+) */}
      {level >= 4 && (
        <g>
          <path d="M154,205 Q170,188 188,205" fill="none" stroke="#1c1c30" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="154" cy="205" r="5.5" fill="#141428"/>
          <circle cx="188" cy="205" r="5.5" fill="#141428"/>
          <rect x="186" y="200" width="6" height="18" rx="2" fill="#111124"/>
        </g>
      )}

      {/* Pro microphone (level 8+) */}
      {level >= 8 && (
        <g>
          <rect x="348" y="188" width="10" height="22" rx="4" fill="#0e0e1c" stroke="#1a1a2e" strokeWidth="0.8"/>
          <ellipse cx="353" cy="188" rx="6" ry="9" fill="#111128" stroke="#1a1a2e" strokeWidth="0.8"/>
          <rect x="351" y="208" width="4" height="12" fill="#0e0e1c"/>
          <rect x="345" y="219" width="16" height="3" rx="1.5" fill="#141428"/>
        </g>
      )}
    </>
  );
}
