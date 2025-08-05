import { useState } from 'react';
import { AuthService } from '../services/authService';

export const usePasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isEmailSent, setIsEmailSent] = useState(false);

  const requestPasswordReset = async (email, role) => {
    setIsLoading(true);
    setStatus({ message: "", type: "" });

    if (!email) {
      setStatus({ message: "Email address is required.", type: "error" });
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.forgotPassword(email, role);

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send reset email");
      }

      setStatus({ 
        message: data.msg || "Password reset email sent successfully", 
        type: "success" 
      });
      setIsEmailSent(true);
      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setStatus({ 
        message: error.message || "Failed to send password reset email", 
        type: "error" 
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  const resetState = () => {
    setIsEmailSent(false);
    setStatus({ message: "", type: "" });
  };

  return {
    requestPasswordReset,
    resetState,
    isLoading,
    status,
    isEmailSent,
    setStatus,
    setIsEmailSent
  };
};
