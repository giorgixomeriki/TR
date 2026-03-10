import { useState } from 'react';
import { createSubtask, updateSubtask, deleteSubtask } from '../services/subtaskService';

function SubtaskItem({ subtask, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  const handleToggle = () => onToggle(subtask.id, !subtask.completed);
  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(subtask.id);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '8px 10px',
        borderRadius:'var(--radius-sm)',
        background:  hovered ? 'var(--surface-hover)' : 'transparent',
        transition:  'background var(--transition)',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        style={{
          width:        18,
          height:       18,
          borderRadius: 4,
          border:       `2px solid ${subtask.completed ? 'var(--col-done)' : 'var(--border-hover)'}`,
          background:   subtask.completed ? 'var(--col-done)' : 'transparent',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          flexShrink:   0,
          cursor:       'pointer',
          transition:   'all var(--transition-sm)',
        }}
      >
        {subtask.completed && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        style={{
          flex:          1,
          fontSize:      '0.875rem',
          color:         subtask.completed ? 'var(--text-muted)' : 'var(--text)',
          textDecoration:subtask.completed ? 'line-through' : 'none',
          lineHeight:    1.4,
        }}
      >
        {subtask.title}
      </span>

      {/* Delete */}
      {hovered && !deleting && (
        <button
          onClick={handleDelete}
          title="Delete subtask"
          style={{
            width:        22,
            height:       22,
            borderRadius: 4,
            color:        'var(--text-muted)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            cursor:       'pointer',
            flexShrink:   0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default function SubtaskList({ taskId, initialSubtasks = [] }) {
  const [subtasks,  setSubtasks] = useState(initialSubtasks);
  const [newTitle,  setNewTitle] = useState('');
  const [adding,    setAdding]   = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const sub = await createSubtask(taskId, newTitle.trim());
      setSubtasks((prev) => [...prev, sub]);
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id, completed) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed } : s)));
    try {
      await updateSubtask(id, { completed });
    } catch {
      setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !completed } : s)));
    }
  };

  const handleDelete = async (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    await deleteSubtask(id);
  };

  const done  = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;

  return (
    <div>
      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{done}/{total}</span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 99 }}>
            <div
              style={{
                height:       '100%',
                width:        `${total ? (done / total) * 100 : 0}%`,
                background:   'var(--col-done)',
                borderRadius: 99,
                transition:   'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Subtask items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {subtasks.map((sub) => (
          <SubtaskItem
            key={sub.id}
            subtask={sub}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add new subtask */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginTop: subtasks.length > 0 ? 10 : 0 }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="input-base"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          style={{
            padding:      '8px 16px',
            borderRadius: 'var(--radius-md)',
            background:   'var(--surface-alt)',
            border:       '1px solid var(--border)',
            color:        'var(--text-secondary)',
            fontSize:     '0.8rem',
            fontWeight:   500,
            cursor:       adding ? 'wait' : 'pointer',
            whiteSpace:   'nowrap',
            transition:   'all var(--transition-sm)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {adding ? '...' : '+ Add'}
        </button>
      </form>
    </div>
  );
}
