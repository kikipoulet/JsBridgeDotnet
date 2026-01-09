import TodoList from '../pages/TodoList.jsx';

import Timer from '../pages/Timer.jsx';

import ArticleShop from '../pages/shop/ArticleShop.jsx';

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

