import { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

export const useResetPassword = (token) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Check if reset token is valid when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsCheckingToken(false);
        return;
      }

      try {
        const { response, data } = await AuthService.validateResetToken(token);
        
        if (response.ok && data.success) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
        }
      } catch (error) {
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };
    
    validateToken();
  }, [token]);

  const resetPassword = async (password, confirmPassword) => {
    setIsLoading(true);
    setError("");

    // Validation
    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      setIsLoading(false);
      return { success: false };
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return { success: false };
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.resetPassword(token, password);

      if (!response.ok) {
        throw new Error(data.msg || "Password reset failed");
      }

      setIsLoading(false);
      return { success: true, message: data.msg || "Password reset successful" };

    } catch (error) {
      setError(error.message || "Password reset failed. Please try again.");
      setIsLoading(false);
      return { success: false };
    }
  };

  return {
    resetPassword,
    isLoading,
    error,
    isTokenValid,
    isCheckingToken,
    setError
  };
};
