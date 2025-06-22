export const Container = ({ children, className = "" }) => {
  return <div className={`max-w-full px-4 mx-auto sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl sm:px-6 lg:px-8 ${className}`}>{children}</div>
}
