import { useState, useEffect } from 'react';
import { getAllSkills } from '../services/skillService';

export default function SkillTagSelector({ selectedIds = [], onChange }) {
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    getAllSkills().then(setSkills).catch(() => {});
  }, []);

  const toggle = (id) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  };

  if (skills.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {skills.map((skill) => {
        const active = selectedIds.includes(skill.id);
        return (
          <button
            key={skill.id}
            type="button"
            onClick={() => toggle(skill.id)}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          5,
              padding:      '5px 11px',
              borderRadius: 'var(--radius-full)',
              border:       `1px solid ${active ? skill.color : 'var(--border)'}`,
              background:   active ? `${skill.color}18` : 'var(--surface-alt)',
              color:        active ? skill.color : 'var(--text-muted)',
              fontSize:     '0.76rem',
              fontWeight:   active ? 700 : 400,
              cursor:       'pointer',
              transition:   'all var(--transition-sm)',
              whiteSpace:   'nowrap',
            }}
          >
            <span style={{ fontSize: '0.9em' }}>{skill.icon}</span>
            {skill.name}
          </button>
        );
      })}
    </div>
  );
}
