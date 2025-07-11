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
  console.log('getImageUrl called with:', { imageUrl, type });
  
  // Fix Windows-style paths and extract filename from absolute paths
  if (imageUrl && typeof imageUrl === 'string') {
    // Extract just the filename from complex paths that might contain Windows-style paths
    if (imageUrl.includes('\\') || 
        imageUrl.includes('C:') || 
        imageUrl.includes('/uploads/') || 
        imageUrl.includes('profileImage-')) {
      
      // Extract the filename using the most reliable pattern - get just the profileImage filename
      const matches = imageUrl.match(/profileImage-[^\\\/]+\.\w+/);
      if (matches && matches[0]) {
        console.log('Extracted filename using regex:', matches[0]);
        imageUrl = '/uploads/' + matches[0];
      } else {
        // Fallback to simpler filename extraction
        const parts = imageUrl.split(/[\/\\]/);
        const filename = parts[parts.length - 1];
        if (filename && !filename.includes('C:')) {
          console.log('Extracted filename using split:', filename);
          imageUrl = '/uploads/' + filename;
        }
      }
      console.log('Simplified imageUrl to:', imageUrl);
    }
  }
  
  // Ensure imageUrl has a leading slash if it doesn't start with http or /
  if (imageUrl && 
      typeof imageUrl === 'string' && 
      !imageUrl.startsWith('http') && 
      !imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl;
    console.log('Added leading slash to imageUrl:', imageUrl);
  }
  
  // Return default image if URL is missing or invalid
  if (!imageUrl || 
      typeof imageUrl !== 'string' || 
      imageUrl === '/undefined' || 
      imageUrl === 'undefined' || 
      imageUrl === 'null') {
    console.log('Using default image for', type);
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
    console.log('URL already complete, returning as is:', imageUrl);
    return imageUrl;
  } 
  
  // Handle backend paths that need to be prefixed with API URL
  if (imageUrl.startsWith('/')) {
    console.log('URL starts with /, adding API prefix');
    
    // Handle special case for uploads with full paths (simplify to just filename)
    if (imageUrl.includes('/uploads/') && (imageUrl.includes('\\') || imageUrl.includes('C:'))) {
      // Extract just the filename
      const matches = imageUrl.match(/profileImage-[^\\\/]+\.\w+/);
      if (matches && matches[0]) {
        const filename = matches[0];
        const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
        console.log('Fixed complex path to:', fullUrl);
        return fullUrl;
      }
    }
    
    // For team service images
    if (type === 'team') {
      const fullUrl = `${TEAM_SERVICE_URL}${imageUrl}`;
      console.log('Returning team URL:', fullUrl);
      return fullUrl;
    }
    // For user profile images
    if (type === 'user') {
      const fullUrl = `${AUTH_SERVICE_URL}${imageUrl}`;
      console.log('Returning user URL:', fullUrl);
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
    console.log('Detected profile image pattern in URL');
    const filename = imageUrl.split(/[\/\\]/).pop();
    const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
    console.log('Extracted filename:', filename, 'Full URL:', fullUrl);
    return fullUrl;
  }
  
  // Handle file:// paths, absolute paths without protocol, or relative paths
  if (imageUrl.includes('C:') || 
      imageUrl.includes('/Users/') || 
      imageUrl.startsWith('file://') || 
      imageUrl.includes('profileImage-') ||
      imageUrl.includes('uploads')) {
    
    console.log('Handling file path or uploads path:', imageUrl);
    
    // Extract the filename using a more robust approach
    let filename;
    
    // Try to extract filename from various path formats
    if (imageUrl.includes('/uploads/')) {
      filename = imageUrl.split('/uploads/')[1];
      console.log('Extracted filename from /uploads/:', filename);
    } else if (imageUrl.includes('\\uploads\\')) {
      filename = imageUrl.split('\\uploads\\')[1];
      console.log('Extracted filename from \\uploads\\:', filename);
    } else {
      // Extract just the filename
      filename = imageUrl.split(/[\/\\]/).pop();
      console.log('Extracted filename using split:', filename);
    }
    
    // Ensure we have the filename
    if (!filename) {
      console.warn("Could not extract filename from path:", imageUrl);
      return type === 'user' ? '/placeholder-user.jpg' : '/placeholder.svg';
    }
    
    // Format the URL based on type
    if (type === 'user') {
      const fullUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
      console.log('Returning user URL with filename:', fullUrl);
      return fullUrl;
    }
    if (type === 'team') {
      const fullUrl = `${TEAM_SERVICE_URL}/uploads/${filename}`;
      console.log('Returning team URL with filename:', fullUrl);
      return fullUrl;
    }
    
    const defaultUrl = `${AUTH_SERVICE_URL}/uploads/${filename}`;
    console.log('Returning default URL with filename:', defaultUrl);
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
