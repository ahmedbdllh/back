import React, { forwardRef } from 'react';

export const Card = forwardRef(({ children, className = "", variant = "default", as: Component = 'div', ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground border border-border shadow-md",
    glass: "bg-background/70 backdrop-blur-lg border border-border/50 shadow-xl",
    elevated: "bg-card text-card-foreground border border-border shadow-lg transform hover:scale-[1.01] transition-transform duration-300",
    interactive: "bg-card text-card-foreground border border-border shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer"
  };
  
  return (
    <Component 
      ref={ref}
      className={`rounded-lg overflow-hidden ${variants[variant]} ${className}`}
      {...props}
    >
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
      )}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </Component>
  )
})

// Add display name for better debugging
Card.displayName = 'Card';
  