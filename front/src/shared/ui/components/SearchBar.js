import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  filters = [], 
  sortOptions = [], 
  placeholder = "Search...",
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const triggerSearch = useCallback((search, sort, order, filters) => {
    const searchParams = {
      search: search,
      sortBy: sort,
      sortOrder: order,
      ...filters
    };
    onSearch(searchParams);
  }, [onSearch]);
  // Initialize filters only once - NO automatic search trigger
  useEffect(() => {
    if (!isInitialized && filters.length > 0) {
      const initialFilters = {};
      filters.forEach(filter => {
        initialFilters[filter.key] = filter.defaultValue || 'all';
      });
      setActiveFilters(initialFilters);
      setIsInitialized(true);
      
      // DON'T trigger search during initialization - let the parent handle initial load
    } else if (!isInitialized && filters.length === 0) {
      // Even with no filters, initialize with empty state
      setIsInitialized(true);
    }
  }, [filters, isInitialized]); // Remove triggerSearch from dependencies

  // Debounced search for all changes - only after user interaction
  useEffect(() => {
    if (!isInitialized || !hasUserInteracted) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      triggerSearch(searchTerm, sortBy, sortOrder, activeFilters);
    }, 500); // Increased debounce time to reduce requests
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, sortBy, sortOrder, activeFilters, isInitialized, hasUserInteracted, triggerSearch]);
  const handleFilterChange = (filterKey, value) => {
    setHasUserInteracted(true);
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    setActiveFilters(newFilters);
    // Don't call triggerSearch directly - let the useEffect handle it with debouncing
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setHasUserInteracted(true);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // Don't call triggerSearch directly - let the useEffect handle it with debouncing
  };

  const clearAllFilters = () => {
    setHasUserInteracted(true);
    setSearchTerm('');
    const clearedFilters = {};
    filters.forEach(filter => {
      clearedFilters[filter.key] = 'all';
    });
    setActiveFilters(clearedFilters);
    setSortBy('');
    setSortOrder('asc');
    // Don't call triggerSearch directly - let the useEffect handle it with debouncing
  };

  const hasActiveFilters = () => {
    return searchTerm || 
           Object.values(activeFilters).some(value => value !== 'all') ||
           sortBy;
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 mb-6 ${className}`}>
      {/* Search Input */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setHasUserInteracted(true);
              setSearchTerm(e.target.value);
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-blue-600 border-blue-500 text-white' 
              : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-slate-600 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dynamic Filters */}
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || 'all'}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Sort Options */}
            {sortOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Default</option>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {sortBy && (
                    <button
                      onClick={() => handleSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
