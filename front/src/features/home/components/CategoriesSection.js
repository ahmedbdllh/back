import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Container } from "../../../shared/ui/components/Container"

export const CategoriesSection = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

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

  const categories = [
    {
      title: "Padel",
      description: "Book courts and join matches with other padel enthusiasts.",
      iconPath: "/assets/icons/padel-icon.png",
      href: "#padel",
      status: "available",
      color: "from-blue-400 to-cyan-400",
    },
    {
      title: "Football",
      description: "Find teams, book pitches, and organize football matches.",
      iconPath: "/assets/icons/football-icon.png",
      href: "#football",
      status: "available",
      color: "from-green-400 to-emerald-500",
    },
    {
      title: "Basketball",
      description: "Join Basketball games and book courts for your team.",
      iconPath: "/assets/icons/basketball-icon.png",
      href: "#basketball",
      status: "coming-soon",
      color: "from-orange-400 to-red-500",
    },
    {
      title: "Tennis",
      description: "Book tennis courts and find partners to play with.",
      iconPath: "/assets/icons/tennis-icon.png",
      href: "#tennis",
      status: "coming-soon",
      color: "from-yellow-400 to-amber-500",
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a1929 0%, #0d2e4d 100%)",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated circles */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-cyan-500/5 animate-pulse-slow animation-delay-1000"></div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2px, transparent 0)",
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* Diagonal lines */}
        <div className="absolute -top-40 -left-40 w-96 h-96 border border-blue-500/10 rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 border border-cyan-500/10 rounded-full"></div>
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            <span className="inline-block relative">
            Sports Categories
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></span>
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Explore different sports activities available on our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#1a4169]/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg group hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300"
            >
              <div className="p-6">
                <div
                  className={`w-16 h-16 mb-4 rounded-lg bg-gradient-to-br ${category.color} p-3 transform group-hover:scale-110 transition-transform duration-300 text-white flex items-center justify-center`}
                >
                  {/* Replace this with your custom icon */}
                  <img
                    src={category.iconPath || "/placeholder.svg"}
                    alt={`${category.title} icon`}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.src = `/placeholder.svg?height=40&width=40`
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                  {category.title}
                </h3>
                <p className="text-gray-300 mb-6 h-20">{category.description}</p>

                {category.status === "available" ? (
                  <a
                    href={category.href}
                    className="inline-block bg-[#0a1929] hover:bg-blue-800 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 transform group-hover:translate-x-1"
                  >
                    Explore {category.title}
                  </a>
                ) : (
                  <span className="inline-block bg-gray-800/50 text-gray-400 font-medium py-2 px-6 rounded-lg cursor-not-allowed backdrop-blur-sm">
                    Coming soon
                  </span>
                )}
              </div>
              <div
                className={`h-1 w-full bg-gradient-to-r ${category.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
              ></div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
