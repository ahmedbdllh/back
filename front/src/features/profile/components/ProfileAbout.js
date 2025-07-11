"use client"

import { useState } from "react"
import { Card } from "../../../shared/ui/components/Card"
import { Button } from "../../../shared/ui/components/Button"
import { Icons } from "../../../shared/ui/components/Icons"

export const ProfileAbout = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState(user.bio || "")

  // Mock data for achievements and recent activity
  const achievements = [
    { id: 1, name: "First Victory", description: "Won your first game", icon: "🏆", date: "2024-01-15", rarity: "common" },
    { id: 2, name: "Streak Master", description: "Won 5 games in a row", icon: "🔥", date: "2024-02-20", rarity: "rare" },
    { id: 3, name: "Team Player", description: "Played 50 team games", icon: "🤝", date: "2024-03-10", rarity: "epic" },
    { id: 4, name: "Marathon Player", description: "Played for 10 hours straight", icon: "⏰", date: "2024-03-25", rarity: "legendary" }
  ]

  const recentActivity = [
    { id: 1, type: "game", description: "Won a Padel match", time: "2 hours ago", icon: "🏓" },
    { id: 2, type: "achievement", description: "Unlocked 'Team Player'", time: "1 day ago", icon: "🏆" },
    { id: 3, type: "friend", description: "Connected with Sarah M.", time: "2 days ago", icon: "👥" },
    { id: 4, type: "game", description: "Played Football match", time: "3 days ago", icon: "⚽" }
  ]

  const handleSaveBio = () => {
    // Here you would save the bio to the backend
    setIsEditing(false)
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: "border-gray-500 bg-gray-500/10 text-gray-300",
      rare: "border-blue-500 bg-blue-500/10 text-blue-300",
      epic: "border-purple-500 bg-purple-500/10 text-purple-300",
      legendary: "border-yellow-500 bg-yellow-500/10 text-yellow-300"
    }
    return colors[rarity] || colors.common
  }

  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card variant="glass">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">About</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-400 hover:text-white"
            >
              <Icons.Edit className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleSaveBio}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {bio ? (
                <p className="text-gray-300 leading-relaxed">{bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio added yet. Click edit to add one!</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Achievements */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${getRarityColor(achievement.rarity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{achievement.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(achievement.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs uppercase font-medium ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-300"
              >
                <div className="text-xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-white">{activity.description}</p>
                  <p className="text-sm text-gray-400">{activity.time}</p>
                </div>
                <div className="text-gray-500">
                  <Icons.ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:text-white">
              View All Activity
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
