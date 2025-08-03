"use client"

import { useState } from "react"
import { Avatar } from "../../../shared/ui/components/Avatar"
import { Card } from "../../../shared/ui/components/Card"
import { Button } from "../../../shared/ui/components/Button"
import { Icons } from "../../../shared/ui/components/Icons"

export const ProfileHeader = ({ user }) => {
  const [isFollowing, setIsFollowing] = useState(false)

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.fullName}'s Profile`,
        text: `Check out ${user.fullName}'s profile on Sportify`,
        url: window.location.href,
      })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast here
    }
  }
  return (
    <Card variant="glass" className="profile-card overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-shimmer"></div>
      
      <div className="relative z-10 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-6 animate-fadeInUp">
            <div className="relative">
              <Avatar
                src={user.profileImage ? `http://localhost:5000${user.profileImage}` : null}
                alt={user.fullName}
                size="xl"
                className="ring-4 ring-white/20 shadow-2xl hover:ring-white/40 transition-all duration-500 hover:scale-105"
              />
              {/* Online Status Indicator */}
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-2 animate-fadeInUp animate-stagger-1">
              <h1 className="text-3xl font-bold text-white tracking-tight hover:text-blue-300 transition-colors duration-300">
                {user.fullName || "Unknown User"}
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full border border-blue-500/30 hover:bg-blue-600/30 transition-colors duration-300">
                  {user.role || "Player"}
                </span>
                {user.location && (
                  <div className="flex items-center gap-1 text-gray-400 hover:text-gray-300 transition-colors duration-300">
                    <Icons.MapPin className="w-4 h-4" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm hover:text-gray-300 transition-colors duration-300">
                {user.email}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto animate-fadeInUp animate-stagger-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareProfile}
              className="border-white/20 text-gray-300 hover:text-white hover:border-white/40 hover:scale-105 transition-all duration-300"
            >
              <Icons.Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            
            <Button
              variant={isFollowing ? "ghost" : "primary"}
              size="sm"
              onClick={handleFollow}
              className={`transition-all duration-300 hover:scale-105 ${isFollowing ? "text-gray-300 hover:text-white" : "hover:shadow-lg"}`}
            >
              <Icons.User className="w-4 h-4 mr-2" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>

        {/* Sports and Additional Info */}
        {user.role === "Player" && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preferred Sports */}
              {(user.preferredSports?.length > 0 || user.preferredSport) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Preferred Sports</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.preferredSports?.length > 0 
                      ? user.preferredSports.map((sport) => (
                          <span
                            key={sport}
                            className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded-lg border border-gray-700/50 capitalize"
                          >
                            {sport}
                          </span>
                        ))
                      : user.preferredSport && (
                          <span className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded-lg border border-gray-700/50 capitalize">
                            {user.preferredSport}
                          </span>
                        )
                    }
                  </div>
                </div>
              )}

              {/* Position */}
              {user.position && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Position</h3>
                  <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-sm rounded-lg border border-purple-500/30 capitalize">
                    {user.position}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manager Info */}
        {user.role === "Manager" && user.companyName && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Icons.Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Company:</span>
              <span className="text-white font-medium">{user.companyName}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
