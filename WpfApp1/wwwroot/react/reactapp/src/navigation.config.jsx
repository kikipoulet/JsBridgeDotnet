import TodoList from './TodoList.jsx';

import Timer from './Timer.jsx';

import ArticleShop from './ArticleShop.jsx';

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
  shop: {
    id: 'shop',
    component: ArticleShop,
    label: 'Boutique',
    icon: '🛒'
  },

};

export const DEFAULT_PAGE = 'todo';

