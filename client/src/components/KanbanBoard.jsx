import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { COLUMNS } from '../constants';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete, onAdd }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // require 8px movement before drag starts
    })
  );

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const newStatus = over.id; // droppable id = column status key
    const task      = tasks.find((t) => t.id === active.id);

    if (task && task.status !== newStatus) {
      onStatusChange(task.id, newStatus);
    }
  };

  const handleDragCancel = () => setActiveTask(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 20,
          alignItems:          'start',
        }}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={() => onAdd(col.id)}
          />
        ))}
      </div>

      {/* Ghost card shown under the cursor while dragging */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeTask && (
          <div style={{ transform: 'rotate(1.5deg)', opacity: 0.92 }}>
            <TaskCard task={activeTask} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
