import { useState, useCallback } from 'react';

export const useAdvancedSearch = (initialFilters = {}) => {
  const [searchParams, setSearchParams] = useState({
    search: '',
    page: 1,
    limit: 10,
    sortBy: '',
    sortOrder: 'asc',
    ...initialFilters
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
    count: 0
  });
  const updateSearchParams = useCallback((newParams) => {
    setSearchParams(prev => {
      const updated = {
        ...prev,
        ...newParams,
        page: newParams.search !== prev.search || 
              newParams.status !== prev.status ||
              newParams.sport !== prev.sport ||
              newParams.position !== prev.position ||
              newParams.sortBy !== prev.sortBy ||
              newParams.sortOrder !== prev.sortOrder ? 1 : prev.page
      };
      return updated;
    });
  }, []);

  const updatePagination = useCallback((paginationData) => {
    setPagination(paginationData);
  }, []);

  const changePage = useCallback((page) => {
    setSearchParams(prev => ({ ...prev, page }));
  }, []);

  const changeItemsPerPage = useCallback((limit) => {
    setSearchParams(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const resetSearch = useCallback(() => {
    setSearchParams({
      search: '',
      page: 1,
      limit: 10,
      sortBy: '',
      sortOrder: 'asc',
      ...initialFilters
    });
    setPagination({
      page: 1,
      pages: 0,
      total: 0,
      count: 0
    });
  }, [initialFilters]);

  return {
    searchParams,
    pagination,
    updateSearchParams,
    updatePagination,
    changePage,
    changeItemsPerPage,
    resetSearch
  };
};
