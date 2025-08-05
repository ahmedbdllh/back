"use client"

import { Card } from "../../../shared/ui/components/Card"
import { Icons } from "../../../shared/ui/components/Icons"

export const ProfileStats = ({ user, detailed = false }) => {
  // Mock stats data - in a real app, this would come from an API
  const stats = {
    gamesPlayed: 127,
    winRate: 68,
    hoursPlayed: 340,
    level: 12,
    achievements: 23,
    friends: 45,
    joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
    lastActive: new Date()
  }
  const StatCard = ({ icon, label, value, trend, color = "blue" }) => (
    <Card variant="glass" className="stat-card p-6 hover:bg-white/5 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-600/20 group-hover:bg-${color}-600/30 transition-colors duration-300`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm transition-all duration-300 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <Icons.TrendingUp className="w-4 h-4 mr-1 animate-pulse" /> : <Icons.TrendingDown className="w-4 h-4 mr-1 animate-pulse" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{value}</p>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{label}</p>
      </div>
    </Card>
  )
      if (detailed) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: <Icons.Trophy className="w-6 h-6 text-yellow-400" />, label: "Games Played", value: stats.gamesPlayed, trend: 12, color: "yellow" },
          { icon: <Icons.Target className="w-6 h-6 text-green-400" />, label: "Win Rate", value: `${stats.winRate}%`, trend: 5, color: "green" },
          { icon: <Icons.Clock className="w-6 h-6 text-blue-400" />, label: "Hours Played", value: stats.hoursPlayed, trend: -3, color: "blue" },
          { icon: <Icons.Star className="w-6 h-6 text-purple-400" />, label: "Level", value: stats.level, trend: 8, color: "purple" },
          { icon: <Icons.Award className="w-6 h-6 text-pink-400" />, label: "Achievements", value: stats.achievements, trend: 15, color: "pink" },
          { icon: <Icons.Users className="w-6 h-6 text-indigo-400" />, label: "Friends", value: stats.friends, trend: 7, color: "indigo" }
        ].map((stat, index) => (
          <div key={stat.label} className="animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>
    )
  }

  return (    <div className="space-y-6">
      {/* Quick Stats */}
      <Card variant="glass" className="profile-card">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { icon: <Icons.Trophy className="w-5 h-5 text-yellow-400" />, label: "Games Played", value: stats.gamesPlayed, color: "yellow" },
              { icon: <Icons.Target className="w-5 h-5 text-green-400" />, label: "Win Rate", value: `${stats.winRate}%`, color: "green" },
              { icon: <Icons.Clock className="w-5 h-5 text-blue-400" />, label: "Hours Played", value: `${stats.hoursPlayed}h`, color: "blue" },
              { icon: <Icons.Star className="w-5 h-5 text-purple-400" />, label: "Level", value: stats.level, color: "purple" }
            ].map((stat, index) => (
              <div key={stat.label} className="flex items-center justify-between group animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-600/20 group-hover:bg-${stat.color}-600/30 transition-colors duration-300`}>
                    {stat.icon}
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{stat.label}</span>
                </div>
                <span className="text-white font-semibold group-hover:scale-105 transition-transform duration-300">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Progress Card */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Progress</h3>
          <div className="space-y-4">
            {/* Level Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Level {stats.level}</span>
                <span className="text-sm text-gray-400">85%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '85%' }}
                ></div>
              </div>
            </div>

            {/* Achievement Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Achievements</span>
                <span className="text-sm text-gray-400">{stats.achievements}/50</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.achievements / 50) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Member since</span>
              <span className="text-white">
                {stats.joinDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last active</span>
              <span className="text-green-400">Online now</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profile views</span>
              <span className="text-white">1,234</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
