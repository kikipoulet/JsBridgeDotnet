import TodoList from '../pages/TodoList.jsx';

import Timer from '../pages/Timer.jsx';

import ArticleShop from '../pages/shop/ArticleShop.jsx';

import LayoutDemo from '../pages/LayoutDemo.jsx';

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
  layouts: {
    id: 'layouts',
    component: LayoutDemo,
    label: 'Layouts XAML',
    icon: '📐'
  },

};

export const DEFAULT_PAGE = 'todo';
