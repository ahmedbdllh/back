"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "../../../shared/ui/components/Button"
import { Alert } from "../../../shared/ui/components/Alert"
import { Card } from "../../../shared/ui/components/Card"
import { Icons } from "../../../shared/ui/components/Icons"

const SessionManagement = () => {
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    setLoadingSessions(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (token) {
        const response = await axios.get("http://localhost:5000/api/auth/sessions", {
          headers: { "x-auth-token": token },
        })
        
        if (response.data.success) {
          setSessions(response.data.sessions)
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      setError("Failed to load sessions.")
    } finally {
      setLoadingSessions(false)
    }
  }

  const terminateSession = async (sessionId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.delete(`http://localhost:5000/api/auth/sessions/${sessionId}`, {
        headers: { "x-auth-token": token },
      })
      
      if (response.data.success) {
        setSuccessMessage("Session terminated successfully.")
        setError("")
        fetchSessions() // Refresh sessions list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error terminating session:", error)
      setError("Failed to terminate session.")
      setSuccessMessage("")
    }
  }

  const terminateAllSessions = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.delete("http://localhost:5000/api/auth/sessions", {
        headers: { "x-auth-token": token },
      })
      
      if (response.data.success) {
        setSuccessMessage("All other sessions terminated successfully.")
        setError("")
        fetchSessions() // Refresh sessions list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000)
      }
    } catch (error) {
      console.error("Error terminating all sessions:", error)
      setError("Failed to terminate sessions.")
      setSuccessMessage("")
    }
  }

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInHours < 24) return `${diffInHours} hours ago`
    return `${diffInDays} days ago`
  }

  const formatSessionDetails = (session) => {
    const browser = session.browser || 'Unknown Browser'
    const os = session.os || 'Unknown OS'
    const location = session.location === 'Unknown Location' ? 'Unknown Location' : session.location
    
    return `${browser} on ${os}${location !== 'Unknown Location' ? ` • ${location}` : ''}`
  }

  const getDeviceIcon = (deviceInfo) => {
    const device = deviceInfo?.toLowerCase() || ''
    if (device.includes('mobile') || device.includes('iphone') || device.includes('android')) {
      return Icons.Smartphone
    } else if (device.includes('tablet') || device.includes('ipad')) {
      return Icons.Tablet
    } else {
      return Icons.Monitor
    }
  }

  return (
    <Card variant="elevated" className="mb-6">
      <div className="px-6 py-5 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Sessions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your active sessions and devices.
        </p>
      </div>
      
      <div className="px-6 py-5">
        {error && <Alert type="error" message={error} className="mb-4" />}
        {successMessage && <Alert type="success" message={successMessage} className="mb-4" />}

        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Spinner className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading sessions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active sessions found.
              </div>
            ) : (
              sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.deviceInfo)
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 border border-border rounded-lg ${
                      session.isCurrentSession ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        session.isCurrentSession ? 'bg-primary/10' : 'bg-muted/50'
                      }`}>
                        <DeviceIcon className={`h-5 w-5 ${
                          session.isCurrentSession ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {session.isCurrentSession ? 'Current Session' : session.deviceInfo}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatSessionDetails(session)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          IP: {session.ipAddress}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-sm font-medium ${
                        session.isCurrentSession ? 'text-green-400' : 'text-muted-foreground'
                      }`}>
                        {session.isCurrentSession ? 'Active Now' : formatLastActivity(session.lastActivity)}
                      </div>
                      {!session.isCurrentSession && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                          className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          Sign Out
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={terminateAllSessions}
              disabled={loadingSessions || sessions.length <= 1}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Icons.XCircle className="mr-2 h-4 w-4" />
              Sign Out All Other Devices
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={fetchSessions}
              disabled={loadingSessions}
              className="hover:bg-blue-50 hover:text-blue-600"
            >
              <Icons.Spinner className={`mr-2 h-4 w-4 ${loadingSessions ? 'animate-spin' : ''}`} />
              Refresh Sessions
            </Button>
          </div>
          
          {sessions.length === 0 && !loadingSessions && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icons.AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">No Active Sessions</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Sessions are created when you log in. If you don't see any sessions, try refreshing the page or logging out and back in to create a new session entry.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SessionManagement
