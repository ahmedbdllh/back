import { Container } from "../../shared/ui/components/Container"
import { NavLink } from "../../shared/ui/components/NavLink"

export const Footer = () => {
  const footerLinks = [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <footer className="bg-black py-6">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 mb-4 md:mb-0">© 2025 Sportify. All rights reserved.</div>

          <div className="flex space-x-6">
            {footerLinks.map((link) => (
              <NavLink key={link.label} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}
