"use client"

import { Button } from "../../../shared/ui/components/Button"
import { Container } from "../../../shared/ui/components/Container"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

export const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false)

  // Animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Path relative to the 'public' folder
  const heroBackgroundImage = "/assets/section1.png"

  return (
    <section
      className="relative bg-cover bg-center text-white overflow-hidden"
      style={{
        backgroundImage: `url(${heroBackgroundImage})`,
        minHeight: "calc(100vh - 80px)",
      }}
    >
      {/* Animated gradient overlay for better text readability and visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>

      {/* Animated particles effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-blue-500/20 animate-pulse"></div>
        <div className="absolute top-3/4 left-1/3 w-24 h-24 rounded-full bg-purple-500/20 animate-ping animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-green-500/20 animate-pulse animation-delay-1000"></div>
      </div>

      <Container className="relative z-10 flex flex-col justify-center h-full py-20 md:py-32">
        <div
          className={`md:w-2/3 lg:w-1/2 transition-all duration-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Your Ultimate Sports Platform
          </h1>
          <p
            className={`text-gray-200 text-lg sm:text-xl mb-10 transition-all duration-1000 delay-300 transform ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Book courts, join teams, and manage sports activities all in one place. From padel to Football, We've got
            you covered.
          </p>
          <div
            className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 transition-all duration-1000 delay-600 transform ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Button
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              onClick={() => window.location.href = '/my-team'}
            >
              Get Started
            </Button>
            <Link to="/courts">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-2 border-white/70 hover:bg-white/10 px-8 py-4 rounded-xl font-bold backdrop-blur-sm transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Explore Courts
              </Button>
            </Link>
          </div>
        </div>
      </Container>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
        <span className="text-white/70 text-sm mb-2">Scroll Down</span>
        <svg
          className="w-6 h-6 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
