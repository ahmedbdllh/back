"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "../../../shared/ui/components/Button"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Card } from "../../../shared/ui/components/Card"

const API_BASE_URL = "http://localhost:5000/api/2fa"

const TwoFactorAuth = ({ user, onSetupComplete, initiateSetup }) => {
  const [secret, setSecret] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [alreadyEnabledNotified, setAlreadyEnabledNotified] = useState(false) // Added state

  useEffect(() => {
    // If initiateSetup becomes false, reset our flag and other relevant states.
    if (!initiateSetup) {
      setAlreadyEnabledNotified(false)
      // Optionally reset other states if the component might be reused/reshown
      // setQrCodeUrl("");
      // setError("");
      // setVerificationCode("");
      // setSecret("");
      // setRecoveryCodes([]);
    }
  }, [initiateSetup])

  const handleEnable2FA = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication required. Please log in again.")
        setLoading(false)
        return
      }

      try {
        const statusResponse = await axios.get(`${API_BASE_URL}/status`, {
          headers: { "x-auth-token": token },
        })
        if (statusResponse.data?.enabled) {
          onSetupComplete(false, "2FA is already enabled")
          setLoading(false)
          return
        }
      } catch (statusErr) {
        console.warn("Error checking 2FA status:", statusErr)
      }

      const response = await axios.post(
        `${API_BASE_URL}/enable`,
        { email: user?.email },
        {
          headers: {
            "x-auth-token": token,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.data.success) {
        setSecret(response.data.secret)
        setQrCodeUrl(response.data.otpAuthUrl)
      } else {
        setError(response.data.msg || "Failed to initiate 2FA setup.")
        if (onSetupComplete) onSetupComplete(false, response.data.msg || "Failed to initiate 2FA setup.")
      }
    } catch (err) {
      console.error("Error enabling 2FA:", err)
      const errorMsg = err.response?.data?.msg || "An error occurred while enabling 2FA."
      setError(errorMsg)
      if (onSetupComplete) onSetupComplete(false, errorMsg)
    } finally {
      setLoading(false)
    }
  }, [user, onSetupComplete])

  useEffect(() => {
    if (initiateSetup && !loading && !qrCodeUrl && !alreadyEnabledNotified) {
      if (user?.twoFactorEnabled) {
        if (onSetupComplete) {
          onSetupComplete(false, "Two-factor authentication is already enabled.")
        }
        setAlreadyEnabledNotified(true) // Set flag
        return
      }
      // Ensure flag is reset if we proceed to actual setup
      setAlreadyEnabledNotified(false)
      handleEnable2FA()
    }
  }, [initiateSetup, loading, qrCodeUrl, handleEnable2FA, user, onSetupComplete, alreadyEnabledNotified])

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Authentication required.")
        setLoading(false)
        return
      }
      const response = await axios.post(
        `${API_BASE_URL}/verify`,
        { code: verificationCode },
        {
          headers: { "x-auth-token": token },
        }
      )
      if (response.data.success) {
        setRecoveryCodes(response.data.recoveryCodes || [])
      } else {
        setError(response.data.msg || "Verification failed.")
      }
    } catch (err) {
      console.error("Error verifying 2FA code:", err)
      setError(err.response?.data?.msg || "An error occurred during verification.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const RecoveryCodesModal = ({ codes, onClose, onModalSetupComplete }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <Card variant="glass" className="max-w-md w-full p-0 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 p-0 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors z-10"
          onClick={() => {
            if (onModalSetupComplete) onModalSetupComplete(true, codes)
            onClose()
          }}
          aria-label="Close recovery codes modal"
        >
          <Icons.Close className="h-4 w-4" />
        </Button>
        <div className="p-6 sm:p-8">
          <AuthHeader title="Your Recovery Codes" subtitle="Store these codes in a safe place. Each can be used once if you lose access to your authenticator app." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5 my-6">
            {codes.map((code, index) => (
              <div
                key={index}
                className="font-mono bg-input border border-border p-3 rounded-md text-center text-foreground select-all text-sm tracking-wider cursor-pointer hover:bg-input/80 transition-colors"
                onClick={() => copyToClipboard(code)}
                title="Copy code"
              >
                {code}
              </div>
            ))}
          </div>
          {copied && <AuthAlert type="success" message="Code copied to clipboard!" className="mb-4 text-xs" />}
          <Button
            onClick={() => {
              if (onModalSetupComplete) onModalSetupComplete(true, codes)
              onClose()
            }}
            className="w-full py-3"
            variant="primary"
          >
            I've Saved My Codes
          </Button>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {recoveryCodes.length > 0 && (
        <RecoveryCodesModal
          codes={recoveryCodes}
          onClose={() => setRecoveryCodes([])}
          onModalSetupComplete={onSetupComplete}
        />
      )}

      {alreadyEnabledNotified ? (
        <AuthAlert type="info" message="Two-factor authentication is already enabled. No setup needed here." />
      ) : (
        <>
          {!qrCodeUrl && !loading && !error && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Click the switch above to start 2FA setup.</p>
            </div>
          )}

          {error && <AuthAlert type="error" message={error} />}

          {loading && !qrCodeUrl && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Icons.Spinner className="h-8 w-8 text-primary" />
              <span className="text-sm text-muted-foreground">Initiating 2FA setup...</span>
            </div>
          )}

          {qrCodeUrl && (
            <div className="space-y-6 animate-fadeIn">
              <Card variant="default" className="p-6">
                <AuthHeader title="Scan QR Code" subtitle="Use your authenticator app (e.g., Google Authenticator, Authy) to scan this code." />
                <div className="flex flex-col items-center space-y-4 mt-4">
                  <div className="p-3 bg-white rounded-lg shadow-md inline-block">
                    <QRCodeSVG value={qrCodeUrl} size={160} level="H" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Or manually enter this key:</p>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="font-mono text-sm bg-input border border-border p-2 rounded-md text-foreground select-all">
                        {secret}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(secret)}
                        className="h-9 w-9"
                        aria-label="Copy secret key"
                      >
                        {copied ? <Icons.CheckCircle className="h-4 w-4 text-green-500" /> : <Icons.Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <form onSubmit={(e) => { e.preventDefault(); handleVerify2FA(); }} className="space-y-4">
                <TextInput
                  id="verification-code"
                  label="Verification Code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setVerificationCode(value)
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  inputMode="numeric"
                  icon={<Icons.ShieldCheck className="h-5 w-5" />}
                  required
                />
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Icons.Spinner className="animate-spin mr-2 h-4 w-4" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Icons.ShieldCheck className="mr-2 h-4 w-4" /> Verify & Enable
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSetupComplete(false)}
                    className="w-full"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TwoFactorAuth
