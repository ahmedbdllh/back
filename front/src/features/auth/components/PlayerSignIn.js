import { useState, useRef } from "react"
import ReCaptchaV3 from '../../../shared/ui/components/ReCaptchaV3';
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Link } from "../../../shared/ui/components/Link"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"


export const PlayerSignIn = ({ onClose, onSwitchToManager, onSwitchToPlayerSignUp, onSwitchToPasswordReset, on2FARequired }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef(null);

  // State for email verification modal
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [resendStatus, setResendStatus] = useState({ message: "", type: "" });

  const handleInitialLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");
    setVerificationError("");

    if (!email || !password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    // Execute reCAPTCHA v3 before submitting
    let recaptchaToken = "";
    if (recaptchaRef.current) {
      try {
        recaptchaToken = await recaptchaRef.current.executeRecaptcha();
        if (!recaptchaToken) {
          setError("reCAPTCHA verification failed. Please try again.");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setError("reCAPTCHA verification failed. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const requestBody = { 
        email, 
        password, 
        role: "Player",
        recaptchaToken 
      };
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.status === 401 && data.code === 'ACCOUNT_NOT_VERIFIED') {
        setError(data.msg || "Your account is not verified. Please check your email for the verification code.");
        setShowEmailVerificationModal(true);
        setIsLoading(false);
        return;
      }      if (response.status === 401 && (data.msg === '2FA required' || data.msg?.toLowerCase().includes('2fa')) && data.tempToken) {
        if (on2FARequired) {
          on2FARequired(email, data.tempToken, handleLoginSuccess);
        }
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.msg || "Authentication failed. Please check your credentials.");
      }

      handleLoginSuccess(data);

    } catch (error) {
      console.error("Player sign in error:", error);
      setError(error.message || "Sign in failed. An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    const user = data.user || data;    if (!user || !user.role || user.role.toLowerCase() !== "player") {
      setError("Access denied. This account is not a player account. Please use the Manager Sign In form.");
      setShowEmailVerificationModal(false);
      return;
    }

    localStorage.setItem("token", data.token);
    const userDetails = {
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    localStorage.setItem("user", JSON.stringify(userDetails));    if (onClose) onClose();
    window.dispatchEvent(new Event("authChange"));

    setEmail("");
    setPassword("");
    setShowEmailVerificationModal(false);
    setError("");
    setVerificationError("");
    setIsLoading(false);
  };  const handleEmailVerificationModalClose = () => {
    setShowEmailVerificationModal(false);
    setVerificationError("");
    setVerificationCode("");
    setIsLoading(false);
  };
  const handleRecaptchaError = () => {
    setError("reCAPTCHA verification failed. Please try again.");
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setVerificationError("");
    try {
      const response = await fetch("http://localhost:5000/api/verification/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: verificationCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Verification failed. Invalid or expired code.");
      }
      setShowEmailVerificationModal(false);
      setVerificationCode("");
      setIsVerifying(false);
      await handleInitialLogin();
    } catch (error) {
      setVerificationError(error.message || "An error occurred during verification.");
      setIsVerifying(false);
    }
  };

  const handleResendVerificationCode = async () => {
    setIsResendingCode(true);
    setResendStatus({ message: "", type: "" });
    setVerificationError("");
    try {
      const response = await fetch("http://localhost:5000/api/verification/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Failed to resend code.");
      }
      setResendStatus({ message: "New verification code sent to your email.", type: "success" });
    } catch (error) {
      setResendStatus({ message: error.message || "Error resending code.", type: "error" });
    } finally {
      setIsResendingCode(false);
      setTimeout(() => setResendStatus({ message: "", type: "" }), 5000);
    }
  };
  const renderEmailVerificationModal = () => {
    if (!showEmailVerificationModal) {
      return null;
    }

    return (
        <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md mx-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors"
            onClick={handleEmailVerificationModalClose}
            aria-label="Close verification modal"
          >
            <Icons.Close className="h-5 w-5" />
          </Button>

          <AuthHeader
            title="Verify Your Email"
            subtitle={`A verification code has been sent to ${email}. Please enter it below.`}
          />
          
          <div className="space-y-5 mt-5">
            {verificationError && (
              <AuthAlert type="error" message={verificationError} className="mb-4" />
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }}>
              <TextInput
                id="verification-code"
                label="Verification Code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isVerifying || isResendingCode}
                required
                icon={<Icons.Shield className="h-5 w-5 text-gray-400" />}
                inputMode="numeric"
              />
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleVerifyCode}
                  type="button"
                  className="w-full mt-2"
                  disabled={isVerifying || isResendingCode || !verificationCode}
                >
                  {isVerifying ? (
                    <><Icons.Spinner className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendVerificationCode}
                  type="button"
                  disabled={isResendingCode || isVerifying}
                  className="w-full"
                >
                  {isResendingCode ? (
                    <><Icons.Spinner className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </form>
            {resendStatus.message && (
              <AuthAlert type={resendStatus.type} message={resendStatus.message} className="mt-4" />
            )}            <Button
              variant="ghost"
              onClick={handleEmailVerificationModalClose}
              type="button"
              className="mt-4 w-full text-muted-foreground hover:bg-muted/50"
              disabled={isVerifying || isResendingCode}
            >
              Cancel
            </Button>
          </div>
        </div>
    );
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close sign in form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}
      
      <AuthHeader title="Player Sign In" subtitle="Access your player account." />

      <AuthAlert type="error" message={error} />

      <form onSubmit={handleInitialLogin} className="space-y-5">
        <TextInput
          id="email-player"
          label="Email Address"
          type="email"
          placeholder="player@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
          icon={<Icons.Mail className="h-5 w-5" />}
        />        <TextInput
          id="password-player"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          icon={<Icons.Lock className="h-5 w-5" />}
          showPasswordToggle={true}        />
          {/* reCAPTCHA v3 (invisible) */}
        <ReCaptchaV3
          ref={recaptchaRef}
          siteKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          action="player_login"
          onError={handleRecaptchaError}
        />
        
        <div className="text-right">
          <Link
            onClick={onSwitchToPasswordReset}
            variant="primary"
            className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Forgot Password?
          </Link>
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a40]"></div>
          </div>
          <div className="relative bg-card px-4 text-xs text-gray-500 uppercase">or</div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-gray-400 text-sm">
            Not a player?{" "}
            <Link
              onClick={onSwitchToManager}
              variant="primary"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in as Manager
            </Link>
          </p>
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link
              onClick={onSwitchToPlayerSignUp}
              variant="primary"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign up as Player
            </Link>
          </p>        </div>
      </div>

      {showEmailVerificationModal && renderEmailVerificationModal()}
    </div>
  )
}
