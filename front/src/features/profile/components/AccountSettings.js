"use client"

import { useState, useEffect } from "react"
import TwoFactorAuth from "../../auth/components/TwoFactorAuth"
import { PasswordSettings } from "./PasswordSettings"
import SessionManagement from "./SessionManagement"
import { PersonalInformation } from "./PersonalInformation"
import axios from "axios"
import { Button } from "../../../shared/ui/components/Button"
import { Switch } from "../../../shared/ui/components/Switch"
import { Alert } from "../../../shared/ui/components/Alert"
import { Card } from "../../../shared/ui/components/Card"
import { Icons } from "../../../shared/ui/components/Icons"

const AccountSettings = () => {  const [user, setUser] = useState(null)
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false)
  const [showTwoFASetup, setShowTwoFASetup] = useState(false)
  const [isAttempting2FASetup, setIsAttempting2FASetup] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [activeTab, setActiveTab] = useState("security")
  useEffect(() => {
    const fetchUserAndStatus = async () => {
      let userData = null;
      const token = localStorage.getItem("token");
      
      // First try to fetch fresh user data from backend
      if (token) {
        try {
          const userResponse = await axios.get("http://localhost:5000/api/auth/profile", {
            headers: { "x-auth-token": token },
          });
          
          if (userResponse.data.success && userResponse.data.user) {
            userData = userResponse.data.user;
            
            // Process profile image path if it exists
            if (userData.profileImage && typeof userData.profileImage === 'string') {
              console.log('AccountSettings: Original profile image from API:', userData.profileImage);
              
              // Extract just the filename from complex paths
              if (userData.profileImage.includes('\\') || 
                  userData.profileImage.includes('C:') || 
                  userData.profileImage.includes('/uploads/') || 
                  userData.profileImage.includes('profileImage-')) {
                
                const matches = userData.profileImage.match(/profileImage-[^\\\/]+\.\w+/);
                if (matches && matches[0]) {
                  console.log('AccountSettings: Extracted filename using regex:', matches[0]);
                  userData.profileImage = '/uploads/' + matches[0];
                } else {
                  // Fallback to simpler filename extraction
                  const parts = userData.profileImage.split(/[\/\\]/);
                  const filename = parts[parts.length - 1];
                  if (filename && !filename.includes('C:')) {
                    console.log('AccountSettings: Extracted filename using split:', filename);
                    userData.profileImage = '/uploads/' + filename;
                  }
                }
                console.log('AccountSettings: Simplified profileImage to:', userData.profileImage);
              }
            }
            
            // Update localStorage with fresh data
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            // Fallback to localStorage if API call fails
            try {
              const userDataString = localStorage.getItem("user");
              if (userDataString) {
                userData = JSON.parse(userDataString);
              }
            } catch (error) {
              console.error("Failed to parse user data from localStorage:", error);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to localStorage if API call fails
          try {
            const userDataString = localStorage.getItem("user");
            if (userDataString) {
              userData = JSON.parse(userDataString);
            }
          } catch (parseError) {
            console.error("Failed to parse user data from localStorage:", parseError);
          }
        }
      } else {
        // No token, try localStorage only
        try {
          const userDataString = localStorage.getItem("user");
          if (userDataString) {
            userData = JSON.parse(userDataString);
          }
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
        }
      }

      setUser(userData);

      // Fetch actual 2FA status from backend
      if (token) {
        try {
          const statusResponse = await axios.get("http://localhost:5000/api/2fa/status", {
            headers: { "x-auth-token": token },
          });
          
          if (statusResponse.data.success) {
            const actualStatus = statusResponse.data.enabled;
            setIsTwoFAEnabled(actualStatus);
            
            // Update localStorage if it doesn't match backend
            if (userData && userData.twoFactorEnabled !== actualStatus) {
              const updatedUser = { ...userData, twoFactorEnabled: actualStatus };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } else {
            // Fallback to localStorage if API fails
            if (userData && typeof userData.twoFactorEnabled === 'boolean') {
              setIsTwoFAEnabled(userData.twoFactorEnabled);
            } else {
              setIsTwoFAEnabled(false);
            }
          }
        } catch (error) {
          console.error("Error fetching 2FA status:", error);
          // Fallback to localStorage if API fails
          if (userData && typeof userData.twoFactorEnabled === 'boolean') {
            setIsTwoFAEnabled(userData.twoFactorEnabled);
          } else {
            setIsTwoFAEnabled(false);
          }
        }
      } else {
        // No token, fallback to localStorage
        if (userData && typeof userData.twoFactorEnabled === 'boolean') {
          setIsTwoFAEnabled(userData.twoFactorEnabled);
        } else {
          setIsTwoFAEnabled(false);
        }
      }
    };

    fetchUserAndStatus();
  }, [])

  const handleTwoFAToggle = async (checked) => {
    setError("")
    setSuccessMessage("")

    if (checked) {
      if (!user || !user.email) {
        setError("Email required to enable 2FA.")
        return
      }
      setShowTwoFASetup(true)
      setIsAttempting2FASetup(true)
    } else {
      try {
        const token = localStorage.getItem("token")
        await axios.post(
          "http://localhost:5000/api/2fa/disable",
          {},
          {
            headers: { "x-auth-token": token },
          },
        )

        setIsTwoFAEnabled(false)
        const updatedUser = { ...user, twoFactorEnabled: false }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setSuccessMessage("Two-factor authentication disabled successfully.")
      } catch (err) {
        setError("Failed to disable 2FA.")
      }
    }
  }

  const handleSetupComplete = (success, errorMessage) => {
    setShowTwoFASetup(false)
    setIsAttempting2FASetup(false)
    setError("")
    setSuccessMessage("")

    if (success) {
      setIsTwoFAEnabled(true)
      const updatedUser = { ...user, twoFactorEnabled: true }
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setSuccessMessage("Two-factor authentication enabled successfully!")
    } else { // success is false
      if (errorMessage === "2FA is already enabled") {
        setIsTwoFAEnabled(true)
        const updatedUser = { ...user, twoFactorEnabled: true }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setSuccessMessage("Two-factor authentication is already enabled on your account.")
      } else {
        setError(errorMessage || "Failed to set up 2FA. Please try again.");
      }
    }
  }
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    // Update localStorage with the new user data
    localStorage.setItem("user", JSON.stringify(updatedUser));
    // Trigger auth change event to update other components like Navbar
    window.dispatchEvent(new CustomEvent('authChange'));
  };

  const getTabContentClass = (tabName) => {
    return `transition-all duration-300 ${activeTab === tabName ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 hidden"}`
  }

  return (
    <div className="w-full">
      <div className="border-b border-border mb-8">
        <nav className="flex -mb-px space-x-4">
          <Button
            variant={activeTab === "profile" ? "primary" : "ghost"}
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-4 font-medium text-sm rounded-t-md`}
          >
            <Icons.User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button
            variant={activeTab === "security" ? "primary" : "ghost"}
            onClick={() => setActiveTab("security")}
            className={`py-3 px-4 font-medium text-sm rounded-t-md`}
          >
            <Icons.Lock className="mr-2 h-4 w-4" />
            Security
          </Button>
          <Button
            variant={activeTab === "notifications" ? "primary" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-4 font-medium text-sm rounded-t-md`}
          >
            <Icons.Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
        </nav>
      </div>      <div className={getTabContentClass("profile")}>
        <PersonalInformation user={user} onUserUpdate={handleUserUpdate} />
      </div>

      <div className={getTabContentClass("security")}>
        {error && <Alert type="error" message={error} className="mb-6" />}
        {successMessage && <Alert type="success" message={successMessage} className="mb-6" />}

        <PasswordSettings />

        <Card variant="elevated" className="mb-6">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Two-Factor Authentication</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-foreground">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">
                  {isTwoFAEnabled
                    ? "Your account is protected with two-factor authentication."
                    : "Protect your account with two-factor authentication."}
                </div>
              </div>
              <Switch
                checked={isTwoFAEnabled}
                onChange={handleTwoFAToggle}
                disabled={isAttempting2FASetup}
              />
            </div>

            {showTwoFASetup && isAttempting2FASetup && user && (
              <div className="mt-6 border-t border-border pt-6 transition-all duration-300 transform">
                <TwoFactorAuth user={user} onSetupComplete={handleSetupComplete} initiateSetup={isAttempting2FASetup} />
              </div>
            )}
          </div>
        </Card>

        <SessionManagement />
      </div>

      <div className={getTabContentClass("notifications")}>
        <Card variant="elevated" className="mb-6">
          <div className="px-6 py-5 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Notification Preferences</h3>
            <p className="mt-1 text-sm text-muted-foreground">Manage how you receive notifications.</p>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div className="space-y-4">
              <h4 className="text-base font-medium text-foreground">Email Notifications</h4>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-foreground">Security Alerts</div>
                  <div className="text-sm text-muted-foreground">Receive emails for suspicious login attempts</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-foreground">Account Updates</div>
                  <div className="text-sm text-muted-foreground">Get notified about changes to your account</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-foreground">Marketing Emails</div>
                  <div className="text-sm text-muted-foreground">Receive promotional offers and updates</div>
                </div>
                <Switch />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-medium text-foreground">Push Notifications</h4>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-foreground">Enable Push Notifications</div>
                  <div className="text-sm text-muted-foreground">Allow browser notifications</div>
                </div>
                <Switch />
              </div>
            </div>

            <Button variant="primary" className="mt-4">
              Save Preferences
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AccountSettings

