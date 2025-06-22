"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Link } from "../../../shared/ui/components/Link"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"

export const PlayerResetPassword = ({ token, resetToken, onClose, onSuccess, onCancel }) => {
  // Use token prop if provided (from URL), otherwise use resetToken (from modal)
  const currentToken = token || resetToken
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isTokenValid, setIsTokenValid] = useState(null)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  // Check if reset token is valid when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!currentToken) {
        setError("Invalid or missing reset token.")
        setIsTokenValid(false)
        setIsCheckingToken(false)
        return
      }

      try {
        const response = await fetch(`http://localhost:5000/api/auth/validate-reset-token/${currentToken}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.msg || "Invalid or expired reset token.")
        }

        setIsTokenValid(true)
      } catch (error) {
        console.error("Token validation error:", error)
        setError(error.message || "Invalid or expired reset token.")
        setIsTokenValid(false)      } finally {
        setIsCheckingToken(false)
      }
    }
    
    validateToken()
  }, [currentToken])

  const handlePasswordReset = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (!password || !confirmPassword) {
      setError("Both password fields are required.")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }      try {
        const response = await fetch(`http://localhost:5000/api/auth/reset-password/${currentToken}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to reset password.")
      }      // Success - call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess("Password reset successfully! You can now sign in with your new password.")
      }

      // If we're on the standalone page (token prop exists), we don't need to show success message
      // as the page will handle navigation
      if (!token && onClose) {
        // For modal usage, close after a short delay
        setTimeout(() => {
          onClose()
        }, 2000)
      }

    } catch (error) {
      console.error("Password reset error:", error)
      setError(error.message || "An error occurred while resetting your password.")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="space-y-5 md:space-y-6">
        <AuthHeader title="Reset Password" subtitle="Validating reset token..." />
        <div className="flex justify-center items-center py-8">
          <Icons.Spinner className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  // Show error state if token is invalid
  if (!isTokenValid) {
    return (
      <>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
            onClick={onClose}
            aria-label="Close reset password form"
          >
            <Icons.Close className="h-5 w-5" />
          </Button>
        )}

        <div className="space-y-5 md:space-y-6">
          <AuthHeader title="Invalid Reset Link" subtitle="This password reset link is invalid or has expired." />

          <AuthAlert type="error" message={error} />

          <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <Icons.AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Reset Link Expired
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close reset password form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}

      <div className="space-y-5 md:space-y-6">
        <AuthHeader 
          title="Set New Password" 
          subtitle="Enter your new password below." 
        />

        <AuthAlert type="error" message={error} />

        <form onSubmit={handlePasswordReset} className="space-y-5">
          <TextInput
            id="new-password"
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            icon={<Icons.Lock className="h-5 w-5" />}
          />

          <TextInput
            id="confirm-password"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            icon={<Icons.Lock className="h-5 w-5" />}
          />
            <div className="pt-2 space-y-3">
            <Button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Resetting Password...
                </div>
              ) : (
                <>
                  <Icons.Key className="mr-2 h-5 w-5" />
                  Reset Password
                </>
              )}
            </Button>

            {(onCancel || onClose) && (
              <Button
                type="button"
                variant="outline"
                className="w-full py-3.5"
                onClick={onCancel || onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-3 pt-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a40]"></div>
            </div>
            <div className="relative bg-card px-4 text-xs text-gray-500 uppercase">security</div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-xs">
              Your password will be encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
