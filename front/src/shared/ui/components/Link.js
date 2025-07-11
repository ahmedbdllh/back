export const Link = ({
  href,
  children,
  className = "",
  size = "md",
  variant = "default",
  underline = true,
  onClick,
  ...props
}) => {
  const sizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-medium",
  }

  const variants = {
    default: "text-foreground hover:text-primary focus:text-primary",
    primary: "text-sky-400 hover:text-sky-300 focus:text-sky-300",
    secondary: "text-muted-foreground hover:text-foreground focus:text-foreground",
    accent: "text-accent-foreground hover:text-accent-foreground/80 focus:text-accent-foreground/80",
    subtle: "text-muted-foreground hover:text-foreground/80 focus:text-foreground/80",
    danger: "text-red-400 hover:text-red-300 focus:text-red-300",
    success: "text-green-400 hover:text-green-300 focus:text-green-300",
    link: "text-sky-400 hover:text-sky-300 focus:text-sky-300",
  }

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      onClick(e)
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`
        relative inline-block transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm
        ${variants[variant]} ${sizes[size]} ${className}
        ${
          underline
            ? `
          after:absolute after:bottom-[-2px] after:left-0 after:h-[1.5px] 
          after:w-0 after:bg-current after:opacity-70 after:transition-all after:duration-300 
          hover:after:w-full focus:after:w-full
        `
            : ""
        }
      `}
      {...props}
    >
      {children}
    </a>
  )
}
