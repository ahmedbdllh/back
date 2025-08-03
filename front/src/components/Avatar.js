import React from 'react';

/**
 * Local Avatar component that generates initials-based avatars
 * without external dependencies
 */
const Avatar = ({ 
  name = '', 
  size = 40, 
  backgroundColor = '#0ea5e9', 
  textColor = '#ffffff',
  className = '',
  style = {}
}) => {
  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return names
      .slice(0, 2) // Take first two names
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  };

  const initials = getInitials(name);
  
  // Calculate font size based on avatar size
  const fontSize = Math.max(size * 0.4, 12);

  const avatarStyle = {
    width: size,
    height: size,
    backgroundColor,
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    fontSize: `${fontSize}px`,
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    userSelect: 'none',
    flexShrink: 0,
    ...style
  };

  return (
    <div 
      className={`avatar ${className}`}
      style={avatarStyle}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
