import { useState } from "react"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthAlert } from "./shared/AuthAlert"
import { AuthHeader } from "./shared/AuthHeader";

export const TwoFactorModal = ({ email, tempToken, onVerifySuccess, onVerifyFail, onClose, isVisible }) => {
  const [twoFACode, setTwoFACode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!twoFACode) {
      setError("2FA code is required.")
      setIsLoading(false)
      return
    }

    try {
      // Removed verbose 2FA verification console.log for privacy
      const requestBody = { email, code: twoFACode, tempToken }

      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("http://localhost:5000/api/2fa/login-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.msg || "2FA verification failed. Please try again.")
      }

      // Removed success console.log for privacy

      // Store the token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token)
      }

      if (onVerifySuccess) onVerifySuccess(data)
    } catch (error) {
      // Removed error console.error for privacy
      setError(error.message || "2FA verification failed. Please check your code and try again.")
      if (onVerifyFail) onVerifyFail(error.message || "2FA verification failed. Please check your code and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors"
          onClick={onClose}
          aria-label="Close 2FA modal"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>

        <div className="space-y-5 md:space-y-6">
          <AuthHeader title="Enter 2FA Code" subtitle="A two-factor authentication code has been sent to your authenticator app." />

          <AuthAlert type="error" message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="2fa-code-modal"
              label="2FA Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={isLoading}
              required
              inputMode="numeric"
              icon={<Icons.Shield className="h-5 w-5 text-gray-400" />}
              className="bg-transparent"
            />
            <div className="pt-2">
            <Button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TwoFactorModal
