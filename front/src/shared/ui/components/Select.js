import { useState } from 'react';

export const Select = ({ options, className = "", label, id, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`
            w-full px-4 py-2.5 
            appearance-none 
            bg-input 
            border ${error ? 'border-destructive' : isFocused ? 'border-primary' : 'border-input'} 
            rounded-md text-foreground 
            shadow-sm 
            focus:outline-none 
            focus:ring-2 ${error ? 'focus:ring-destructive/50' : 'focus:ring-ring/50'} 
            focus:border-transparent 
            transition-all duration-200 ease-in-out 
            hover:border-input/80
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-background text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive animate-fade-in mt-1">{error}</p>
      )}
    </div>
  );
}
  