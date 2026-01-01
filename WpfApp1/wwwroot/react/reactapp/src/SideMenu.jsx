import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Surface } from '@heroui/react';
import { PAGES } from './navigation.config.jsx';

function SideMenu({ currentPage, onPageChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapseCounter, setCollapseCounter] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    // Check system preference or saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const document = window.document.documentElement;
    
    if (isDark) {
      document.classList.add('dark');
      document.setAttribute('data-theme', 'dark');
    } else {
      document.classList.remove('dark');
      document.setAttribute('data-theme', 'light');
    }
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleCollapse = () => {
    if (!isCollapsed) {
      setCollapseCounter(prev => prev + 1);
    }
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = Object.values(PAGES);

  return (
    <Surface variant="default">
      <aside 
        className={`h-screen border-r transition-all duration-420 ease-in-out flex flex-col overflow-hidden flex-shrink-0 m-0 p-0 shadow-lg ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >

          {/* Menu toggle button and theme switcher */}
          <div className="flex items-center justify-between px-2 mb-6 ml-1 mt-3">
              {/* Theme toggle button */}
              {isCollapsed ? (<div></div>) : (
              <Button
                  variant="ghost"
                  onPress={() => setIsDark(!isDark)}
                  className="m-0 bg-white dark:bg-gray-700"
                  isIconOnly
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                  {isDark ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"></circle>
                          <line x1="12" y1="1" x2="12" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="23"></line>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                          <line x1="1" y1="12" x2="3" y2="12"></line>
                          <line x1="21" y1="12" x2="23" y2="12"></line>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                          <path d="M12 3a6 6 0 0 0 6 6 6 0 0 0 6-6 6 6 0 0 0-6 6zm0 14a6 6 0 0 0 6 6 6 0 0 0 6-6 6 6 0 0 0-6 6z"></path>
                      </svg>
                  )}
              </Button>
                  )}
              
              {/* Menu collapse button */}
              <Button
                  variant="ghost"
                  onPress={handleCollapse}
                  className="m-0"
                  isIconOnly
                  aria-label={isCollapsed ? "Ouvrir le menu" : "Fermer le menu"}
              >
                  {isCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="12" x2="21" y2="12"></line>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                  )}
              </Button>
          </div>

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                height: { duration: 0.42 },
                opacity: { duration: 0.28 }
              }}
              className="flex flex-col items-center justify-center overflow-hidden px-4 gap-2"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" 
                alt="React Logo" 
                className="w-16 h-16"
              />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                React Example
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        

      {/* Navigation items - always visible, labels animate on collapse */}
      <motion.nav
        initial={false}
        animate={{
          paddingLeft: isCollapsed ? '0rem' : '1rem',
          paddingRight: isCollapsed ? '0rem' : '1rem'
        }}
        transition={{ duration: 0.42, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto mt-8"
      >
        <ul className="space-y-2 list-none">
          {menuItems.map((item, index) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-4 py-3 rounded-full transition-all duration-200 font-medium border-0 cursor-pointer text-left m-0 ${
                  currentPage === item.id
                    ? 'bg-accent text-white shadow-md hover:opacity-90'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{
                  width: '100%',
                  minWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <motion.span
                  key={`icon-${item.id}-${collapseCounter}`}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ 
                    opacity: [1, 0, 0, 1],
                    scale: [1, 0.5, 0.5, 1]
                  }}
                  transition={{ 
                    duration: 1.05,
                    times: [0, 0.3, 0.6, 1]
                  }}
                  className="text-xl"
                >
                  {item.icon}
                </motion.span>
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.35, delay: index * 0.07 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </li>
          ))}
        </ul>
          </motion.nav>

      </aside>
    </Surface>
  );
}

export default SideMenu;
