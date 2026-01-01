import TodoList from './TodoList.jsx';
import Settings from './Settings.jsx';
import Stats from './Stats.jsx';

export const PAGES = {
  todo: {
    id: 'todo',
    component: TodoList,
    label: 'TodoList',
    icon: '📋'
  },
  settings: {
    id: 'settings',
    component: Settings,
    label: 'Paramètres',
    icon: '⚙️'
  },
  stats: {
    id: 'stats',
    component: Stats,
    label: 'Statistiques',
    icon: '📊'
  }
};

export const DEFAULT_PAGE = 'stats';
