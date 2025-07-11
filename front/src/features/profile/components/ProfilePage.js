"use client"

import { useState, useEffect } from "react"
import { ProfileHeader } from "./ProfileHeader"
import { ProfileStats } from "./ProfileStats"
import { ProfileAbout } from "./ProfileAbout"
import { ProfileActivity } from "./ProfileActivity"
import MyTeamsTab from "./MyTeamsTab"
import { Container } from "../../../shared/ui/components/Container"
import { Card } from "../../../shared/ui/components/Card"
import { ProfileSkeleton } from "../../../shared/ui/components/SkeletonLoader"
import { Navbar } from "../../../core/layout/Navbar"

export const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Check URL params for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'activity', 'stats', 'myteam', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    // Load user data from localStorage or API
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])
  const tabs = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "activity", label: "Activity", icon: "📊" },
    { id: "stats", label: "Statistics", icon: "📈" },
    { id: "myteam", label: "My Team", icon: "⚽" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        <Container className="py-8">
          <ProfileSkeleton />
        </Container>
      </div>
    )  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        <Container>
          <div className="flex items-center justify-center min-h-screen">
            <Card variant="glass" className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">No Profile Found</h2>
              <p className="text-gray-400">Please sign in to view your profile.</p>
            </Card>
          </div>
        </Container>
      </div>
    )  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <Container className="py-8">
        {/* Profile Header */}
        <div className="mb-8 animate-fadeInUp">
          <ProfileHeader user={user} />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 animate-fadeInUp animate-stagger-1">
          <Card variant="glass" className="p-0">
            <div className="p-6 border-b border-white/10">
              <nav className="flex space-x-8">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                      ${activeTab === tab.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 hover:scale-105'
                      }
                    `}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </Card>
        </div>        {/* Tab Content */}
        <div className="space-y-8 animate-fadeInUp animate-stagger-2">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 animate-fadeInUp animate-stagger-3">
                <ProfileAbout user={user} />
              </div>
              <div className="animate-fadeInUp animate-stagger-4">
                <ProfileStats user={user} />
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="animate-fadeInUp">
              <ProfileActivity user={user} />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp">
              <ProfileStats user={user} detailed />
            </div>
          )}

          {activeTab === "myteam" && (
            <div className="animate-fadeInUp">
              <Card variant="glass">
                <MyTeamsTab user={user} />
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-fadeInUp">
              <Card variant="glass">
                <div className="text-center py-12">
                  <div className="animate-scaleIn">
                    <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
                    <p className="text-gray-400 mb-6">Profile settings are available in Account Settings</p>
                    <button
                      onClick={() => window.location.href = '/account-settings'}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      Go to Account Settings
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
