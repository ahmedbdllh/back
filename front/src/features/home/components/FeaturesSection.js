import { useEffect, useState, useRef } from "react"
import { Container } from "../../../shared/ui/components/Container"

export const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)
  const playerCardRef = useRef(null)
  const managerCardRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const currentSectionRef = sectionRef.current
    if (currentSectionRef) {
      observer.observe(currentSectionRef)
    }

    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef)
      }
    }
  }, [])

  // 3D tilt effect
  useEffect(() => {
    const cards = [playerCardRef.current, managerCardRef.current]

    const handleMouseMove = (e, card) => {
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const percentX = (x - centerX) / centerX
      const percentY = (y - centerY) / centerY

      // Limit the tilt effect to be subtle
      const tiltLimit = 5
      const tiltX = percentY * tiltLimit
      const tiltY = -percentX * tiltLimit

      // Apply the transform
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`

      // Add a subtle highlight effect based on mouse position
      const glareX = 100 * (1 - x / rect.width)
      const glareY = 100 * (1 - y / rect.height)
      card.style.background = `
        linear-gradient(135deg, rgba(10, 25, 41, 0.95), rgba(10, 36, 64, 0.95)),
        radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.1), transparent 80%)
      `
    }

    const handleMouseLeave = (card) => {
      if (!card) return

      // Reset the transform and background
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)"
      card.style.background = "linear-gradient(135deg, rgba(10, 25, 41, 0.95), rgba(10, 36, 64, 0.95))"
    }

    // Add event listeners to each card
    cards.forEach((card) => {
      if (!card) return

      card.addEventListener("mousemove", (e) => handleMouseMove(e, card))
      card.addEventListener("mouseleave", () => handleMouseLeave(card))

      // Add transition for smooth effect
      card.style.transition = "transform 0.1s ease, background 0.3s ease"
      card.style.transformStyle = "preserve-3d"
    })

    // Cleanup
    return () => {
      cards.forEach((card) => {
        if (!card) return

        card.removeEventListener("mousemove", (e) => handleMouseMove(e, card))
        card.removeEventListener("mouseleave", () => handleMouseLeave(card))
      })
    }
  }, [isVisible])

  const playerFeatures = [
    {
      text: "Book courts and facilities",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      bgColor: "bg-cyan-500/20",
    },
    {
      text: "Join teams and matches",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      bgColor: "bg-green-500/20",
    },
    {
      text: "Track your performance",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      bgColor: "bg-purple-500/20",
    },
    {
      text: "Connect with other players",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
      bgColor: "bg-pink-500/20",
    },
  ]

  const managerFeatures = [
    {
      text: "Manage facilities and bookings",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      bgColor: "bg-blue-500/20",
    },
    {
      text: "Organize tournaments and events",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      bgColor: "bg-amber-500/20",
    },
    {
      text: "Track teams performance",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
      bgColor: "bg-red-500/20",
    },
    {
      text: "Handle payments and memberships",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      bgColor: "bg-emerald-500/20",
    },
  ]

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 overflow-hidden">
        {/* Animated wave pattern */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="rgba(255, 255, 255, 0.03)"
            fillOpacity="1"
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-pulse-slow"
          ></path>
        </svg>

        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ transform: "translateY(20px)" }}
        >
          <path
            fill="rgba(255, 255, 255, 0.05)"
            fillOpacity="1"
            d="M0,96L48,128C96,160,192,224,288,213.3C384,203,480,117,576,101.3C672,85,768,139,864,181.3C960,224,1056,256,1152,261.3C1248,267,1344,245,1392,234.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-pulse-slow animation-delay-1000"
          ></path>
        </svg>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-gradient"></div>

        {/* Particle dots */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-30"></div>
          <div className="absolute top-40 left-40 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute top-60 left-10 w-1.5 h-1.5 bg-white rounded-full opacity-25"></div>
          <div className="absolute top-80 left-60 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute top-20 right-40 w-2 h-2 bg-white rounded-full opacity-30"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute top-60 right-60 w-1.5 h-1.5 bg-white rounded-full opacity-25"></div>
          <div className="absolute top-80 right-10 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-40 w-2 h-2 bg-white rounded-full opacity-30"></div>
          <div className="absolute bottom-40 left-20 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute bottom-60 left-60 w-1.5 h-1.5 bg-white rounded-full opacity-25"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full opacity-30"></div>
          <div className="absolute bottom-40 right-40 w-1 h-1 bg-white rounded-full opacity-20"></div>
          <div className="absolute bottom-60 right-10 w-1.5 h-1.5 bg-white rounded-full opacity-25"></div>
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <Container className="relative z-10">
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            <span className="inline-block relative">
              Platform Features
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-300"></span>
            </span>
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Our platform offers specialized features for both players and managers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* For Players Card */}
          <div
            ref={playerCardRef}
            className={`card-3d bg-gradient-to-br from-[#0a1929]/95 to-[#0a2440]/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-blue-500/20 transition-all duration-300 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{
              transitionDelay: "200ms",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="p-8 card-content">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-4 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">For Players</h3>
              </div>

              <div className="space-y-6">
                {playerFeatures.map((feature, index) => (
                  <div
                    key={feature.text}
                    className={`flex items-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 transform ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${feature.bgColor} flex items-center justify-center mr-4 text-white`}
                    >
                      {feature.icon}
                    </div>
                    <span className="text-white/90 text-lg">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          </div>

          {/* For Managers Card */}
          <div
            ref={managerCardRef}
            className={`card-3d bg-gradient-to-br from-[#0a1929]/95 to-[#0a2440]/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-cyan-500/20 transition-all duration-300 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{
              transitionDelay: "400ms",
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div className="p-8 card-content">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-4 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">For Managers</h3>
              </div>

              <div className="space-y-6">
                {managerFeatures.map((feature, index) => (
                  <div
                    key={feature.text}
                    className={`flex items-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 transform ${
                      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    }`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${feature.bgColor} flex items-center justify-center mr-4 text-white`}
                    >
                      {feature.icon}
                    </div>
                    <span className="text-white/90 text-lg">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
          </div>
        </div>
      </Container>
    </section>
  )
}
