"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Alert } from "../../../shared/ui/components/Alert"
import { Card } from "../../../shared/ui/components/Card"
import { Icons } from "../../../shared/ui/components/Icons"

export const PasswordSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
    match: false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.")
      setIsLoading(false)
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.")
      setIsLoading(false)
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number.")
      setIsLoading(false)
      return
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      setError("Password must contain at least one special character (!@#$%^&*).")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://localhost:5000/api/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { "x-auth-token": token },
        }
      )

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordStrength({
          length: false,
          uppercase: false,
          number: false,
          specialChar: false,
          match: false
        })
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to change password.")
    } finally {
      setIsLoading(false)
    }
  }

  const PasswordStrengthIndicator = ({ label, met }) => (
    <div className={`flex items-center text-sm ${met ? 'text-green-400' : 'text-muted-foreground'}`}>
      {met ? <Icons.CheckCircle className="w-4 h-4 mr-2" /> : <Icons.XCircle className="w-4 h-4 mr-2" />}
      {label}
    </div>
  )

  return (
    <Card variant="elevated" className="mb-6">
      <div className="px-6 py-5 border-b border-border">
        <h3 className="text-lg font-medium text-foreground">Password</h3>
        <p className="text-sm text-muted-foreground">Change your password here.</p>
      </div>
      <div className="px-6 py-5 space-y-6">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Current Password"
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <TextInput
            label="New Password"
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              const value = e.target.value
              setNewPassword(value)
              setPasswordStrength({
                length: value.length >= 8,
                uppercase: /[A-Z]/.test(value),
                number: /[0-9]/.test(value),
                specialChar: /[!@#$%^&*]/.test(value),
                match: value === confirmPassword && value.length > 0
              })
            }}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
            <PasswordStrengthIndicator label="At least 8 characters" met={passwordStrength.length} />
            <PasswordStrengthIndicator label="At least one uppercase letter" met={passwordStrength.uppercase} />
            <PasswordStrengthIndicator label="At least one number" met={passwordStrength.number} />
            <PasswordStrengthIndicator label="At least one special character (!@#$%^&*)" met={passwordStrength.specialChar} />
          </div>
          <TextInput
            label="Confirm New Password"
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              const value = e.target.value
              setConfirmPassword(value)
              setPasswordStrength(prev => ({
                ...prev,
                match: value === newPassword && value.length > 0
              }))
            }}
            required
          />
          <PasswordStrengthIndicator label="Passwords match" met={passwordStrength.match} />
          
          <Button
            type="submit"
            variant="primary"
            className="mt-4"
            disabled={isLoading || !passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number || !passwordStrength.specialChar || !passwordStrength.match}
          >
            {isLoading ? (
              <>
                <Icons.Spinner className="animate-spin h-5 w-5 mr-2" />
                Updating...
              </>
            ) : "Update Password"}
          </Button>
        </form>
      </div>
    </Card>
  )
}
