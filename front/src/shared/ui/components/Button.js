export const Button = ({ children, variant = "primary", size = "md", className = "", name = "", ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-lg",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring",
    ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
    outline:
      "border border-[#2a2a40] bg-transparent hover:border-blue-500 hover:text-blue-400 focus-visible:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    glass:
      "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 focus-visible:ring-white/30 shadow-lg",
  }

  const sizes = {
    xs: "py-1.5 px-3 text-xs",
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-5 text-base",
    lg: "py-3.5 px-6 text-lg",
  }

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  return (
    <button className={classes} name={name} {...props}>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  )
}
