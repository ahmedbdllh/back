// Search utility functions for advanced filtering and sorting

export const buildSearchQuery = (searchParams) => {
  const query = new URLSearchParams();
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== '') {
      query.append(key, value);
    }
  });
  
  return query.toString();
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
};

export const filterOptions = {
  sports: [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'padel', label: 'Padel' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'handball', label: 'Handball' }
  ],
  
  footballPositions: [
    { value: 'goalkeeper', label: 'Goalkeeper' },
    { value: 'defender', label: 'Defender' },
    { value: 'midfielder', label: 'Midfielder' },
    { value: 'forward', label: 'Forward' },
    { value: 'winger', label: 'Winger' }
  ],
  
  basketballPositions: [
    { value: 'point-guard', label: 'Point Guard' },
    { value: 'shooting-guard', label: 'Shooting Guard' },
    { value: 'small-forward', label: 'Small Forward' },
    { value: 'power-forward', label: 'Power Forward' },
    { value: 'center', label: 'Center' }
  ],
  
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ]
};

export const sortOptions = {
  players: [
    { value: 'fullName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'preferredSport', label: 'Sport' },
    { value: 'position', label: 'Position' },
    { value: 'createdAt', label: 'Join Date' },
    { value: 'isVerified', label: 'Status' }
  ],
  
  managers: [
    { value: 'fullName', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'createdAt', label: 'Join Date' },
    { value: 'isVerified', label: 'Status' }
  ]
};

export const getPositionOptions = (sport) => {
  switch (sport) {
    case 'football':
      return filterOptions.footballPositions;
    case 'basketball':
      return filterOptions.basketballPositions;
    default:
      return [];
  }
};

export const formatSearchResults = (data, searchTerm) => {
  if (!searchTerm) return data;
  
  return data.map(item => ({
    ...item,
    highlightedName: highlightSearchTerm(item.name, searchTerm),
    highlightedEmail: highlightSearchTerm(item.email, searchTerm)
  }));
};

export const getSearchSuggestions = (searchTerm, data, fields = ['name', 'email']) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const suggestions = new Set();
  const term = searchTerm.toLowerCase();
  
  data.forEach(item => {
    fields.forEach(field => {
      if (item[field] && item[field].toLowerCase().includes(term)) {
        // Extract relevant part that matches
        const value = item[field];
        const index = value.toLowerCase().indexOf(term);
        if (index !== -1) {
          const suggestion = value.substring(index, index + term.length + 10);
          suggestions.add(suggestion);
        }
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 5);
};

export default {
  buildSearchQuery,
  debounce,
  highlightSearchTerm,
  filterOptions,
  sortOptions,
  getPositionOptions,
  formatSearchResults,
  getSearchSuggestions
};
