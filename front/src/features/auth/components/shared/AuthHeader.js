export const AuthHeader = ({ title, subtitle }) => {
    return (
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-2 sm:mt-3 md:text-base max-w-md mx-auto">{subtitle}</p>}
      </div>
    )
  }
