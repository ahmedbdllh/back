"use client"

import { useState } from "react"
import { Card } from "../../../shared/ui/components/Card"
import { Button } from "../../../shared/ui/components/Button"
import { Icons } from "../../../shared/ui/components/Icons"

export const ProfileActivity = ({ user }) => {
  const [activeFilter, setActiveFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("week")

  // Mock activity data
  const activities = [
    {
      id: 1,
      type: "game",
      title: "Padel Match Victory",
      description: "Won against Team Alpha with score 6-4, 6-2",
      time: "2 hours ago",
      icon: "🏓",
      details: { opponent: "Team Alpha", score: "6-4, 6-2", duration: "45 min" },
      result: "win"
    },
    {
      id: 2,
      type: "training",
      title: "Football Training Session",
      description: "Completed agility and shooting drills",
      time: "1 day ago",
      icon: "⚽",
      details: { duration: "90 min", focus: "Agility & Shooting" },
      result: "completed"
    },
    {
      id: 3,
      type: "achievement",
      title: "New Achievement Unlocked",
      description: "Earned 'Team Player' badge for 50 team games",
      time: "2 days ago",
      icon: "🏆",
      details: { badge: "Team Player", progress: "50/50 games" },
      result: "unlocked"
    },
    {
      id: 4,
      type: "game",
      title: "Basketball Match",
      description: "Close game against City Warriors",
      time: "3 days ago",
      icon: "🏀",
      details: { opponent: "City Warriors", score: "78-82", duration: "48 min" },
      result: "loss"
    },
    {
      id: 5,
      type: "social",
      title: "New Connection",
      description: "Connected with Sarah Martinez",
      time: "4 days ago",
      icon: "👥",
      details: { friend: "Sarah Martinez", mutual: "5 mutual friends" },
      result: "connected"
    }
  ]

  const filters = [
    { id: "all", label: "All Activity", icon: Icons.Activity },
    { id: "game", label: "Games", icon: Icons.Trophy },
    { id: "training", label: "Training", icon: Icons.Target },
    { id: "achievement", label: "Achievements", icon: Icons.Award },
    { id: "social", label: "Social", icon: Icons.Users }
  ]

  const timeRanges = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
    { id: "all", label: "All Time" }
  ]

  const filteredActivities = activities.filter(activity => 
    activeFilter === "all" || activity.type === activeFilter
  )
  const getResultColor = (result) => {
    const colors = {
      win: "text-green-400 bg-green-500/10",
      loss: "text-red-400 bg-red-500/10",
      completed: "text-blue-400 bg-blue-500/10",
      unlocked: "text-yellow-400 bg-yellow-500/10",
      connected: "text-purple-400 bg-purple-500/10"
    }
    return colors[result] || "text-gray-400 bg-gray-500/10"
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card variant="glass">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Activity Type Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const IconComponent = filter.icon
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                      ${activeFilter === filter.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <IconComponent className="w-4 h-4" />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {/* Time Range Filter */}
            <div className="flex gap-2">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300
                    ${timeRange === range.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Feed */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Activity Feed
            <span className="text-sm text-gray-400 font-normal ml-2">
              ({filteredActivities.length} activities)
            </span>
          </h3>          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              return (
                <div
                  key={activity.id}
                  className="group relative p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-300 border border-transparent hover:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-lg">
                        {activity.icon}
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                            {activity.title}
                          </h4>
                          <p className="text-gray-400 text-sm mt-1">{activity.description}</p>
                          
                          {/* Activity Details */}
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <span key={key} className="capitalize">
                                <span className="text-gray-400">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Result Badge */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getResultColor(activity.result)}`}>
                          {activity.result}
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <Icons.Clock className="w-3 h-3" />
                        {activity.time}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Icons.ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Connection Line for feed-like appearance */}
                  {index < filteredActivities.length - 1 && (
                    <div className="absolute left-8 top-16 w-px h-8 bg-gray-700"></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Button variant="outline" className="border-white/20 text-gray-300 hover:text-white">
              Load More Activity
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Summary */}
      <Card variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-6">This Week Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">8</div>
              <div className="text-sm text-gray-400">Games Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">12</div>
              <div className="text-sm text-gray-400">Hours Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">3</div>
              <div className="text-sm text-gray-400">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">5</div>
              <div className="text-sm text-gray-400">New Friends</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
