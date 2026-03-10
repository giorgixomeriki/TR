import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AvatarScene from '../components/AvatarScene';
import SkillCard from '../components/SkillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUserSkills, getAllSkills } from '../services/skillService';
import { LEVEL_NAMES } from '../utils/xp';

function StatPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: color || 'var(--text)', letterSpacing: '-0.03em' }}>
        {value}
      </span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

export default function SkillsPage() {
  const navigate = useNavigate();

  const [userSkills,  setUserSkills]  = useState([]);
  const [allSkills,   setAllSkills]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getUserSkills(), getAllSkills()])
      .then(([us, all]) => { setUserSkills(us); setAllSkills(all); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Build a complete list: userSkill for acquired skills, zeroed for unstarted */
  const skillMap = {};
  userSkills.forEach((us) => { skillMap[us.skillId] = us; });

  const fullList = allSkills.map((skill) =>
    skillMap[skill.id] ?? { id: `zero-${skill.id}`, skillId: skill.id, skill, xp: 0, level: 1 }
  );

  /* Derived stats */
  const totalXp    = userSkills.reduce((s, us) => s + us.xp, 0);
  const topSkill   = userSkills.length > 0
    ? userSkills.reduce((a, b) => (b.xp > a.xp ? b : a))
    : null;
  const activeSkills = userSkills.filter((us) => us.xp > 0).length;

  /* Overall character level = average of all skill levels (floor) */
  const charLevel = userSkills.length > 0
    ? Math.floor(userSkills.reduce((s, us) => s + us.level, 0) / userSkills.length)
    : 1;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size={44} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* ── Page header ── */}
        <header style={{ marginBottom: 36, animation: 'fadeInDown 0.35s var(--ease)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Character Progression
          </p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Skills & Avatar
          </h1>
        </header>

        {/* ── Main two-panel layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 28, alignItems: 'start' }}>

          {/* ── LEFT — Avatar panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar card */}
            <div
              style={{
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                overflow:     'hidden',
                position:     'relative',
              }}
            >
              {/* Top label */}
              <div
                style={{
                  position:      'absolute',
                  top:           14,
                  left:          16,
                  zIndex:        10,
                  display:       'flex',
                  alignItems:    'center',
                  gap:           8,
                  padding:       '5px 12px',
                  background:    'rgba(9,9,14,0.85)',
                  backdropFilter:'blur(8px)',
                  border:        '1px solid var(--border)',
                  borderRadius:  'var(--radius-full)',
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--col-done)', boxShadow: '0 0 6px var(--col-done)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  YOUR CHARACTER
                </span>
              </div>

              {/* Level badge */}
              <div
                style={{
                  position:     'absolute',
                  top:          14,
                  right:        16,
                  zIndex:       10,
                  padding:      '5px 12px',
                  background:   'rgba(59,130,246,0.15)',
                  border:       '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '0.04em' }}>
                  LEVEL {charLevel}
                </span>
              </div>

              {/* SVG scene */}
              <div style={{ height: 300, padding: '8px 8px 0' }}>
                <AvatarScene userSkills={userSkills} />
              </div>

              {/* Bottom stat strip */}
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-around',
                  alignItems:     'center',
                  padding:        '16px 20px',
                  borderTop:      '1px solid var(--border)',
                  background:     'var(--surface-alt)',
                }}
              >
                <StatPill label="Total XP"      value={totalXp.toLocaleString()}   color="var(--primary-light)" />
                <div style={{ width: 1, height: 30, background: 'var(--border)' }} />
                <StatPill label="Skills Active" value={activeSkills}                color="var(--col-progress)" />
                <div style={{ width: 1, height: 30, background: 'var(--border)' }} />
                <StatPill label="Top Skill"     value={topSkill?.skill.name ?? '—'} color="var(--col-done)" />
              </div>
            </div>

            {/* Character description */}
            <div
              style={{
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding:      '18px 20px',
              }}
            >
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Office Upgrades
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { skill: 'Programming', desc: 'Screens & workstation gear', icon: '⌨' },
                  { skill: 'Learning',    desc: 'Books & bookshelves',         icon: '📚' },
                  { skill: 'Business',    desc: 'Documents, tie & trophy',     icon: '💼' },
                  { skill: 'Creativity',  desc: 'Sketchpads & design board',   icon: '🎨' },
                  { skill: 'Discipline',  desc: 'Clock & organized desk',       icon: '🎯' },
                  { skill: 'Communication', desc: 'Phone, headset & mic',      icon: '🗣' },
                  { skill: 'Fitness',     desc: 'Broader frame & dumbbell',    icon: '💪' },
                ].map(({ skill, desc, icon }) => {
                  const us = userSkills.find((u) => u.skill.name === skill);
                  const lv = us?.level ?? 0;
                  return (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.78rem', color: lv > 0 ? 'var(--text)' : 'var(--text-muted)', fontWeight: lv > 0 ? 600 : 400 }}>
                          {skill}
                        </p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{desc}</p>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: lv > 0 ? 'var(--col-done)' : 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                        {lv > 0 ? `Lv ${lv}` : 'Locked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT — Skill cards grid ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                  All Skills
                </p>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Complete tasks tagged with a skill to earn XP · 10 XP per task
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding:      '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border:       '1px solid var(--border)',
                  color:        'var(--text-muted)',
                  background:   'transparent',
                  fontSize:     '0.8rem',
                  cursor:       'pointer',
                  flexShrink:   0,
                  transition:   'all var(--transition-sm)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                ← Dashboard
              </button>
            </div>

            <div
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap:                 16,
              }}
            >
              {fullList.map((us) => (
                <SkillCard key={us.skillId} userSkill={us} />
              ))}
            </div>

            {/* XP earn guide */}
            <div
              style={{
                marginTop:    24,
                padding:      '16px 20px',
                background:   'var(--surface)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                display:      'flex',
                alignItems:   'center',
                gap:          14,
              }}
            >
              <div style={{ fontSize: 20, flexShrink: 0 }}>⚡</div>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                  How to level up
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Tag tasks with skills when creating or editing them. Moving a tagged task to <strong style={{ color: 'var(--col-done)' }}>Done</strong> awards 10 XP per skill. 100 XP = 1 level. Your avatar upgrades as you progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
