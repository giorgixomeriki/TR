export const TOKEN_KEY = 'taskflow_token';

export const TASK_STATUS = {
  TODO:        'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE:        'DONE',
};

export const COLUMNS = [
  {
    id:          'TODO',
    label:       'To Do',
    accentColor: 'var(--col-todo)',
    emptyMsg:    'No tasks queued. Add one to get started.',
  },
  {
    id:          'IN_PROGRESS',
    label:       'In Progress',
    accentColor: 'var(--col-progress)',
    emptyMsg:    'Nothing active. Drag a task here.',
  },
  {
    id:          'DONE',
    label:       'Done',
    accentColor: 'var(--col-done)',
    emptyMsg:    'Completed tasks will appear here.',
  },
];
