"use client"

import { useState } from "react"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Link } from "../../../shared/ui/components/Link"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"

export const PlayerPasswordReset = ({ onClose, onSwitchToSignIn }) => {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState({ message: "", type: "" })
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handlePasswordResetRequest = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setStatus({ message: "", type: "" })

    if (!email) {
      setStatus({ message: "Email address is required.", type: "error" })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role: "Player" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send password reset email.")
      }

      setStatus({ 
        message: "Password reset email sent successfully! Please check your inbox and follow the instructions to reset your password.", 
        type: "success" 
      })
      setIsEmailSent(true)

    } catch (error) {
      console.error("Password reset error:", error)
      setStatus({ 
        message: error.message || "An error occurred while sending the reset email.", 
        type: "error" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = () => {
    setIsEmailSent(false)
    setStatus({ message: "", type: "" })
    handlePasswordResetRequest()
  }

  return (
    <>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close password reset form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}

      <div className="space-y-5 md:space-y-6">
        <AuthHeader 
          title="Reset Password" 
          subtitle="Enter your email address and we'll send you a link to reset your password." 
        />

        <AuthAlert type={status.type} message={status.message} />

        {!isEmailSent ? (
          <form onSubmit={handlePasswordResetRequest} className="space-y-5">
            <TextInput
              id="reset-email"
              label="Email Address"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Mail className="h-5 w-5" />}
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                    Sending Reset Email...
                  </div>
                ) : (
                  <>
                    <Icons.Mail className="mr-2 h-5 w-5" />
                    Send Reset Email
                  </>
                )}
              </Button>
            </div>
          </form>        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Icons.Spinner className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
                ) : (
                  <>
                    <Icons.RefreshCw className="mr-2 h-4 w-4" />
                    Resend Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a40]"></div>
            </div>
            <div className="relative bg-card px-4 text-xs text-gray-500 uppercase">or</div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Remember your password?{" "}
              <Link
                onClick={onSwitchToSignIn}
                variant="primary"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
