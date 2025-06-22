import { useState } from "react";
import { Button } from "../../../shared/ui/components/Button";
import { TextInput } from "../../../shared/ui/components/TextInput";
import { Link } from "../../../shared/ui/components/Link";
import { Icons } from "../../../shared/ui/components/Icons";
import { AuthHeader } from "./shared/AuthHeader";
import { AuthAlert } from "./shared/AuthAlert";

export const ManagerPasswordReset = ({ onClose, onSwitchToSignIn }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          role: "Manager" 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send reset email");
      }

      setSuccess("Password reset email sent successfully! Please check your email inbox.");
      setIsEmailSent(true);
      setEmail(""); // Clear email for security

    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setError("");
    setSuccess("");
    setIsEmailSent(false);
    setEmail("");
    onSwitchToSignIn();
  };
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
          title="Reset Password"
          subtitle="Enter your email address and we'll send you a link to reset your password."
        />

        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={success} />

        {!isEmailSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="manager@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              icon={<Icons.Mail className="h-5 w-5" />}
            />

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Icons.Spinner className="mr-2 h-5 w-5 animate-spin" />
                    Send Reset Email
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
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Icons.CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Email Sent!</h3>
              <p className="text-gray-300 text-sm">
                We've sent a password reset link to your email address. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="text-gray-400 text-xs">
                The reset link will expire in 10 minutes for security reasons.
              </p>
            </div>
            <Button
              onClick={handleBackToSignIn}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        )}

        {!isEmailSent && (
          <>
            <div className="space-y-3 pt-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#2a2a40]"></div>
                </div>
                <div className="relative bg-card px-4 text-xs text-gray-500 uppercase">OR</div>
              </div>
            </div>

            <div className="text-center pt-3">
              <p className="text-gray-400 text-sm">
                Remember your password?{" "}
                <Link
                  onClick={handleBackToSignIn}
                  variant="primary"
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Back to Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ManagerPasswordReset;
