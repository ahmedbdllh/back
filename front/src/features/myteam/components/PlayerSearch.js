import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

const PlayerSearch = ({ 
  searchQuery, 
  onSearchChange, 
  isSearching 
}) => {
  return (
    <div className="relative">
      <div className="relative group">
        <Search 
          size={18} 
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            isSearching ? 'text-blue-400' : 'text-white/60 group-hover:text-white/80'
          }`} 
        />
        
        <input
          type="text"
          placeholder="Search by name, email, or sport..."
          value={searchQuery}
          onChange={onSearchChange}
          className="w-full bg-white/10 border border-white/20 text-white px-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/15 transition-all duration-300 placeholder-white/50 text-sm"
          disabled={isSearching}
        />
        
        {/* Loading spinner when searching */}
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Loader2 size={16} className="text-blue-400 animate-spin" />
          </div>
        )}
        
        {/* Clear button */}
        {searchQuery && !isSearching && (
          <button
            onClick={() => onSearchChange({ target: { value: '' } })}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/10 hover:bg-red-500/20 rounded-full flex items-center justify-center transition-all duration-200 group/clear"
            title="Clear search"
          >
            <X size={14} className="text-white/60 group-hover/clear:text-red-400 transition-colors duration-200" />
          </button>
        )}
      </div>
      
      {/* Search tips - only show when no query and not searching */}
      {!searchQuery && !isSearching && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
            🔍 Name
          </span>
          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
            ⚽ Sport
          </span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
            📧 Email
          </span>
        </div>
      )}
      
      {/* Search status */}
      {searchQuery && (
        <div className="mt-2 text-xs text-white/60">
          {isSearching ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              Searching for "{searchQuery}"...
            </span>
          ) : (
            <span>
              Press Enter to search or use filters above
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerSearch;
