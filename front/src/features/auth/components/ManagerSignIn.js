import { useState, useRef } from "react"
import { Button } from "../../../shared/ui/components/Button"
import { TextInput } from "../../../shared/ui/components/TextInput"
import { Link } from "../../../shared/ui/components/Link"
import { Icons } from "../../../shared/ui/components/Icons"
import { AuthHeader } from "./shared/AuthHeader"
import { AuthAlert } from "./shared/AuthAlert"
import ReCaptchaV3 from "../../../shared/ui/components/ReCaptchaV3"

export const ManagerSignIn = ({ onClose, onSwitchToPlayer, onSwitchToManagerSignUp, onSwitchToForgotPassword, on2FARequired }) => {const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const recaptchaRef = useRef(null)
  const handleInitialLogin = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission if called from form
    setIsLoading(true);
    setError("");

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
        console.error("reCAPTCHA error:", error);
        setError("reCAPTCHA verification failed. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Removed verbose login attempt console.log for privacy
      const requestBody = { 
        email, 
        password, 
        role: "Manager",
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

      if (response.status === 401 && (data.msg === '2FA required' || data.msg?.toLowerCase().includes('2fa')) && data.tempToken) {
        if (on2FARequired) {
          on2FARequired(email, data.tempToken, handleLoginSuccess);
        }
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.msg || "Authentication failed");
      }

      // If login is successful without 2FA (e.g., 2FA not enabled for user)
      handleLoginSuccess(data);

    } catch (error) {
      console.error("Sign in error:", error);
      setError(error.message || "Sign in failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    // Removed verbose manager sign in success console.log for privacy

    // Support both flat and nested user structure
    const role = data.role || (data.user && data.user.role);
    const fullName = data.fullName || (data.user && data.user.fullName);
    const email = data.email || (data.user && data.user.email);
    const token = data.token || (data.user && data.user.token);

    if (!role || typeof role !== "string") {
      setError("Access denied. User role is missing or invalid.");
      return;
    }

    if (role.toLowerCase() !== "manager") {
      setError("Access denied. This account is not a manager account.");
      return;
    }

    localStorage.setItem("token", token);
    const userDetails = {
      fullName: fullName,
      email: email,
      role: role
    };
    localStorage.setItem("user", JSON.stringify(userDetails));

    if (onClose) onClose();
    window.dispatchEvent(new Event("authChange"));
      // Reset all relevant states
    setEmail("");
    setPassword("");
    setError("");
    setIsLoading(false);
  };

  const handleRecaptchaError = () => {
    setError("reCAPTCHA verification failed. Please try again.");
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
      
      <AuthHeader title="Manager Sign In" subtitle="Access your facility management dashboard." />

        <AuthAlert type="error" message={error} />

        <form onSubmit={handleInitialLogin} className="space-y-5">
          <TextInput
            id="email-manager"
            label="Email Address"
            type="email"
            placeholder="manager@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            icon={<Icons.Mail className="h-5 w-5" />}
          />
          <TextInput
            id="password-manager"
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
          {/* reCAPTCHA v3 (invisible) */}
          <ReCaptchaV3
            ref={recaptchaRef}
            siteKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            action="manager_login"
            onError={handleRecaptchaError}
          />
          
          <div className="flex justify-end mb-4">
            <Link
              onClick={onSwitchToForgotPassword}
              variant="primary"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
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
              Not a manager?{" "}
              <Link
                onClick={onSwitchToPlayer}
                variant="primary"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in as Player
              </Link>
            </p>
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link
                onClick={onSwitchToManagerSignUp}
                variant="primary"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign up as Manager
              </Link>
            </p>
          </div>
        </div>
    </div>
  )
}

export default ManagerSignIn
