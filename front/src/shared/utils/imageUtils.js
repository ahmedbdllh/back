/**
 * Utility functions for handling images throughout the application
 */

// Base URLs for different services
const AUTH_SERVICE_URL = 'http://localhost:5000';
const TEAM_SERVICE_URL = 'http://localhost:5004';

/**
 * Returns the appropriate image URL with fallback to default images
 * @param {string|null} imageUrl - The original image URL
 * @param {string} type - Type of image ('team', 'user', 'court')
 * @returns {string} - A valid image URL or default image path
 */
export const getImageUrl = (imageUrl, type = 'team') => {
  //
  
  // Return default image if URL is missing or invalid
  if (!imageUrl || 
      typeof imageUrl !== 'string' || 
      imageUrl === '/undefined' || 
      imageUrl === 'undefined' || 
      imageUrl === 'null' ||
      imageUrl === '/uploads/default/team-default.jpg' ||
      imageUrl.trim() === '') {
    //
    // Return default images based on type
    switch (type) {
      case 'team':
        return '/sae.jpg'; // Frontend default team image
      case 'user':
        return '/placeholder-user.jpg';
      case 'court':
        return '/placeholder.jpg';
      default:
        return '/placeholder.svg';
    }
  }
  
  // If already a complete URL, return as is
  if (imageUrl.startsWith('http')) {
    //
    return imageUrl;
  } 
  
  // Handle backend paths that need to be prefixed with API URL
  if (imageUrl.startsWith('/')) {
    //
    
    // For team service images (team logos)
    if (type === 'team') {
      const fullUrl = `${TEAM_SERVICE_URL}${imageUrl}`;
      //
      return fullUrl;
    }
    
    // Handle user profile images for auth service
    if (type === 'user' || imageUrl.includes('profileImage-')) {
      // Handle special case for uploads with full paths (simplify to just filename)
      if (imageUrl.includes('/uploads/') && (imageUrl.includes('\\') || imageUrl.includes('C:'))) {
        // Extract just the filename
        const matches = imageUrl.match(/profileImage-[^\\\/]+\.\w+/);
        if (matches && matches[0]) {
          const filename = matches[0];
          const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
          //
          return fullUrl;
        }
      }
      
      const fullUrl = `${AUTH_SERVICE_URL}${imageUrl}`;
      //
      return fullUrl;
    }
    // For user profile images
    if (type === 'user') {
      const fullUrl = `${AUTH_SERVICE_URL}${imageUrl}`;
      //
      return fullUrl;
    }
    return imageUrl;
  }
  
  // Handle profile image specific patterns for user images
  if (type === 'user' && (
      imageUrl.includes('profileImage-') || 
      imageUrl.includes('service auth/uploads') ||
      imageUrl.includes('service%20auth/uploads')
    )) {
    //
    const filename = imageUrl.split(/[\/\\]/).pop();
    const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
    //
    return fullUrl;
  }
  
  // Handle file:// paths, absolute paths without protocol, or relative paths
  if (imageUrl.includes('C:') || 
      imageUrl.includes('/Users/') || 
      imageUrl.startsWith('file://') || 
      imageUrl.includes('profileImage-') ||
      imageUrl.includes('uploads')) {
    
    //
    
    // Extract the filename using a more robust approach
    let filename;
    
    // Try to extract filename from various path formats
    if (imageUrl.includes('/uploads/')) {
      filename = imageUrl.split('/uploads/')[1];
      //
    } else if (imageUrl.includes('\\uploads\\')) {
      filename = imageUrl.split('\\uploads\\')[1];
      //
    } else {
      // Extract just the filename
      filename = imageUrl.split(/[\/\\]/).pop();
      //
    }
    
    // Ensure we have the filename
    if (!filename) {
      //
      return type === 'user' ? '/placeholder-user.jpg' : '/placeholder.svg';
    }
    
    // Format the URL based on type
    if (type === 'user') {
      const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
      //
      return fullUrl;
    }
    if (type === 'team') {
      const fullUrl = `${TEAM_SERVICE_URL}/uploads/${filename}`;
      //
      return fullUrl;
    }
    
    const defaultUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
    //
    return defaultUrl;
  }
  
  return imageUrl;
};

/**
 * Error handler for image loading failures
 * @param {Event} event - The error event
 * @param {string} type - Type of image ('team', 'user', 'court')
 * @param {string} entityName - Optional name of entity for logging
 */
export const handleImageError = (event, type = 'team', entityName = '') => {
  const element = event.target;
  const originalSrc = element.src;
  
  // Only set a new source if we haven't already tried the default
  if (originalSrc.includes('placeholder') || 
      originalSrc.includes('sae.jpg') || 
      originalSrc.includes('default')) {
    // Already using a fallback, don't try again
    element.onerror = null;
    return;
  }
  
  // Set default fallback image based on type
  switch (type) {
    case 'team':
      element.src = '/sae.jpg';
      break;
    case 'user':
      element.src = '/placeholder-user.jpg';
      break;
    case 'court':
      element.src = '/placeholder.jpg';
      break;
    default:
      element.src = '/placeholder.svg';
  }
  
  // Prevent infinite error loop
  element.onerror = null;
  
  // Uncomment for debugging specific issues
  // if (entityName && process.env.NODE_ENV === 'development') {
  //   console.log(`Using default ${type} image for ${entityName}. Original source: ${originalSrc}`);
  // }
};
