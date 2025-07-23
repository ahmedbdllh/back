// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Other configuration constants
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

// Authentication constants
export const TOKEN_STORAGE_KEY = 'auth_token';
export const USER_STORAGE_KEY = 'user_data';
