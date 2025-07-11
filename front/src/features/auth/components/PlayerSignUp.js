import { useState, useRef } from "react";
import ReCaptchaV3 from '../../../shared/ui/components/ReCaptchaV3';
import { Button } from "../../../shared/ui/components/Button";
import { TextInput } from "../../../shared/ui/components/TextInput";
import { Checkbox } from "../../../shared/ui/components/Checkbox";
import { Icons } from "../../../shared/ui/components/Icons";
import { AuthHeader } from "./shared/AuthHeader";
import { AuthAlert } from "./shared/AuthAlert";
import { Link } from "../../../shared/ui/components/Link"


export const PlayerSignUp = ({ onClose, onSwitchToPlayerSignIn }) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredSports, setPreferredSports] = useState([]); // Changed to array
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const recaptchaRef = useRef(null);

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSportsChange = (sport) => {
    setPreferredSports(prev => {
      const updatedSports = prev.includes(sport)
        ? prev.filter(s => s !== sport) // Remove if already selected
        : [...prev, sport] // Add if not selected
      
      // Clear position if football is deselected
      if (sport === 'football' && prev.includes(sport)) {
        setPosition("");
      }
      
      return updatedSports;
    });
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      const response = await fetch(
        "http://localhost:5000/api/verification/resend-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || "Failed to resend code");
      setResendMessage("A new verification code has been sent to your email.");
    } catch (error) {
      setResendMessage(error.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!fullName || !email || !password || !preferredSports.length || !phoneNumber) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

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

    const userData = {
      fullName,
      email,
      password,
      preferredSports,
      phoneNumber,
      ...(preferredSports.includes("football") && { position }),
      recaptchaToken
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/verification/player-signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        if (
          data.msg &&
          (data.msg.includes("verification code was already sent") ||
            data.msg.includes("already registered as pending user"))
        ) {
          setUserEmail(email);
          setError("");
          setSuccessMessage(
            data.msg.includes("already registered as pending user")
              ? "Account already created! Please check your email for the verification code."
              : "A verification code was already sent. Please check your email."
          );
          setShowVerificationModal(true);
          return;
        }
        if (
          data.msg &&
          data.msg.toLowerCase().includes("phone number") &&
          (data.msg.toLowerCase().includes("already registered") ||
            data.msg.toLowerCase().includes("already in use"))
        ) {
          setError(data.msg);
          setSuccessMessage("");
          return;
        }
        throw new Error(
          data.msg || (data.errors && data.errors[0].msg) || "Signup failed"
        );
      }

      setError("");
      setSuccessMessage(
        "Account created! Please check your email for your verification code."
      );
      setUserEmail(email);
      setShowVerificationModal(true);
    } catch (error) {
      console.error("Error during player signup:", error);
      setError(error.message || "An error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaError = () => {
    setError("reCAPTCHA verification failed. Please try again.");
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setVerificationError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/verification/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, code: verificationCode }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        if (
          data.msg &&
          data.msg.toLowerCase().includes("phone number") &&
          (data.msg.toLowerCase().includes("already registered") ||
            data.msg.toLowerCase().includes("already in use"))
        ) {
          setVerificationError(data.msg);
        } else {
          setVerificationError(
            data.msg ||
              "Verification failed. Please check your code and try again."
          );
        }
        return;
      }

      setSuccessMessage("Account verified successfully! You can now sign in.");
      setShowVerificationModal(false);
      if (onSwitchToPlayerSignIn) onSwitchToPlayerSignIn();
      window.dispatchEvent(new Event("authChange"));
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError(
        error.message || "Invalid verification code. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const renderVerificationModal = () => (
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full transition-colors"
          onClick={() => {
            setShowVerificationModal(false);
            setVerificationCode("");
            setVerificationError("");
            setResendMessage("");
          }}
          aria-label="Close verification modal"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
        <div className="space-y-5">
          <AuthHeader
            title="Verify Your Email"
            subtitle={`A verification code has been sent to ${userEmail}`}
          />
          {verificationError && (
            <AuthAlert type="error" message={verificationError} />
          )}
          <TextInput
            id="verification-code"
            label="Verification Code"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            disabled={isVerifying}
            required
            inputMode="numeric"
          />
          <Button
            onClick={handleVerifyCode}
            className="w-full"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                Resending...
              </>
            ) : (
              "Resend Code"
            )}
          </Button>
          {resendMessage && (
            <p
              className={`text-sm mt-2 ${
                resendMessage.includes("sent")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {resendMessage}
            </p>
          )}
        </div>
      </div>
  );

  const renderSignUpForm = () => (
    <div className="space-y-5 md:space-y-6">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 p-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-full z-20 transition-colors"
          onClick={onClose}
          aria-label="Close sign up form"
        >
          <Icons.Close className="h-5 w-5" />
        </Button>
      )}
      
      <AuthHeader title="Player Sign Up" subtitle="Join us and start playing!" />
        <AuthAlert type="error" message={error} />
        {successMessage &&
          !successMessage.includes("Account verified successfully") && (
            <AuthAlert type="success" message={successMessage} />
          )}
        {successMessage &&
          successMessage.includes("Account verified successfully") && (
            <AuthAlert type="success" message={successMessage} />
          )}

        {(!successMessage ||
          error ||
          (successMessage &&
            !successMessage.includes("Account created!") &&
            !successMessage.includes("verification code was already sent") &&
            !successMessage.includes("Account verified successfully"))) && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="fullName-player"
              label="Full Name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.User className="h-5 w-5" />}
            />
            <TextInput
              id="email-player-signup"
              label="Email Address"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Mail className="h-5 w-5" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <TextInput
                id="password-player-signup"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                icon={<Icons.Lock className="h-5 w-5" />}
                showPasswordToggle={true}
              />
              <TextInput
                id="confirmPassword-player"
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                icon={<Icons.Lock className="h-5 w-5" />}
                showPasswordToggle={true}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Preferred Sports *
              </label>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "padel", label: "Padel", icon: "/assets/icons/padel-icon.png" },
                  { value: "football", label: "Football", icon: "/assets/icons/football-icon.png" },
                  { value: "basketball", label: "Basketball", icon: "/assets/icons/basketball-icon.png" },
                  { value: "tennis", label: "Tennis", icon: "/assets/icons/tennis-icon.png" },
                ].map((sport) => {
                  const isSelected = preferredSports.includes(sport.value);
                  return (
                    <button
                      key={sport.value}
                      type="button"
                      onClick={() => handleSportsChange(sport.value)}
                      disabled={isLoading}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-gray-500/50
                        ${isSelected 
                          ? 'bg-gray-700 text-white border-gray-600 shadow-sm' 
                          : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50 hover:text-gray-300 hover:border-gray-600'
                        }
                      `}
                    >
                      <img 
                        src={sport.icon} 
                        alt={sport.label}
                        className="w-4 h-4 mr-2 opacity-80"
                      />
                      {sport.label}
                      {isSelected && (
                        <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Selection indicator */}
              <div className="mt-4 flex items-center">
                <div className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  preferredSports.length > 0 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 transition-all duration-300 ${
                    preferredSports.length > 0 ? 'bg-blue-400' : 'bg-gray-500'
                  }`}></div>
                  {preferredSports.length > 0 
                    ? `${preferredSports.length} sport${preferredSports.length !== 1 ? 's' : ''} selected`
                    : 'Select at least one sport'
                  }
                </div>
              </div>
            </div>
            {preferredSports.includes("football") && (
              <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Football Position *
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "goalkeeper", label: "Goalkeeper", emoji: "🥅" },
                    { value: "defender", label: "Defender", emoji: "🛡️" },
                    { value: "midfielder", label: "Midfielder", emoji: "⚽" },
                    { value: "attacker", label: "Attacker", emoji: "🎯" },
                  ].map((pos) => {
                    const isSelected = position === pos.value;
                    return (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setPosition(pos.value)}
                        disabled={isLoading}
                        className={`
                          inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-gray-700 text-white border-gray-600 shadow-sm' 
                            : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50 hover:text-gray-300 hover:border-gray-600'
                          }
                        `}
                      >
                        <span className="mr-2">{pos.emoji}</span>
                        {pos.label}
                        {isSelected && (
                          <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <TextInput
              id="phoneNumber-player"
              label="Phone Number"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Phone className="h-5 w-5" />}
            />
            
            {/* reCAPTCHA v3 (invisible) */}
            {(() => {
              const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
              console.log('Environment variable REACT_APP_RECAPTCHA_SITE_KEY:', siteKey);
              return (
                <ReCaptchaV3
                  ref={recaptchaRef}
                  siteKey={siteKey}
                  action="player_signup"
                  onError={handleRecaptchaError}
                />
              );
            })()}
            
            <Checkbox
              id="agreeToTerms-player"
              label="I agree to the Terms of Service and Privacy Policy"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        )}
        <div className="text-center pt-2">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{" "}
                    <Link
                      onClick={onSwitchToPlayerSignIn}
                      variant="primary"
                      className="font-medium text-blue-400 hover:text-blue-300"
                    >
                      Sign in as Player
                    </Link>
                  </p>
                </div>
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      {showVerificationModal
        ? renderVerificationModal()
        : renderSignUpForm()}
    </div>
  );
};
