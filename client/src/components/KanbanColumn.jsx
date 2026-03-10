import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';

/* ── Draggable wrapper ─────────────────────────────── */
function DraggableCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        opacity:   isDragging ? 0.35 : 1,
        zIndex:    isDragging ? 999 : 'auto',
      }}
      {...attributes}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

/* ── Empty state ───────────────────────────────────── */
function EmptyColumn({ message }) {
  return (
    <div
      style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        justifyContent:'center',
        padding:       '40px 16px',
        gap:           8,
        animation:     'fadeIn 0.3s var(--ease)',
      }}
    >
      <div
        style={{
          width:        36,
          height:       36,
          borderRadius: 'var(--radius-md)',
          border:       '1px dashed var(--border-hover)',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          marginBottom:  4,
          color:        'var(--text-muted)',
          fontSize:     18,
        }}
      >
        ·
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  );
}

/* ── Column ────────────────────────────────────────── */
export default function KanbanColumn({ column, tasks, onEdit, onDelete, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const accentRaw = column.id === 'TODO'
    ? 'rgba(100,116,139,'
    : column.id === 'IN_PROGRESS'
      ? 'rgba(245,158,11,'
      : 'rgba(16,185,129,';

  return (
    <div
      ref={setNodeRef}
      style={{
        display:       'flex',
        flexDirection: 'column',
        background:    isOver ? 'rgba(255,255,255,0.015)' : 'var(--surface)',
        border:        `1px solid ${isOver ? accentRaw + '0.35)' : 'var(--border)'}`,
        borderRadius:  'var(--radius-lg)',
        minHeight:     480,
        transition:    'border-color 0.15s ease, background 0.15s ease',
        overflow:      'hidden',
      }}
    >
      {/* Column header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 16px',
          borderBottom:   '1px solid var(--border)',
          flexShrink:     0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status dot */}
          <div
            style={{
              width:        8,
              height:       8,
              borderRadius: '50%',
              background:   column.accentColor,
              boxShadow:    `0 0 6px ${accentRaw}0.5)`,
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontSize:      '0.72rem',
              fontWeight:    700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         'var(--text-secondary)',
            }}
          >
            {column.label}
          </span>
          {/* Count badge */}
          <span
            style={{
              fontSize:     '0.7rem',
              fontWeight:   600,
              color:        tasks.length > 0 ? column.accentColor : 'var(--text-muted)',
              background:   tasks.length > 0 ? `${accentRaw}0.12)` : 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-full)',
              padding:      '1px 7px',
              minWidth:     22,
              textAlign:    'center',
            }}
          >
            {tasks.length}
          </span>
        </div>

        {/* Quick-add button (only on To Do) */}
        {column.id === 'TODO' && (
          <button
            onClick={onAdd}
            title="Add task"
            style={{
              width:        26,
              height:       26,
              borderRadius: 'var(--radius-sm)',
              border:       '1px solid var(--border)',
              color:        'var(--text-muted)',
              background:   'transparent',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     16,
              transition:   'all var(--transition-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color      = 'var(--text)';
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.background = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color      = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Cards area */}
      <div
        style={{
          flex:          1,
          padding:       12,
          display:       'flex',
          flexDirection: 'column',
          gap:           8,
          overflowY:     'auto',
          minHeight:     0,
        }}
      >
        {tasks.length === 0
          ? <EmptyColumn message={column.emptyMsg} />
          : tasks.map((task) => (
              <DraggableCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
        }
      </div>
    </div>
  );
}
