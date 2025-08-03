import React from 'react';

const PlayerSearch = ({ 
  searchQuery, 
  onSearchChange, 
  isSearching 
}) => {
  return (
    <div className="search-container mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search players by name or email..."
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full bg-neutral-700 text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-neutral-600 transition-all duration-300"
          disabled={isSearching}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
          ) : (
            <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSearch;
