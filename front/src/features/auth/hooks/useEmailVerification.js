import { useState } from 'react';
import { AuthService } from '../services/authService';

export const useEmailVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [resendStatus, setResendStatus] = useState({ message: "", type: "" });

  const verifyEmail = async (email, verificationCode, role) => {
    setIsVerifying(true);
    setVerificationError("");

    if (!verificationCode) {
      setVerificationError("Verification code is required.");
      setIsVerifying(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.verifyEmail(email, verificationCode, role);

      if (!response.ok) {
        throw new Error(data.msg || "Email verification failed. Please check your code.");
      }

      // Handle verification success
      if (data.token) {
        localStorage.setItem("token", data.token);
        const userDetails = {
          fullName: data.user?.fullName || "",
          email: data.user?.email || email,
          role: data.user?.role || role
        };
        localStorage.setItem("user", JSON.stringify(userDetails));
        window.dispatchEvent(new Event("authChange"));
      }

      setIsVerifying(false);
      return { success: true, data };

    } catch (error) {
      setVerificationError(error.message || "Email verification failed. Please check your code.");
      setIsVerifying(false);
      return { success: false };
    }
  };

  const resendVerificationCode = async (email, role) => {
    setIsResendingCode(true);
    setResendStatus({ message: "", type: "" });

    try {
      const { response, data } = await AuthService.resendVerificationCode(email, role);

      if (!response.ok) {
        throw new Error(data.msg || "Failed to resend verification code");
      }

      setResendStatus({ 
        message: data.msg || "Verification code sent successfully", 
        type: "success" 
      });
      setIsResendingCode(false);
      return { success: true, data };

    } catch (error) {
      setResendStatus({ 
        message: error.message || "Failed to resend verification code", 
        type: "error" 
      });
      setIsResendingCode(false);
      return { success: false };
    }
  };

  return {
    verifyEmail,
    resendVerificationCode,
    isVerifying,
    verificationError,
    isResendingCode,
    resendStatus,
    setVerificationError,
    setResendStatus
  };
};
