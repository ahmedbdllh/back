export const Checkbox = ({ id, label, className = "", error, ...props }) => {
  return (
    <div className="space-y-1.5">
      <div className={`flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <input
            id={id}
            type="checkbox"
            className="w-4 h-4 
              rounded 
              border-input 
              bg-input 
              text-primary 
              focus:ring-2 
              focus:ring-ring/50 
              focus:ring-offset-2
              focus:ring-offset-background
              focus:outline-none
              transition-colors
              duration-200
              cursor-pointer
              shadow-sm
              hover:border-primary/70"
            {...props}
          />
        </div>
        {label && (
          <label htmlFor={id} className="ml-3 text-sm text-foreground cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
  