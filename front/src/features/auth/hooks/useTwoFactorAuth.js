import { useState } from 'react';
import { AuthService } from '../services/authService';

export const useTwoFactorAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const verify2FA = async (email, code, tempToken) => {
    setIsLoading(true);
    setError("");

    if (!code) {
      setError("2FA code is required.");
      setIsLoading(false);
      return { success: false };
    }

    try {
      const { response, data } = await AuthService.verify2FA(email, code, tempToken);

      if (!response.ok) {
        throw new Error(data.msg || "2FA verification failed. Please try again.");
      }

      // Store the token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("authChange"));
      }

      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "2FA verification failed. Please check your code and try again.");
      setIsLoading(false);
      return { success: false };
    }
  };

  const enable2FA = async (userId) => {
    setIsLoading(true);
    setError("");

    try {
      const { response, data } = await AuthService.enable2FA(userId);

      if (!response.ok) {
        throw new Error(data.msg || "Failed to enable 2FA");
      }

      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "Failed to enable 2FA");
      setIsLoading(false);
      return { success: false };
    }
  };

  const verify2FASetup = async (userId, verificationCode, secret) => {
    setIsLoading(true);
    setError("");

    try {
      const { response, data } = await AuthService.verify2FASetup(userId, verificationCode, secret);

      if (!response.ok) {
        throw new Error(data.msg || "2FA setup verification failed");
      }

      setIsLoading(false);
      return { success: true, data };

    } catch (error) {
      setError(error.message || "2FA setup verification failed");
      setIsLoading(false);
      return { success: false };
    }
  };

  return {
    verify2FA,
    enable2FA,
    verify2FASetup,
    isLoading,
    error,
    setError
  };
};
