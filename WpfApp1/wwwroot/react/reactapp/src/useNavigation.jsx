import { useState, useCallback, useMemo } from 'react';
import { PAGES, DEFAULT_PAGE } from './navigation.config.jsx';

export function useNavigation() {
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);

  const navigate = useCallback((pageId) => {
    if (PAGES[pageId]) {
      setCurrentPage(pageId);
    } else {
      console.error(`Page not found: ${pageId}`);
    }
  }, []);

  const currentPageComponent = useMemo(() => {
    return PAGES[currentPage]?.component;
  }, [currentPage]);

  const getCurrentPage = useCallback(() => {
    return PAGES[currentPage];
  }, [currentPage]);

  const getPageList = useCallback(() => {
    return Object.values(PAGES);
  }, []);

  return {
    currentPage,
    currentPageComponent,
    navigate,
    getCurrentPage,
    getPageList
  };
}
