import TodoList from './TodoList.jsx';

import Timer from './Timer.jsx';

export const PAGES = {
  todo: {
    id: 'todo',
    component: TodoList,
    label: 'TodoList',
    icon: '📋'
  },
  timer: {
    id: 'timer',
    component: Timer,
    label: 'Timer',
    icon: '⏱️'
  },

};

export const DEFAULT_PAGE = 'todo';
