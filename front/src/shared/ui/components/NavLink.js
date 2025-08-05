export const NavLink = ({ href, children }) => {
  return (
    <a href={href} className="text-sm sm:text-base text-white hover:text-gray-300 transition-colors">
      {children}
    </a>
  )
}
